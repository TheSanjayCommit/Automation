/**
 * Google Sheets Data Access Layer
 *
 * Treats each tab in the spreadsheet as a table. Row 1 is the header; every
 * subsequent row is one record. All reads/writes are ordered by SCHEMA column
 * order so that adding columns to a live sheet in the wrong position never
 * silently corrupts data.
 *
 * Auth: a single service-account client is initialised once and reused.
 * The private key in the env var may have literal `\\n` instead of real
 * newlines (common when pasting JSON into dotenv) — we normalise it on load.
 */

import { google } from 'googleapis';
import { getRuntimeValue } from './runtimeConfig.js';

// ── Schema ──────────────────────────────────────────────────────────────────
export const SCHEMA = {
  Students:     ['id','name','mobile','email','hall','rollNo','paymentStatus','otp','checkedIn','checkInTime'],
  Halls:        ['id','name','capacity','filled','whatsappQrUrl','wifiQrUrl'],
  Subjects:     ['id','name','instructor'],
  Schedule:     ['id','day','type','startTime','endTime','subject','instructor','hall','notes'],
  Attendance:   ['id','studentId','studentName','hall','day','session','status','markedAt'],
  Prerequisites:['id','text'],
  Materials:    ['id','session','type','name','url'],
  Winners:      ['id','session','studentName','prize'],
  Contacts:     ['id','role','name','phone','hall'],
  Tickets:      ['id','hall','raisedBy','issueType','description','status','createdAt','resolvedAt'],
  Doubts:       ['id','session','studentName','question','answer','answeredBy','createdAt'],
  Feedback:     ['id','session','studentName','formUrl','submitted'],
  Config:       ['key','value'],
};

// ── Client init ──────────────────────────────────────────────────────────────
let _sheets = null;

function getSheetsClient() {
  if (_sheets) return _sheets;

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');

  const creds = JSON.parse(raw);
  // Fix private key newline escaping (\\n → real newline)
  if (creds.private_key) {
    creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  _sheets = google.sheets({ version: 'v4', auth });
  return _sheets;
}

// Sheet ID: runtime config (set via UI) takes priority over .env
const SHEET_ID = () => {
  const id = getRuntimeValue('sheetId') || process.env.GOOGLE_SHEET_ID || '';
  if (!id) throw new Error('No Google Sheet connected yet. Go to Admin → Connect Sheet to set up.');
  return id;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return a unique id string */
function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Convert a row array to an object using the tab's schema columns */
function rowToObj(tab, row) {
  const cols = SCHEMA[tab];
  const obj = {};
  cols.forEach((col, i) => { obj[col] = row[i] ?? ''; });
  return obj;
}

/** Convert an object to a row array ordered by the tab's schema columns */
function objToRow(tab, obj) {
  return SCHEMA[tab].map(col => obj[col] ?? '');
}

// ── Core CRUD ────────────────────────────────────────────────────────────────

/**
 * Read all data rows from a tab (skips the header row).
 */
export async function readAll(tab) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${tab}!A:ZZ`,
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];           // only header or empty
  return rows.slice(1).map(row => rowToObj(tab, row));
}

/**
 * Find the first row where column === value. Returns the record or null.
 */
export async function findOne(tab, column, value) {
  const rows = await readAll(tab);
  return rows.find(r => r[column] === value) || null;
}

/**
 * Insert a new record. Auto-generates `id` if the tab has one and it is absent.
 */
export async function insert(tab, record) {
  const sheets = getSheetsClient();
  const cols = SCHEMA[tab];

  const newRecord = { ...record };
  if (cols.includes('id') && !newRecord.id) {
    newRecord.id = newId();
  }

  const row = objToRow(tab, newRecord);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `${tab}!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return newRecord;
}

/**
 * Update the first row where matchColumn === matchValue by merging `updates`.
 * Returns the updated record or null if not found.
 */
export async function update(tab, matchColumn, matchValue, updates) {
  const sheets = getSheetsClient();

  // Fetch raw values including header to find the 1-indexed row number
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${tab}!A:ZZ`,
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return null;

  const cols = SCHEMA[tab];
  const colIdx = cols.indexOf(matchColumn);
  if (colIdx === -1) throw new Error(`Column "${matchColumn}" not in schema for ${tab}`);

  // rows[0] is header; rows[1] is spreadsheet row 2, etc.
  const dataRows = rows.slice(1);
  const rowIndex = dataRows.findIndex(r => (r[colIdx] ?? '') === matchValue);
  if (rowIndex === -1) return null;

  const existing = rowToObj(tab, dataRows[rowIndex]);
  const updated = { ...existing, ...updates };
  const rowNum = rowIndex + 2; // +1 for header, +1 for 1-indexing

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `${tab}!A${rowNum}:${colLetter(cols.length)}${rowNum}`,
    valueInputOption: 'RAW',
    requestBody: { values: [objToRow(tab, updated)] },
  });

  return updated;
}

/**
 * Remove the first row where matchColumn === matchValue.
 * Uses batchUpdate deleteDimension (requires the tab's numeric sheetId/gid).
 */
export async function remove(tab, matchColumn, matchValue) {
  const sheets = getSheetsClient();

  // Get all values to find which row to delete
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${tab}!A:ZZ`,
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return false;

  const cols = SCHEMA[tab];
  const colIdx = cols.indexOf(matchColumn);
  if (colIdx === -1) throw new Error(`Column "${matchColumn}" not in schema for ${tab}`);

  const dataRows = rows.slice(1);
  const rowIndex = dataRows.findIndex(r => (r[colIdx] ?? '') === matchValue);
  if (rowIndex === -1) return false;

  const rowNum = rowIndex + 1; // 0-indexed within all rows (header is 0), so data row n is index n+1

  // Fetch sheet metadata to get the numeric sheetId (gid)
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID() });
  const sheetMeta = meta.data.sheets.find(s => s.properties.title === tab);
  if (!sheetMeta) throw new Error(`Tab "${tab}" not found in spreadsheet`);
  const sheetIdNum = sheetMeta.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID(),
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetIdNum,
            dimension: 'ROWS',
            startIndex: rowNum,       // 0-indexed; header is 0, first data row is 1
            endIndex: rowNum + 1,
          },
        },
      }],
    },
  });

  return true;
}

// ── Config helpers ────────────────────────────────────────────────────────────

/**
 * Get a single config value by key.
 */
export async function getConfig(key) {
  const row = await findOne('Config', 'key', key);
  return row ? row.value : null;
}

/**
 * Set a config key (upsert).
 */
export async function setConfig(key, value) {
  const existing = await findOne('Config', 'key', key);
  if (existing) {
    return update('Config', 'key', key, { value });
  }
  return insert('Config', { key, value });
}

/**
 * Return all config rows as a plain key→value object.
 */
export async function getAllConfig() {
  const rows = await readAll('Config');
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  return obj;
}

// ── Sheet initialisation helper ───────────────────────────────────────────────

/**
 * Ensure a tab exists with the correct header row. Idempotent.
 */
export async function ensureTab(tabName) {
  const sheets = getSheetsClient();
  const spreadsheetId = SHEET_ID();

  // Check if the tab already exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
existing:
  for (const s of meta.data.sheets) {
    if (s.properties.title === tabName) {
      // Tab exists — make sure header is present
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabName}!A1:ZZ1`,
      });
      const headerRow = (res.data.values || [])[0] || [];
      const expectedHeader = SCHEMA[tabName];
      if (headerRow.join(',') !== expectedHeader.join(',')) {
        // Write/overwrite the header
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${tabName}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [expectedHeader] },
        });
      }
      break existing;
    }
  }

  // If tab not found, create it
  const exists = meta.data.sheets.some(s => s.properties.title === tabName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [SCHEMA[tabName]] },
    });
  }
}

// ── Internal util ─────────────────────────────────────────────────────────────

/** Convert a 1-indexed column number to a letter (1→A, 26→Z, 27→AA, …) */
function colLetter(n) {
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
