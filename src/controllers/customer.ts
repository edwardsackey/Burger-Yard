import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const getRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true, description: true, address: true, rating: true }
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = parseInt(req.params.id);
    const menu = await prisma.menuItem.findMany({
      where: { restaurantId }
    });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const placeOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { restaurantId, items } = req.body; 
    // items should be [{ menuItemId: 1, quantity: 2 }]

    // Fetch prices to calculate total
    let total_amount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem) {
        res.status(400).json({ message: `Menu item ${item.menuItemId} not found` });
        return;
      }
      total_amount += menuItem.price * item.quantity;
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price_at_time_of_order: menuItem.price
      });
    }

    // Create the order transaction
    const order = await prisma.order.create({
      data: {
        userId,
        restaurantId,
        total_amount,
        status: 'PENDING',
        orderItems: {
          create: orderItemsData
        }
      },
      include: { orderItems: true }
    });

    // TODO: Trigger Paystack initialization here
    // TODO: Trigger POS Integration webhook here

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
      include: { orderItems: { include: { menuItem: true } } }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Ensure users can only view their own orders unless they are admin
    if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'Unauthorized' });
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
      include: { restaurant: { select: { name: true } } }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
