import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import { sendPushNotification } from '../services/push';

const STATUS_MESSAGE: Record<string, string> = {
  NEW: 'Your order has been placed.',
  PREPARING: 'Your order has been accepted and is being prepared.',
  READY: 'Your order is packed and waiting for a rider.',
  OUT_FOR_DELIVERY: 'Your order is on the way!',
  COMPLETED: 'Your order has been delivered. Enjoy!',
  CANCELLED: 'Your order was cancelled.',
};

export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      // The delivery code is the customer's own proof-of-receipt — never
      // expose it on an admin-facing query.
      omit: { deliveryCode: true },
      include: {
        user: { select: { name: true, phone: true } },
        address: true,
        orderItems: { include: { menuItem: true } }
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// There's deliberately no separate Payment/Transaction table (see the
// schema notes in the README) — each row here is just an Order re-shaped
// as a payment record. Cancelled orders are included on purpose: a paid,
// cancelled order still needs a refund, which the admin should see.
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        total_amount: true,
        paymentMethod: true,
        momoNetwork: true,
        paid: true,
        status: true,
        createdAt: true,
        riderName: true,
        user: { select: { name: true } },
      },
    });

    const rows = orders.map((o) => ({
      id: o.id,
      customer: o.user?.name ?? 'Customer',
      method: o.paymentMethod,
      momoNetwork: o.momoNetwork,
      amount: o.total_amount,
      paid: o.paid,
      cancelled: o.status === 'CANCELLED',
      time: o.createdAt,
      rider: o.riderName,
    }));

    const collected = rows.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0);
    const cashOutstanding = rows
      .filter((r) => r.method === 'CASH' && !r.paid && !r.cancelled)
      .reduce((s, r) => s + r.amount, 0);
    const awaiting = rows.filter((r) => r.method !== 'CASH' && !r.paid && !r.cancelled);
    const awaitingAmount = awaiting.reduce((s, r) => s + r.amount, 0);

    res.json({
      rows,
      stats: { collected, cashOutstanding, awaitingAmount, awaitingCount: awaiting.length },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        phone: true,
        orders: { select: { total_amount: true, createdAt: true } },
        addresses: { where: { isDefault: true }, select: { label: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = customers.map((c) => {
      const orderCount = c.orders.length;
      const spent = c.orders.reduce((sum, o) => sum + o.total_amount, 0);
      const lastOrderAt = c.orders.length
        ? c.orders.reduce((latest, o) => (o.createdAt > latest ? o.createdAt : latest), c.orders[0].createdAt)
        : null;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        location: c.addresses[0]?.label ?? null,
        orders: orderCount,
        spent,
        lastOrderAt,
      };
    });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, riderName, riderPhone, riderVehicle, deliveryCode } = req.body;
    // status should be one of: NEW, PREPARING, READY, OUT_FOR_DELIVERY, COMPLETED, CANCELLED

    if (status === 'OUT_FOR_DELIVERY') {
      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { riderName: true },
      });
      if (!(riderName || existing?.riderName)) {
        res.status(400).json({ message: 'Assign a rider before sending this order out for delivery.' });
        return;
      }
    }

    // Never trust the client's word that delivery happened — the code is
    // deliberately never sent to the admin (see the Order.deliveryCode
    // comment), so this is the only way to confirm the handoff actually
    // happened: whoever is at the door reads it from the customer and the
    // admin types it in, checked here against the value nobody on this
    // side of the request can see.
    let cashCollectedOnDelivery: boolean | undefined;
    if (status === 'COMPLETED') {
      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { deliveryCode: true, paymentMethod: true },
      });
      if (!existing?.deliveryCode || deliveryCode !== existing.deliveryCode) {
        res.status(400).json({ message: 'Incorrect delivery code.' });
        return;
      }
      // Cash never gets marked paid by a webhook like MoMo/Card does — the
      // rider physically collects it at the door, which is exactly the
      // moment this status transition represents.
      if (existing.paymentMethod === 'CASH') cashCollectedOnDelivery = true;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(cashCollectedOnDelivery ? { paid: true } : {}),
        riderName: riderName ?? undefined,
        riderPhone: riderPhone ?? undefined,
        riderVehicle: riderVehicle ?? undefined,
        // Stamped the moment each stage is first reached, so Reports can
        // compute a real avg prep time (readyAt - acceptedAt).
        acceptedAt: status === 'PREPARING' ? new Date() : undefined,
        readyAt: status === 'READY' ? new Date() : undefined,
        outForDeliveryAt: status === 'OUT_FOR_DELIVERY' ? new Date() : undefined,
      },
      omit: { deliveryCode: true },
      include: { user: { select: { pushToken: true } } },
    });

    if (status && STATUS_MESSAGE[status]) {
      // Fire-and-forget — a failed push must never block the status update
      // itself from succeeding.
      sendPushNotification(order.user.pushToken, 'Order update', STATUS_MESSAGE[status], {
        orderId: order.id,
      });
    }

    const { user, ...rest } = order;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
