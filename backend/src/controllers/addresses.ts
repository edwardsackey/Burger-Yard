import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { label, details, city, isDefault } = req.body;

    if (!label || !details || !city) {
      res.status(400).json({ message: 'Label, details, and city are required.' });
      return;
    }

    const userId = req.user!.id;
    const existingCount = await prisma.address.count({ where: { userId } });
    // The first address for an account is always the default, regardless of what was sent.
    const shouldBeDefault = isDefault === true || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: { userId, label, details, city, isDefault: shouldBeDefault },
      });
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { label, details, city, isDefault } = req.body;
    const userId = req.user!.id;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.update({
        where: { id },
        data: { label, details, city, isDefault },
      });
    });

    res.json(address);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (existing.isDefault) {
        // Never leave the account without a default when others remain.
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        });
        if (next) {
          await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
      }
    });

    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);

    res.json({ message: 'Default address updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
