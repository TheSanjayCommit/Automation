/**
 * Attendance QR routes
 *
 * POST /api/attendance-qr/rotate  (admin) — generates a new rotating QR token
 *   and encodes it into a PNG data-URL.  Old tokens immediately become invalid.
 *
 * GET  /api/attendance-qr/wifi-ssid — returns the bootcamp WiFi SSID from
 *   Config (used by the student app to display the expected network name).
 */

import { Router } from 'express';
import QRCode from 'qrcode';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { setConfig, getConfig } from '../services/sheets.js';

const router = Router();

// POST /api/attendance-qr/rotate  (admin only)
router.post('/rotate', requireAdmin, async (req, res, next) => {
  try {
    const { day, session } = req.body;
    if (!day || !session) return res.status(400).json({ error: 'day and session are required' });

    // New random token — makes any previously distributed QR screenshot worthless
    const token = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const sessionKey = `${day}|${session}`;

    await Promise.all([
      setConfig('activeQrToken', token),
      setConfig('activeQrSession', sessionKey),
    ]);

    // Encode the full context into the QR so the student app can submit everything
    const qrPayload = JSON.stringify({ qrToken: token, day, session });
    const qrImage = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M', width: 400 });

    res.json({ token, qrImage, day, session });
  } catch (e) { next(e); }
});

// GET /api/attendance-qr/wifi-ssid
router.get('/wifi-ssid', requireAuth, async (_req, res, next) => {
  try {
    const ssid = await getConfig('wifiSsid');
    res.json({ ssid: ssid || '' });
  } catch (e) { next(e); }
});

export default router;
