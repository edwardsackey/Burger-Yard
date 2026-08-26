import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

function signToken(id: number, role: string) {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ user: { id, role } }, secret, { expiresIn: '1d' });
}

function freshPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const ownerLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'OWNER' || !user.password_hash) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken(user.id, 'OWNER');
    res.json({ token, role: 'OWNER', name: user.name });
  } catch (error) {
    console.error('Owner login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/** Public: the staff sign-in screen needs this to show a name picker before anyone is authenticated. */
export const getActiveStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const staffLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId, pin } = req.body;
    if (!staffId || !pin) {
      res.status(400).json({ message: 'staffId and pin are required.' });
      return;
    }

    const staff = await prisma.staff.findUnique({ where: { id: parseInt(staffId) } });
    if (!staff || !staff.active) {
      res.status(400).json({ message: 'That account is not available.' });
      return;
    }

    const isMatch = await bcrypt.compare(pin, staff.pinHash);
    if (!isMatch) {
      res.status(400).json({ message: 'That code is not right for this name.' });
      return;
    }

    const token = signToken(staff.id, 'STAFF');
    res.json({ token, role: 'STAFF', name: staff.name });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Staff management (owner-only) ---

export const listStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await prisma.staff.findMany({
      select: { id: true, name: true, phone: true, active: true, invitedAt: true },
      orderBy: { invitedAt: 'asc' },
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      res.status(400).json({ message: 'Name and phone are required.' });
      return;
    }

    const pin = freshPin();
    const pinHash = await bcrypt.hash(pin, 10);
    const staff = await prisma.staff.create({
      data: { name, phone, pinHash },
      select: { id: true, name: true, phone: true, active: true, invitedAt: true },
    });

    // The only moment the plaintext PIN ever exists outside the owner's
    // hands — shown once here, never retrievable again after this response.
    res.status(201).json({ ...staff, pin });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, active } = req.body;

    const staff = await prisma.staff.update({
      where: { id },
      data: { name, phone, active },
      select: { id: true, name: true, phone: true, active: true, invitedAt: true },
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await prisma.staff.delete({ where: { id } });
    res.json({ message: 'Staff removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const regenerateStaffPin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const pin = freshPin();
    const pinHash = await bcrypt.hash(pin, 10);
    await prisma.staff.update({ where: { id }, data: { pinHash } });
    res.json({ pin });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
