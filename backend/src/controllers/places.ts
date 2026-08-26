import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getNearbyLandmark } from '../services/places';

export const nearbyLandmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      res.status(400).json({ message: 'lat and lng query params are required.' });
      return;
    }

    const result = await getNearbyLandmark(lat, lng);
    res.json(result);
  } catch (error) {
    console.error('Nearby landmark error:', error);
    res.status(500).json({ message: 'Could not look up a landmark for that location.' });
  }
};
