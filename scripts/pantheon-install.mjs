#!/usr/bin/env node
/**
 * pantheon-install.mjs — Multi-phase Pantheon installer orchestrator
 *
 * Runs 3-phase pipeline: SYNC → INSTALL → VERIFY
 *
 * Usage:
 *   node scripts/pantheon-install.mjs                          # default: opencode → ~/.config/opencode/
 *   node scripts/pantheon-install.mjs --platform opencode,claude
 *   node scripts/pantheon-install.mjs --platform all
 *   node scripts/pantheon-install.mjs --target ~/.config/opencode
 *   node scripts/pantheon-install.mjs --dry-run                  # preview only
 *   node scripts/pantheon-install.mjs --check-only               # verify only, no sync/install
 *   node scripts/pantheon-install.mjs --skip-sync                # skip sync, just install+verify
 *   node scripts/pantheon-install.mjs --clean                    # clean install (wipe + fresh)
 *   node scripts/pantheon-install.mjs --yes                      # non-interactive
 *   node scripts/pantheon-install.mjs --retry-failed             # retry only failed items from last run
 *   node scripts/pantheon-install.mjs --verbose                  # detailed output
 *   node scripts/pantheon-install.mjs --help                     # show help
 *   node scripts/pantheon-install.mjs --tier none                # agents only, no external MCPs
 *   node scripts/pantheon-install.mjs --no-mcp                   # alias for --tier none
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateVscodeMcpConfig } from './install/copilot.mjs'
import { detectAndReport } from './install/shared.mjs'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATE_FILE = join(ROOT, '.pantheon', 'install-state.json')
const PANTHON_DOT_DIR = join(ROOT, '.pantheon')
const DOCS_MCP_TOOLS = join(ROOT, 'docs', 'mcp-tools.md')

const AGENT_COUNT = 14

const ALL_PLATFORMS = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot', 'continue', 'cline']

const PLATFORM_LABELS = {
  opencode: 'OpenCode',
  claude: 'Claude Code',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  copilot: 'VS Code / Copilot',
  continue: 'Continue.dev',
  cline: 'Cline',
}

// ANSI color codes (no external deps)
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {{ pass: number; warn: number; error: number; info: number }} */
const counts = { pass: 0, warn: 0, error: 0, info: 0 }
const warnings = []

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    target: null,
    platforms: null,
    detect: false,
    dryRun: false,
    backup: false,
    checkOnly: false,
    skipSync: false,
    clean: false,
    yes: false,
    retryFailed: false,
    verbose: false,
    help: false,
    tier: null,
  }

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--target':
        args.target = argv[++i]
        break
      case '--platform':
      case '--platforms':
        args.platforms = argv[++i].split(',').map((s) => s.trim().toLowerCase())
        break
      case '--backup':
        args.backup = true
        break
      case '--detect':
        args.detect = true
        break
      case '--dry-run':
        args.dryRun = true
        break
      case '--check-only':
        args.checkOnly = true
        break
      case '--skip-sync':
        args.skipSync = true
        break
      case '--clean':
        args.clean = true
        break
      case '--yes':
        args.yes = true
        break
      case '--retry-failed':
        args.retryFailed = true
        break
      case '--verbose':
        args.verbose = true
        break
      case '--tier':
        args.tier = argv[++i]
        break
      case '--no-mcp':
        args.tier = 'none'
        break
      case '--help':
      case '-h':
        args.help = true
        break
      default:
        console.warn(`  ${C.yellow}⚠ Unknown option: ${arg}${C.reset}`)
        break
    }
  }

  // Default target
  if (!args.target) {
    args.target = join(homedir(), '.config', 'opencode')
  } else if (!args.target.startsWith('/')) {
    args.target = resolvePath(
      args.target.startsWith('~') ? args.target.replace('~', homedir()) : args.target,
    )
  }

  // Resolve ~ in target
  if (args.target.startsWith('~')) {
    args.target = join(homedir(), args.target.slice(1))
  }

  // Default platforms
  if (!args.platforms) {
    args.platforms = ['opencode']
  }

  // Validate --tier
  if (args.tier) {
    const validTiers = ['essential', 'recommended', 'full', 'none']
    if (!validTiers.includes(args.tier)) {
      console.error(
        `${C.red}${I.error} Invalid --tier value "${args.tier}". Valid: ${validTiers.join(', ')}${C.reset}`,
      )
      process.exit(2)
    }
  }

  return args
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

const I = {
  pass: '\u2705',
  warn: '\u26A0\uFE0F',
  error: '\u274C',
  info: '\u2139\uFE0F',
}

function emit(category, message) {
  counts[category]++
  if (
    category === 'pass' &&
    !process.argv.includes('--verbose') &&
    !process.argv.includes('--check-only')
  )
    return
  const prefix = I[category] ?? category
  const color =
    category === 'pass'
      ? C.green
      : category === 'warn'
        ? C.yellow
        : category === 'error'
          ? C.red
          : C.blue
  console.log(`  ${color}${prefix} ${message}${C.reset}`)
}

function pass(msg) {
  emit('pass', msg)
}
function warn(msg) {
  emit('warn', msg)
  warnings.push(msg)
}
function error(msg) {
  emit('error', msg)
}
function info(msg) {
  emit('info', msg)
}

function section(title) {
  console.log(`\n${C.cyan}${C.bold}  ${title}${C.reset}`)
  console.log(`  ${C.gray}${'─'.repeat(54)}${C.reset}`)
}

function showHelp() {
  console.log(`
${C.bold}Pantheon Install — Multi-phase installer orchestrator${C.reset}

${C.dim}Runs 3-phase pipeline: SYNC → INSTALL → VERIFY${C.reset}

${C.bold}Usage:${C.reset}
  node scripts/pantheon-install.mjs                              ${C.dim}# default: opencode → ~/.config/opencode/${C.reset}
  node scripts/pantheon-install.mjs --platform opencode,claude
  node scripts/pantheon-install.mjs --platform all
  node scripts/pantheon-install.mjs --target ~/.config/opencode
  node scripts/pantheon-install.mjs --detect                       ${C.dim}# detect platforms, no install${C.reset}
  node scripts/pantheon-install.mjs --dry-run                      ${C.dim}# preview only${C.reset}
  node scripts/pantheon-install.mjs --backup                       ${C.dim}# create timestamped backup before install${C.reset}
  node scripts/pantheon-install.mjs --check-only                   ${C.dim}# verify only, no sync/install${C.reset}
  node scripts/pantheon-install.mjs --skip-sync                    ${C.dim}# skip sync, just install+verify${C.reset}
  node scripts/pantheon-install.mjs --clean                        ${C.dim}# clean install (wipe + fresh)${C.reset}
  node scripts/pantheon-install.mjs --yes                          ${C.dim}# non-interactive${C.reset}
  node scripts/pantheon-install.mjs --retry-failed             ${C.dim}# retry only failed items from last run${C.reset}
  node scripts/pantheon-install.mjs --verbose                  ${C.dim}# detailed output${C.reset}
  node scripts/pantheon-install.mjs --help                     ${C.dim}# show this help${C.reset}
  ${C.dim}
  ${C.reset}  ${C.bold}Tier MCP selection:${C.reset}
   node scripts/pantheon-install.mjs --tier essential --dry-run ${C.dim}# preview essential MCPs${C.reset}
   node scripts/pantheon-install.mjs --tier recommended --dry-run${C.dim} # preview essential + recommended${C.reset}
   node scripts/pantheon-install.mjs --tier full --dry-run      ${C.dim}# preview all MCPs${C.reset}
   node scripts/pantheon-install.mjs --tier essential --yes     ${C.dim}# auto-add essential MCPs + install${C.reset}
   node scripts/pantheon-install.mjs --tier recommended --yes   ${C.dim}# auto-add recommended MCPs + install${C.reset}
   node scripts/pantheon-install.mjs --tier none                 ${C.dim}# agents only, no external MCPs${C.reset}
   node scripts/pantheon-install.mjs --no-mcp                    ${C.dim}# alias for --tier none${C.reset}

${C.bold}Phases:${C.reset}
  ${C.cyan}SYNC${C.reset}    — npm run sync (generate platform files from canonical agents)
  ${C.cyan}INSTALL${C.reset} — node scripts/install.mjs with passed args
  ${C.cyan}VERIFY${C.reset}  — run verification checks (Tier 1 fail-fast, Tier 2 warn, Tier 3 info)

${C.bold}Exit codes:${C.reset}
  0 — all phases complete and verified
  1 — warnings (verify tier 2/3 issues)
  2 — errors (sync/install failure or tier 1 verify failure)
`)
}

// ---------------------------------------------------------------------------
// Header / Footer
// ---------------------------------------------------------------------------

function printHeader(title) {
  const line = `╔${'═'.repeat(30)}╗`
  const padded = `║  ${title.padEnd(26)} ║`
  console.log(`\n${C.cyan}${line}`)
  console.log(padded)
  console.log(`${`╚${'═'.repeat(30)}╝`}${C.reset}\n`)
}

function printFooter(title) {
  const icon = title.startsWith('❌') ? C.red : title.startsWith('⚠') ? C.yellow : C.green
  const line = `╔${'═'.repeat(36)}╗`
  const padded = `║  ${icon} ${title.padEnd(26)} ${C.reset}║`
  console.log(`\n${C.cyan}${line}${C.reset}`)
  console.log(padded)
  console.log(`${C.cyan}╚${'═'.repeat(36)}╝${C.reset}`)
}

// ---------------------------------------------------------------------------
// State tracking
// ---------------------------------------------------------------------------

function readState() {
  try {
    if (!existsSync(STATE_FILE)) return null
    const raw = readFileSync(STATE_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeState(state) {
  if (!existsSync(PANTHON_DOT_DIR)) {
    mkdirSync(PANTHON_DOT_DIR, { recursive: true })
  }
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function defaultState(args) {
  return {
    version: 1,
    started_at: new Date().toISOString(),
    platforms: args.platforms,
    target: args.target,
    status: 'running',
    phases: {
      sync: 'pending',
      install: 'pending',
      verify: 'pending',
    },
    warnings: [],
  }
}

// ---------------------------------------------------------------------------
// Phase 1: SYNC
// ---------------------------------------------------------------------------

function runSync(args, state) {
  section('Phase 1: SYNC — Generate platform files')
  console.log()

  if (args.skipSync || args.checkOnly) {
    info('Skipped (--skip-sync or --check-only)')
    state.phases.sync = 'skipped'
    writeState(state)
    return true
  }

  if (args.dryRun) {
    console.log(
      `  ${C.blue}${I.info}${C.reset} ${C.dim}Dry-run: would run "npm run sync"${C.reset}`,
    )
    state.phases.sync = 'dry-run'
    writeState(state)
    return true
  }

  if (args.retryFailed && state.phases.sync === 'pass') {
    info('Already passed in last run, skipping (--retry-failed)')
    return true
  }

  try {
    console.log(`  ${C.cyan}⟳${C.reset} Running npm run sync...\n`)
    const output = execSync('npm run sync', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: args.verbose ? 'inherit' : 'pipe',
      timeout: 120_000,
    })
    const lines = (output.stdout || output || '').split('\n').filter(Boolean)
    const platformCount = lines.filter((l) => l.includes('Done —') || l.includes('(')).length || 1
    const changeCount = lines.filter((l) => l.includes('✏️') || l.includes('updated')).length

    console.log()
    pass(`Sync complete — ${platformCount} platform(s), ${changeCount} change(s)`)
    state.phases.sync = 'pass'
    writeState(state)
    return true
  } catch (err) {
    const stderr = err.stderr?.toString() || err.message || 'unknown error'
    console.error(`\n  ${C.red}${I.error} Sync failed:${C.reset}`)
    console.error(`  ${C.red}${stderr.split('\n').slice(0, 10).join('\n  ')}${C.reset}`)
    error('Sync failed — see above')
    state.phases.sync = 'fail'
    state.status = 'partial'
    writeState(state)
    return false
  }
}

// ---------------------------------------------------------------------------
// Phase 2: INSTALL
// ---------------------------------------------------------------------------

function runInstall(args, state) {
  section('Phase 2: INSTALL — Deploy to target')
  console.log()

  if (args.checkOnly) {
    info('Skipped (--check-only)')
    state.phases.install = 'skipped'
    writeState(state)
    return true
  }

  if (args.dryRun) {
    console.log(
      `  ${C.blue}${I.info}${C.reset} ${C.dim}Dry-run: would run install.mjs --target ${args.target} --platforms ${args.platforms.join(',')}${C.reset}`,
    )
    state.phases.install = 'dry-run'
    writeState(state)
    return true
  }

  if (args.retryFailed && state.phases.install === 'pass') {
    info('Already passed in last run, skipping (--retry-failed)')
    return true
  }

  // Build args for install.mjs
  const installArgs = [
    join(ROOT, 'scripts', 'install.mjs'),
    '--target',
    args.target,
    '--platforms',
    args.platforms.join(','),
  ]

  if (args.clean) installArgs.push('--clean')
  if (args.backup) installArgs.push('--backup')
  if (args.dryRun) installArgs.push('--dry-run')
  if (args.yes) {
    // install.mjs doesn't have a --yes flag, but we pass it for future compat
    installArgs.push('--yes')
  }
  if (args.verbose) installArgs.push('--verbose')

  const platformsStr = args.platforms.map((p) => PLATFORM_LABELS[p] || p).join(', ')
  console.log(`  ${C.cyan}⟳${C.reset} Installing ${platformsStr} → ${args.target}\n`)

  try {
    const result = spawnSync(process.execPath, installArgs, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: args.verbose ? 'inherit' : 'pipe',
      timeout: 180_000,
    })

    const stdout = result.stdout || ''
    const stderr = result.stderr || ''

    if (result.status === 0) {
      // Parse output for created/skipped counts
      const createdMatch = stdout.match(/(\d+)\s+created/g)
      const totalCreated = createdMatch
        ? createdMatch.map((m) => parseInt(m.match(/\d+/)[0], 10)).reduce((a, b) => a + b, 0)
        : 0
      const errorsMatch = stdout.match(/(\d+)\s+errors/)
      const hasErrors = errorsMatch ? parseInt(errorsMatch[1], 10) > 0 : false

      if (hasErrors) {
        warn('Install completed with errors — check output above')
        state.phases.install = 'warn'
      } else {
        pass(`Install complete — ${totalCreated} files created`)
        state.phases.install = 'pass'
      }
      if (args.verbose && stdout) {
        console.log(stdout)
      }
    } else {
      const errLines = (stderr || stdout || `exit code ${result.status}`)
        .split('\n')
        .slice(0, 15)
        .join('\n  ')
      console.error(`\n  ${C.red}${I.error} Install failed (exit ${result.status}):${C.reset}`)
      console.error(`  ${C.red}${errLines}${C.reset}`)
      error('Install failed — see above')
      state.phases.install = 'fail'
      state.status = 'partial'
      writeState(state)
      return false
    }
  } catch (err) {
    console.error(`\n  ${C.red}${I.error} Install error: ${err.message}${C.reset}`)
    error('Install error')
    state.phases.install = 'fail'
    state.status = 'partial'
    writeState(state)
    return false
  }

  writeState(state)
  return state.phases.install === 'pass' || state.phases.install === 'warn'
}

// ---------------------------------------------------------------------------
// Phase 3: VERIFY
// ---------------------------------------------------------------------------

/**
 * Run all verification checks against the target installation.
 * Returns { pass: boolean, tier1: number, tier2: number, tier3: number }
 */
async function verify(target, args) {
  /** @type {{ tier: number, pass: boolean, msg: string }[]} */
  const results = []

  // Helper to run a check
  function check(tier, name, fn) {
    try {
      const result = fn()
      if (result.pass) {
        results.push({ tier, pass: true, msg: `${name}: ${result.msg || 'passed'}` })
      } else {
        results.push({ tier, pass: false, msg: `${name}: ${result.msg || 'failed'}` })
      }
    } catch (err) {
      results.push({ tier, pass: false, msg: `${name}: ${err.message}` })
    }
  }

  // -----------------------------------------------------------------------
  // Tier 1 — fail-fast
  // -----------------------------------------------------------------------

  check(1, 'Agent count', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir))
      return { pass: false, msg: `agents directory not found at ${agentsDir}` }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const count = files.length
    if (count < AGENT_COUNT) {
      return {
        pass: false,
        msg: `expected ${AGENT_COUNT} agents, found ${count} (missing: ${AGENT_COUNT - count})`,
      }
    }
    return { pass: true, msg: `${count}/${AGENT_COUNT} agents present` }
  })

  check(1, 'mcp_tools frontmatter', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir)) return { pass: false, msg: 'agents directory not found' }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const missing = []
    for (const file of files) {
      const content = readFileSync(join(agentsDir, file), 'utf8')
      if (!content.includes('mcp_tools:')) {
        missing.push(file)
      }
    }
    if (missing.length > 0) {
      return {
        pass: false,
        msg: `${missing.length} agent(s) missing mcp_tools: ${missing.join(', ')}`,
      }
    }
    return { pass: true, msg: `all ${files.length} agents have mcp_tools` }
  })

  check(1, 'Permissions check', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir)) return { pass: false, msg: 'agents directory not found' }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const issues = []
    for (const file of files) {
      const content = readFileSync(join(agentsDir, file), 'utf8')
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (!fmMatch) {
        issues.push(`${file}: no frontmatter`)
        continue
      }
      const fm = fmMatch[1]
      // Check permission block exists
      if (!fm.includes('permission:') && !fm.includes('tools:')) {
        issues.push(`${file}: no permission or tools block`)
      }
      // Check for both bash and edit being denied (read-only agents should have edit: deny)
      const _hasEditDeny = /edit:\s*deny/.test(fm)
      const hasBashDeny = /bash:\s*deny/.test(fm)
      // Agents that have edit or bash allow should have ⛔ sections in body for the denied one
      // This is a soft check — we flag inconsistency but don't fail
      if (hasBashDeny && !content.includes('\u26D4')) {
        issues.push(`${file}: bash is deny but no ⛔ section in body`)
      }
    }
    if (issues.length > 0) {
      return {
        pass: issues.length <= 2,
        msg: `${issues.length} permission issue(s): ${issues.slice(0, 3).join('; ')}`,
      }
    }
    return { pass: true, msg: 'all permissions valid' }
  })

  check(1, 'bash=deny agents exclusion', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir)) return { pass: false, msg: 'agents directory not found' }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const issues = []
    for (const file of files) {
      const content = readFileSync(join(agentsDir, file), 'utf8')
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (!fmMatch) continue
      const fm = fmMatch[1]
      const hasBashDeny = /bash:\s*deny/.test(fm)
      if (hasBashDeny) {
        // Check if mcp_tools has non-empty pantheon-code-mode references
        const mcpSection = content.match(/mcp_tools:\s*\n([\s\S]*?)(?=\n\S|\n---|$)/)
        if (mcpSection) {
          const mcpContent = mcpSection[1]
          const codeModeMatch = mcpContent.match(/pantheon-code-mode:\s*\[(.*?)\]/)
          if (codeModeMatch) {
            const tools = codeModeMatch[1].trim()
            if (tools.length > 0) {
              issues.push(`${file}: bash is deny but has pantheon-code-mode: [${tools}]`)
            }
          }
        }
      }
    }
    if (issues.length > 0) {
      return {
        pass: false,
        msg: `${issues.length} agent(s) have bash=deny but non-empty pantheon-code-mode: ${issues.join('; ')}`,
      }
    }
    return { pass: true, msg: 'all bash=deny agents properly exclude code-mode' }
  })

  // -----------------------------------------------------------------------
  // Tier 2 — warn
  // -----------------------------------------------------------------------

  check(2, 'MCP Capabilities sections', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir)) return { pass: false, msg: 'agents directory not found' }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const missing = []
    for (const file of files) {
      const content = readFileSync(join(agentsDir, file), 'utf8')
      if (!content.includes('MCP Capabilities') && !content.includes('MCP Capability')) {
        missing.push(file)
      }
    }
    if (missing.length > 0) {
      // Accept if some agents don't have it (e.g., talos might not)
      const threshold = Math.ceil(files.length * 0.2) // 20% threshold
      if (missing.length > threshold) {
        return {
          pass: false,
          msg: `${missing.length} agent(s) missing MCP Capabilities section (threshold: ${threshold})`,
        }
      }
    }
    return { pass: true, msg: 'MCP Capabilities sections present' }
  })

  check(2, 'Inline compression preserved', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir)) return { pass: false, msg: 'agents directory not found' }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const issues = []
    for (const file of files) {
      const content = readFileSync(join(agentsDir, file), 'utf8')
      // Check that MCP sections have inline tool lists, not just references
      const mcpSection = content.match(/## MCP Capabilities[\s\S]*?(?=## |$)/)
      if (mcpSection?.[0].includes('See `mcp_tools:`')) {
        issues.push(`${file}: MCP section defers to frontmatter without inline list`)
      }
    }
    if (issues.length > 0) {
      return { pass: false, msg: `${issues.length} agent(s) with inline compression issues` }
    }
    return { pass: true, msg: 'inline compression preserved' }
  })

  check(2, 'docs/mcp-tools.md exists', () => {
    if (existsSync(DOCS_MCP_TOOLS)) {
      const stats = statSync(DOCS_MCP_TOOLS)
      return { pass: true, msg: `${(stats.size / 1024).toFixed(1)}KB` }
    }
    // Check in target similarly
    const targetDocs = join(target, '..', 'docs', 'mcp-tools.md')
    if (existsSync(targetDocs)) {
      return { pass: true, msg: 'found at project level' }
    }
    return { pass: false, msg: 'not found in docs/ or target' }
  })

  check(2, 'Skills deployed', () => {
    const skillsDir = join(target, 'skills')
    if (!existsSync(skillsDir)) {
      // Also check .opencode/skills
      const opencodeSkills = join(target, '.opencode', 'skills')
      if (!existsSync(opencodeSkills)) {
        return { pass: false, msg: 'no skills directory found' }
      }
      const skills = readdirSync(opencodeSkills).filter((d) => {
        const sk = join(opencodeSkills, d)
        return statSync(sk).isDirectory() && existsSync(join(sk, 'SKILL.md'))
      })
      return { pass: true, msg: `${skills.length} skills in .opencode/skills/` }
    }
    const skills = readdirSync(skillsDir).filter((d) => {
      const sk = join(skillsDir, d)
      return statSync(sk).isDirectory() && existsSync(join(sk, 'SKILL.md'))
    })
    return { pass: skills.length > 0, msg: `${skills.length} skills deployed` }
  })

  // -----------------------------------------------------------------------
  // Tier 3 — info
  // -----------------------------------------------------------------------

  check(3, 'Invalid pantheon:// refs', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir)) return { pass: false, msg: 'agents directory not found' }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const knownPaths = [
      'pantheon://agents',
      'pantheon://agents/',
      'pantheon://routing',
      'pantheon://skills',
      'pantheon://skills/',
      'pantheon://deepwork/',
      'pantheon://memory-bank/',
      'pantheon://code-mode/',
      'pantheon://memory/',
    ]
    const invalid = []
    for (const file of files) {
      const content = readFileSync(join(agentsDir, file), 'utf8')
      const refs = content.match(/pantheon:\/\/\S+/g) || []
      for (const ref of refs) {
        const cleanRef = ref.replace(/[`)\]>}.]+$/, '')
        const isValid = knownPaths.some((p) => cleanRef.startsWith(p))
        if (!isValid) {
          invalid.push(`${file}: ${cleanRef}`)
        }
      }
    }
    if (invalid.length > 0) {
      return {
        pass: true,
        msg: `${invalid.length} unknown ref(s): ${invalid.slice(0, 3).join('; ')}`,
      }
    }
    return { pass: true, msg: 'all pantheon:// refs valid' }
  })

  check(3, 'File sizes', () => {
    const agentsDir = join(target, 'agents')
    if (!existsSync(agentsDir)) return { pass: false, msg: 'agents directory not found' }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.md'))
    const oversized = []
    for (const file of files) {
      const stats = statSync(join(agentsDir, file))
      const sizeKB = stats.size / 1024
      if (sizeKB > 50) {
        oversized.push(`${file} (${sizeKB.toFixed(1)}KB)`)
      }
    }
    if (oversized.length > 0) {
      return { pass: true, msg: `${oversized.length} file(s) >50KB: ${oversized.join(', ')}` }
    }
    return { pass: true, msg: `all ${files.length} files reasonable size` }
  })

  // -----------------------------------------------------------------------
  // Execute checks
  // -----------------------------------------------------------------------

  section('Phase 3: VERIFY — Installation checks')
  console.log()

  const tiers = {
    1: { fail: 0, total: 0, label: 'Tier 1 (fail-fast)' },
    2: { fail: 0, total: 0, label: 'Tier 2 (warn)' },
    3: { fail: 0, total: 0, label: 'Tier 3 (info)' },
  }

  for (const r of results) {
    tiers[r.tier].total++
    if (!r.pass) tiers[r.tier].fail++
    const icon = r.pass ? I.pass : I.warn
    const color = r.pass ? C.green : tiers[r.tier].fail > 0 ? C.yellow : C.red
    if (args.verbose || !r.pass || r.tier === 1) {
      console.log(`  ${color}${icon} ${r.msg}${C.reset}`)
    }
  }

  console.log()
  for (const [_num, t] of Object.entries(tiers)) {
    const status = t.fail === 0 ? `${C.green}${I.pass}${C.reset}` : `${C.yellow}${I.warn}${C.reset}`
    console.log(`  ${status} ${t.label}: ${t.total - t.fail}/${t.total} passed`)
  }

  const tier1Fail = tiers[1].fail > 0
  const tier2Fail = tiers[2].fail > 0
  const _tier3Fail = tiers[3].fail > 0

  if (tier1Fail) {
    error(`${tiers[1].fail} Tier 1 check(s) failed`)
  }
  if (tier2Fail) {
    warn(`${tiers[2].fail} Tier 2 check(s) have warnings`)
  }

  return {
    pass: !tier1Fail,
    tier1: tiers[1].total - tiers[1].fail,
    tier2: tiers[2].total - tiers[2].fail,
    tier3: tiers[3].total - tiers[3].fail,
  }
}

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------

function printSummaryTable(state, verifyResult) {
  console.log(`\n${C.bold}  📊 Summary:${C.reset}`)
  console.log(`  ${C.gray}${'─'.repeat(50)}${C.reset}`)
  console.log(`  ${C.dim}  Phase       Status    Details${C.reset}`)
  console.log(`  ${C.gray}  ${'─'.repeat(45)}${C.reset}`)

  function phaseLine(name, status, detail) {
    const icon =
      status === 'pass'
        ? `${C.green}${I.pass}${C.reset}`
        : status === 'warn'
          ? `${C.yellow}${I.warn}${C.reset}`
          : status === 'fail'
            ? `${C.red}${I.error}${C.reset}`
            : status === 'skipped'
              ? `${C.blue}${I.info}${C.reset}`
              : status === 'dry-run'
                ? `${C.blue}${I.info}${C.reset}`
                : `${C.yellow}${I.warn}${C.reset}`
    const label = `${name.padEnd(11)}`
    const statusLabel = `${(status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : status === 'warn' ? 'WARN' : status.toUpperCase()).padEnd(9)}`
    console.log(`  ${icon} ${C.bold}${label}${C.reset} ${statusLabel} ${C.dim}${detail}${C.reset}`)
  }

  if (state) {
    phaseLine(
      'Sync',
      state.phases.sync,
      {
        pass: 'All platforms synced',
        skipped: 'Not run',
        'dry-run': 'Preview mode',
        fail: 'See errors above',
      }[state.phases.sync] || state.phases.sync,
    )
    phaseLine(
      'Install',
      state.phases.install,
      {
        pass: 'All files deployed',
        skipped: 'Not run',
        'dry-run': 'Would install',
        warn: 'Completed with warnings',
        fail: 'See errors above',
      }[state.phases.install] || state.phases.install,
    )
  }

  if (verifyResult) {
    const verifyStatus = verifyResult.pass ? 'pass' : 'fail'
    phaseLine(
      'Verify',
      verifyStatus,
      `T1:${verifyResult.tier1}/4  T2:${verifyResult.tier2}/4  T3:${verifyResult.tier3}/2`,
    )
  }

  console.log(`  ${C.gray}${'─'.repeat(45)}${C.reset}`)
}

// ---------------------------------------------------------------------------
// Tier MCP helpers
// ---------------------------------------------------------------------------

/**
 * Read the tiers configuration from .pantheon/tiers.json
 * @returns {Record<string, any>|null}
 */
function readTiersConfig() {
  const tiersPath = join(ROOT, '.pantheon', 'tiers.json')
  if (!existsSync(tiersPath)) {
    error(`Tiers config not found at ${tiersPath}`)
    return null
  }
  return JSON.parse(readFileSync(tiersPath, 'utf8'))
}

/**
 * Expand a tier name into a flat Map of { key, mcp, tier } entries.
 * "recommended" = essential + recommended.
 * "full" = essential + recommended + optional.
 * @param {Record<string, any>} tiers
 * @param {string} tierName
 * @returns {Map<string, { key: string, mcp: any, sourceTier: string }>}
 */
function expandTier(tiers, tierName) {
  /** @type {Map<string, { key: string, mcp: any, sourceTier: string }>} */
  const result = new Map()
  const tierOrder = ['essential', 'recommended', 'optional']

  // Always include native MCPs first — they are project built-ins
  if (tiers.native) {
    for (const [key, mcp] of Object.entries(tiers.native)) {
      result.set(key, { key, mcp, sourceTier: 'native' })
    }
  }

  // "none" means native MCPs only
  if (tierName === 'none') return result

  // Map user-facing names: "full" → "optional" (includes everything)
  const normalizedName = tierName === 'full' ? 'optional' : tierName
  const stopAt = tierOrder.indexOf(normalizedName)
  if (stopAt === -1) return result

  for (let i = 0; i <= stopAt; i++) {
    const section = tiers[tierOrder[i]]
    if (!section) continue
    for (const [key, mcp] of Object.entries(section)) {
      // Don't overwrite — first match wins (native > essential > recommended > optional)
      if (!result.has(key)) {
        result.set(key, { key, mcp, sourceTier: tierOrder[i] })
      }
    }
  }
  return result
}

/**
 * Load opencode.json from the project's platform directory.
 * @returns {{ path: string, config: any }|null}
 */
function loadOpencodeConfig() {
  const opencodePath = join(ROOT, 'platform', 'opencode', 'opencode.json')
  if (!existsSync(opencodePath)) {
    warn(`opencode.json not found at ${opencodePath}`)
    return null
  }
  return { path: opencodePath, config: JSON.parse(readFileSync(opencodePath, 'utf8')) }
}

/**
 * Check if an MCP key is already present in opencode.json's mcp section.
 * @param {any} opencodeConfig
 * @param {string} mcpKey
 * @returns {boolean}
 */
function mcpAlreadyConfigured(opencodeConfig, mcpKey) {
  return !!opencodeConfig.mcp?.[mcpKey]
}

/**
 * Check if the MCP definition has a non-empty config that needs to be added.
 * @param {any} mcp
 * @returns {boolean}
 */
function hasNonEmptyConfig(mcp) {
  return mcp.config && typeof mcp.config === 'object' && Object.keys(mcp.config).length > 0
}

/**
 * Generate an opencode.json MCP entry from the tier config definition.
 * @param {string} mcpKey
 * @param {any} mcp
 * @returns {Record<string, any>}
 */
function generateMCPEntry(_mcpKey, mcp) {
  const config = mcp.config || {}
  /** @type {Record<string, any>} */
  const entry = { enabled: true }

  if (config.url) {
    // URL-based MCP (e.g., context7)
    entry.type = 'url'
    entry.url = config.url
    if (config.headers) {
      entry.headers = config.headers
    }
  } else if (config.command && Array.isArray(config.command)) {
    // Command-based MCP (e.g., filesystem, git, playwright, memory)
    entry.type = 'local'
    entry.cwd = '.'
    // Merge args into command array
    const cmd = [...config.command]
    if (config.args && Array.isArray(config.args)) {
      cmd.push(...config.args)
    }
    entry.command = cmd
  } else {
    // Unknown config format — skip
    return null
  }

  return entry
}

/**
 * Show a formatted plan of what MCPs would be configured.
 * @param {string} tierLabel
 * @param {Map<string, { key: string, mcp: any, sourceTier: string, status: string }>} enhanced
 * @param {boolean} dryRun
 */
function showTierPlan(tierLabel, enhanced, dryRun) {
  const mode = dryRun ? 'Would configure' : 'Configuration'
  section(`Tier: ${tierLabel} — ${mode}`)
  console.log()

  if (enhanced.size === 0) {
    info('No MCPs found for this tier.')
    return
  }

  for (const [, entry] of enhanced) {
    const { mcp, status } = entry
    let statusIcon, statusLabel

    switch (status) {
      case 'configured':
        statusIcon = `${C.green}${I.pass}${C.reset}`
        statusLabel = 'already configured'
        break
      case 'pending':
        statusIcon = `${C.yellow}⚠${C.reset}`
        statusLabel = dryRun ? 'would be added' : 'pending'
        break
      case 'native':
        statusIcon = `${C.cyan}⚡${C.reset}`
        statusLabel = 'native (always available)'
        break
      default:
        statusIcon = `${C.dim}•${C.reset}`
        statusLabel = status
    }

    console.log(`  ${statusIcon} ${C.bold}${mcp.name}${C.reset}`)
    console.log(`      ${C.dim}Status:  ${statusLabel}${C.reset}`)
    if (mcp.package) {
      console.log(`      ${C.dim}Package: ${mcp.package}${C.reset}`)
    }
    if (mcp.description) {
      console.log(`      ${C.dim}Use:     ${mcp.description}${C.reset}`)
    }
    if (mcp.note) {
      console.log(`      ${C.dim}Note:    ${mcp.note}${C.reset}`)
    }
    if (mcp.resources) {
      console.log(`      ${C.dim}Res:     ${mcp.resources}${C.reset}`)
    }
    console.log()
  }

  // Summary
  const counts = { configured: 0, pending: 0, native: 0 }
  for (const [, entry] of enhanced) {
    if (counts[entry.status] !== undefined) counts[entry.status]++
  }

  console.log(`  ${C.gray}${'─'.repeat(45)}${C.reset}`)
  const parts = []
  if (counts.native > 0) parts.push(`${C.cyan}${counts.native} native${C.reset}`)
  if (counts.configured > 0) parts.push(`${C.green}${counts.configured} configured${C.reset}`)
  if (counts.pending > 0) {
    const action = dryRun ? 'would be added' : 'to configure'
    parts.push(`${C.yellow}${counts.pending} ${action}${C.reset}`)
  }
  console.log(`  ${parts.join('  ')}`)
  console.log()
}

/**
 * Apply missing MCP configs to opencode.json.
 * @param {string} opencodePath
 * @param {any} opencodeConfig
 * @param {Array<{ key: string, mcp: any }>} toAdd
 * @returns {number} number of MCPs added
 */
function applyMissingConfigs(opencodePath, opencodeConfig, toAdd) {
  if (toAdd.length === 0) return 0

  if (!opencodeConfig.mcp) {
    opencodeConfig.mcp = {}
  }
  if (!opencodeConfig.permission) {
    opencodeConfig.permission = {}
  }
  if (!opencodeConfig.permission.mcp) {
    opencodeConfig.permission.mcp = {}
  }

  let added = 0
  for (const { key, mcp } of toAdd) {
    const entry = generateMCPEntry(key, mcp)
    if (!entry) {
      warn(`Cannot generate config for "${key}" — unknown config format. Skipping.`)
      continue
    }
    opencodeConfig.mcp[key] = entry
    // Set default permission to "ask" for new MCPs
    opencodeConfig.permission.mcp[key] = 'ask'
    added++
  }

  if (added > 0) {
    writeFileSync(opencodePath, `${JSON.stringify(opencodeConfig, null, 2)}\n`, 'utf8')
  }

  return added
}

/**
 * Main handler for the --tier flag.
 * @param {import("./pantheon-install.mjs").CliArgs} args
 * @returns {boolean} true if tier processing succeeded (including dry-run)
 */
function processTier(args) {
  const tiers = readTiersConfig()
  if (!tiers) return false

  // --tier none / --no-mcp: agents only, no MCP configuration
  if (args.tier === 'none') {
    section('Tier: None — Agents only')
    console.log()
    info('MCPs: none (agents only) — skipping MCP configuration')
    // Still show native MCPs that are always available
    if (tiers.native) {
      const nativeCount = Object.keys(tiers.native).length
      console.log(
        `  ${C.dim}  ${nativeCount} native MCP(s) always available: ${Object.keys(tiers.native).join(', ')}${C.reset}`,
      )
    }
    console.log()
    return true
  }

  const tierLabel = args.tier.charAt(0).toUpperCase() + args.tier.slice(1)
  const expanded = expandTier(tiers, args.tier)
  if (expanded.size === 0) {
    error(`No MCPs found in tier "${args.tier}"`)
    return false
  }

  // Load opencode.json
  const opencodeCtx = loadOpencodeConfig()
  const opencodeConfig = opencodeCtx ? opencodeCtx.config : { mcp: {} }

  // Enrich each entry with status
  /** @type {Map<string, { key: string, mcp: any, sourceTier: string, status: string }>} */
  const enhanced = new Map()
  /** @type {Array<{ key: string, mcp: any }>} */
  const toAdd = []

  for (const [key, entry] of expanded) {
    const isNative = entry.sourceTier === 'native' || entry.mcp.always_installed
    const isConfigured = opencodeCtx && mcpAlreadyConfigured(opencodeConfig, key)
    const _needsConfig = hasNonEmptyConfig(entry.mcp)
    let status
    if (isNative) {
      status = 'native'
    } else if (isConfigured) {
      status = 'configured'
    } else {
      status = 'pending'
      toAdd.push({ key, mcp: entry.mcp })
    }

    enhanced.set(key, { ...entry, status })
  }

  // Show the plan
  showTierPlan(tierLabel, enhanced, args.dryRun)

  // Apply with --yes (only when not dry-run)
  if (!args.dryRun && args.yes && toAdd.length > 0) {
    if (!opencodeCtx) {
      error('Cannot apply config: opencode.json not found at platform/opencode/')
      return false
    }
    const added = applyMissingConfigs(opencodeCtx.path, opencodeConfig, toAdd)
    if (added > 0) {
      pass(`Added ${added} MCP server(s) to ${opencodeCtx.path}`)
      pass('Run without --dry-run to sync and install.')
    } else {
      info('No MCPs needed to be added.')
    }
    console.log()
  } else if (!args.dryRun && args.yes && toAdd.length === 0) {
    info('All MCPs in this tier are already configured.')
    console.log()
  } else if (toAdd.length > 0 && !args.dryRun) {
    console.log(
      `  ${C.yellow}${I.info} Use --yes to auto-add ${toAdd.length} pending MCP(s) to opencode.json${C.reset}`,
    )
    console.log()
  }

  // -------------------------------------------------------------------
  // Generate .vscode/mcp.json for VS Code / Copilot platform
  // -------------------------------------------------------------------
  const platformIncludesCopilot =
    args.platforms.includes('copilot') || args.platforms.includes('all')
  if (platformIncludesCopilot) {
    const vscodeResult = generateVscodeMcpConfig(expanded, args.target, args.dryRun)
    if (vscodeResult.generated) {
      const mode = args.dryRun ? 'Would generate' : 'Generated'
      console.log(
        `  ${C.green}${I.pass}${C.reset} VS Code MCP config: ${mode} ${vscodeResult.path}`,
      )
      console.log(`      ${C.dim}${vscodeResult.servers} server(s) configured${C.reset}`)
      console.log()
    } else {
      const mode = args.dryRun ? 'would be' : 'is'
      console.log(
        `  ${C.blue}${I.info}${C.reset} VS Code MCP config: no configurable MCPs for this tier (${mode} skipped)`,
      )
      console.log()
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv)

  if (args.help) {
    showHelp()
    process.exit(0)
  }

  if (args.detect) {
    detectAndReport(args.target)
    process.exit(0)
  }

  if (args.platforms.includes('all')) {
    args.platforms = [...ALL_PLATFORMS]
  }

  if (!existsSync(args.target) && !args.checkOnly && !args.dryRun) {
    console.error(`${C.red}${I.error} Target directory does not exist: ${args.target}${C.reset}`)
    if (!args.yes) {
      console.log(`  ${C.yellow}Create it and retry, or use --dry-run to preview.${C.reset}`)
    }
    process.exit(2)
  }

  // Load or init state
  let state = args.retryFailed ? readState() : null
  if (!state) {
    state = defaultState(args)
  }
  writeState(state)

  const phaseResult = { sync: false, install: false }
  let verifyResult = null

  // --check-only: run verify only
  if (args.checkOnly) {
    printHeader('🔍 Pantheon Install — Check Only')

    if (!existsSync(join(args.target, 'agents'))) {
      console.error(
        `${C.red}${I.error} No agents directory found at ${args.target} — nothing to verify${C.reset}`,
      )
      printSummaryTable(null, null)
      process.exit(2)
    }

    verifyResult = await verify(args.target, args)
    printSummaryTable({ phases: { sync: 'skipped', install: 'skipped' } }, verifyResult)

    const exitCode = verifyResult.pass ? 0 : warnings.length > 0 ? 1 : 2
    process.exit(exitCode)
  }

  // Determine title
  const title = args.dryRun
    ? '🔍 Pantheon Install — Dry Run'
    : args.retryFailed
      ? '🔄 Pantheon Install — Retry Failed'
      : args.clean
        ? '🧹 Pantheon Install — Clean Install'
        : '✅ Pantheon Install'

  printHeader(title)

  const platformsStr = args.platforms.map((p) => PLATFORM_LABELS[p] || p).join(', ')
  console.log(`  ${C.dim}Target:    ${args.target}${C.reset}`)
  console.log(`  ${C.dim}Platforms: ${platformsStr}${C.reset}`)
  console.log(
    `  ${C.dim}Mode:      ${args.dryRun ? 'dry-run' : args.clean ? 'clean' : args.retryFailed ? 'retry-failed' : args.tier ? `tier:${args.tier}` : 'full'}${C.reset}`,
  )
  console.log()

  // --tier processing: show plan (dry-run exits, otherwise continues to sync+install)
  if (args.tier) {
    processTier(args)
    if (args.dryRun) {
      console.log(`  ${C.blue}${I.info} Tier preview complete — no files modified.${C.reset}\n`)
      printSummaryTable(null, null)
      process.exit(0)
    }
  }

  // Phase 1: SYNC
  if (!args.checkOnly) {
    phaseResult.sync = runSync(args, state)
    if (!phaseResult.sync && !args.retryFailed) {
      console.log(
        `\n  ${C.red}${I.error} Sync phase failed — stopping. Fix the issue and retry.${C.reset}`,
      )
      console.log(
        `  ${C.yellow}Tip: Use --retry-failed to resume from last successful phase.${C.reset}`,
      )
      printSummaryTable(state, null)
      process.exit(2)
    }
  }

  // Phase 2: INSTALL
  if (!args.checkOnly) {
    phaseResult.install = runInstall(args, state)
    if (!phaseResult.install && !args.retryFailed) {
      console.log(
        `\n  ${C.red}${I.error} Install phase failed — partial results may be present.${C.reset}`,
      )
      console.log(
        `  ${C.yellow}Tip: Fix the issue and use --retry-failed to retry only failed phases.${C.reset}`,
      )
      printSummaryTable(state, null)
      process.exit(2)
    }
  }

  // Phase 3: VERIFY (only after successful install, or always for check-only)
  if (!args.dryRun && state.phases.install !== 'fail') {
    verifyResult = await verify(args.target, args)
    if (verifyResult?.pass) {
      state.phases.verify = 'pass'
    } else if (verifyResult && !verifyResult.pass) {
      state.phases.verify = 'fail'
    } else {
      state.phases.verify = 'warn'
    }
    state.warnings = warnings
    state.status = state.phases.verify === 'pass' ? 'complete' : 'partial'
    writeState(state)
  } else {
    state.phases.verify = args.dryRun ? 'dry-run' : 'skipped'
    writeState(state)
  }

  // Print summary
  printSummaryTable(state, verifyResult)

  // Final verdict
  if (args.dryRun) {
    console.log(`\n  ${C.blue}${I.info} Dry-run complete — no files modified.${C.reset}`)
    process.exit(0)
  }

  if (state.status === 'complete') {
    printFooter('✅ Pantheon Install — Complete')
    process.exit(0)
  } else if (warnings.length > 0) {
    printFooter('⚠️  Pantheon Install — Complete with Warnings')
    console.log(`\n  ${C.yellow}Warnings (${warnings.length}):${C.reset}`)
    for (const w of warnings) {
      console.log(`  ${C.yellow}  • ${w}${C.reset}`)
    }
    console.log()
    process.exit(1)
  } else {
    printFooter('❌ Pantheon Install — Failed')
    process.exit(2)
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error(`${C.red}${I.error} Unhandled error: ${err.message}${C.reset}`)
  console.error(err.stack)
  process.exit(2)
})
