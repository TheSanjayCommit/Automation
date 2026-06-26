/**
 * Sheet Setup routes — lets BOAs connect a Google Sheet from the admin UI.
 * No code or .env changes needed after this.
 *
 * GET  /api/setup/status   — returns whether a sheet is connected + service-account email
 * POST /api/setup/connect  — accepts a Google Sheet URL (or bare ID), validates access,
 *                            saves the sheet ID, and auto-initialises all 13 tabs.
 */

import { Router } from 'express';
import { google } from 'googleapis';
import { requireAdmin } from '../middleware/auth.js';
import { getRuntimeValue, setRuntimeValue, extractSheetId } from '../services/runtimeConfig.js';
import { SCHEMA, ensureTab } from '../services/sheets.js';

const router = Router();

// ── Helper: get the service-account email from the JSON in .env ───────────────
function getServiceAccountEmail() {
  try {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
    const creds = JSON.parse(raw);
    return creds.client_email || null;
  } catch {
    return null;
  }
}

// ── Helper: build a sheets client (same as in sheets.js) ─────────────────────
function buildSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Service account credentials not configured on the server.');
  const creds = JSON.parse(raw);
  if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ── GET /api/setup/status ────────────────────────────────────────────────────
// Public (no auth) so the login page can show whether the system is ready.
router.get('/status', (req, res) => {
  const sheetId      = getRuntimeValue('sheetId');
  const sheetUrl     = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;
  const email        = getServiceAccountEmail();
  const initialised  = getRuntimeValue('initialised') === true;

  res.json({
    connected:   !!sheetId,
    initialised,
    sheetId,
    sheetUrl,
    serviceAccountEmail: email,
  });
});

// ── POST /api/setup/connect ──────────────────────────────────────────────────
// Admin only. Accepts { sheetUrl } or { sheetId }, validates, saves, inits tabs.
router.post('/connect', requireAdmin, async (req, res, next) => {
  try {
    const { sheetUrl, sheetId: rawId } = req.body;
    const input = sheetUrl || rawId || '';
    const sheetId = extractSheetId(input);

    if (!sheetId) {
      return res.status(400).json({
        error: 'Could not find a valid Spreadsheet ID in the URL you provided. ' +
               'Make sure you copy the full URL from the browser address bar.',
      });
    }

    // Validate that the service account can actually access this sheet
    const sheets = buildSheetsClient();
    try {
      await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    } catch (err) {
      const msg = err.code === 403 || err.code === 404
        ? `Cannot access that sheet. Make sure you shared it with:\n${getServiceAccountEmail()}\n(Editor access)`
        : `Sheet access error: ${err.message}`;
      return res.status(400).json({ error: msg });
    }

    // Save the sheet ID to runtime config
    setRuntimeValue('sheetId', sheetId);
    setRuntimeValue('initialised', false);

    // Auto-initialise all tabs
    const results = {};
    for (const tab of Object.keys(SCHEMA)) {
      try {
        await ensureTab(tab);
        results[tab] = 'ok';
      } catch (e) {
        results[tab] = `failed: ${e.message}`;
      }
    }

    setRuntimeValue('initialised', true);

    res.json({
      ok: true,
      sheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      tabResults: results,
      message: 'Sheet connected and all tabs initialised successfully!',
    });
  } catch (e) { next(e); }
});

// ── POST /api/setup/disconnect ───────────────────────────────────────────────
// Clears the saved sheet ID (lets BOA connect a different sheet).
router.post('/disconnect', requireAdmin, (req, res) => {
  setRuntimeValue('sheetId', null);
  setRuntimeValue('initialised', false);
  res.json({ ok: true, message: 'Sheet disconnected.' });
});

export default router;
