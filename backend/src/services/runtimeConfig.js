/**
 * Runtime config — persists settings that BOAs change through the UI
 * (primarily the Google Sheet ID) to a local JSON file so they survive
 * server restarts without touching .env or any code.
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

/** Extract the spreadsheet ID from a full Google Sheets URL or bare ID */
export function extractSheetId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  // If it looks like a bare ID (no slashes, reasonable length) accept it directly
  if (/^[a-zA-Z0-9-_]{20,}$/.test(urlOrId.trim())) return urlOrId.trim();
  return null;
}
