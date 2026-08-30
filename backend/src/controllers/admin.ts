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
    const { status, riderName, riderPhone, riderVehicle } = req.body;
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

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        riderName: riderName ?? undefined,
        riderPhone: riderPhone ?? undefined,
        riderVehicle: riderVehicle ?? undefined,
        // Stamped the moment each stage is first reached, so Reports can
        // compute a real avg prep time (readyAt - acceptedAt).
        acceptedAt: status === 'PREPARING' ? new Date() : undefined,
        readyAt: status === 'READY' ? new Date() : undefined,
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
