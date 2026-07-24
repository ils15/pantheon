/**
 * pantheon-sync — Sync Pantheon agent definitions across projects.
 *
 * Provides:
 *   1. `pantheon_sync` tool — sync agent .md files from the Pantheon source
 *      project to a target project's `.opencode/agents/` directory.
 *   2. `file.edited` event hook — watches for agent file changes and offers
 *      to sync to known projects.
 *
 * On Linux/macOS creates symlinks so updates propagate automatically.
 * On Windows falls back to file copy (no symlink support in all environments).
 * Supports `--dry-run` to preview without writing anything.
 */

import { copyFileSync, existsSync, mkdirSync, symlinkSync, unlinkSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { type Plugin, tool } from '@opencode-ai/plugin'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENTS = [
  'zeus',
  'athena',
  'apollo',
  'hermes',
  'aphrodite',
  'demeter',
  'themis',
  'prometheus',
  'hephaestus',
  'nyx',
  'gaia',
  'iris',
  'mnemosyne',
  'talos',
]

const SOURCE_SUBDIR = path.join('src', 'agents')
const TARGET_SUBDIR = path.join('.opencode', 'agents')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return true when running on Windows (NT kernel). */
function isWindows() {
  return os.platform() === 'win32'
}

/**
 * Format a duration in milliseconds for human-readable console output.
 * Example: "1.2s", "340ms"
 */
function fmtDuration(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

/**
 * Create a sync entry (symlink or copy) from sourceFile to targetFile.
 *
 * @param {string} sourceFile  Absolute path to the source agent .md file.
 * @param {string} targetFile  Absolute path where the link/copy should live.
 * @param {boolean} dryRun     When true, only log — no filesystem mutations.
 * @param {(msg: string) => void} log  Logger function (side-effect only).
 * @returns {'symlink'|'copy'|'dry-run'}  The action that was taken.
 */
function createSyncEntry(sourceFile, targetFile, dryRun, log) {
  if (dryRun) {
    log(`  ~ ${path.basename(sourceFile)}  (dry-run)`)
    return 'dry-run'
  }

  // Remove any existing entry at the target path so we can replace it.
  try {
    if (existsSync(targetFile)) {
      unlinkSync(targetFile)
    }
  } catch {
    // File doesn't exist yet — that's fine.
  }

  if (isWindows()) {
    copyFileSync(sourceFile, targetFile)
    log(`  ✓ ${path.basename(sourceFile)}  → copy`)
    return 'copy'
  }

  symlinkSync(sourceFile, targetFile)
  log(`  ✓ ${path.basename(sourceFile)}  → symlink`)
  return 'symlink'
}

/**
 * Sync agents from sourceDir to targetDir.
 *
 * @param {string} sourceDir  Absolute path to Pantheon src/agents/.
 * @param {string} targetDir  Absolute path to target .opencode/agents/.
 * @param {string[]} agents   List of agent names to sync.
 * @param {boolean} dryRun    Preview-only mode flag.
 * @returns {{ [agent: string]: { status: string, type?: string, source?: string } }}
 */
function syncProject(sourceDir, targetDir, agents, dryRun) {
  const log = (msg) => console.log(`[pantheon-sync] ${msg}`)

  log(`source: ${sourceDir}`)
  log(`target: ${targetDir}`)

  if (dryRun) {
    log('mode:   DRY-RUN — no files will be written')
  }

  // Guard — fail early if the source directory is missing.
  if (!existsSync(sourceDir)) {
    throw new Error(
      `Source directory not found: ${sourceDir}\n` +
        "Make sure you're running this from the Pantheon project root, " +
        'or provide an absolute path with --source.',
    )
  }

  if (!dryRun) {
    mkdirSync(targetDir, { recursive: true })
  }

  /** @type {{ [agent: string]: { status: string, type?: string, source?: string } }} */
  const results = {}

  for (const agent of agents) {
    const agentName = agent.toLowerCase()
    const sourceFile = path.join(sourceDir, `${agentName}.md`)
    const targetFile = path.join(targetDir, `${agentName}.md`)

    if (!existsSync(sourceFile)) {
      log(`  ⚠ source missing: ${agentName}.md`)
      results[agentName] = { status: 'missing', source: sourceFile }
      continue
    }

    const action = createSyncEntry(sourceFile, targetFile, dryRun, log)
    results[agentName] = { status: 'synced', type: action }
  }

  return results
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/** Named export consumed by the opencode plugin runtime. */
export const SyncPlugin = async ({ project, client, $, directory, worktree }) => {
  // Track known target projects in memory (reset each session).
  // In a production version this could read from a config file.
  /** @type {Set<string>} */
  const knownProjects = new Set()

  return {
    // -----------------------------------------------------------------------
    // Custom tool: /pantheon-sync
    // -----------------------------------------------------------------------
    tool: {
      pantheon_sync: tool({
        description:
          'Sync Pantheon agent definitions (.md files) from the Pantheon ' +
          "source project to a target project's .opencode/agents/ directory. " +
          'Creates symlinks on Linux/macOS; copies on Windows.',
        args: {
          target: tool.schema
            .string()
            .describe(
              'Absolute path to the target project (the project that should ' +
                'receive the agent definitions).',
            ),
          agents: tool.schema
            .array(tool.schema.string())
            .optional()
            .default(AGENTS)
            .describe(
              "Specific agents to sync (e.g. ['zeus','hermes']). " + 'Defaults to all 14 agents.',
            ),
          'dry-run': tool.schema
            .boolean()
            .optional()
            .default(false)
            .describe('When true, only log what would happen — no filesystem mutations.'),
        },
        async execute(args, context) {
          const start = Date.now()
          const target = args.target
          const agents = args.agents ?? AGENTS
          const dryRun = args['dry-run'] ?? false

          // Resolve the Pantheon source agents directory.
          const sourceDir = path.resolve(context.directory ?? directory, SOURCE_SUBDIR)
          const targetDir = path.resolve(target, TARGET_SUBDIR)

          console.log('')
          console.log('╔══════════════════════════════════════════════╗')
          console.log('║        pantheon-sync — agent sync           ║')
          console.log('╚══════════════════════════════════════════════╝')
          console.log('')

          const results = syncProject(sourceDir, targetDir, agents, dryRun)

          console.log('')

          const synced = Object.values(results).filter((r) => r.status === 'synced').length
          const missing = Object.values(results).filter((r) => r.status === 'missing').length

          console.log(
            `Synced ${synced} agent(s), ${missing} missing, ` +
              `in ${fmtDuration(Date.now() - start)}.`,
          )
          console.log('')

          // Remember this target for the event hook.
          if (!dryRun) {
            knownProjects.add(target)
          }

          return {
            target,
            dry_run: dryRun,
            total: agents.length,
            synced,
            missing,
            results,
          }
        },
      }),
    },

    // -----------------------------------------------------------------------
    // Event hook: file.edited — detect agent changes and offer sync
    // -----------------------------------------------------------------------
    event: async ({ event }) => {
      try {
        const { type, payload } = event

        if (type !== 'file.edited') return

        // Extract the edited file path. Structure varies by context; try
        // common payload shapes.
        const editedPath =
          payload?.path ??
          payload?.file ??
          payload?.filePath ??
          (typeof payload === 'string' ? payload : null)

        if (!editedPath) return

        // Normalize to forward slashes for path comparison.
        const normalPath = editedPath.replace(/\\/g, '/')

        // Only react to agent files in src/agents/.
        if (!normalPath.includes('src/agents/') || !normalPath.endsWith('.md')) {
          return
        }

        const agentName = path.basename(editedPath, '.md')

        // Validate it's a known agent name.
        if (!AGENTS.includes(agentName)) return

        console.log('')
        console.log(`[pantheon-sync] Detected change to ${agentName}.md in ` + `src/agents/.`)

        if (knownProjects.size === 0) {
          console.log(
            '[pantheon-sync] No known target projects. Run ' +
              '`/pantheon-sync --target <path>` to register one.',
          )
          return
        }

        console.log(
          `[pantheon-sync] To sync this change, run /pantheon-sync for ` +
            `${knownProjects.size} known project(s):`,
        )
        for (const proj of knownProjects) {
          console.log(`  /pantheon-sync --target ${proj} --agents ${agentName}`)
        }
      } catch (err) {
        // Never let a plugin handler crash the host.
        if (client?.app?.log) {
          client.app.log(`[pantheon-sync] event handler error: ${err.message}`)
        }
      }
    },
  }
}
