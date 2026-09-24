/**
 * Rewrites StudySession.activity_type from display labels to activity keys.
 *
 *   'Qbank Practice' → 'practice'      'New Material'  → 'new-material'
 *   'Timed Practice' → 'timed-practice' 'Gap-Filling'  → 'gap-fill'
 *   'Sectional Test' → 'sectional'      'Mock Analysis' → 'analysis'
 *
 * Sessions logged from Sep 1, 2026 already store keys and pass through
 * untouched, so this is safe to run more than once.
 *
 *   node scripts/migrate-activity-types.mjs <backup.json> [-o <out.json>]
 *
 * Writes <backup>.migrated.json unless -o is given; never edits in place.
 * Restore the result through the app's own backup/restore.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const LEGACY = {
  'New Material': 'new-material',
  'Gap-Filling': 'gap-fill',
  'Qbank Practice': 'practice',
  'Timed Practice': 'timed-practice',
  'Sectional Test': 'sectional',
  'Mock Analysis': 'analysis',
};
const KEYS = new Set([
  'new-material', 'gap-fill', 'practice', 'timed-practice',
  'revision', 'sectional', 'mock', 'analysis',
]);

const args = process.argv.slice(2);
const inPath = args.find(a => !a.startsWith('-'));
const outFlag = args.indexOf('-o');
const outPath = outFlag !== -1 ? args[outFlag + 1] : null;

if (!inPath) {
  console.error('usage: node scripts/migrate-activity-types.mjs <backup.json> [-o <out.json>]');
  process.exit(1);
}

const backup = JSON.parse(readFileSync(inPath, 'utf8'));

// The export shape puts collections either at the top level or under `data`.
const root = backup.data && typeof backup.data === 'object' ? backup.data : backup;
const sessions = root.StudySession;

if (!Array.isArray(sessions)) {
  console.error(`No StudySession array found in ${inPath}. Collections present: ${Object.keys(root).join(', ')}`);
  process.exit(1);
}

const counts = { migrated: 0, alreadyKeys: 0, empty: 0 };
const unknown = new Map();

for (const s of sessions) {
  const v = s.activity_type;
  if (!v) { counts.empty++; continue; }
  if (KEYS.has(v)) { counts.alreadyKeys++; continue; }
  if (LEGACY[v]) {
    s.activity_type = LEGACY[v];
    counts.migrated++;
    continue;
  }
  unknown.set(v, (unknown.get(v) || 0) + 1);
}

const dest = outPath || inPath.replace(/\.json$/i, '') + '.migrated.json';
writeFileSync(dest, JSON.stringify(backup, null, 2));

console.log(`StudySession rows: ${sessions.length}`);
console.log(`  migrated to keys : ${counts.migrated}`);
console.log(`  already keys     : ${counts.alreadyKeys}`);
console.log(`  no activity_type : ${counts.empty}`);
if (unknown.size) {
  console.log('\n  UNRECOGNISED — left untouched, these will show as blank in the dialog:');
  for (const [v, n] of unknown) console.log(`    ${JSON.stringify(v)} × ${n}`);
}
console.log(`\nWrote ${dest}`);
