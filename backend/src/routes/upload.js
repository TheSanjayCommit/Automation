/**
 * POST /api/upload
 * Accepts a base64 data URL from the frontend, writes it as a real image
 * file on disk, and returns a plain HTTP URL.
 * This keeps Google Sheets cells small (just a URL, never a huge base64 blob).
 */

import { Router } from 'express';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const __dir  = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = resolve(__dir, '../../public/uploads');

// Ensure the folder exists on startup
mkdirSync(UPLOAD_DIR, { recursive: true });

router.post('/', requireAdmin, (req, res, next) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl) return res.status(400).json({ error: 'dataUrl is required' });

    // Parse  "data:image/png;base64,AAAA..."
    const match = dataUrl.match(/^data:([a-zA-Z0-9+/]+\/[a-zA-Z0-9+/]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid data URL format' });

    const mimeType  = match[1];                          // e.g. image/png
    const base64    = match[2];
    const ext       = mimeType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const safeName  = (filename || `upload_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName  = `${safeName}_${Date.now()}.${ext}`;
    const filePath  = resolve(UPLOAD_DIR, fileName);

    writeFileSync(filePath, Buffer.from(base64, 'base64'));

    // Return the public URL the frontend (and students) will use
    const host = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    res.json({ url: `${host}/uploads/${fileName}` });
  } catch (e) { next(e); }
});

export default router;
