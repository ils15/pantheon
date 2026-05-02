#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const manifestFiles = [
  'package.json',
  'plugin.json',
  '.github/plugin/plugin.json',
];

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', ...opts }).trim();
  } catch {
    return '';
  }
}

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  return pkg.version;
}

function getLatestTag() {
  const tag = run('git describe --tags --abbrev=0 2>/dev/null || true');
  return tag || 'v0.0.0';
}

function analyzeConventionalCommits(since) {
  const log = run(`git log ${since}..HEAD --format="%s" 2>/dev/null || git log --format="%s"`);
  if (!log) return 'patch';

  const messages = log.split('\n').filter(Boolean);
  let bump = 'patch';

  for (const msg of messages) {
    if (/BREAKING CHANGE/i.test(msg) || /^[a-z]+!:/i.test(msg)) {
      return 'major';
    }
    if (/^feat/i.test(msg) || /^feature/i.test(msg)) {
      bump = 'minor';
    }
  }

  return bump;
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    default:      return `${major}.${minor}.${patch + 1}`;
  }
}

function updateManifests(newVersion) {
  for (const file of manifestFiles) {
    const path = join(ROOT, file);
    try {
      const content = JSON.parse(readFileSync(path, 'utf-8'));
      content.version = newVersion;
      writeFileSync(path, JSON.stringify(content, null, 2) + '\n');
      console.log(`✓ Updated ${file} → ${newVersion}`);
    } catch {
      console.log(`⚠ Skipped ${file} (not found)`);
    }
  }
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'recommend': {
    const latestTag = getLatestTag();
    const bump = analyzeConventionalCommits(latestTag);
    const current = getCurrentVersion();
    const next = bumpVersion(current, bump);
    console.log(`Current: ${current}`);
    console.log(`Latest tag: ${latestTag}`);
    console.log(`Recommended bump: ${bump}`);
    console.log(`Next version: ${next}`);
    break;
  }

  case 'apply': {
    const type = arg || 'auto';
    const latestTag = getLatestTag();
    const current = getCurrentVersion();
    let bumpType = type;

    if (type === 'auto') {
      bumpType = analyzeConventionalCommits(latestTag);
    }

    const nextVersion = bumpVersion(current, bumpType);
    updateManifests(nextVersion);
    console.log(`\nBumped ${current} → ${nextVersion} (${bumpType})`);
    break;
  }

  default:
    console.log(`Usage: node scripts/versioning.mjs <command>
Commands:
  recommend          Analyze commits and suggest version bump
  apply [type]       Bump version (auto|patch|minor|major) - default: auto
  apply patch        Force patch bump
  apply minor        Force minor bump
  apply major        Force major bump
`);
}
