import { Router } from 'express';
import { register, login, requestOtp, verifyOtp, forgotPassword, resetPassword } from '../controllers/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
