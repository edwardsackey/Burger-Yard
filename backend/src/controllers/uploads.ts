import { NextFunction, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Never trust the original filename — timestamp + random suffix avoids
  // collisions and directory-traversal-y names entirely.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const singleImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('image');

// Runs multer manually (rather than as plain route middleware) so a
// rejection — wrong type, too large — comes back as clean JSON instead of
// falling through to Express's default HTML error page.
export const uploadImageMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  singleImage(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
          ? 'Image must be under 5MB'
          : err instanceof Error
            ? err.message
            : 'Upload failed';
      res.status(400).json({ message });
      return;
    }
    next();
  });
};

export const handleImageUpload = (req: AuthRequest, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ message: 'No image file received' });
    return;
  }
  // Deliberately relative, not built from req.protocol/host — a cloudflared
  // quick tunnel gets a brand-new random hostname every restart, and baking
  // that hostname into the stored URL meant every previously uploaded photo
  // went permanently dead the next time the tunnel restarted. The client
  // resolves this path against whichever host it's currently configured to
  // use (see resolveUploadUrl in mobile/api.ts), so a tunnel restart no
  // longer breaks anything already uploaded.
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
};
