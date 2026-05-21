#!/usr/bin/env node
/**
 * install.mjs — Multi-platform Pantheon agent installer
 *
 * Generates platform-specific configuration files and agent directories
 * for any target project. Detects which platforms to install, runs the
 * sync engine, and creates/configures the appropriate files.
 *
 * Usage:
 *   node scripts/install.mjs                                     # auto-detect, cwd
 *   node scripts/install.mjs --target /path/to/project           # auto-detect, target
 *   node scripts/install.mjs --platforms opencode,claude         # specific platforms, cwd
 *   node scripts/install.mjs --target /path --platforms all      # all platforms
 *   node scripts/install.mjs --dry-run                           # preview without writing
 *   node scripts/install.mjs --help                              # show help
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');                         // pantheon repo root
const AGENTS_DIR = join(ROOT, 'agents');                     // canonical VS Code agents
const PLATFORM_DIR = join(ROOT, 'platform');                 // platform-specific generated files

// ---------------------------------------------------------------------------
// Agent names (all 16 in canonical order)
// ---------------------------------------------------------------------------

const AGENT_NAMES = [
  'zeus', 'athena', 'apollo', 'argus',
  'hermes', 'aphrodite', 'demeter', 'prometheus', 'hephaestus', 'chiron', 'echo', 'nyx',
  'gaia',
  'iris',
  'themis',
  'mnemosyne',
  'talos',
];

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function showHelp() {
  console.log(`
install.mjs — Multi-platform Pantheon agent installer

Usage:
  node scripts/install.mjs                                     auto-detect, cwd
  node scripts/install.mjs --target /path/to/project           auto-detect, target
  node scripts/install.mjs --platforms opencode,claude         specific platforms, cwd
  node scripts/install.mjs --target /path --platforms all      all platforms
  node scripts/install.mjs --dry-run                           preview without writing
  node scripts/install.mjs --clean                             wipe + fresh install (all components)
  node scripts/install.mjs --clean --components agents,skills  wipe only agents+skills, reinstall
  node scripts/install.mjs --components agents                 install only agents (no skills/instructions)
  node scripts/install.mjs --help                              show this help

Components (--components):
  Comma-separated list of what to install. Default: agents,skills,instructions
    agents        → agent .md files
    skills        → skill definitions (.opencode/skills/)
    instructions  → AGENTS.md + instructions/*.instructions.md
    prompts       → prompts/*.prompt.md (optional)
    commands      → .opencode/commands/*.md (OpenCode command shortcuts)

Clean mode (--clean):
  Deletes ALL existing Pantheon files for selected components, then
  re-installs fresh from source. Useful after removing/renaming agents or skills.
  OFF by default — without --clean only copies new/changed files (never deletes).

Platforms:
  opencode    → .opencode/agents/ + opencode.json
  claude       → .claude/agents/ + CLAUDE.md + settings.json
  cursor       → .cursor/rules/ (renamed .mdc files)
  windsurf     → .windsurf/agents/ + .windsurfrules
  copilot      → .github/agents/ symlinks + .vscode/settings.json check
  continue     → .continue/rules/ + .continue/config.yaml
  all          → install every platform

When --platforms is omitted, the script auto-detects which platforms
the target project already supports (based on config files present).
If none are detected, ALL platforms are installed.
`);
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    target: null,
    platforms: null,
    components: null,
    dryRun: false,
    clean: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--target':
        args.target = argv[++i];
        break;
      case '--platforms':
        args.platforms = argv[++i].split(',').map(s => s.trim().toLowerCase());
        break;
      case '--components':
        args.components = argv[++i].split(',').map(s => s.trim().toLowerCase());
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--clean':
        args.clean = true;
        break;
      case '--help':
        args.help = true;
        break;
      default:
        console.warn(`⚠️  Unknown option: ${argv[i]}`);
        break;
    }
  }

  if (!args.target) {
    args.target = process.cwd();
  }

  // Resolve to absolute path
  args.target = resolveTarget(args.target);

  return args;
}

function resolveTarget(target) {
  // If it's already absolute, use it
  if (target.startsWith('/')) return target;
  // If it's relative, resolve from cwd
  return join(process.cwd(), target);
}

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

const PLATFORM_DETECTORS = {
  opencode: (target) => existsSync(join(target, 'opencode.json')),
  claude:   (target) => existsSync(join(target, '.claude')) || existsSync(join(target, 'CLAUDE.md')),
  cursor:   (target) => existsSync(join(target, '.cursor')) || existsSync(join(target, '.cursorrules')),
  windsurf: (target) => existsSync(join(target, '.windsurf')) || existsSync(join(target, '.windsurfrules')),
  copilot:  (target) => existsSync(join(target, '.github', 'copilot-instructions.md')) || existsSync(join(target, '.vscode')),
  continue: (target) => existsSync(join(target, '.continue', 'config.yaml')) || existsSync(join(target, '.continue')),
};

function detectPlatforms(target) {
  const detected = [];
  for (const [platform, detector] of Object.entries(PLATFORM_DETECTORS)) {
    if (detector(target)) {
      detected.push(platform);
    }
  }
  return detected;
}

// ---------------------------------------------------------------------------
// Summary counters
// ---------------------------------------------------------------------------

const summary = {
  opencode:  { created: 0, skipped: 0, errors: 0 },
  claude:    { created: 0, skipped: 0, errors: 0 },
  cursor:    { created: 0, skipped: 0, errors: 0 },
  windsurf:  { created: 0, skipped: 0, errors: 0 },
  copilot:   { created: 0, skipped: 0, errors: 0 },
  continue:  { created: 0, skipped: 0, errors: 0 },
};

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

/**
 * Check if source directory exists and has files.
 */
function sourceDirValid(dir) {
  if (!existsSync(dir)) return false;
  const entries = readdirSync(dir);
  return entries.length > 0;
}

/**
 * Copy files from srcDir to dstDir, returning counts of created/skipped.
 * Skips files that already exist with identical content.
 *
 * When clean=true: removes stale Pantheon agent .md files from dst that
 * no longer exist in src. Uses AGENT_NAMES as safety guard — only removes
 * files whose base name (without .md/.mdc) matches a known Pantheon agent.
 * User custom files are NEVER removed.
 */
function copyFiles(srcDir, dstDir, dryRun, renameMap = null, clean = false) {
  const entries = readdirSync(srcDir);
  let created = 0;
  let skipped = 0;

  // Build set of expected destination filenames (after rename)
  const dstNames = new Set();
  for (const entry of entries) {
    const srcFile = join(srcDir, entry);
    if (!existsSync(srcFile)) continue;
    const dstName = renameMap ? (renameMap(entry) ?? entry) : entry;
    dstNames.add(dstName);

    const dstFile = join(dstDir, dstName);

    const content = readFileSync(srcFile, 'utf8');
    const existing = existsSync(dstFile) ? readFileSync(dstFile, 'utf8') : null;

    if (existing !== null) {
      if (existing === content) {
        skipped++;
        continue;
      }
      if (!dryRun) {
        writeFileSync(dstFile, content, 'utf8');
      }
      created++;
    } else {
      if (!dryRun) {
        writeFileSync(dstFile, content, 'utf8');
      }
      created++;
    }
  }

  // Remove stale Pantheon agent files from dst (opt-in via clean flag)
  // Safety: ONLY removes files whose base name matches a known AGENT_NAMES entry
  if (clean && existsSync(dstDir)) {
    const dstEntries = readdirSync(dstDir);
    for (const entry of dstEntries) {
      if (dstNames.has(entry)) continue; // still in source
      const dstFile = join(dstDir, entry);
      if (!statSync(dstFile).isFile()) continue;
      // Safety: only remove known Pantheon agent files (user custom files untouched)
      const baseName = entry.replace(/\.(md|mdc)$/, '');
      if (!AGENT_NAMES.includes(baseName)) continue;
      if (!dryRun) {
        rmSync(dstFile, { force: true });
      }
      created++;
    }
  }

  return { created, skipped };
}

/**
 * Write a file if content differs or file doesn't exist.
 */
function writeIfChanged(filePath, content, dryRun) {
  const existing = existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
  if (existing === content) {
    return 'skipped';
  }
  if (!dryRun) {
    writeFileSync(filePath, content, 'utf8');
  }
  return 'created';
}

// ---------------------------------------------------------------------------
// Platform installers
// ---------------------------------------------------------------------------

/**
 * Collect skill names from the skills directory.
 */
function collectSkillNames() {
  const skillsDir = join(ROOT, 'skills');
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir)
    .filter(entry => {
      const entryPath = join(skillsDir, entry);
      return statSync(entryPath).isDirectory() && existsSync(join(entryPath, 'SKILL.md'));
    })
    .sort();
}

/**
 * Install skills to target project's skills directory.
 * Copies new/changed file content. Does NOT remove stale skills from dest —
 * we can't distinguish user custom skills from removed Pantheon skills
 * without a manifest. Use sync-opencode.sh with --clean for full sync.
 *
 * @param {string[]} skills - list of skill names
 * @param {string} target - target project root
 * @param {boolean} dryRun - dry-run mode
 * @param {string} subDir - subdirectory for skills (e.g. '.opencode')
 */
function installSkills(skills, target, dryRun, subDir = '.opencode') {
  const srcSkillsDir = join(ROOT, 'skills');
  const dstSkillsDir = join(target, subDir, 'skills');

  let created = 0;
  let skipped = 0;

  for (const skill of skills) {
    const src = join(srcSkillsDir, skill);
    const dst = join(dstSkillsDir, skill);

    if (!dryRun) mkdirSync(dst, { recursive: true });

    function copyDirRecursive(from, to) {
      const entries = readdirSync(from);
      for (const entry of entries) {
        const srcPath = join(from, entry);
        const dstPath = join(to, entry);
        if (statSync(srcPath).isDirectory()) {
          if (!dryRun) mkdirSync(dstPath, { recursive: true });
          copyDirRecursive(srcPath, dstPath);
        } else {
          const content = readFileSync(srcPath, 'utf8');
          const existing = existsSync(dstPath) ? readFileSync(dstPath, 'utf8') : null;
          if (existing === content) {
            skipped++;
          } else {
            if (!dryRun) writeFileSync(dstPath, content, 'utf8');
            created++;
          }
        }
      }
    }

    copyDirRecursive(src, dst);
  }

  return { created, skipped };
}

/**
 * Recursively copy a directory from src to dst.
 * When clean=true: removes dst/* completely before copying (full sync).
 * @param {function} [filter] - optional filter fn (entryName) => boolean
 * Returns { created, skipped } counts.
 */
function syncDir(src, dst, dryRun, clean = false, filter = null) {
  if (!existsSync(src)) return { created: 0, skipped: 0 };
  let created = 0;
  let skipped = 0;

  if (clean && existsSync(dst)) {
    if (!dryRun) {
      rmSync(dst, { recursive: true, force: true });
    }
  }

  if (!dryRun) mkdirSync(dst, { recursive: true });

  const entries = readdirSync(src);
  for (const entry of entries) {
    if (filter && !filter(entry)) continue;
    const srcPath = join(src, entry);
    const dstPath = join(dst, entry);
    if (statSync(srcPath).isDirectory()) {
      const sub = syncDir(srcPath, dstPath, dryRun, false, filter);
      created += sub.created;
      skipped += sub.skipped;
    } else {
      const content = readFileSync(srcPath, 'utf8');
      const existing = existsSync(dstPath) ? readFileSync(dstPath, 'utf8') : null;
      if (existing === content) {
        skipped++;
      } else {
        if (!dryRun) writeFileSync(dstPath, content, 'utf8');
        created++;
      }
    }
  }
  return { created, skipped };
}

/**
 * Install OpenCode platform.
 * - Runs sync to generate agents from canonical sources
 * - Copies platform/opencode/agents/ → .opencode/agents/
 * - Copies skills/ → .opencode/skills/ (project-level, also available globally)
 * - Copies AGENTS.md + instructions/ → target root
 * - Creates/updates opencode.json: reads target's existing config, merges Pantheon
 *   settings (agents, commands, permissions, instructions) on top.
 *   Preserves user's MCP, provider, plugin, compaction, theme settings.
 *
 * @param {boolean} clean - wipe dest + fresh install for selected components
 * @param {string[]} components - what to install: ['agents','skills','instructions','prompts']
 */
function installOpenCode(target, dryRun, clean = false, components = ['agents', 'skills', 'instructions', 'commands']) {
  const componentSet = new Set(components);
  const stats = summary.opencode;

  // -----------------------------------------------------------------------
  // 1. Install agents (--components agents)
  // -----------------------------------------------------------------------
  if (componentSet.has('agents')) {
    const srcDir = join(PLATFORM_DIR, 'opencode', 'agents');
    if (!sourceDirValid(srcDir)) {
      console.warn(`  ⚠️  Agent source directory not found: ${srcDir}`);
      stats.errors++;
    } else {
      const dstDir = join(target, '.opencode', 'agents');
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
      const dstSkillsDir = join(target, '.opencode', 'skills');
      if (clean && existsSync(dstSkillsDir) && !dryRun) {
        const existing = readdirSync(dstSkillsDir);
        for (const s of existing) {
          rmSync(join(dstSkillsDir, s), { recursive: true, force: true });
        }
      }
      const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun, '.opencode');
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
    const dstCmds = join(target, '.opencode', 'commands');
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
      zeus:      '.opencode/agents/zeus.md',
      athena:    '.opencode/agents/athena.md',
      themis:    '.opencode/agents/themis.md',
      hermes:    '.opencode/agents/hermes.md',
      aphrodite: '.opencode/agents/aphrodite.md',
      demeter:   '.opencode/agents/demeter.md',
      prometheus:'.opencode/agents/prometheus.md',
      hephaestus:'.opencode/agents/hephaestus.md',
      chiron:    '.opencode/agents/chiron.md',
      echo:      '.opencode/agents/echo.md',
      gaia:      '.opencode/agents/gaia.md',
      apollo:    '.opencode/agents/apollo.md',
      iris:      '.opencode/agents/iris.md',
      mnemosyne: '.opencode/agents/mnemosyne.md',
      nyx:       '.opencode/agents/nyx.md',
      talos:     '.opencode/agents/talos.md',
      argus:     '.opencode/agents/argus.md',
      agora:     '.opencode/agents/agora.md',
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

/**
 * Install Claude Code platform.
 * - Copies platform/claude/agents/ → .claude/agents/
 * - Creates .claude/settings.json with minimal config
 * - Creates CLAUDE.md bridge file
 * - Creates AGENTS.md if it doesn't exist
 * - Skills: installed globally via sync-opencode.sh, not per-platform
 */
function installClaude(target, dryRun, clean = false) {
  const stats = summary.claude;

  // Source: platform/claude/agents/
  const srcDir = join(PLATFORM_DIR, 'claude', 'agents');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    stats.errors++;
    return;
  }

  // Target: .claude/agents/
  const dstDir = join(target, '.claude', 'agents');
  if (!dryRun) mkdirSync(dstDir, { recursive: true });

  const { created, skipped } = copyFiles(srcDir, dstDir, dryRun, null, clean);
  stats.created += created;
  stats.skipped += skipped;

  // Skills: installed globally via sync-opencode.sh not per-project
  // OpenCode already reads .opencode/skills/ and .claude/skills/ as fallback
  // Create .claude/settings.json with safe defaults
  const settingsPath = join(target, '.claude', 'settings.json');
  const settings = {
    permissions: {
      allow: [
        'Bash(git *)',
        'Bash(npm *)',
        'Bash(npx *)',
        'Bash(python *)',
        'Bash(pip *)',
        'Read',
        'Grep',
        'Glob',
      ],
    },
  };
  const settingsContent = JSON.stringify(settings, null, 2) + '\n';
  const settingsStatus = writeIfChanged(settingsPath, settingsContent, dryRun);
  if (settingsStatus === 'created') stats.created++;
  else stats.skipped++;

  // Create CLAUDE.md bridge with rich instructions
  const claudeMdPath = join(target, 'CLAUDE.md');
  const claudeMdContent = `# Pantheon Agent System

This project uses the Pantheon multi-agent framework for AI-assisted development.

## Instructions

Always check AGENTS.md for shared project conventions and architecture decisions.

## Available Agents

| Agent | Role | When to use |
|-------|------|-------------|
| @zeus | Central orchestrator | Full feature orchestration, multi-agent coordination |
| @athena | Strategic planner | Architecture decisions, implementation plans |
| @apollo | Codebase discovery | Research, finding files, exploring patterns |
| @hermes | Backend (FastAPI) | API endpoints, services, business logic |
| @aphrodite | Frontend (React) | UI components, responsive design |
| @demeter | Database | Schema design, migrations, query optimization |
| @themis | Quality & security | Code review, OWASP audit, coverage check |
| @prometheus | Infrastructure | Docker, CI/CD, deployment |
| @hephaestus | AI pipelines | RAG, LangChain, vector search |
| @chiron | Model routing | Provider configuration, cost optimization |
| @echo | Conversational AI | NLU, dialogue flows, chatbots |
| @nyx | Observability | Monitoring, tracing, cost tracking |
| @gaia | Remote sensing | LULC analysis, satellite imagery |
| @iris | GitHub operations | Branches, PRs, issues, releases |
| @mnemosyne | Documentation | Memory bank, ADRs, progress logging |
| @talos | Hotfixes | Rapid bug fixes, CSS corrections |

## Workflow

Plan → Implement → Review → Commit (each phase requires approval)
See .claude/agents/ for full agent definitions.
Skills are in .opencode/skills/ (or globally at ~/.config/opencode/skills/).
`;
  const claudeMdStatus = writeIfChanged(claudeMdPath, claudeMdContent, dryRun);
  if (claudeMdStatus === 'created') stats.created++;
  else stats.skipped++;

  // Create/sync AGENTS.md
  const agentsMdPath = join(target, 'AGENTS.md');
  const agentsMdContent = `# Pantheon Agent System

This project uses the Pantheon multi-agent framework.

## Commands

- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`

## Conventions

- TDD: Write failing test first, then implement
- Minimum 80% test coverage
- Async/await on all I/O operations
- Type hints on all functions
- OWASP Top 10 compliance required

## Architecture

17 specialized agents coordinated by Zeus (orchestrator).
See .claude/agents/ for definitions and CLAUDE.md for agent descriptions.
`;
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;
}

/**
 * Install Cursor platform.
 * - Copies platform/cursor/rules/ → .cursor/rules/
 * - Creates AGENTS.md for global rules
 * - Skills: installed globally via sync-opencode.sh, not per-platform
 */
function installCursor(target, dryRun, clean = false) {
  const stats = summary.cursor;

  // -----------------------------------------------------------------------
  // 1. Install .mdc rules
  // -----------------------------------------------------------------------
  const srcDir = join(PLATFORM_DIR, 'cursor', 'rules');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    stats.errors++;
  } else {
    const dstDir = join(target, '.cursor', 'rules');
    if (!dryRun) mkdirSync(dstDir, { recursive: true });

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun, null, clean);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Create/sync AGENTS.md
  // -----------------------------------------------------------------------
  const agentsMdPath = join(target, 'AGENTS.md');
  const agentsMdContent = `# Pantheon Agent System

This project uses the Pantheon multi-agent framework with 17 specialized agents.

## Available Agents

| Agent | Role | Invocation |
|-------|------|------------|
| @zeus | Central orchestrator | Coordinates all agents |
| @athena | Strategic planner | Creates TDD-driven plans |
| @apollo | Codebase discovery | Parallel research |
| @hermes | Backend (FastAPI) | API implementation |
| @aphrodite | Frontend (React) | UI components |
| @demeter | Database | Schema & optimization |
| @themis | Quality & security | Code review |
| @prometheus | Infrastructure | Docker & deployment |
| @hephaestus | AI pipelines | RAG & LangChain |
| @chiron | Model routing | Provider hub |
| @echo | Conversational AI | NLU & dialogue |
| @nyx | Observability | Tracing & monitoring |
| @gaia | Remote sensing | LULC analysis |
| @iris | GitHub operations | PRs & releases |
| @mnemosyne | Documentation | Memory bank |
| @talos | Hotfixes | Rapid repairs |

## Commands

- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`

## Conventions

- TDD: Write failing test first, then implement
- Coverage minimum: 80%
- Async/await on all I/O
- Type hints on all functions
`;
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;
}

/**
 * Install Windsurf (Cascade) platform.
 * - Copies platform/windsurf/rules/ → .windsurf/rules/
 * - Creates workflows/ → .windsurf/workflows/
 * - Creates AGENTS.md with project rules
 * - Skills: installed globally via sync-opencode.sh, not per-platform
 */
function installWindsurf(target, dryRun, clean = false) {
  const stats = summary.windsurf;

  // -----------------------------------------------------------------------
  // 1. Install Cascade rules (replaces old agents/)
  // -----------------------------------------------------------------------
  const srcDir = join(PLATFORM_DIR, 'windsurf', 'rules');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Rules source directory not found: ${srcDir}`);
    stats.errors++;
  } else {
    const dstDir = join(target, '.windsurf', 'rules');
    if (!dryRun) mkdirSync(dstDir, { recursive: true });

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun, null, clean);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Create workflows
  // -----------------------------------------------------------------------
  const workflowsDir = join(target, '.windsurf', 'workflows');
  if (!dryRun) mkdirSync(workflowsDir, { recursive: true });

  const orchestrateWorkflow = `# Orchestrate a feature with Pantheon agents

Use this workflow to orchestrate a full feature implementation.

1. Start by understanding the feature requirements
2. Delegate to @zeus for full orchestration, or invoke specific agents:
   - @athena for planning
   - @apollo for codebase research
   - @hermes for backend implementation
   - @aphrodite for frontend implementation
   - @demeter for database changes
    - @themis for code review and security audit
    - @prometheus for infrastructure changes
3. Review results and iterate as needed
4. Run tests to verify: \`npm test\`
`;
  const orchestratePath = join(workflowsDir, 'orchestrate.md');
  const orchStatus = writeIfChanged(orchestratePath, orchestrateWorkflow, dryRun);
  if (orchStatus === 'created') stats.created++;
  else stats.skipped++;

  const reviewWorkflow = `# Code review with Themis

Use this workflow to run a code review and security audit.

1. Examine the recent changes (use \`git diff\` or @apollo)
2. Invoke @themis for security audit and code quality review
3. Apply any fixes identified
4. Verify tests pass
`;
  const reviewPath = join(workflowsDir, 'code-review.md');
  const reviewStatus = writeIfChanged(reviewPath, reviewWorkflow, dryRun);
  if (reviewStatus === 'created') stats.created++;
  else stats.skipped++;

  // -----------------------------------------------------------------------
  // 4. Create/update AGENTS.md
  // -----------------------------------------------------------------------
  const agentsMdPath = join(target, 'AGENTS.md');
  const agentsMdContent = `# Pantheon Agent System — Windsurf (Cascade)

This project uses the Pantheon multi-agent framework with 17 specialized agents.

## Available Agents

| Agent | Role | How to invoke |
|-------|------|---------------|
| @zeus | Central orchestrator | Full feature orchestration |
| @athena | Strategic planner | Architecture & planning |
| @apollo | Codebase discovery | Research & exploration |
| @hermes | Backend (FastAPI) | API implementation |
| @aphrodite | Frontend (React) | UI components |
| @demeter | Database | Schema & optimization |
| @themis | Quality & security | Code review |
| @prometheus | Infrastructure | Docker & deployment |
| @hephaestus | AI pipelines | RAG & LangChain |
| @chiron | Model routing | Provider configuration |
| @echo | Conversational AI | NLU & dialogue |
| @nyx | Observability | Monitoring & tracing |
| @gaia | Remote sensing | LULC analysis |
| @iris | GitHub operations | PRs & releases |
| @mnemosyne | Documentation | Memory bank |
| @talos | Hotfixes | Rapid repairs |

## Workflows

- \`/orchestrate\` — Full feature orchestration
- \`/code-review\` — Code review with Themis

## Commands

- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`
`;
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;

  // Remove legacy .windsurfrules if it exists
  const legacyRulesPath = join(target, '.windsurfrules');
  if (existsSync(legacyRulesPath) && !dryRun) {
    try { unlinkSync(legacyRulesPath); } catch {}
  }
}

/**
 * Install Continue.dev platform.
 * - Copies platform/continue/rules/ → .continue/rules/
 * - Copies platform/continue/config.yaml → .continue/config.yaml
 */
function installContinue(target, dryRun, clean = false) {
  const stats = summary.continue;

  // -----------------------------------------------------------------------
  // 1. Install rule files
  // -----------------------------------------------------------------------
  const srcDir = join(PLATFORM_DIR, 'continue', 'rules');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Rules source directory not found: ${srcDir}`);
    stats.errors++;
  } else {
    const dstDir = join(target, '.continue', 'rules');
    if (!dryRun) mkdirSync(dstDir, { recursive: true });

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun, null, clean);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Install config.yaml (only if it doesn't exist)
  // -----------------------------------------------------------------------
  const configSrc = join(PLATFORM_DIR, 'continue', 'config.yaml');
  const configDst = join(target, '.continue', 'config.yaml');
  if (existsSync(configSrc)) {
    const content = readFileSync(configSrc, 'utf8');
    const status = writeIfChanged(configDst, content, dryRun);
    if (status === 'created') stats.created++;
    else stats.skipped++;
  }
}

/**
 * Install VS Code / Copilot platform.
 * - Copies canonical agents to .github/agents/
 * - Configures .vscode/settings.json for plugin + subagents
 * - Skills: installed globally via sync-opencode.sh, not per-platform
 */
function installCopilot(target, dryRun, clean = false) {
  const stats = summary.copilot;

  // -----------------------------------------------------------------------
  // 1. Copy canonical .agent.md files to .github/agents/
  // -----------------------------------------------------------------------
  const agentsDstDir = join(target, '.github', 'agents');
  if (!dryRun) mkdirSync(agentsDstDir, { recursive: true });

  const agentFiles = readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.agent.md'))
    .sort();

  for (const agentFile of agentFiles) {
    const srcFile = join(AGENTS_DIR, agentFile);
    const dstFile = join(agentsDstDir, agentFile);

    if (!existsSync(srcFile)) continue;

    const content = readFileSync(srcFile, 'utf8');
    const existing = existsSync(dstFile) ? readFileSync(dstFile, 'utf8') : null;

    if (existing === content) {
      stats.skipped++;
      continue;
    }

    if (!dryRun) {
      writeFileSync(dstFile, content, 'utf8');
    }
    stats.created++;
  }

  // -----------------------------------------------------------------------
  // 2. Configure .vscode/settings.json
  // -----------------------------------------------------------------------
  const vscodeSettingsPath = join(target, '.vscode', 'settings.json');
  const vscodeDir = join(target, '.vscode');
  if (!dryRun) mkdirSync(vscodeDir, { recursive: true });

  let settings = {};
  if (existsSync(vscodeSettingsPath)) {
    try {
      settings = JSON.parse(readFileSync(vscodeSettingsPath, 'utf8'));
    } catch {
      settings = {};
    }
  }

  // Ensure plugin and subagent settings
  settings['chat.plugins.enabled'] = true;
  settings['chat.subagents.allowInvocationsFromSubagents'] = true;

  const settingsContent = JSON.stringify(settings, null, 2) + '\n';
  const status = writeIfChanged(vscodeSettingsPath, settingsContent, dryRun);
  if (status === 'created') stats.created++;
  else stats.skipped++;
}

// ---------------------------------------------------------------------------
// Summary printer
// ---------------------------------------------------------------------------

function printSummary(target, platforms) {
  const PLATFORM_LABELS = {
    opencode: 'OpenCode',
    claude:   'Claude Code',
    cursor:   'Cursor',
    windsurf: 'Windsurf',
    copilot:  'VS Code / Copilot',
    continue: 'Continue.dev',
  };

  console.log('');
  console.log('='.repeat(60));
  console.log('📋 Installation Summary');
  console.log(`   Target: ${target}`);
  console.log('='.repeat(60));

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const platform of platforms) {
    const label = PLATFORM_LABELS[platform] ?? platform;
    const stats = summary[platform];
    totalCreated += stats.created;
    totalSkipped += stats.skipped;
    totalErrors += stats.errors;

    const status = stats.errors > 0 ? '⚠️' : '✅';
    console.log(` ${status} ${label}: ${stats.created} created, ${stats.skipped} skipped${stats.errors > 0 ? `, ${stats.errors} errors` : ''}`);
  }

  console.log('-'.repeat(60));
  console.log(`   Total: ${totalCreated} files created, ${totalSkipped} files skipped, ${totalErrors} errors`);

  if (totalErrors > 0) {
    console.log('   ⚠️  Some platforms had errors — review warnings above.');
  }

  console.log('');
  console.log('📖 Next Steps:');
  console.log('');

  if (platforms.includes('opencode')) {
    console.log('  OpenCode:');
    console.log(`    - Run \`opencode\` in ${target}`);
    console.log('    - Invoke agents with @agent-name in chat');
    console.log('    - To customize models: edit opencode.json');
    console.log('    - Skills are in .opencode/skills/ (auto-loaded)');
    console.log('');
  }

  if (platforms.includes('claude')) {
    console.log('  Claude Code:');
    console.log(`    - Run \`claude\` in ${target}`);
    console.log('    - Agents in .claude/agents/');
    console.log('    - Skills in .claude/skills/');
    console.log('    - Settings in .claude/settings.json');
    console.log('');
  }

  if (platforms.includes('cursor')) {
    console.log('  Cursor:');
    console.log(`    - Rules in .cursor/rules/ (.mdc format)`);
    console.log('    - Skills in .cursor/skills/');
    console.log('    - AGENTS.md in project root');
    console.log('    - Use @agent-name in Agent mode');
    console.log('');
  }

  if (platforms.includes('windsurf')) {
    console.log('  Windsurf (Cascade):');
    console.log(`    - Rules in .windsurf/rules/`);
    console.log('    - Skills in .windsurf/skills/');
    console.log('    - Workflows in .windsurf/workflows/ (/orchestrate, /code-review)');
    console.log('    - AGENTS.md in project root');
    console.log('');
  }

  if (platforms.includes('copilot')) {
    console.log('  VS Code / Copilot:');
    console.log(`    - Agents in .github/agents/`);
    console.log('    - Ensure .vscode/settings.json has plugin config');
    console.log('    - Use @agent-name in VS Code Copilot Chat');
    console.log('    - Plugin manifest in plugin.json');
    console.log('');
  }

  if (platforms.includes('continue')) {
    console.log('  Continue.dev:');
    console.log(`    - Rules in .continue/rules/`);
    console.log('    - Config in .continue/config.yaml');
    console.log('    - Rules are injected into system prompts (no @name invocation)');
    console.log('    - Edit config.yaml to set API keys and models');
    console.log('    - Use /reload to apply config changes');
    console.log('');
  }

  console.log('  📚 Full documentation: https://github.com/ils15/pantheon');
  console.log('  🐛 Report issues: https://github.com/ils15/pantheon/issues');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const target = args.target;

  // Validate target directory exists
  if (!existsSync(target)) {
    console.error(`❌ Target directory does not exist: ${target}`);
    process.exit(1);
  }

  // Determine which platforms to install
  let platforms = args.platforms;

  if (platforms && platforms.includes('all')) {
    platforms = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot', 'continue'];
  } else if (!platforms) {
    // Auto-detect
    const detected = detectPlatforms(target);
    if (detected.length === 0) {
      console.log(`🔍 No Pantheon platform config detected in ${target}`);
      console.log('   Installing all platforms.\n');
      platforms = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot', 'continue'];
    } else {
      console.log(`🔍 Detected platforms in ${target}: ${detected.join(', ')}\n`);
      platforms = detected;
    }
  }

  // ---------------------------------------------------------------------------
  // Step 0: Sync agents from canonical sources to platform directories
  // ---------------------------------------------------------------------------
  if (!args.dryRun) {
    console.log('🔄 Syncing agents from canonical sources...\n');
    try {
      execSync('npm run sync', { cwd: ROOT, stdio: 'inherit' });
      console.log('');
    } catch (err) {
      console.error('❌ Sync failed — aborting install');
      process.exit(1);
    }
  } else {
    console.log('🔄 Would sync agents from canonical sources (skipped in dry-run)\n');
  }

  console.log(args.dryRun ? '🔍 Dry-run mode — no files will be written\n' : '');
  console.log(`📦 Installing Pantheon agents into: ${target}\n`);

  // Validate that ROOT is the Pantheon repo
  if (!existsSync(join(ROOT, 'AGENTS.md')) || !existsSync(join(ROOT, 'agents', 'zeus.agent.md'))) {
    console.error(`❌ Cannot find Pantheon source files. Is ${ROOT} the Pantheon repository root?`);
    console.error('   Make sure this script is run from the Pantheon repo.');
    process.exit(1);
  }

  // Install each platform
  for (const platform of platforms) {
    switch (platform) {
      case 'opencode':
        console.log(`🔧 OpenCode`);
        installOpenCode(target, args.dryRun, args.clean, args.components || undefined);
        break;
      case 'claude':
        console.log(`🔧 Claude Code`);
        installClaude(target, args.dryRun, args.clean);
        break;
      case 'cursor':
        console.log(`🔧 Cursor`);
        installCursor(target, args.dryRun, args.clean);
        break;
      case 'windsurf':
        console.log(`🔧 Windsurf`);
        installWindsurf(target, args.dryRun, args.clean);
        break;
      case 'copilot':
        console.log(`🔧 VS Code / Copilot`);
        installCopilot(target, args.dryRun, args.clean);
        break;
      case 'continue':
        console.log(`🔧 Continue.dev`);
        installContinue(target, args.dryRun, args.clean);
        break;
      default:
        console.warn(`  ⚠️  Unknown platform: ${platform} — skipping`);
        break;
    }
  }

  printSummary(target, platforms);

  process.exit(0);
}

main();
