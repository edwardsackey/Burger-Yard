import { Router } from 'express';
import { nearbyLandmark } from '../controllers/places';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/nearby-landmark', authenticate, nearbyLandmark);

export default router;
