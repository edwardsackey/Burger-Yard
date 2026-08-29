import { Router } from 'express';
import { getAllOrders, getCustomers, updateOrderStatus } from '../controllers/admin';
import { listMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menu';
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
import { listRiders, createRider, updateRider, deleteRider } from '../controllers/riders';
import { getDashboard } from '../controllers/dashboard';
import { getReports } from '../controllers/reports';
import { authenticate, requireOwner, requireStaffOrOwner } from '../middleware/auth';

const router = Router();

// Public — reached before anyone is signed in.
router.post('/auth/owner-login', ownerLogin);
router.get('/auth/active-staff', getActiveStaff);
router.post('/auth/staff-login', staffLogin);

// Staff or owner — the day-to-day admin console screens.
router.get('/menu', authenticate, requireStaffOrOwner, listMenu);
router.post('/menu', authenticate, requireStaffOrOwner, addMenuItem);
router.put('/menu/:id', authenticate, requireStaffOrOwner, updateMenuItem);
router.delete('/menu/:id', authenticate, requireStaffOrOwner, deleteMenuItem);
router.get('/orders', authenticate, requireStaffOrOwner, getAllOrders);
router.get('/customers', authenticate, requireStaffOrOwner, getCustomers);
router.put('/orders/:id/status', authenticate, requireStaffOrOwner, updateOrderStatus);
router.get('/riders', authenticate, requireStaffOrOwner, listRiders);
// Staff can add a rider on the fly while assigning a delivery; only the
// owner curates the roster afterward (edit/deactivate/remove).
router.post('/riders', authenticate, requireStaffOrOwner, createRider);

// Owner-only — staff management.
router.get('/staff', authenticate, requireOwner, listStaff);
router.post('/staff', authenticate, requireOwner, createStaff);
router.put('/staff/:id', authenticate, requireOwner, updateStaff);
router.delete('/staff/:id', authenticate, requireOwner, deleteStaff);
router.post('/staff/:id/regenerate-pin', authenticate, requireOwner, regenerateStaffPin);

// Owner-only — rider roster management.
router.put('/riders/:id', authenticate, requireOwner, updateRider);
router.delete('/riders/:id', authenticate, requireOwner, deleteRider);

// Owner-only — matches OWNER_ONLY in mobile/context/AdminSession.tsx.
router.get('/dashboard', authenticate, requireOwner, getDashboard);
router.get('/reports', authenticate, requireOwner, getReports);

export default router;
