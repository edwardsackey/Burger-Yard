import { Router } from 'express';
import { createRestaurant, addMenuItem, getAllOrders, updateOrderStatus } from '../controllers/admin';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

const router = Router();

// Admin middleware
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return;
  }
  next();
};

router.use(authenticate, requireAdmin);

router.post('/restaurants', createRestaurant);
router.post('/restaurants/:id/menu', addMenuItem);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
