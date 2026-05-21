#!/usr/bin/env node
/**
 * opencode.mjs — OpenCode platform installer
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { ROOT, PLATFORM_DIR, summary, sourceDirValid, copyFiles, writeIfChanged, collectSkillNames, installSkills, syncDir } from './shared.mjs';

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

    for (const [agentName, agentCfg] of Object.entries(pantheonConfig.agent)) {
      if (!agentCfg || typeof agentCfg !== 'object') continue;
      if (config.agent[agentName]) {
        const existing = config.agent[agentName];
        if (agentSources[agentName]) existing.source = agentSources[agentName];
        delete existing.model;
        delete existing.small_model;
        continue;
      }
      const newAgent = {};
      if (agentSources[agentName]) newAgent.source = agentSources[agentName];
      if (agentCfg.description) newAgent.description = agentCfg.description;
      const defaults = agentDefaults[agentName];
      if (defaults) {
        for (const [key, val] of Object.entries(defaults)) {
          if (key === 'bash') continue;
          newAgent[key] = val;
        }
        if (defaults.bash !== undefined) newAgent.permission = { bash: defaults.bash };
      }
      config.agent[agentName] = newAgent;
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

  // --------------------------------------------------------------------
  // C. Merge permissions
  // --------------------------------------------------------------------
  if (!config.permission) config.permission = {};
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

  const configContent = JSON.stringify(config, null, 2) + '\n';
  const status = writeIfChanged(targetConfigPath, configContent, dryRun);
  if (status === 'created') stats.created++;
  else stats.skipped++;
}
