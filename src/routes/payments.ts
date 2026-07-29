import { Router } from 'express';
import { initializePayment, paystackWebhook } from '../controllers/payments';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticate, initializePayment);
router.post('/webhook', paystackWebhook); 

export default router;
