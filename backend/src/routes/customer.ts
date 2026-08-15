import { Router } from 'express';
import { getRestaurants, getMenu, placeOrder, getOrderStatus, getMyOrders } from '../controllers/customer';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (anyone can view restaurants and menus)
router.get('/restaurants', getRestaurants);
router.get('/restaurants/:id/menu', getMenu);

// Protected routes (must be logged in)
router.use(authenticate);
router.post('/orders', placeOrder);
router.get('/orders/:id', getOrderStatus);
router.get('/users/me/orders', getMyOrders);

export default router;
