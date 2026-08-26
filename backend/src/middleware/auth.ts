import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Owner-only screens: dashboard, reports, payments, staff management.
export const requireOwner = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'OWNER') {
    res.status(403).json({ message: 'Access denied. Owner only.' });
    return;
  }
  next();
};

// Everything else in the admin console: orders, menu, customers.
export const requireStaffOrOwner = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'OWNER' && req.user?.role !== 'STAFF') {
    res.status(403).json({ message: 'Access denied. Staff or owner only.' });
    return;
  }
  next();
};
