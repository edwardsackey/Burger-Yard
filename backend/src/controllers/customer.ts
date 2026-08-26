import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const getMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const menu = await prisma.menuItem.findMany({ orderBy: { id: 'asc' } });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const placeOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { items, addressId, landmark, phone, paymentMethod, momoNetwork, deliveryFee } = req.body;
    // items should be [{ menuItemId: 1, quantity: 2, extras?: [{ name, price }] }]

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }
    if (!phone || !paymentMethod) {
      res.status(400).json({ message: 'phone and paymentMethod are required' });
      return;
    }

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) {
        res.status(400).json({ message: `Menu item ${item.menuItemId} not found` });
        return;
      }
      const extras = Array.isArray(item.extras) ? item.extras : [];
      const extrasTotal = extras.reduce((sum: number, e: { price?: number }) => sum + (e.price ?? 0), 0);
      const unitPrice = menuItem.price + extrasTotal;
      subtotal += unitPrice * item.quantity;
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price_at_time_of_order: unitPrice,
        extras: extras.length ? extras : undefined,
      });
    }

    const fee = typeof deliveryFee === 'number' ? deliveryFee : 25;
    const total_amount = subtotal + fee;
    // Handed to the customer only, never the admin — this is how they prove
    // to the rider that the order in hand is really theirs at drop-off.
    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await prisma.order.create({
      data: {
        userId,
        addressId: addressId ?? undefined,
        landmark,
        phone,
        paymentMethod,
        momoNetwork: momoNetwork ?? undefined,
        deliveryFee: fee,
        total_amount,
        status: 'NEW',
        deliveryCode,
        orderItems: { create: orderItemsData },
      },
      include: { orderItems: true },
    });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { menuItem: true } }, address: true },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const isStaffOrOwner = req.user!.role === 'OWNER' || req.user!.role === 'STAFF';

    // Ensure users can only view their own orders unless they're admin-side
    if (order.userId !== req.user!.id && !isStaffOrOwner) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    // The delivery code is the customer's own proof-of-receipt — no one on
    // the admin side (e.g. viewing an order for support) may see it.
    if (isStaffOrOwner) {
      const { deliveryCode, ...rest } = order;
      res.json(rest);
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { orderItems: { include: { menuItem: true } } },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
