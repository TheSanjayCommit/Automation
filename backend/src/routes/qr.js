/**
 * POST /api/qr/generate
 * Generates a QR code PNG data-URL from any text or URL string.
 * Used by the Halls page to convert WhatsApp invite links and WiFi
 * strings into scannable QR images without any external service.
 */

import { Router } from 'express';
import QRCode from 'qrcode';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/generate', requireAdmin, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }
    const dataUrl = await QRCode.toDataURL(text.trim(), {
      errorCorrectionLevel: 'M',
      width: 400,
      margin: 2,
    });
    res.json({ dataUrl });
  } catch (e) { next(e); }
});

export default router;
