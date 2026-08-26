import { Router } from 'express';
import { getMenu, placeOrder, getOrderStatus, getMyOrders } from '../controllers/customer';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route (anyone can view the menu)
router.get('/menu', getMenu);

// Protected routes (must be logged in)
router.use(authenticate);
router.post('/orders', placeOrder);
router.get('/orders/:id', getOrderStatus);
router.get('/users/me/orders', getMyOrders);

export default router;
