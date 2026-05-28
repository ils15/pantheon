#!/usr/bin/env node
/**
 * versioning.mjs — Pantheon release versioning helper
 *
 * Commands:
 *   recommend            Analyze commits and suggest next version bump type
 *   apply [type]         Bump manifests + move [Unreleased] → [vX.Y.Z] in CHANGELOG
 *                        type: patch | minor | major | auto (default: auto)
 *   changelog [ver]      (Internal) Insert a versioned section into CHANGELOG
 *                        Normally called by `apply`; can be run standalone.
 *   status               Show current version, latest tag, and pending bump type
 *
 * Design: the release signal is "package.json version > latest git tag".
 * Developers (or AI agents) call `apply` to bump + update CHANGELOG, then push.
 * The auto-release workflow detects the version bump and creates the release.
 * No version bumping ever happens inside GitHub Actions.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MANIFEST_FILES = [
  'package.json',
  'plugin.json',
  '.github/plugin/plugin.json',
];

const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md');

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getLatestTag() {
  // Use numerically highest tag, not just nearest git ancestor
  const tag = run("git tag -l 'v[0-9]*.[0-9]*.[0-9]*' | sort -V | tail -1");
  return tag || 'v0.0.0';
}

function getCurrentVersion() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')).version;
}

// ---------------------------------------------------------------------------
// Semver helpers
// ---------------------------------------------------------------------------

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    default:      return `${major}.${minor}.${patch + 1}`;
  }
}

function analyzeConventionalCommits(since) {
  const log = run(`git log ${since}..HEAD --format="%s"`);
  if (!log) return 'patch';
  let bump = 'patch';
  for (const msg of log.split('\n').filter(Boolean)) {
    if (/BREAKING CHANGE/i.test(msg) || /^[a-z]+!/i.test(msg)) return 'major';
    if (/^feat/i.test(msg)) bump = 'minor';
  }
  return bump;
}

// ---------------------------------------------------------------------------
// Manifest updater
// ---------------------------------------------------------------------------

function updateManifests(newVersion) {
  for (const file of MANIFEST_FILES) {
    const path = join(ROOT, file);
    try {
      const content = JSON.parse(readFileSync(path, 'utf-8'));
      content.version = newVersion;
      writeFileSync(path, JSON.stringify(content, null, 2) + '\n');
      console.log(`  ✓ ${file} → ${newVersion}`);
    } catch {
      console.log(`  ⚠ ${file} not found — skipped`);
    }
  }
}

// ---------------------------------------------------------------------------
// CHANGELOG updater
//
// Finds the [Unreleased] section and:
//   1. Strips empty subsections (### Added\n\n### Changed...)
//   2. Renames [Unreleased] → [vX.Y.Z] - date
//   3. Inserts a fresh empty [Unreleased] template above it
// ---------------------------------------------------------------------------

function promoteUnreleased(newVersion, dateStr) {
  const content = readFileSync(CHANGELOG_PATH, 'utf-8');

  const unreleasedHeader = '## [Unreleased]';
  const idx = content.indexOf(unreleasedHeader);
  if (idx === -1) {
    console.log('  ⚠ [Unreleased] section not found in CHANGELOG — skipping');
    return false;
  }

  // Find the end of [Unreleased]: next ## header or end of file
  const afterHeader = idx + unreleasedHeader.length;
  const nextSectionIdx = content.indexOf('\n## [', afterHeader);
  const unreleasedBody = nextSectionIdx === -1
    ? content.slice(afterHeader)
    : content.slice(afterHeader, nextSectionIdx);

  // Check if the [Unreleased] section has any real content (non-empty lines
  // that aren't just section headers or comments)
  const realLines = unreleasedBody
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('###') && !l.startsWith('<!--'));

  if (realLines.length === 0) {
    console.log('  ℹ [Unreleased] is empty — CHANGELOG not modified');
    return false;
  }

  // Strip lines that are just empty subsections (### X followed by blank line
  // then another ### or end)
  const cleanedBody = unreleasedBody
    .replace(/\n### \w[^\n]*\n(\n(?=###|\n## |\n$))+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();

  const newTemplate = `\n\n<!-- Add new changes here. Running \`node scripts/versioning.mjs apply\` will\n     move this section to a versioned entry and reset the template below. -->\n\n### Added\n\n### Changed\n\n### Fixed\n\n### Removed`;
  const newVersionHeader = `## [v${newVersion}] - ${dateStr}`;

  const before = content.slice(0, idx);
  const after  = nextSectionIdx === -1 ? '' : content.slice(nextSectionIdx);

  const updated =
    before +
    unreleasedHeader + newTemplate + '\n\n' +
    newVersionHeader + cleanedBody +
    after;

  writeFileSync(CHANGELOG_PATH, updated);
  console.log(`  ✓ CHANGELOG: [Unreleased] → [v${newVersion}]`);
  return true;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const command = process.argv[2];
const arg     = process.argv[3];

switch (command) {

  case 'status': {
    const latestTag   = getLatestTag();
    const current     = getCurrentVersion();
    const latestVer   = latestTag.replace(/^v/, '');
    const bump        = analyzeConventionalCommits(latestTag);
    const next        = bumpVersion(current, bump);
    const needsRelease = current !== latestVer;

    console.log(`Current version  : ${current}`);
    console.log(`Latest git tag   : ${latestTag}`);
    console.log(`Release pending  : ${needsRelease ? `YES — tag ${latestTag} < pkg ${current}` : 'NO — already tagged'}`);
    console.log(`Recommended bump : ${bump}`);
    console.log(`Next version     : ${next}`);
    break;
  }

  case 'recommend': {
    const latestTag = getLatestTag();
    const bump      = analyzeConventionalCommits(latestTag);
    const current   = getCurrentVersion();
    console.log(bumpVersion(current, bump));
    break;
  }

  case 'apply': {
    const type      = arg || 'auto';
    const latestTag = getLatestTag();
    const current   = getCurrentVersion();
    const latestVer = latestTag.replace(/^v/, '');

    // If package.json is already ahead of the latest tag, someone bumped
    // without tagging — warn and use the current version as-is.
    if (current !== latestVer) {
      console.log(`⚠ package.json (${current}) already ahead of latest tag (${latestTag}).`);
      console.log(`  Syncing all manifests to ${current} and promoting CHANGELOG.`);
      updateManifests(current);
      const date = new Date().toISOString().slice(0, 10);
      promoteUnreleased(current, date);
      break;
    }

    const bumpType   = type === 'auto' ? analyzeConventionalCommits(latestTag) : type;
    const newVersion = bumpVersion(current, bumpType);
    const date       = new Date().toISOString().slice(0, 10);

    console.log(`Bumping ${current} → ${newVersion} (${bumpType})`);
    updateManifests(newVersion);
    promoteUnreleased(newVersion, date);
    console.log(`\nDone. Commit with: git add -A && git commit -m "chore(release): v${newVersion}"`);
    break;
  }

  // Legacy standalone command — kept for backward compat
  case 'changelog': {
    const version = arg || getCurrentVersion();
    const date    = new Date().toISOString().slice(0, 10);
    promoteUnreleased(version, date);
    break;
  }

  default:
    console.log(`Usage: node scripts/versioning.mjs <command>

Commands:
  status               Show current version, latest tag, release status
  recommend            Print recommended bump type (patch/minor/major)
  apply [type]         Bump manifests + move [Unreleased] → [vX.Y.Z]
                       type: patch | minor | major | auto (default: auto)
  changelog [version]  Promote [Unreleased] → [vX.Y.Z] without bumping

Release flow:
  1. node scripts/versioning.mjs apply [minor]
  2. git add -A && git commit -m "chore(release): vX.Y.Z"
  3. git push     ← CI passes → auto-release fires because pkg > tag
`);
}
