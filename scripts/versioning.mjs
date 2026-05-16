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

function getNextAvailableVersion(baseVersion, bumpType) {
  let candidate = bumpVersion(baseVersion, bumpType);
  while (true) {
    const tag = `v${candidate}`;
    const result = execSync(`git tag -l "${tag}"`, { encoding: 'utf-8' }).trim();
    if (!result) return candidate; // tag doesn't exist — use it
    // Tag exists — bump patch
    const [major, minor, patch] = candidate.split('.').map(Number);
    candidate = `${major}.${minor}.${patch + 1}`;
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

const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md');

function parseConventional(subject) {
  if (/^Merge\b/i.test(subject)) {
    return { type: 'merge', scope: '', breaking: false, desc: subject };
  }
  const m = /^([a-zA-Z]+)(?:\(([^)]*)\))?(!)?\s*:\s*(.*)$/.exec(subject);
  if (m) {
    return { type: m[1].toLowerCase(), scope: m[2] || '', breaking: !!m[3], desc: m[4] };
  }
  return { type: 'other', scope: '', breaking: false, desc: subject };
}

function categorize(parsed) {
  if (parsed.breaking) return '⚠️ Breaking Changes';
  if (parsed.type === 'merge') return null;
  switch (parsed.type) {
    case 'feat':
    case 'feature': return 'Added';
    case 'fix': return 'Fixed';
    case 'perf':
    case 'refactor': return 'Changed';
    case 'docs': return 'Documentation';
    case 'test':
    case 'style': return null;
    case 'ci': return 'Changed';
    case 'chore':
      if (parsed.scope === 'release') return null;
      if (parsed.scope === 'deps' || parsed.scope === 'deps-dev') return 'Dependencies';
      return 'Changed';
    default:
      return (parsed.desc && parsed.desc.length > 20) ? 'Changed' : null;
  }
}

function generateChangelog(newVersion, dateStr) {
  const latestTag = getLatestTag();
  const sep = '|||SEP|||';
  let log = run(`git log ${latestTag}..HEAD --format="%H${sep}%s${sep}%b${sep}%aN${sep}%ai" 2>/dev/null`);
  if (!log) {
    console.log('No new commits since last tag — nothing to add to CHANGELOG');
    return false;
  }

  const commits = log.split('\n').filter(Boolean).map(line => {
    const p = line.split(sep);
    return { hash: p[0] || '', subject: p[1] || '', body: (p[2] || '').trim(), author: p[3] || '', date: p[4] || '' };
  });

  const sections = { '⚠️ Breaking Changes': [], Added: [], Fixed: [], Changed: [], Documentation: [], Dependencies: [] };
  const order = ['⚠️ Breaking Changes', 'Added', 'Fixed', 'Changed', 'Documentation', 'Dependencies'];

  for (const c of commits) {
    const parsed = parseConventional(c.subject);
    const cat = categorize(parsed);
    if (!cat) continue;

    let desc = parsed.desc.charAt(0).toUpperCase() + parsed.desc.slice(1);
    let entry = `- ${desc}`;
    if (c.body && c.body.length > 10) {
      const firstPara = c.body.split('\n\n')[0].trim().replace(/\n/g, '\n  ');
      if (firstPara.length > 10) {
        entry += `\n  ${firstPara}`;
      }
    }
    sections[cat].push(entry);
  }

  const hasContent = Object.values(sections).some(a => a.length > 0);
  if (!hasContent) {
    console.log('No categorizable commits since last tag — nothing to add to CHANGELOG');
    return false;
  }

  const lines = [`## [${newVersion}] - ${dateStr}`, ''];
  for (const cat of order) {
    const items = sections[cat];
    if (!items.length) continue;
    lines.push(`### ${cat}`, '');
    lines.push(...items, '');
  }

  const section = lines.join('\n');
  const content = readFileSync(CHANGELOG_PATH, 'utf-8');
  const idx = content.indexOf('\n---\n');
  if (idx === -1) {
    console.error('Could not find separator (---) in CHANGELOG.md — aborting');
    return false;
  }
  const insertPos = idx + 5;
  writeFileSync(CHANGELOG_PATH, content.slice(0, insertPos) + '\n' + section + '\n' + content.slice(insertPos));
  console.log(`✓ Inserted changelog section for v${newVersion} into CHANGELOG.md`);
  return true;
}

const command = process.argv[2];
const arg = process.argv[3];
const arg2 = process.argv[4];

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

    const nextVersion = getNextAvailableVersion(current, bumpType);
    updateManifests(nextVersion);
    console.log(`\nBumped ${current} → ${nextVersion} (${bumpType})`);
    break;
  }

  case 'changelog': {
    const version = arg || getCurrentVersion();
    const date = arg2 || new Date().toISOString().slice(0, 10);
    generateChangelog(version, date);
    break;
  }

  default:
    console.log(`Usage: node scripts/versioning.mjs <command>
Commands:
  recommend            Analyze commits and suggest version bump
  apply [type]         Bump version (auto|patch|minor|major) - default: auto
  changelog [ver] [dt] Generate changelog section since last tag (uses pkg version + today by default)
`);
}
