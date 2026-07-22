#!/usr/bin/env node
/**
 * pantheon-update.mjs — Pantheon release CLI
 *
 * Bumps version, updates changelog, commits + tags, and optionally creates a
 * GitHub Release. Reuses scripts/versioning.mjs for version operations.
 *
 * Usage:
 *   node scripts/pantheon-update.mjs                         # auto-detect bump
 *   node scripts/pantheon-update.mjs --patch                 # explicit bump
 *   node scripts/pantheon-update.mjs --minor
 *   node scripts/pantheon-update.mjs --major
 *   node scripts/pantheon-update.mjs --message "fix: ..."    # custom msg
 *   node scripts/pantheon-update.mjs --no-release            # skip GitHub release
 *   node scripts/pantheon-update.mjs --dry-run               # preview only
 *   node scripts/pantheon-update.mjs --help                  # show help
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd, options = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', timeout: 60000, ...options }).trim()
  } catch (e) {
    console.error(`  ❌ Command failed: ${cmd}`)
    if (e.stderr) process.stderr.write(e.stderr)
    if (e.stdout) process.stdout.write(e.stdout)
    return null
  }
}

function getCurrentVersion() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')).version
}

function getLatestTag() {
  const tag = run("git tag -l 'v[0-9]*.[0-9]*.[0-9]*' | sort -V | tail -1")
  return tag || 'v0.0.0'
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    default:
      return `${major}.${minor}.${patch + 1}`
  }
}

function analyzeConventionalCommits(since) {
  const log = run(`git log ${since}..HEAD --format="%s"`)
  if (!log) return 'patch'
  let bump = 'patch'
  for (const msg of log.split('\n').filter(Boolean)) {
    if (/BREAKING CHANGE/i.test(msg) || /^[a-z]+!/i.test(msg)) return 'major'
    if (/^feat/i.test(msg)) bump = 'minor'
  }
  return bump
}

function formatDate() {
  return new Date().toISOString().slice(0, 10)
}

function changelogHasVersionSection(version) {
  if (!existsSync(CHANGELOG_PATH)) return false
  const content = readFileSync(CHANGELOG_PATH, 'utf-8')
  return content.includes(`## [v${version}]`)
}

function addMinimalChangelogEntry(version, message) {
  const date = formatDate()
  const entryLine = message || 'No unreleased changes recorded.'
  const entry = `\n## [v${version}] - ${date}\n\n### Added\n\n- ${entryLine}\n`

  const content = readFileSync(CHANGELOG_PATH, 'utf-8')
  const unreleasedHeader = '## [Unreleased]'
  const idx = content.indexOf(unreleasedHeader)

  if (idx === -1) {
    // No Unreleased section — append at end
    const updated = `${content.trimEnd()}\n\n${entry.trimStart()}`
    writeFileSync(CHANGELOG_PATH, updated)
  } else {
    // Insert after [Unreleased] section
    const afterHeader = idx + unreleasedHeader.length
    const nextSectionIdx = content.indexOf('\n## [', afterHeader)
    const insertAt = nextSectionIdx === -1 ? content.length : nextSectionIdx
    const before = content.slice(0, insertAt)
    const after = content.slice(insertAt)
    writeFileSync(CHANGELOG_PATH, before + entry + after)
  }
  console.log(`  ✓ CHANGELOG: added entry for v${version}`)
}

function showHelp(exitCode = 0) {
  const help = `
pantheon-update — Create a new Pantheon release

USAGE
  node scripts/pantheon-update.mjs [options]

OPTIONS
  --patch               Force patch bump (default for auto-detect)
  --minor               Force minor bump
  --major               Force major bump
  --message <text>      Custom commit / changelog message
  --no-release          Skip GitHub Release creation
  --dry-run             Preview changes without applying
  --help                Show this help

EXAMPLES
  node scripts/pantheon-update.mjs
    Auto-detect bump level from commits since last tag, then release.

  node scripts/pantheon-update.mjs --minor
    Force a minor version bump.

  node scripts/pantheon-update.mjs --dry-run
    Show what the next version would be, without making changes.

  node scripts/pantheon-update.mjs --no-release
    Bump, tag, and commit — skip GitHub Release.
`
  console.log(help)
  process.exit(exitCode)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

if (args.length === 0 || args.some((a) => a === '--help')) {
  showHelp(0)
}

// Parse flags
const flags = {
  patch: args.includes('--patch'),
  minor: args.includes('--minor'),
  major: args.includes('--major'),
  dryRun: args.includes('--dry-run'),
  noRelease: args.includes('--no-release'),
  message: '',
}

const msgIdx = args.indexOf('--message')
if (msgIdx !== -1 && msgIdx + 1 < args.length) {
  flags.message = args[msgIdx + 1]
}

// Determine bump level
const explicitFlagCount = [flags.patch, flags.minor, flags.major].filter(Boolean).length
if (explicitFlagCount > 1) {
  console.error('ERROR: Only one of --patch, --minor, --major allowed.')
  process.exit(1)
}

const latestTag = getLatestTag()
const currentVer = getCurrentVersion()

let bumpType
if (flags.patch) bumpType = 'patch'
else if (flags.minor) bumpType = 'minor'
else if (flags.major) bumpType = 'major'
else bumpType = analyzeConventionalCommits(latestTag)

const nextVersion = bumpVersion(currentVer, bumpType)
const _date = formatDate()

// Check if current version is already unreleased (pkg > tag)
const needsBump = currentVer !== latestTag.replace(/^v/, '')
const targetVersion = needsBump ? currentVer : nextVersion
const effectiveBump = needsBump ? 'none (already ahead)' : bumpType

// ── Dry-run ─────────────────────────────────────────────────────────────────
if (flags.dryRun) {
  const border = '─'.repeat(Math.max(40, targetVersion.length + 20))
  console.log(`
┌${border}┐
│  🔍 DRY-RUN — no changes will be made  │
└${border}┘

Version:      ${currentVer} → ${targetVersion} (${effectiveBump})
Changelog:    Would create entry for ${targetVersion}
${flags.message ? `Message:      "${flags.message}"` : ''}
Git:          Would commit + tag v${targetVersion}
Release:      ${flags.noRelease ? 'Skipped (--no-release)' : `Would create GitHub Release "Pantheon v${targetVersion}"`}

→ Run without --dry-run to apply.
`)
  process.exit(0)
}

// ── Apply version bump ───────────────────────────────────────────────────────
console.log(`\n🚀 Creating release v${targetVersion} (${effectiveBump})\n`)

if (!needsBump) {
  // Normal bump: run versioning.mjs apply
  const applyCmd = `node scripts/versioning.mjs apply ${bumpType}`
  console.log(`$ ${applyCmd}`)
  const output = run(applyCmd)
  console.log(output || '')
} else {
  // Already ahead: sync manifests to current version
  console.log(`ℹ package.json (${currentVer}) already ahead of latest tag (${latestTag}).`)
  const syncCmd = `node scripts/versioning.mjs apply auto`
  const output = run(syncCmd)
  console.log(output || '')
}

// Confirm new version
const newVer = getCurrentVersion()
if (newVer !== targetVersion) {
  console.error(`ERROR: Version mismatch — expected ${targetVersion}, got ${newVer}.`)
  process.exit(1)
}
console.log(`\n✓ Version set to ${newVer}`)

// ── Changelog ────────────────────────────────────────────────────────────────
if (!changelogHasVersionSection(newVer)) {
  // versioning.mjs didn't create a versioned section (Unreleased was empty)
  addMinimalChangelogEntry(newVer, flags.message || undefined)
  console.log('  ℹ Edit CHANGELOG.md to add details if needed.')
} else {
  console.log('  ✓ CHANGELOG section found')
}

// ── Git commit + tag ─────────────────────────────────────────────────────────
const commitMsg = `chore(release): v${newVer}`
const status = run('git status --porcelain', { stdio: 'pipe' })
if (!status) {
  console.error('\n❌ No changes to commit. Nothing to release.')
  process.exit(0)
}
console.log(`\n$ git add -A && git commit -m "${commitMsg}"`)
run('git add -A')
const commitOut = run(`git commit -m "${commitMsg}"`)
console.log(commitOut || '')

console.log(`$ git tag v${newVer}`)
const tagOut = run(`git tag v${newVer}`)
console.log(tagOut || `✓ v${newVer} tagged`)
console.log(`\n✓ Committed and tagged v${newVer}`)

// ── GitHub Release ───────────────────────────────────────────────────────────
if (!flags.noRelease) {
  // Extract the changelog section for this version as release notes
  const changelog = readFileSync(CHANGELOG_PATH, 'utf-8')
  const versionHeader = `## [v${newVer}]`
  const startIdx = changelog.indexOf(versionHeader)

  if (startIdx !== -1) {
    const afterHeader = startIdx + versionHeader.length
    const endIdx = changelog.indexOf('\n## [v', afterHeader)
    const notesBody =
      endIdx === -1
        ? changelog.slice(afterHeader).trim()
        : changelog.slice(afterHeader, endIdx).trim()

    // Write release notes to temp file (avoids shell escaping issues)
    const notesPath = join(ROOT, `.tmp-release-v${newVer}.md`)
    writeFileSync(notesPath, `Pantheon v${newVer}\n\n${notesBody}\n`)

    const releaseCmd = `gh release create v${newVer} --title "Pantheon v${newVer}" --notes-file "${notesPath}"`
    console.log(`\n$ gh release create v${newVer} ...`)
    const releaseOut = run(releaseCmd)
    console.log(releaseOut || '✓ GitHub Release created')
    run(`rm -f "${notesPath}"`)
  } else {
    console.log('  ⚠ Could not extract changelog section for release notes')
    const fallbackCmd = `gh release create v${newVer} --title "Pantheon v${newVer}" --notes "Release v${newVer}"`
    const releaseOut = run(fallbackCmd)
    console.log(releaseOut || '✓ GitHub Release created (fallback)')
  }
} else {
  console.log('  - Skipped GitHub Release (--no-release)')
}

console.log(`\n✅ Release v${newVer} complete!\n`)
console.log(`   To push: git push && git push origin v${newVer}`)
