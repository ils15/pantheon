#!/usr/bin/env node

/**
 * sync-platforms.mjs — Canonical → platform sync engine
 *
 * Reads canonical agents from agents/ and generates platform-specific
 * configs into platforms/<name>/ based on adapter.json rules.
 *
 * Usage:
 *   node scripts/sync-platforms.mjs               # sync all platforms
 *   node scripts/sync-platforms.mjs vscode         # sync specific platform
 *   node scripts/sync-platforms.mjs --list         # list available platforms
 *   node scripts/sync-platforms.mjs --check        # dry-run: verify no drift
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseAllCanonical, loadAdapter } from './lib/canonical.mjs';
import { transformAgent, serializeAgent } from './lib/transform.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const AGENTS_DIR = path.join(ROOT, 'agents');
const PLATFORMS_DIR = path.join(ROOT, 'platforms');

function getPlatforms() {
  if (!fs.existsSync(PLATFORMS_DIR)) return [];
  return fs.readdirSync(PLATFORMS_DIR)
    .filter(f => {
      // Skip _template directory
      if (f === '_template') return false;
      const adapterPath = path.join(PLATFORMS_DIR, f, 'adapter.json');
      return fs.statSync(path.join(PLATFORMS_DIR, f)).isDirectory() && fs.existsSync(adapterPath);
    })
    .sort();
}

function syncPlatform(platformName, canonicalAgents, checkOnly = false) {
  const adapterPath = path.join(PLATFORMS_DIR, platformName, 'adapter.json');
  const adapter = loadAdapter(adapterPath);
  const outputDir = path.join(PLATFORMS_DIR, platformName, adapter.outputDir || 'agents');
  const changes = [];

  if (!checkOnly) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Identity platforms: copy canonical files byte-for-byte
  const isIdentity = adapter.strategy === 'identity';

  for (const agent of canonicalAgents) {
    // Identity: use original file path
    const origPath = path.join(AGENTS_DIR, `${agent.name}.agent.md`);
    const fileName = isIdentity ? `${agent.name}.agent.md` : transformAgent(agent, adapter).name;
    const filePath = path.join(outputDir, fileName);

    if (isIdentity) {
      if (checkOnly) {
        const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
        const original = fs.readFileSync(origPath, 'utf8');
        if (existing !== original) {
          changes.push({ file: fileName, status: existing === null ? 'NEW' : 'MODIFIED' });
        }
      } else {
        fs.copyFileSync(origPath, filePath);
        changes.push({ file: fileName, status: 'WRITTEN' });
      }
    } else {
      const transformed = transformAgent(agent, adapter);
      const content = serializeAgent(transformed);

      if (checkOnly) {
        const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
        if (existing !== content) {
          changes.push({ file: fileName, status: existing === null ? 'NEW' : 'MODIFIED' });
        }
      } else {
        fs.writeFileSync(filePath, content, 'utf8');
        changes.push({ file: fileName, status: 'WRITTEN' });
      }
    }
  }

  // Check for stale files in output dir (exist in output but not in canonical)
  const canonicalNames = new Set(
    isIdentity
      ? canonicalAgents.map(a => `${a.name}.agent.md`)
      : canonicalAgents.map(a => transformAgent(a, adapter).name)
  );

  if (fs.existsSync(outputDir)) {
    for (const f of fs.readdirSync(outputDir)) {
      if (!canonicalNames.has(f)) {
        changes.push({ file: f, status: checkOnly ? 'STALE' : 'REMOVED' });
        if (!checkOnly) {
          fs.unlinkSync(path.join(outputDir, f));
        }
      }
    }
  }

  return changes;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const platforms = getPlatforms();
    console.log('Available platforms:');
    for (const p of platforms) {
      const adapter = loadAdapter(path.join(PLATFORMS_DIR, p, 'adapter.json'));
      console.log(`  ${p.padEnd(12)} ${adapter.displayName || adapter.name}`);
    }
    process.exit(0);
  }

  const checkOnly = args.includes('--check');

  // Resolve which platforms to sync
  const requested = args.filter(a => !a.startsWith('--'));
  const platforms = requested.length > 0 ? requested : getPlatforms();

  if (platforms.length === 0) {
    const hint = requested.length > 0
      ? `Platforms not found: ${requested.join(', ')}. Create platforms/<name>/adapter.json first.`
      : 'No platforms found in platforms/ directory. Create platforms/<name>/adapter.json to add one.';
    console.log(hint);
    process.exit(1);
  }

  // Parse canonical agents
  let canonicalAgents;
  try {
    canonicalAgents = parseAllCanonical(AGENTS_DIR);
  } catch (err) {
    console.error(`❌ Failed to parse canonical agents: ${err.message}`);
    process.exit(1);
  }

  console.log(`📦 Canonical agents: ${canonicalAgents.length} found in ${AGENTS_DIR}`);
  console.log(`🎯 Platforms to sync (${checkOnly ? 'check' : 'generate'}): ${platforms.join(', ')}`);
  console.log('');

  let hasDrift = false;

  for (const platform of platforms) {
    try {
      const changes = syncPlatform(platform, canonicalAgents, checkOnly);
      const summary = changes.filter(c => c.status !== 'OK').length;

      if (summary === 0 && checkOnly) {
        console.log(`✅ ${platform} — in sync`);
      } else if (summary === 0 && !checkOnly) {
        console.log(`✅ ${platform} — no changes needed`);
      } else {
        hasDrift = true;
        console.log(`${checkOnly ? '❌' : '🔄'} ${platform} — ${summary} changes:`);
        for (const c of changes) {
          if (c.status !== 'OK') {
            console.log(`     ${c.status === 'WRITTEN' ? '✏️' : c.status === 'NEW' ? '🆕' : c.status === 'MODIFIED' ? '📝' : c.status === 'REMOVED' ? '🗑️' : '⚠️'} ${c.file}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${platform} — error: ${err.message}`);
      hasDrift = true;
    }
  }

  if (checkOnly && hasDrift) {
    console.log('\n❌ Platforms are out of sync. Run `npm run sync` to regenerate.');
    process.exit(1);
  }

  if (!checkOnly) {
    console.log('\n✅ Sync complete.');
  }
}

main();
