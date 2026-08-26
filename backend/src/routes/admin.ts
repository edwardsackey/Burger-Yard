import { Router } from 'express';
import { addMenuItem, getAllOrders, updateOrderStatus } from '../controllers/admin';
import {
  ownerLogin,
  getActiveStaff,
  staffLogin,
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  regenerateStaffPin,
} from '../controllers/adminAuth';
import { authenticate, requireOwner, requireStaffOrOwner } from '../middleware/auth';

const router = Router();

// Public — reached before anyone is signed in.
router.post('/auth/owner-login', ownerLogin);
router.get('/auth/active-staff', getActiveStaff);
router.post('/auth/staff-login', staffLogin);

// Staff or owner — the day-to-day admin console screens.
router.post('/menu', authenticate, requireStaffOrOwner, addMenuItem);
router.get('/orders', authenticate, requireStaffOrOwner, getAllOrders);
router.put('/orders/:id/status', authenticate, requireStaffOrOwner, updateOrderStatus);

// Owner-only — staff management.
router.get('/staff', authenticate, requireOwner, listStaff);
router.post('/staff', authenticate, requireOwner, createStaff);
router.put('/staff/:id', authenticate, requireOwner, updateStaff);
router.delete('/staff/:id', authenticate, requireOwner, deleteStaff);
router.post('/staff/:id/regenerate-pin', authenticate, requireOwner, regenerateStaffPin);

export default router;
