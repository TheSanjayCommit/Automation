/**
 * Runtime config — persists settings that BOAs change through the UI
 * to a local JSON file so they survive server restarts without touching .env.
 *
 * File: backend/runtime-config.json (auto-created on first write)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dir, '../../runtime-config.json');

function read() {
  if (!existsSync(CONFIG_PATH)) return {};
  try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return {}; }
}

function write(data) {
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getRuntimeConfig() {
  return read();
}

export function setRuntimeValue(key, value) {
  const current = read();
  current[key] = value;
  write(current);
  return current;
}

export function getRuntimeValue(key) {
  return read()[key] ?? null;
}

// ── Bootcamp registry ─────────────────────────────────────────────────────────
// Each bootcamp has a stable ID (e.g. NIAT_BOOTCAMP_1) mapped to a sheet ID.
// Students choose their bootcamp at login — this eliminates dependency on which
// sheet is "currently active" in the admin panel.

/** Return all registered bootcamps as { [bootcampId]: { sheetId, name, registeredAt } } */
export function getAllBootcamps() {
  const cfg = read();
  const bootcamps = cfg.bootcamps || {};

  // Backward-compat: auto-register the existing connected sheet if registry is empty.
  // Fall back to GOOGLE_SHEET_ID env var so this works on fresh Render deploys where
  // runtime-config.json doesn't exist yet (it's gitignored).
  const seedSheetId = cfg.sheetId || process.env.GOOGLE_SHEET_ID || null;
  if (Object.keys(bootcamps).length === 0 && seedSheetId) {
    bootcamps['NIAT_BOOTCAMP_1'] = {
      sheetId: seedSheetId,
      name: 'NIAT Bootcamp 1',
      registeredAt: new Date().toISOString(),
    };
    cfg.bootcamps = bootcamps;
    write(cfg);
  }

  return bootcamps;
}

/** Get a specific bootcamp's data by its ID string */
export function getBootcampById(bootcampId) {
  return getAllBootcamps()[bootcampId] || null;
}

/** Register (or overwrite) a bootcamp in the registry */
export function registerBootcamp(bootcampId, sheetId, name) {
  const current = read();
  if (!current.bootcamps) current.bootcamps = {};
  current.bootcamps[bootcampId] = {
    sheetId,
    name,
    registeredAt: current.bootcamps[bootcampId]?.registeredAt || new Date().toISOString(),
  };
  write(current);
}

/** Turn a human name into a stable uppercase ID, e.g. "NIAT Bootcamp 2" → "NIAT_BOOTCAMP_2" */
export function makeBootcampId(name) {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  // If the ID already exists in the registry, append a counter
  const bootcamps = getAllBootcamps();
  if (!bootcamps[base]) return base;
  let n = 2;
  while (bootcamps[`${base}_${n}`]) n++;
  return `${base}_${n}`;
}

// ── Archived sheets (legacy — now superseded by bootcamp registry) ─────────────
export function getArchivedSheets() {
  return read().archivedSheets || [];
}

export function addArchivedSheet(sheetId) {
  const current = read();
  const archived = current.archivedSheets || [];
  if (!archived.some(s => s.id === sheetId)) {
    archived.push({ id: sheetId, archivedAt: new Date().toISOString() });
  }
  current.archivedSheets = archived;
  write(current);
}

/** Extract the spreadsheet ID from a full Google Sheets URL or bare ID */
export function extractSheetId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(urlOrId.trim())) return urlOrId.trim();
  return null;
}
