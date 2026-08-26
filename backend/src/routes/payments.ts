import { Router } from 'express';
import { initializePayment, verifyPayment, paystackWebhook } from '../controllers/payments';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, initializePayment);
router.get('/verify/:reference', authenticate, verifyPayment);
router.post('/webhook', paystackWebhook);

export default router;
