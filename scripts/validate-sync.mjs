#!/usr/bin/env node

/**
 * validate-sync.mjs — CI drift validation
 *
 * Runs `npm run sync -- --check` and exits with code 1 if platforms/
 * are out of sync with canonical agents/.
 *
 * Designed for CI (GitHub Actions). Silent on success, loud on failure.
 *
 * Usage:
 *   node scripts/validate-sync.mjs       # CI mode
 *   node scripts/validate-sync.mjs --verbose  # Show all output
 */

import { spawnSync } from 'node:child_process';

const isVerbose = process.argv.includes('--verbose');

const result = spawnSync('node', [
  'scripts/sync-platforms.mjs',
  '--check',
], {
  encoding: 'utf8',
  stdio: isVerbose ? 'inherit' : 'pipe',
});

if (result.error) {
  console.error('❌ Failed to run sync check:', result.error.message);
  process.exit(1);
}

if (result.status === 0) {
  if (!isVerbose) {
    console.log('✅ All platforms are in sync with canonical agents.');
  }
  process.exit(0);
}

// Drift detected
console.log('');
console.log('❌❌❌ PLATFORM SYNC DRIFT DETECTED ❌❌❌');
console.log('');
console.log('The generated platform configs in platforms/ are out of sync');
console.log('with the canonical agents in agents/. This happens when:');
console.log('');
console.log('  1. An agent was edited in agents/ but platforms/ was not regenerated');
console.log('  2. An adapter.json was changed without re-running sync');
console.log('');
console.log('To fix:');
console.log('');
console.log('  npm run sync');
console.log('');
console.log('Then commit the generated files in platforms/.');
console.log('');
console.log('To prevent this, run `npm run sync:check` before committing.');
console.log('A CI gate (sync-check.yml) also blocks PRs with drift.');
console.log('');
process.exit(1);
