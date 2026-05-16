#!/usr/bin/env node
/**
 * release-bundle.mjs — Creates the distribution tar.gz for a Pantheon release.
 *
 * Packages all user-relevant files into pantheon-vX.Y.Z.tar.gz.
 * Excludes build tooling (scripts/, .github/, node_modules/).
 *
 * Usage:
 *   node scripts/release-bundle.mjs                      # reads version from package.json
 *   node scripts/release-bundle.mjs --output ./dist      # custom output dir
 *   node scripts/release-bundle.mjs --version 3.5.0     # explicit version
 */

import { readFileSync, existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const outputDir = arg('--output') ?? join(ROOT, 'dist');
const version = arg('--version') ??
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')).version;

const bundleName = `pantheon-v${version}`;
const stagingDir = join(ROOT, 'dist', `.staging-${bundleName}`);
const outputTar = join(outputDir, `${bundleName}.tar.gz`);

// ── Helpers ───────────────────────────────────────────────────────────────────
function copy(src, dest) {
  const srcPath = join(ROOT, src);
  if (!existsSync(srcPath)) {
    console.log(`  ⏭  skipped  ${src}  (not found)`);
    return;
  }
  const destPath = join(stagingDir, bundleName, dest ?? src);
  mkdirSync(dirname(destPath), { recursive: true });
  cpSync(srcPath, destPath, { recursive: true });
  console.log(`  ✓  ${src}`);
}

// ── Stage files ───────────────────────────────────────────────────────────────
console.log(`\nBuilding bundle: ${bundleName}`);

if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(join(stagingDir, bundleName), { recursive: true });

// Root documents
copy('README.md');
copy('AGENTS.md');
copy('CHANGELOG.md');
copy('CONTRIBUTING.md');
copy('LICENSE');

// Config
copy('opencode.json');
copy('plugin.json');

// Shell helper
copy('sync-opencode.sh');

// Install script exposed at root (not nested under scripts/)
copy('scripts/install.mjs', 'install.mjs');

// Agent definitions
copy('agents');
copy('skills');
copy('prompts');
copy('platform');
copy('instructions');
copy('docs');
copy('images');

// Platform MCP configs
copy('.vscode');
copy('.cursor');
copy('.claude');
copy('.mcp.json');

// ── Write a minimal package.json so install.mjs can resolve it ────────────────
const minPkg = {
  name: 'pantheon',
  version,
  description: 'Multi-agent orchestration platform for AI coding assistants',
  type: 'module',
};
writeFileSync(
  join(stagingDir, bundleName, 'package.json'),
  JSON.stringify(minPkg, null, 2) + '\n',
);

// ── Create tar.gz ─────────────────────────────────────────────────────────────
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

execSync(
  `tar czf "${outputTar}" -C "${stagingDir}" "${bundleName}"`,
  { stdio: 'inherit' },
);

// ── Cleanup staging ───────────────────────────────────────────────────────────
rmSync(stagingDir, { recursive: true, force: true });

// ── Report ────────────────────────────────────────────────────────────────────
const { size } = { size: execSync(`wc -c < "${outputTar}"`).toString().trim() };
const kb = Math.round(Number(size) / 1024);
console.log(`\n✅  ${outputTar}  (${kb} KB)`);
