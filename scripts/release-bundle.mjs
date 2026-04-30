#!/usr/bin/env node

/**
 * release-bundle.mjs — Generate Pantheon release tarball
 *
 * Creates pantheon-vX.Y.Z.tar.gz with the essential files users need
 * to set up Pantheon in their project.
 *
 * Usage:
 *   node scripts/release-bundle.mjs                    # uses version from package.json
 *   node scripts/release-bundle.mjs --output ./dist     # custom output dir
 *   node scripts/release-bundle.mjs --no-compress       # directory only, no tarball
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const VERSION = PKG.version;
const NAME = `pantheon-v${VERSION}`;

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    outputDir: path.resolve(args[args.indexOf('--output') + 1] || ROOT),
    compress: !args.includes('--no-compress'),
  };
}

// Directories to include in the bundle
const BUNDLE_DIRS = [
  'agents',
  'platform',
  'skills',
  'instructions',
  'prompts',
  'scripts',
  'docs',
  '.github/workflows',
  '.github/hooks',
  '.github/copilot-instructions.md',
  '.github/plugin',
];

// Root-level files to include
const BUNDLE_ROOT_FILES = [
  'AGENTS.md',
  'package.json',
  'plugin.json',
  'package-lock.json',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
];

function buildBundle(baseDir) {
  console.log(`📦 Building Pantheon v${VERSION} bundle...\n`);

  // Create bundle directory
  const bundleDir = path.join(baseDir, NAME);
  fs.mkdirSync(bundleDir, { recursive: true });

  // Copy directories
  for (const dir of BUNDLE_DIRS) {
    const src = path.join(ROOT, dir);
    if (!fs.existsSync(src)) {
      console.log(`   ⚠️  Skipping (not found): ${dir}`);
      continue;
    }
    const dst = path.join(bundleDir, dir);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    execSync(`cp -r "${src}" "${dst}"`, { stdio: 'ignore' });
    console.log(`   ✅ ${dir}`);
  }

  // Copy root files
  for (const file of BUNDLE_ROOT_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) {
      console.log(`   ⚠️  Skipping (not found): ${file}`);
      continue;
    }
    const dst = path.join(bundleDir, file);
    fs.cpSync(src, dst);
    console.log(`   ✅ ${file}`);
  }

  // Write VERSION file
  fs.writeFileSync(path.join(bundleDir, 'VERSION'), `Pantheon v${VERSION}\n`, 'utf8');

  // Remove generated agent files (user runs sync themselves)
  const generatedDirs = [
    'platform/_template/agents',
  ];
  for (const dir of generatedDirs) {
    const full = path.join(bundleDir, dir);
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true });
    }
  }

  console.log(`\n   📁 Bundle directory: ${bundleDir}`);
  return bundleDir;
}

function createTarball(bundleDir, outputDir) {
  const cwd = path.dirname(bundleDir);
  const dirName = path.basename(bundleDir);
  const tarball = path.join(outputDir, `${dirName}.tar.gz`);

  console.log(`   🗜️  Creating tarball: ${tarball}`);

  execSync(`tar -czf "${tarball}" "${dirName}"`, {
    cwd,
    stdio: 'ignore',
  });

  const stats = fs.statSync(tarball);
  console.log(`   📦 Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);

  return tarball;
}

function main() {
  const { outputDir, compress } = parseArgs();

  fs.mkdirSync(outputDir, { recursive: true });

  const bundleDir = buildBundle(outputDir);

  if (compress) {
    const tarball = createTarball(bundleDir, outputDir);
    // Clean up uncompressed directory
    fs.rmSync(bundleDir, { recursive: true, force: true });
    console.log(`\n✅ Release bundle ready: ${tarball}`);
  } else {
    console.log(`\n✅ Release bundle ready (uncompressed): ${bundleDir}`);
  }
}

main();
