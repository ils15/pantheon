#!/usr/bin/env node
/**
 * opencode.mjs — OpenCode platform installer
 */

import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { healthCheck } from './health-check.mjs'
import { detectVersion, runMigrations } from './migrate.mjs'
import {
  collectSkillNames,
  copyFiles,
  installSkills,
  PLATFORM_DIR,
  parseFrontmatter,
  ROOT,
  sourceDirValid,
  summary,
  syncDir,
  writeIfChanged,
} from './shared.mjs'
import { setupVenv } from './venv.mjs'

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function mergeMissing(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target
  if (!target || typeof target !== 'object' || Array.isArray(target)) return deepClone(source)

  for (const [key, sourceVal] of Object.entries(source)) {
    const targetVal = target[key]

    if (targetVal === undefined) {
      target[key] = deepClone(sourceVal)
      continue
    }

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      mergeMissing(targetVal, sourceVal)
    }
  }

  return target
}

/**
 * Detect whether `target` is the user's global OpenCode installation directory
 * (~/.opencode or $XDG_CONFIG_HOME/opencode).
 * Global installs use a flat layout: agents/ skills/ commands/ plugins/
 * Project installs use the .opencode/ sub-directory layout.
 */
function isGlobalConfigDir(target) {
  // Primary: ~/.opencode (actual OpenCode installation)
  const homeDir = resolve(join(homedir(), '.opencode'))
  if (resolve(target) === homeDir) return true

  // Fallback: $XDG_CONFIG_HOME/opencode (legacy/alternative)
  const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  const xdgDir = resolve(join(xdgConfig, 'opencode'))
  return resolve(target) === xdgDir
}

export function installOpenCode(
  target,
  dryRun,
  clean = false,
  components = ['agents', 'skills', 'instructions', 'commands', 'plugins', 'runtime'],
) {
  const componentSet = new Set(components)
  const stats = summary.opencode

  // Determine layout based on install scope.
  // Global config dir (~/.opencode or ~/.config/opencode) uses a flat layout:
  //   agents/   skills/   commands/   plugins/
  // Project installs use the .opencode/ sub-directory layout:
  //   .opencode/agents/   .opencode/skills/   .opencode/commands/
  const isGlobal = isGlobalConfigDir(target)
  const _subDir = isGlobal ? '' : '.opencode'
  const agentPrefix = isGlobal ? 'agents' : '.opencode/agents'

  if (isGlobal) {
    console.log(
      '  🌐 Global config directory detected — using flat layout (agents/, skills/, commands/)',
    )
  }

  // -----------------------------------------------------------------------
  // 1. Install agents (--components agents)
  // -----------------------------------------------------------------------
  if (componentSet.has('agents')) {
    const srcDir = join(ROOT, 'src', 'agents')
    if (!sourceDirValid(srcDir)) {
      console.warn(`  ⚠️  Agent source directory not found: ${srcDir}`)
      stats.errors++
    } else {
      const dstDir = isGlobal ? join(target, 'agents') : join(target, '.opencode', 'agents')
      if (!dryRun) mkdirSync(dstDir, { recursive: true })
      if (clean && existsSync(dstDir) && !dryRun) {
        const existing = readdirSync(dstDir)
        for (const f of existing) {
          rmSync(join(dstDir, f), { recursive: true, force: true })
        }
      }
      const { created, skipped } = copyFiles(srcDir, dstDir, dryRun)
      stats.created += created
      stats.skipped += skipped
    }
  }

  // -----------------------------------------------------------------------
  // 2. Install skills (--components skills)
  // -----------------------------------------------------------------------
  if (componentSet.has('skills')) {
    const skillNames = collectSkillNames()
    if (skillNames.length > 0) {
      console.log(`  📚 Installing ${skillNames.length} skills...`)
      const dstSkillsDir = isGlobal ? join(target, 'skills') : join(target, '.opencode', 'skills')
      if (clean && existsSync(dstSkillsDir) && !dryRun) {
        const existing = readdirSync(dstSkillsDir)
        for (const s of existing) {
          rmSync(join(dstSkillsDir, s), { recursive: true, force: true })
        }
      }
      const installSubDir = isGlobal ? '' : '.opencode'
      const { created: sCreated, skipped: sSkipped } = installSkills(
        skillNames,
        target,
        dryRun,
        installSubDir,
      )
      stats.created += sCreated
      stats.skipped += sSkipped
    }
  }

  // -----------------------------------------------------------------------
  // 2.5 Install instructions: AGENTS.md + instructions/ (--components instructions)
  // -----------------------------------------------------------------------
  if (componentSet.has('instructions')) {
    // AGENTS.md
    const srcAgentsMd = join(ROOT, 'AGENTS.md')
    const dstAgentsMd = join(target, 'AGENTS.md')
    if (existsSync(srcAgentsMd)) {
      const content = readFileSync(srcAgentsMd, 'utf8')
      const status = writeIfChanged(dstAgentsMd, content, dryRun)
      if (status === 'created') stats.created++
      else stats.skipped++
    }
    // instructions/ directory
    const srcInstr = join(ROOT, 'src', 'instructions')
    const dstInstr = join(target, 'instructions')
    if (existsSync(srcInstr)) {
      const instrResult = syncDir(srcInstr, dstInstr, dryRun, clean)
      stats.created += instrResult.created
      stats.skipped += instrResult.skipped
    }
  }

  // -----------------------------------------------------------------------
  // 2.6 Install prompts (--components prompts)
  // -----------------------------------------------------------------------
  if (componentSet.has('prompts')) {
    const srcPrompts = join(ROOT, 'prompts')
    const dstPrompts = join(target, 'prompts')
    if (existsSync(srcPrompts)) {
      const promptsResult = syncDir(srcPrompts, dstPrompts, dryRun, clean)
      stats.created += promptsResult.created
      stats.skipped += promptsResult.skipped
    }
  }

  // -----------------------------------------------------------------------
  // 2.7 Install commands (--components commands)
  // -----------------------------------------------------------------------
  if (componentSet.has('commands')) {
    const srcCmds = join(ROOT, 'commands')
    const dstCmds = isGlobal ? join(target, 'commands') : join(target, '.opencode', 'commands')
    if (existsSync(srcCmds)) {
      const cmdResult = syncDir(srcCmds, dstCmds, dryRun, clean, (f) => f.endsWith('.md'))
      stats.created += cmdResult.created
      stats.skipped += cmdResult.skipped
    }
  }

  // -----------------------------------------------------------------------
  // 2.8 Install TUI plugins (--components plugins)
  // -----------------------------------------------------------------------
  if (componentSet.has('plugins')) {
    const srcPluginDir = join(PLATFORM_DIR, 'opencode', '.opencode', 'plugins', 'pantheon-tui')
    const dstPluginDir = isGlobal
      ? join(target, 'plugins', 'pantheon-tui')
      : join(target, '.opencode', 'plugins', 'pantheon-tui')
    if (!dryRun) mkdirSync(dstPluginDir, { recursive: true })
    if (clean && existsSync(dstPluginDir) && !dryRun) {
      rmSync(dstPluginDir, { recursive: true, force: true })
      mkdirSync(dstPluginDir, { recursive: true })
    }
    const { created, skipped } = syncDir(srcPluginDir, dstPluginDir, dryRun, false)
    stats.created += created
    stats.skipped += skipped
  }

  // -----------------------------------------------------------------------
  // 2.9 Create/update tui.json with plugin registration
  // -----------------------------------------------------------------------
  const targetTuiConfigPath = isGlobal
    ? join(target, 'tui.json')
    : join(target, '.opencode', 'tui.json')
  let tuiConfig = { plugin: [] }
  if (existsSync(targetTuiConfigPath)) {
    try {
      tuiConfig = JSON.parse(readFileSync(targetTuiConfigPath, 'utf8'))
    } catch {
      /* use default */
    }
  }
  if (!Array.isArray(tuiConfig.plugin)) {
    tuiConfig.plugin = []
  }
  // Add our plugin if not already present
  const pluginRef = 'plugins/pantheon-tui/dist/tui.tsx'
  if (!tuiConfig.plugin.includes(pluginRef)) {
    tuiConfig.plugin.push(pluginRef)
  }
  const tuiContent = `${JSON.stringify(tuiConfig, null, 2)}\n`
  const tuiStatus = writeIfChanged(targetTuiConfigPath, tuiContent, dryRun)
  if (tuiStatus === 'created') stats.created++
  else stats.skipped++

  // -----------------------------------------------------------------------
  // 2.10 Install runtime infrastructure (--components runtime)
  //      MCP server scripts, code-mode scripts, tiers.json
  // -----------------------------------------------------------------------
  if (componentSet.has('runtime')) {
    const runtimeTarget = isGlobal ? target : join(target, '.opencode')

    // ── MCP server scripts ──
    const mcpScripts = [
      'mcp_resources_server.py',
      'code_mode_server.py',
      'memory_mcp_server.py',
      'scrub-secrets.py',
      '_pantheon_paths.py',
      'mcp_persistence_server.py',
    ]
    const srcScriptsDir = join(ROOT, 'scripts')
    const dstScriptsDir = join(runtimeTarget, 'scripts')
    if (!dryRun) mkdirSync(dstScriptsDir, { recursive: true })
    for (const script of mcpScripts) {
      const src = join(srcScriptsDir, script)
      if (!existsSync(src)) {
        console.warn(`  ⚠️  Script not found: ${src}`)
        stats.errors++
        continue
      }
      const content = readFileSync(src, 'utf8')
      const dst = join(dstScriptsDir, script)
      const status = writeIfChanged(dst, content, dryRun)
      if (status === 'created') {
        stats.created++
        // Make executable
        if (!dryRun) {
          try {
            chmodSync(dst, 0o755)
          } catch {
            /* non-critical */
          }
        }
      } else stats.skipped++
    }

    // ── Code-mode scripts ──
    const srcCodeModeDir = join(ROOT, '.pantheon', 'code-mode')
    const dstCodeModeDir = join(runtimeTarget, '.pantheon', 'code-mode')
    if (existsSync(srcCodeModeDir)) {
      const cmResult = syncDir(srcCodeModeDir, dstCodeModeDir, dryRun, clean)
      stats.created += cmResult.created
      stats.skipped += cmResult.skipped
    }

    // ── tiers.json ──
    const srcTiers = join(ROOT, '.pantheon', 'tiers.json')
    const dstTiers = join(runtimeTarget, '.pantheon', 'tiers.json')
    if (existsSync(srcTiers)) {
      const content = readFileSync(srcTiers, 'utf8')
      const status = writeIfChanged(dstTiers, content, dryRun)
      if (status === 'created') stats.created++
      else stats.skipped++
    }
  }

  // -----------------------------------------------------------------------
  // 3. Create/update opencode.json (always runs)
  //    Reads TARGET's existing config first, then merges Pantheon settings
  //    on top. Preserves user's MCP, provider, plugin, compaction, theme.
  // -----------------------------------------------------------------------
  const pantheonConfigPath = join(ROOT, 'opencode.json')
  const targetConfigPath = join(target, 'opencode.json')

  let config = {}
  if (existsSync(targetConfigPath)) {
    try {
      config = JSON.parse(readFileSync(targetConfigPath, 'utf8'))
    } catch {
      config = {}
    }
  }

  let pantheonConfig = {}
  if (existsSync(pantheonConfigPath)) {
    try {
      pantheonConfig = JSON.parse(readFileSync(pantheonConfigPath, 'utf8'))
    } catch {
      pantheonConfig = {}
    }
  }

  // --------------------------------------------------------------------
  // A. Parse canonical agent config from agents/*.agent.md frontmatter
  //    and merge into opencode.json config.
  // --------------------------------------------------------------------
  function getAgentSources(agentPrefix) {
    const agentsDir = join(ROOT, 'src', 'agents')
    if (!existsSync(agentsDir)) return {}
    const sources = {}
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.agent.md') || f.endsWith('.md'))
    for (const f of files) {
      const name = f.replace(/\.(agent\.)?md$/, '')
      sources[name] = `${agentPrefix}/${name}.md`
    }
    return sources
  }

  function readAgentConfigFromCanonical() {
    const agentsDir = join(ROOT, 'src', 'agents')
    if (!existsSync(agentsDir)) return {}
    const config = {}
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.agent.md') || f.endsWith('.md'))
    for (const f of files) {
      const name = f.replace(/\.(agent\.)?md$/, '')
      const content = readFileSync(join(agentsDir, f), 'utf8')
      const parsed = parseFrontmatter(content)
      if (!parsed) continue
      const fm = parsed.fm
      const agent = {}

      // Extract fields from frontmatter
      if (fm.color) agent.color = fm.color
      if (fm.description) agent.description = fm.description
      if (fm.mode) agent.mode = fm.mode
      if (fm.hidden) agent.hidden = fm.hidden
      if (fm.temperature !== undefined) agent.temperature = fm.temperature
      if (fm.steps !== undefined) agent.steps = fm.steps
      // Support both hyphen (YAML) and underscore (JSON) key variants
      if (fm['disable-model-invocation'] !== undefined)
        agent.disable_model_invocation = fm['disable-model-invocation']
      else if (fm.disable_model_invocation !== undefined)
        agent.disable_model_invocation = fm.disable_model_invocation

      // Build permission from frontmatter
      if (fm.permission) {
        agent.permission = JSON.parse(JSON.stringify(fm.permission))
      }

      config[name] = agent
    }
    return config
  }

  const canonicalAgentConfig = readAgentConfigFromCanonical()
  const agentSources = getAgentSources(agentPrefix)
  const MANAGED_FIELDS = [
    'steps',
    'temperature',
    'color',
    'permission',
    'mode',
    'hidden',
    'disable_model_invocation',
  ]

  if (!config.agent) config.agent = {}

  for (const [agentName, agentCfg] of Object.entries(canonicalAgentConfig)) {
    if (!agentCfg || typeof agentCfg !== 'object') continue

    if (config.agent[agentName]) {
      // ── Agent exists in target config ──
      // Update framework-managed fields from canonical source
      // Preserve user-customized fields (model, provider, mcp, etc.)
      const existing = config.agent[agentName]
      if (agentSources[agentName]) existing.source = agentSources[agentName]
      for (const field of MANAGED_FIELDS) {
        if (field in agentCfg) {
          existing[field] = JSON.parse(JSON.stringify(agentCfg[field]))
        }
      }
      // Remove stale fields that are no longer in canonical config
      delete existing.model
      delete existing.small_model
    } else {
      // ── New agent ──
      const newAgent = {}
      if (agentSources[agentName]) newAgent.source = agentSources[agentName]
      if (agentCfg.description) newAgent.description = agentCfg.description

      // Copy all framework-managed fields from canonical config
      for (const field of MANAGED_FIELDS) {
        if (field in agentCfg) {
          newAgent[field] = JSON.parse(JSON.stringify(agentCfg[field]))
        }
      }

      // Ensure bash permission is set from canonical (default to deny if missing)
      if (!newAgent.permission) {
        newAgent.permission = {}
      }
      if (!newAgent.permission.bash && agentCfg.permission?.bash) {
        newAgent.permission.bash = JSON.parse(JSON.stringify(agentCfg.permission.bash))
      }

      config.agent[agentName] = newAgent
    }
  }

  // Remove stale agents (exist in target config but not in canonical source)
  // Only removes agents whose source is managed (starts with our prefix)
  // so user-defined agents with different source paths are preserved.
  const canonicalNames = new Set(Object.keys(canonicalAgentConfig))
  for (const [agentName, agentCfg] of Object.entries(config.agent)) {
    const source = agentCfg?.source || ''
    if (source.startsWith(agentPrefix) && !canonicalNames.has(agentName)) {
      delete config.agent[agentName]
    }
  }
  if (Object.keys(config.agent).length === 0) delete config.agent

  // --------------------------------------------------------------------
  // B. Commands from .md frontmatter (commands.json removed)
  // --------------------------------------------------------------------
  // Commands are now sourced from .md frontmatter in commands/.
  // The .md frontmatter is the canonical source — no json merge needed.

  // --------------------------------------------------------------------
  // B.5 Ensure critical top-level OpenCode config sections
  // --------------------------------------------------------------------
  if (!config.default_agent && pantheonConfig.default_agent) {
    config.default_agent = pantheonConfig.default_agent
  }

  if (!Array.isArray(config.plugin)) {
    config.plugin = []
  }
  if (Array.isArray(pantheonConfig.plugin)) {
    for (const plugin of pantheonConfig.plugin) {
      if (!config.plugin.includes(plugin)) {
        config.plugin.push(plugin)
      }
    }
  }

  if (!config.provider && pantheonConfig.provider) {
    config.provider = deepClone(pantheonConfig.provider)
  } else if (config.provider && pantheonConfig.provider) {
    mergeMissing(config.provider, pantheonConfig.provider)
  }

  if (!config.compaction && pantheonConfig.compaction) {
    config.compaction = deepClone(pantheonConfig.compaction)
  } else if (config.compaction && pantheonConfig.compaction) {
    mergeMissing(config.compaction, pantheonConfig.compaction)
  }

  // --------------------------------------------------------------------
  // C. Merge permissions
  // --------------------------------------------------------------------
  if (!config.permission) config.permission = {}
  if (pantheonConfig.permission) {
    mergeMissing(config.permission, pantheonConfig.permission)
  }
  if (componentSet.has('skills')) {
    config.permission.skill = { '*': 'allow' }
  }
  if (!config.permission.bash) {
    config.permission.bash = {
      'git *': 'allow',
      'npm *': 'allow',
      'npx *': 'allow',
      'pytest *': 'allow',
      'ruff *': 'allow',
      'black *': 'allow',
      'pip *': 'allow',
      'docker *': 'allow',
      'curl *': 'allow',
      'gh *': 'allow',
      'make *': 'allow',
    }
  }

  // --------------------------------------------------------------------
  // D. Merge instructions paths
  // --------------------------------------------------------------------
  const pantheonInstructions = ['AGENTS.md', 'instructions/*.instructions.md']
  if (!config.instructions) {
    config.instructions = [...pantheonInstructions]
  } else {
    for (const instr of pantheonInstructions) {
      if (!config.instructions.includes(instr)) {
        config.instructions.push(instr)
      }
    }
  }

  // --------------------------------------------------------------------
  // E. Ensure $schema
  // --------------------------------------------------------------------
  if (!config.$schema) {
    config.$schema = 'https://opencode.ai/config.json'
  }

  // --------------------------------------------------------------------
  // F. Compatibility cleanup (OpenCode >= v1.15.7)
  // --------------------------------------------------------------------
  // `todoContinuation` is rejected by newer OpenCode versions.
  // Remove it from merged user config to avoid startup/config failures.
  if (Object.hasOwn(config, 'todoContinuation')) {
    delete config.todoContinuation
  }

  // --------------------------------------------------------------------
  // F.5 MCP server entries (for runtime-deployed scripts)
  // --------------------------------------------------------------------
  if (componentSet.has('runtime')) {
    config.mcp = config.mcp || {}
    const runtimeTarget = isGlobal ? target : join(target, '.opencode')
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3'
    const venvPython = join(runtimeTarget, '.venv', 'bin', 'python3')
    const memoryPython = existsSync(venvPython) ? venvPython : pythonPath

    // Only add if not already configured by user
    if (!config.mcp['pantheon-resources']) {
      config.mcp['pantheon-resources'] = {
        type: 'local',
        cwd: runtimeTarget,
        command: [pythonPath, 'scripts/mcp_resources_server.py'],
        enabled: true,
      }
    }
    if (!config.mcp['pantheon-code-mode']) {
      config.mcp['pantheon-code-mode'] = {
        type: 'local',
        cwd: runtimeTarget,
        command: [pythonPath, 'scripts/code_mode_server.py'],
        enabled: true,
      }
    }
    if (!config.mcp['pantheon-memory']) {
      config.mcp['pantheon-memory'] = {
        type: 'local',
        cwd: runtimeTarget,
        command: [memoryPython, 'scripts/memory_mcp_server.py'],
        enabled: true,
      }
    }
    if (!config.mcp['pantheon-persistence']) {
      config.mcp['pantheon-persistence'] = {
        type: 'local',
        cwd: runtimeTarget,
        command: [memoryPython, 'scripts/mcp_persistence_server.py'],
        enabled: true,
      }
    }

    // Default MCP permissions
    config.permission = config.permission || {}
    config.permission.mcp = config.permission.mcp || {}
    if (!config.permission.mcp['pantheon-resources']) {
      config.permission.mcp['pantheon-resources'] = 'allow'
    }
    if (!config.permission.mcp['pantheon-code-mode']) {
      config.permission.mcp['pantheon-code-mode'] = 'ask'
    }
    if (!config.permission.mcp['pantheon-memory']) {
      config.permission.mcp['pantheon-memory'] = 'allow'
    }
    if (!config.permission.mcp['pantheon-persistence']) {
      config.permission.mcp['pantheon-persistence'] = 'allow'
    }
  }

  const configContent = `${JSON.stringify(config, null, 2)}\n`
  const status = writeIfChanged(targetConfigPath, configContent, dryRun)
  if (status === 'created') stats.created++
  else stats.skipped++

  // -----------------------------------------------------------------------
  // 3.5 Run migrations (--components runtime)
  // -----------------------------------------------------------------------
  if (componentSet.has('runtime')) {
    const currentVersion = detectVersion(target)
    if (currentVersion) {
      const migration = runMigrations(target, currentVersion, { dryRun })
      if (migration.applied > 0) {
        console.log(`  ✅ Applied ${migration.applied} migration(s)`)
        for (const msg of migration.messages) {
          console.log(`     • ${msg}`)
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 4. Setup virtual environment + health check (--components runtime)
  // -----------------------------------------------------------------------
  if (componentSet.has('runtime')) {
    try {
      setupVenv(target, { dryRun })
      const health = healthCheck(target, { dryRun })

      // Print health summary
      console.log('\n  📊 Health Check:')
      for (const p of health.passed) console.log(`    ✅ ${p.check}: ${p.detail}`)
      for (const w of health.warnings) console.log(`    ⚠️  ${w.check}: ${w.detail}`)
      for (const f of health.failed) console.log(`    ❌ ${f.check}: ${f.detail}`)

      if (health.failed.length > 0) {
        console.log(`  ⚠️  ${health.failed.length} check(s) failed — review above`)
        stats.errors += health.failed.length
      }
    } catch (err) {
      console.error(`  ❌ Setup failed: ${err.message}`)
      stats.errors++
    }
  }
}
