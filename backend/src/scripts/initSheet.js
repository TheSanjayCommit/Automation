/**
 * npm run init-sheet
 *
 * Creates every missing tab in the Google Sheet and writes the correct header
 * row. Idempotent — safe to re-run on an existing sheet; existing data rows
 * are never touched.
 */

import 'dotenv/config';
import { SCHEMA, ensureTab } from '../services/sheets.js';

async function main() {
  const tabs = Object.keys(SCHEMA);
  console.log(`Initialising ${tabs.length} tabs in sheet ${process.env.GOOGLE_SHEET_ID}\n`);

  for (const tab of tabs) {
    process.stdout.write(`  ${tab.padEnd(16)} … `);
    try {
      await ensureTab(tab);
      console.log('OK');
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  console.log('\nDone. All tabs are ready.');
}

main().catch(err => {
  console.error('init-sheet failed:', err.message);
  process.exit(1);
});
