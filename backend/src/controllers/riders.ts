import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const listRiders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const riders = await prisma.rider.findMany({ orderBy: { name: 'asc' } });
    res.json(riders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, vehicle } = req.body;
    if (!name || !phone) {
      res.status(400).json({ message: 'Name and phone are required' });
      return;
    }
    const rider = await prisma.rider.create({
      data: { name, phone, vehicle: vehicle || undefined },
    });
    res.status(201).json(rider);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, vehicle, active } = req.body;
    const rider = await prisma.rider.update({
      where: { id },
      data: { name, phone, vehicle, active },
    });
    res.json(rider);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await prisma.rider.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
