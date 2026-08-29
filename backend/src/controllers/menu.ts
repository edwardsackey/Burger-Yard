import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Every item, including hidden ones — the admin needs to see the whole
 * menu, not just what customers currently see. Each gets a real "sold in
 * the last 7 days" count computed from OrderItem, not a stored/stale figure. */
export const listMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const since = new Date(Date.now() - SEVEN_DAYS_MS);
    const [items, recentItems] = await Promise.all([
      prisma.menuItem.findMany({ orderBy: { id: 'asc' } }),
      prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: since }, status: { not: 'CANCELLED' } } },
        select: { menuItemId: true, quantity: true },
      }),
    ]);

    const soldById = new Map<number, number>();
    for (const oi of recentItems) {
      soldById.set(oi.menuItemId, (soldById.get(oi.menuItemId) ?? 0) + oi.quantity);
    }

    res.json(items.map((item) => ({ ...item, sold: soldById.get(item.id) ?? 0 })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, image_url, category, available } = req.body;
    if (!name || !Number.isFinite(price) || price <= 0) {
      res.status(400).json({ message: 'Name and a price greater than zero are required' });
      return;
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || undefined,
        price,
        image_url: image_url || undefined,
        category: category || undefined,
        available: available ?? true,
      },
    });
    res.status(201).json({ ...menuItem, sold: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, image_url, category, available } = req.body;

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { name, description, price, image_url, category, available },
    });
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/** Hard-deletes when nothing ever ordered it; otherwise falls back to
 * hiding it (available: false) so past orders don't lose their line-item
 * details — Order.orderItems.menuItem would otherwise 404/break. */
export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const orderCount = await prisma.orderItem.count({ where: { menuItemId: id } });

    if (orderCount === 0) {
      await prisma.menuItem.delete({ where: { id } });
      res.json({ deleted: true });
      return;
    }

    const menuItem = await prisma.menuItem.update({ where: { id }, data: { available: false } });
    res.json({ deleted: false, hidden: true, menuItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
