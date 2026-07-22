#!/usr/bin/env node
/**
 * migrate.mjs — Multi-version migration logic for Pantheon installations
 *
 * Usage:
 *   node scripts/install/migrate.mjs --target ~/.config/opencode
 *   node scripts/install/migrate.mjs --target ~/.config/opencode --dry-run
 *   node scripts/install/migrate.mjs --target ~/.config/opencode --force
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

// Package version from project root
const PANTHON_VERSION = readPackageVersion()

function readPackageVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/**
 * Read the installed version from the target's install state file.
 * @param {string} target
 * @returns {string|null} - version string or null for fresh install
 */
export function detectVersion(target) {
  const stateFile = join(target, '.pantheon', 'install-state.json')
  if (existsSync(stateFile)) {
    try {
      const state = JSON.parse(readFileSync(stateFile, 'utf8'))
      return state.pantheon_version || state.version || 'unknown'
    } catch {
      /* corrupted state — treat as unknown */
    }
  }
  return null // fresh install
}

/**
 * Run version-specific migrations sequentially.
 *
 * @param {string} target - Installation directory
 * @param {string|null} currentVersion - Detected version (null = fresh install)
 * @param {{ dryRun?: boolean }} [options]
 * @returns {{ applied: number, messages: string[] }}
 */
export function runMigrations(target, currentVersion, { dryRun = false } = {}) {
  const applied = []
  const semver = parseSemver(currentVersion)

  // ── Migration: v3.10.0 → v3.18.0 ──────────────────────────────────
  // Fix dangling references, add Memory Protocol
  if (semver && lt(semver, [3, 18, 0])) {
    applied.push({
      from: formatSemver(semver),
      to: '3.18.0',
      description: 'Fix dangling references, add Memory Protocol',
    })
    semver[0] = 3
    semver[1] = 18
    semver[2] = 0
  }

  // ── Migration: v3.18.0 → v3.19.0 ──────────────────────────────────
  // Add runtime component, _pantheon_paths
  if (semver && lt(semver, [3, 19, 0])) {
    applied.push({
      from: formatSemver(semver),
      to: '3.19.0',
      description: 'Add runtime component, _pantheon_paths',
    })
    semver[0] = 3
    semver[1] = 19
    semver[2] = 0
  }

  // ── Migration: v3.19.0 → v3.19.1 ──────────────────────────────────
  // Add persistence MCP, fix 157 dangling refs
  if (semver && lt(semver, [3, 19, 1])) {
    applied.push({
      from: formatSemver(semver),
      to: '3.19.1',
      description: 'Add persistence MCP, fix dangling refs',
    })
    semver[0] = 3
    semver[1] = 19
    semver[2] = 1
  }

  // ── Write updated state ───────────────────────────────────────────
  if (applied.length > 0 && !dryRun) {
    writeInstallState(target, formatSemver(semver))
  }

  return {
    applied: applied.length,
    messages: applied.map((m) => `${m.from} → ${m.to}: ${m.description}`),
  }
}

/**
 * Write install state with current version to target.
 */
function writeInstallState(target, version) {
  const stateDir = join(target, '.pantheon')
  const stateFile = join(stateDir, 'install-state.json')
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true })
  }
  const state = {
    pantheon_version: version,
    updated_at: new Date().toISOString(),
  }
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

// ---------------------------------------------------------------------------
// Minimal semver helpers (no external deps)
// ---------------------------------------------------------------------------

/**
 * Parse "x.y.z" → [major, minor, patch] or null.
 * @param {string|null} v
 * @returns {number[]|null}
 */
function parseSemver(v) {
  if (!v || typeof v !== 'string') return null
  const parts = v.split('.').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) return null
  return [parts[0], parts[1], parts[2] ?? 0]
}

/**
 * Format [major, minor, patch] → "x.y.z".
 * @param {number[]} v
 * @returns {string}
 */
function formatSemver(v) {
  return `${v[0]}.${v[1]}.${v[2]}`
}

/**
 * Compare two semver arrays: is a < b?
 * @param {number[]} a
 * @param {number[]} b
 * @returns {boolean}
 */
function lt(a, b) {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) {
      return (a[i] ?? 0) < (b[i] ?? 0)
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2)
  const targetIdx = args.indexOf('--target')
  const target = targetIdx !== -1 ? args[targetIdx + 1] : process.cwd()
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')

  const currentVersion = detectVersion(target)
  if (!currentVersion) {
    // Fresh install — write state and exit
    if (!dryRun) {
      writeInstallState(target, PANTHON_VERSION)
      console.log(`  ✅ Fresh install — state written (${PANTHON_VERSION})`)
    } else {
      console.log(`  ✅ Fresh install — would write state (${PANTHON_VERSION})`)
    }
    return
  }

  console.log(`  Current version: ${currentVersion}`)

  if (!force && currentVersion === PANTHON_VERSION) {
    console.log('  ⏭️  Already at latest version — no migrations needed')
    return
  }

  const migration = runMigrations(target, currentVersion, { dryRun })

  if (migration.applied > 0) {
    console.log(`  ✅ Applied ${migration.applied} migration(s):`)
    for (const msg of migration.messages) {
      console.log(`     • ${msg}`)
    }
  } else {
    console.log('  ⏭️  No applicable migrations')
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
