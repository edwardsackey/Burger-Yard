import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const addMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, image_url } = req.body;

    const menuItem = await prisma.menuItem.create({
      data: { name, description, price, image_url }
    });
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
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

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, riderName, riderPhone, riderVehicle } = req.body;
    // status should be one of: PENDING, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        riderName: riderName ?? undefined,
        riderPhone: riderPhone ?? undefined,
        riderVehicle: riderVehicle ?? undefined,
      },
      omit: { deliveryCode: true },
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
