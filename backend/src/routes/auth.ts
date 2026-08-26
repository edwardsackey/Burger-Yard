import { Router } from 'express';
import { register, login, signup, requestOtp, verifyOtp, forgotPassword, resetPassword, getProfile, updateProfile, savePushToken } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/signup', signup);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.put('/push-token', authenticate, savePushToken);

export default router;
