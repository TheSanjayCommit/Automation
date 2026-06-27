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
import {
  getRuntimeValue, setRuntimeValue, extractSheetId,
  addArchivedSheet, getAllBootcamps, getBootcampById, registerBootcamp, makeBootcampId,
} from '../services/runtimeConfig.js';
import { SCHEMA, ensureTab, readAll } from '../services/sheets.js';

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

// ── GET /api/setup/bootcamps ─────────────────────────────────────────────────
// Public — used by the student login page to populate the bootcamp selector.
router.get('/bootcamps', (_req, res) => {
  const bootcamps = getAllBootcamps();
  const list = Object.entries(bootcamps)
    .map(([id, data]) => ({ id, name: data.name, registeredAt: data.registeredAt }))
    .sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt));
  res.json(list);
});

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
// Admin only. Accepts { sheetUrl, bootcampName }, validates, saves, inits tabs.
router.post('/connect', requireAdmin, async (req, res, next) => {
  try {
    const { sheetUrl, sheetId: rawId, bootcampName } = req.body;
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

    // Archive the previous sheet so past-bootcamp students can still log in
    const previousSheetId = getRuntimeValue('sheetId');
    if (previousSheetId && previousSheetId !== sheetId) {
      addArchivedSheet(previousSheetId);
    }

    // Snapshot the registry BEFORE changing sheetId — getAllBootcamps() auto-registers
    // the current (old) sheet when the registry is empty, so it must run first.
    const existingCount = Object.keys(getAllBootcamps()).length;

    // Save the new sheet ID to runtime config
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

    // Register this sheet as a named bootcamp in the registry
    const name = (bootcampName || '').trim() || `NIAT Bootcamp ${existingCount + 1}`;
    const bootcampId = makeBootcampId(name);
    registerBootcamp(bootcampId, sheetId, name);

    res.json({
      ok: true,
      sheetId,
      bootcampId,
      bootcampName: name,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      tabResults: results,
      message: `Sheet connected as "${name}" and all tabs initialised successfully!`,
    });
  } catch (e) { next(e); }
});

// ── GET /api/setup/bootcamps-admin ──────────────────────────────────────────
// Admin only. Returns all bootcamps with live student count, halls, and sheet URL.
router.get('/bootcamps-admin', requireAdmin, async (_req, res, next) => {
  try {
    const activeSheetId = getRuntimeValue('sheetId');
    const bootcamps = getAllBootcamps();

    const list = await Promise.all(
      Object.entries(bootcamps).map(async ([id, data]) => {
        let studentCount = 0;
        let halls = [];
        try {
          const [students, hallRows] = await Promise.all([
            readAll('Students', data.sheetId),
            readAll('Halls', data.sheetId),
          ]);
          studentCount = students.length;
          halls = hallRows.map(h => ({
            name: h.name,
            capacity: h.capacity,
            filled: h.filled,
          }));
        } catch (_e) { /* sheet may be inaccessible */ }

        return {
          id,
          name: data.name,
          sheetId: data.sheetId,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${data.sheetId}/edit`,
          registeredAt: data.registeredAt,
          studentCount,
          halls,
          isActive: data.sheetId === activeSheetId,
        };
      })
    );

    list.sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt));
    res.json(list);
  } catch (e) { next(e); }
});

// ── PUT /api/setup/bootcamps/:id ─────────────────────────────────────────────
// Admin only. Edit a bootcamp's name or reconnect it to a different sheet URL.
router.put('/bootcamps/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = getBootcampById(id);
    if (!existing) return res.status(404).json({ error: 'Bootcamp not found' });

    const { name, sheetUrl } = req.body;
    let newSheetId = existing.sheetId;

    if (sheetUrl && sheetUrl.trim()) {
      newSheetId = extractSheetId(sheetUrl.trim());
      if (!newSheetId) return res.status(400).json({ error: 'Invalid Google Sheet URL' });

      // Verify the new sheet is accessible
      const sheets = buildSheetsClient();
      try {
        await sheets.spreadsheets.get({ spreadsheetId: newSheetId });
      } catch (err) {
        const msg = err.code === 403 || err.code === 404
          ? `Cannot access that sheet. Share it with ${getServiceAccountEmail()} (Editor)`
          : `Sheet access error: ${err.message}`;
        return res.status(400).json({ error: msg });
      }
    }

    registerBootcamp(id, newSheetId, (name || existing.name).trim());
    res.json({ ok: true, id, name: (name || existing.name).trim(), sheetId: newSheetId });
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
