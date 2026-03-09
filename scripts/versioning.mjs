#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const versionFiles = [
  'package.json',
  'plugin.json',
  '.github/plugin/plugin.json',
];

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function safeRun(cmd) {
  try {
    return run(cmd);
  } catch {
    return '';
  }
}

function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  return pkg.version;
}

function parseVersion(version) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) {
    throw new Error(`Unsupported version format: ${version}. Expected MAJOR.MINOR.PATCH`);
  }
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function bumpVersion(version, bump) {
  const v = parseVersion(version);
  if (bump === 'major') return `${v.major + 1}.0.0`;
  if (bump === 'minor') return `${v.major}.${v.minor + 1}.0`;
  if (bump === 'patch') return `${v.major}.${v.minor}.${v.patch + 1}`;
  throw new Error(`Invalid bump type: ${bump}`);
}

function getCommitSubjects() {
  const lastTag = safeRun('git describe --tags --abbrev=0');
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const output = safeRun(`git log --pretty=%s ${range}`);
  if (!output) return [];
  return output.split('\n').map((s) => s.trim()).filter(Boolean);
}

function classifyBump(commits) {
  if (commits.length === 0) return 'patch';

  for (const c of commits) {
    if (/BREAKING CHANGE/i.test(c) || /^[a-z]+(\([^)]*\))?!:/i.test(c)) {
      return 'major';
    }
  }

  for (const c of commits) {
    if (/^feat(\([^)]*\))?:/i.test(c)) {
      return 'minor';
    }
  }

  return 'patch';
}

function updateVersionFiles(nextVersion) {
  for (const rel of versionFiles) {
    const abs = path.join(repoRoot, rel);
    const data = JSON.parse(fs.readFileSync(abs, 'utf8'));
    data.version = nextVersion;
    fs.writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}

function printRecommendation() {
  const current = getCurrentVersion();
  const commits = getCommitSubjects();
  const bump = classifyBump(commits);
  const next = bumpVersion(current, bump);

  console.log(`Current: ${current}`);
  console.log(`Recommended bump: ${bump}`);
  console.log(`Next: ${next}`);
  console.log('');
  console.log('Commit sample considered:');
  for (const c of commits.slice(0, 8)) {
    console.log(`- ${c}`);
  }
}

function applyBump(mode) {
  const current = getCurrentVersion();
  const commits = getCommitSubjects();
  const bump = mode === 'auto' ? classifyBump(commits) : mode;
  const next = bumpVersion(current, bump);

  updateVersionFiles(next);
  console.log(`Updated versions: ${current} -> ${next} (${bump})`);
  console.log('Updated files:');
  for (const f of versionFiles) {
    console.log(`- ${f}`);
  }
}

const cmd = process.argv[2];
const arg = process.argv[3];

if (cmd === 'recommend') {
  printRecommendation();
  process.exit(0);
}

if (cmd === 'apply') {
  const valid = new Set(['auto', 'major', 'minor', 'patch']);
  const mode = arg || 'auto';
  if (!valid.has(mode)) {
    console.error('Usage: node scripts/versioning.mjs apply [auto|major|minor|patch]');
    process.exit(1);
  }
  applyBump(mode);
  process.exit(0);
}

console.error('Usage:');
console.error('  node scripts/versioning.mjs recommend');
console.error('  node scripts/versioning.mjs apply [auto|major|minor|patch]');
process.exit(1);
