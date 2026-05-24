#!/usr/bin/env node
/**
 * opencode.mjs — OpenCode platform installer
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { ROOT, PLATFORM_DIR, summary, sourceDirValid, copyFiles, writeIfChanged, collectSkillNames, installSkills, syncDir } from './shared.mjs';

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeMissing(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
  if (!target || typeof target !== 'object' || Array.isArray(target)) return deepClone(source);

  for (const [key, sourceVal] of Object.entries(source)) {
    const targetVal = target[key];

    if (targetVal === undefined) {
      target[key] = deepClone(sourceVal);
      continue;
    }

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      mergeMissing(targetVal, sourceVal);
    }
  }

  return target;
}

/**
 * Detect whether `target` is the user's global OpenCode config directory
 * (~/.config/opencode or $XDG_CONFIG_HOME/opencode).
 * Global installs use a flat layout: agents/ skills/ commands/
 * Project installs use the .opencode/ sub-directory layout.
 */
function isGlobalConfigDir(target) {
  const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  const globalDir = resolve(join(xdgConfig, 'opencode'));
  return resolve(target) === globalDir;
}

export function installOpenCode(target, dryRun, clean = false, components = ['agents', 'skills', 'instructions', 'commands']) {
  const componentSet = new Set(components);
  const stats = summary.opencode;

  // Determine layout based on install scope.
  // Global config dir (~/.config/opencode) uses a flat layout:
  //   agents/   skills/   commands/
  // Project installs use the .opencode/ sub-directory layout:
  //   .opencode/agents/   .opencode/skills/   .opencode/commands/
  const isGlobal = isGlobalConfigDir(target);
  const subDir = isGlobal ? '' : '.opencode';
  const agentPrefix = isGlobal ? 'agents' : '.opencode/agents';

  if (isGlobal) {
    console.log('  🌐 Global config directory detected — using flat layout (agents/, skills/, commands/)');
  }

  // -----------------------------------------------------------------------
  // 1. Install agents (--components agents)
  // -----------------------------------------------------------------------
  if (componentSet.has('agents')) {
    const srcDir = join(PLATFORM_DIR, 'opencode', 'agents');
    if (!sourceDirValid(srcDir)) {
      console.warn(`  ⚠️  Agent source directory not found: ${srcDir}`);
      stats.errors++;
    } else {
      const dstDir = isGlobal ? join(target, 'agents') : join(target, '.opencode', 'agents');
      if (!dryRun) mkdirSync(dstDir, { recursive: true });
      if (clean && existsSync(dstDir) && !dryRun) {
        const existing = readdirSync(dstDir);
        for (const f of existing) {
          rmSync(join(dstDir, f), { recursive: true, force: true });
        }
      }
      const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
      stats.created += created;
      stats.skipped += skipped;
    }
  }

  // -----------------------------------------------------------------------
  // 2. Install skills (--components skills)
  // -----------------------------------------------------------------------
  if (componentSet.has('skills')) {
    const skillNames = collectSkillNames();
    if (skillNames.length > 0) {
      console.log(`  📚 Installing ${skillNames.length} skills...`);
      const dstSkillsDir = isGlobal ? join(target, 'skills') : join(target, '.opencode', 'skills');
      if (clean && existsSync(dstSkillsDir) && !dryRun) {
        const existing = readdirSync(dstSkillsDir);
        for (const s of existing) {
          rmSync(join(dstSkillsDir, s), { recursive: true, force: true });
        }
      }
      const installSubDir = isGlobal ? '' : '.opencode';
      const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun, installSubDir);
      stats.created += sCreated;
      stats.skipped += sSkipped;
    }
  }

  // -----------------------------------------------------------------------
  // 2.5 Install instructions: AGENTS.md + instructions/ (--components instructions)
  // -----------------------------------------------------------------------
  if (componentSet.has('instructions')) {
    // AGENTS.md
    const srcAgentsMd = join(ROOT, 'AGENTS.md');
    const dstAgentsMd = join(target, 'AGENTS.md');
    if (existsSync(srcAgentsMd)) {
      const content = readFileSync(srcAgentsMd, 'utf8');
      const status = writeIfChanged(dstAgentsMd, content, dryRun);
      if (status === 'created') stats.created++;
      else stats.skipped++;
    }
    // instructions/ directory
    const srcInstr = join(ROOT, 'instructions');
    const dstInstr = join(target, 'instructions');
    if (existsSync(srcInstr)) {
      const instrResult = syncDir(srcInstr, dstInstr, dryRun, clean);
      stats.created += instrResult.created;
      stats.skipped += instrResult.skipped;
    }
  }

  // -----------------------------------------------------------------------
  // 2.6 Install prompts (--components prompts)
  // -----------------------------------------------------------------------
  if (componentSet.has('prompts')) {
    const srcPrompts = join(ROOT, 'prompts');
    const dstPrompts = join(target, 'prompts');
    if (existsSync(srcPrompts)) {
      const promptsResult = syncDir(srcPrompts, dstPrompts, dryRun, clean);
      stats.created += promptsResult.created;
      stats.skipped += promptsResult.skipped;
    }
  }

  // -----------------------------------------------------------------------
  // 2.7 Install commands (--components commands)
  // -----------------------------------------------------------------------
  if (componentSet.has('commands')) {
    const srcCmds = join(ROOT, 'commands');
    const dstCmds = isGlobal ? join(target, 'commands') : join(target, '.opencode', 'commands');
    if (existsSync(srcCmds)) {
      const cmdResult = syncDir(srcCmds, dstCmds, dryRun, clean, (f) => f.endsWith('.md'));
      stats.created += cmdResult.created;
      stats.skipped += cmdResult.skipped;
    }
  }

  // -----------------------------------------------------------------------
  // 3. Create/update opencode.json (always runs)
  //    Reads TARGET's existing config first, then merges Pantheon settings
  //    on top. Preserves user's MCP, provider, plugin, compaction, theme.
  // -----------------------------------------------------------------------
  const pantheonConfigPath = join(ROOT, 'opencode.json');
  const targetConfigPath = join(target, 'opencode.json');

  let config = {};
  if (existsSync(targetConfigPath)) {
    try {
      config = JSON.parse(readFileSync(targetConfigPath, 'utf8'));
    } catch {
      config = {};
    }
  }

  let pantheonConfig = {};
  if (existsSync(pantheonConfigPath)) {
    try {
      pantheonConfig = JSON.parse(readFileSync(pantheonConfigPath, 'utf8'));
    } catch {
      pantheonConfig = {};
    }
  }

  // --------------------------------------------------------------------
  // A. Merge agents into opencode.json config
  // --------------------------------------------------------------------
  if (pantheonConfig.agent) {
    if (!config.agent) config.agent = {};

    const agentSources = {
      zeus:      `${agentPrefix}/zeus.md`,
      athena:    `${agentPrefix}/athena.md`,
      themis:    `${agentPrefix}/themis.md`,
      hermes:    `${agentPrefix}/hermes.md`,
      aphrodite: `${agentPrefix}/aphrodite.md`,
      demeter:   `${agentPrefix}/demeter.md`,
      prometheus:`${agentPrefix}/prometheus.md`,
      hephaestus:`${agentPrefix}/hephaestus.md`,
      chiron:    `${agentPrefix}/chiron.md`,
      echo:      `${agentPrefix}/echo.md`,
      gaia:      `${agentPrefix}/gaia.md`,
      apollo:    `${agentPrefix}/apollo.md`,
      iris:      `${agentPrefix}/iris.md`,
      mnemosyne: `${agentPrefix}/mnemosyne.md`,
      nyx:       `${agentPrefix}/nyx.md`,
      talos:     `${agentPrefix}/talos.md`,
      argus:     `${agentPrefix}/argus.md`,
      agora:     `${agentPrefix}/agora.md`,
    };

    const agentDefaults = {
      zeus:      { mode: 'primary',                          task_budget: 30, bash: 'deny' },
      athena:    { mode: 'primary',                          task_budget: 10, bash: 'deny' },
      themis:    {                           hidden: true,   task_budget: 5,  bash: { 'pytest *': 'allow', 'ruff *': 'allow', 'grep *': 'allow', 'npx vitest *': 'allow', 'pip *': 'allow' } },
      hermes:    { mode: 'subagent',         hidden: true,   task_budget: 5,  bash: 'allow' },
      aphrodite: { mode: 'subagent',         hidden: true,   task_budget: 5,  bash: 'allow' },
      demeter:   { mode: 'subagent',         hidden: true,   task_budget: 5,  bash: 'allow' },
      prometheus:{ mode: 'subagent',         hidden: true,   task_budget: 3,  bash: 'allow' },
      hephaestus:{ mode: 'subagent',         hidden: true,   task_budget: 5,  bash: 'allow' },
      chiron:    { mode: 'subagent',         hidden: true,   task_budget: 3,  bash: 'allow' },
      echo:      { mode: 'subagent',         hidden: true,   task_budget: 3,  bash: 'allow' },
      gaia:      { mode: 'subagent',         hidden: true,   task_budget: 3,  bash: 'deny' },
      apollo:    { mode: 'subagent',         hidden: true,   task_budget: 0,  bash: 'deny' },
      iris:      { mode: 'subagent',         hidden: true,   task_budget: 2,  bash: { 'git *': 'allow', 'gh *': 'allow' } },
      mnemosyne: { mode: 'subagent',         hidden: true,   task_budget: 0,  bash: 'deny' },
      nyx:       { mode: 'subagent',         hidden: true,   task_budget: 3,  bash: 'allow' },
      talos:     { mode: 'subagent',         hidden: true,   task_budget: 0,  bash: { 'git add *': 'allow', 'npx prettier *': 'allow', 'git *': 'allow' } },
      argus:     { mode: 'subagent',         hidden: true,   task_budget: 0,  bash: 'deny' },
      agora:     { mode: 'subagent',         hidden: true,   task_budget: 10, bash: 'deny' },
    };

    const MANAGED_FIELDS = ['steps', 'task_budget', 'temperature', 'color', 'permission'];

    for (const [agentName, agentCfg] of Object.entries(pantheonConfig.agent)) {
      if (!agentCfg || typeof agentCfg !== 'object') continue;

      // Common: set source, strip model/small_model from Pantheon config
      const safeCfg = { ...agentCfg };
      delete safeCfg.model;
      delete safeCfg.small_model;
      delete safeCfg.description; // handled separately

      if (config.agent[agentName]) {
        // ── Agent exists in target config ──
        // Update framework-managed fields (steps, task_budget, etc.)
        // Preserve user-customized fields (model, provider, mcp, etc.)
        const existing = config.agent[agentName];
        if (agentSources[agentName]) existing.source = agentSources[agentName];
        for (const field of MANAGED_FIELDS) {
          if (field in safeCfg) {
            existing[field] = JSON.parse(JSON.stringify(safeCfg[field]));
          }
        }
        // Remove stale fields that are no longer in Pantheon config
        delete existing.model;
        delete existing.small_model;
      } else {
        // ── New agent ──
        const newAgent = {};
        if (agentSources[agentName]) newAgent.source = agentSources[agentName];
        if (agentCfg.description) newAgent.description = agentCfg.description;

        // Copy all framework-managed fields from Pantheon config
        for (const field of MANAGED_FIELDS) {
          if (field in safeCfg) {
            newAgent[field] = JSON.parse(JSON.stringify(safeCfg[field]));
          }
        }

        // Apply defaults for any missing fields
        const defaults = agentDefaults[agentName];
        if (defaults) {
          if (!newAgent.mode && defaults.mode) newAgent.mode = defaults.mode;
          if (!newAgent.hidden && defaults.hidden) newAgent.hidden = defaults.hidden;
          if (!newAgent.task_budget && defaults.task_budget !== undefined) newAgent.task_budget = defaults.task_budget;
          // Apply bash permission from defaults if permission wasn't set from config
          if (!newAgent.permission && defaults.bash !== undefined) {
            newAgent.permission = { bash: defaults.bash };
          } else if (newAgent.permission && defaults.bash !== undefined && !newAgent.permission.bash) {
            newAgent.permission.bash = defaults.bash;
          }
        }

        config.agent[agentName] = newAgent;
      }
    }

    const pantheonAgentNames = new Set(Object.keys(pantheonConfig.agent));
    for (const [agentName] of Object.entries(config.agent)) {
      if (agentSources[agentName] && !pantheonAgentNames.has(agentName)) {
        delete config.agent[agentName];
      }
    }
    if (Object.keys(config.agent).length === 0) delete config.agent;
  }

  // --------------------------------------------------------------------
  // B. Merge commands
  // --------------------------------------------------------------------
  const commandsPath = join(ROOT, 'commands', 'commands.json');
  if (!config.command) config.command = {};
  if (existsSync(commandsPath)) {
    try {
      const pantheonCommands = JSON.parse(readFileSync(commandsPath, 'utf8'));
      if (pantheonCommands && typeof pantheonCommands === 'object') {
        for (const [name, definition] of Object.entries(pantheonCommands)) {
          config.command[name] = deepClone(definition);
        }
      }
    } catch {
      // Non-fatal: keep existing config.command if commands.json is malformed.
    }
  }

  // --------------------------------------------------------------------
  // B.5 Ensure critical top-level OpenCode config sections
  // --------------------------------------------------------------------
  if (!config.default_agent && pantheonConfig.default_agent) {
    config.default_agent = pantheonConfig.default_agent;
  }

  if (!Array.isArray(config.plugin)) {
    config.plugin = [];
  }
  if (Array.isArray(pantheonConfig.plugin)) {
    for (const plugin of pantheonConfig.plugin) {
      if (!config.plugin.includes(plugin)) {
        config.plugin.push(plugin);
      }
    }
  }

  if (!config.provider && pantheonConfig.provider) {
    config.provider = deepClone(pantheonConfig.provider);
  } else if (config.provider && pantheonConfig.provider) {
    mergeMissing(config.provider, pantheonConfig.provider);
  }

  if (!config.compaction && pantheonConfig.compaction) {
    config.compaction = deepClone(pantheonConfig.compaction);
  } else if (config.compaction && pantheonConfig.compaction) {
    mergeMissing(config.compaction, pantheonConfig.compaction);
  }

  // --------------------------------------------------------------------
  // C. Merge permissions
  // --------------------------------------------------------------------
  if (!config.permission) config.permission = {};
  if (pantheonConfig.permission) {
    mergeMissing(config.permission, pantheonConfig.permission);
  }
  if (componentSet.has('skills')) {
    config.permission.skill = { '*': 'allow' };
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
    };
  }

  // --------------------------------------------------------------------
  // D. Merge instructions paths
  // --------------------------------------------------------------------
  const pantheonInstructions = ['AGENTS.md', 'instructions/*.instructions.md'];
  if (!config.instructions) {
    config.instructions = [...pantheonInstructions];
  } else {
    for (const instr of pantheonInstructions) {
      if (!config.instructions.includes(instr)) {
        config.instructions.push(instr);
      }
    }
  }

  // --------------------------------------------------------------------
  // E. Ensure $schema
  // --------------------------------------------------------------------
  if (!config.$schema) {
    config.$schema = 'https://opencode.ai/config.json';
  }

  // --------------------------------------------------------------------
  // F. Compatibility cleanup (OpenCode >= v1.15.7)
  // --------------------------------------------------------------------
  // `todoContinuation` is rejected by newer OpenCode versions.
  // Remove it from merged user config to avoid startup/config failures.
  if (Object.prototype.hasOwnProperty.call(config, 'todoContinuation')) {
    delete config.todoContinuation;
  }

  const configContent = JSON.stringify(config, null, 2) + '\n';
  const status = writeIfChanged(targetConfigPath, configContent, dryRun);
  if (status === 'created') stats.created++;
  else stats.skipped++;
}
