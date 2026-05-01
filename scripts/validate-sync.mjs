#!/usr/bin/env node
/**
 * validate-sync.mjs
 *
 * Checks whether all platform files are in sync with the canonical agents.
 * Exits with code 1 if any file is out of date (for use in CI).
 *
 * Usage:
 *   node scripts/validate-sync.mjs              # check all platforms
 *   node scripts/validate-sync.mjs opencode     # check one platform
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const syncScript = join(__dirname, 'sync-platforms.mjs');

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));

const syncArgs = ['--dry-run'];
if (target) syncArgs.push(target);

const result = spawnSync(
  process.execPath,
  [syncScript, ...syncArgs],
  { stdio: 'inherit', cwd: join(__dirname, '..') }
);

process.exit(result.status ?? 0);
