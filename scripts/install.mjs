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
  'zeus', 'athena', 'apollo',
  'hermes', 'aphrodite', 'maat', 'ra', 'hefesto', 'quiron', 'eco', 'nix',
  'gaia',
  'iris',
  'temis',
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
  node scripts/install.mjs --help                              show this help

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
    dryRun: false,
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
      case '--dry-run':
        args.dryRun = true;
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
 */
function copyFiles(srcDir, dstDir, dryRun, renameMap = null) {
  const entries = readdirSync(srcDir);
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const srcFile = join(srcDir, entry);
    const dstName = renameMap ? (renameMap(entry) ?? entry) : entry;
    const dstFile = join(dstDir, dstName);

    if (!existsSync(srcFile)) continue;

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
 * @param {string[]} skills - list of skill names
 * @param {string} target - target project root
 * @param {boolean} dryRun - dry-run mode
 * @param {string} subDir - subdirectory for skills (e.g. '.opencode', '.claude', '.cursor')
 */
function installSkills(skills, target, dryRun, subDir = '.opencode') {
  const srcSkillsDir = join(ROOT, 'skills');
  const dstSkillsDir = join(target, subDir, 'skills');

  let created = 0;
  let skipped = 0;

  for (const skill of skills) {
    const src = join(srcSkillsDir, skill);
    const dst = join(dstSkillsDir, skill);

    // Recursively copy skill directory
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
 * Install OpenCode platform.
 * - Runs sync to generate agents from canonical sources
 * - Copies platform/opencode/agents/ → .opencode/agents/
 * - Copies skills/ → .opencode/skills/
 * - Creates/updates opencode.json with skill permissions (strips per-agent model configs)
 */
function installOpenCode(target, dryRun) {
  const label = 'OpenCode';
  const stats = summary.opencode;

  // -----------------------------------------------------------------------
  // 1. Install agents
  // -----------------------------------------------------------------------
  const srcDir = join(PLATFORM_DIR, 'opencode', 'agents');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Agent source directory not found: ${srcDir}`);
    stats.errors++;
  } else {
    const dstDir = join(target, '.opencode', 'agents');
    if (!dryRun) mkdirSync(dstDir, { recursive: true });

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Install skills
  // -----------------------------------------------------------------------
  const skillNames = collectSkillNames();
  if (skillNames.length > 0) {
    console.log(`  📚 Installing ${skillNames.length} skills...`);
    const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun, '.opencode');
    stats.created += sCreated;
    stats.skipped += sSkipped;
  }

  // -----------------------------------------------------------------------
  // 3. Create/update opencode.json
  //    IMPORTANT: Strips per-agent model configs — models vary by user plan
  //    and hardcoded models cause "not valid" errors. Model suggestions
  //    belong in documentation (see platform/plans/), not in config.
  // -----------------------------------------------------------------------
  const opencodeConfigPath = join(ROOT, 'opencode.json');
  const targetConfigPath = join(target, 'opencode.json');

  let config = {};
  if (existsSync(opencodeConfigPath)) {
    try {
      config = JSON.parse(readFileSync(opencodeConfigPath, 'utf8'));
    } catch {
      config = {};
    }
  }

  // Strip ALL model configurations — users configure models via their plan
  // Models vary by user plan and hardcoded models cause "not valid" errors.
  // Remove root model/small_model defaults AND per-agent overrides.
  delete config.model;
  delete config.small_model;

  if (config.agent) {
    for (const [agentName, agentConfig] of Object.entries(config.agent)) {
      if (agentConfig && typeof agentConfig === 'object') {
        delete agentConfig.model;
        delete agentConfig.small_model;
        // Remove empty agent entries (no source, no model, no permission)
        if (Object.keys(agentConfig).length === 0) {
          delete config.agent[agentName];
        }
      }
    }
    // Remove agent section entirely if empty
    if (Object.keys(config.agent).length === 0) {
      delete config.agent;
    }
  }

  // Add skill permissions
  if (!config.permission) config.permission = {};
  // Always set skill permission when skills are installed
  if (skillNames.length > 0) {
    config.permission.skill = { '*': 'allow' };
  }

  // Add instructions to load Pantheon rules (AGENTS.md + instructions/)
  if (!config.instructions) {
    config.instructions = ['AGENTS.md', 'instructions/*.instructions.md'];
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
 */
function installClaude(target, dryRun) {
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

  const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
  stats.created += created;
  stats.skipped += skipped;

  // Install skills to .claude/skills/
  const skillNames = collectSkillNames();
  if (skillNames.length > 0) {
    console.log(`  📚 Installing ${skillNames.length} skills...`);
    const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun, '.claude');
    stats.created += sCreated;
    stats.skipped += sSkipped;
  }

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
| @maat | Database | Schema design, migrations, query optimization |
| @temis | Quality & security | Code review, OWASP audit, coverage check |
| @ra | Infrastructure | Docker, CI/CD, deployment |
| @hefesto | AI pipelines | RAG, LangChain, vector search |
| @quiron | Model routing | Provider configuration, cost optimization |
| @eco | Conversational AI | NLU, dialogue flows, chatbots |
| @nix | Observability | Monitoring, tracing, cost tracking |
| @gaia | Remote sensing | LULC analysis, satellite imagery |
| @iris | GitHub operations | Branches, PRs, issues, releases |
| @mnemosyne | Documentation | Memory bank, ADRs, progress logging |
| @talos | Hotfixes | Rapid bug fixes, CSS corrections |

## Workflow

Plan → Implement → Review → Commit (each phase requires approval)
See .claude/agents/ for full agent definitions.
Skills are in .claude/skills/.
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

16 specialized agents coordinated by Zeus (orchestrator).
See .claude/agents/ for definitions and CLAUDE.md for agent descriptions.
`;
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;
}

/**
 * Install Cursor platform.
 * - Copies platform/cursor/rules/ → .cursor/rules/
 * - Copies skills/ → .cursor/skills/
 * - Creates AGENTS.md for global rules
 */
function installCursor(target, dryRun) {
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

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Install skills
  // -----------------------------------------------------------------------
  const skillNames = collectSkillNames();
  if (skillNames.length > 0) {
    console.log(`  📚 Installing ${skillNames.length} skills...`);
    const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun, '.cursor');
    stats.created += sCreated;
    stats.skipped += sSkipped;
  }

  // -----------------------------------------------------------------------
  // 3. Create/sync AGENTS.md
  // -----------------------------------------------------------------------
  const agentsMdPath = join(target, 'AGENTS.md');
  const agentsMdContent = `# Pantheon Agent System

This project uses the Pantheon multi-agent framework with 16 specialized agents.

## Available Agents

| Agent | Role | Invocation |
|-------|------|------------|
| @zeus | Central orchestrator | Coordinates all agents |
| @athena | Strategic planner | Creates TDD-driven plans |
| @apollo | Codebase discovery | Parallel research |
| @hermes | Backend (FastAPI) | API implementation |
| @aphrodite | Frontend (React) | UI components |
| @maat | Database | Schema & optimization |
| @temis | Quality & security | Code review |
| @ra | Infrastructure | Docker & deployment |
| @hefesto | AI pipelines | RAG & LangChain |
| @quiron | Model routing | Provider hub |
| @eco | Conversational AI | NLU & dialogue |
| @nix | Observability | Tracing & monitoring |
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
 * - Copies skills/ → .windsurf/skills/
 * - Creates workflows/ → .windsurf/workflows/
 * - Creates AGENTS.md with project rules
 */
function installWindsurf(target, dryRun) {
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

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Install skills
  // -----------------------------------------------------------------------
  const skillNames = collectSkillNames();
  if (skillNames.length > 0) {
    console.log(`  📚 Installing ${skillNames.length} skills...`);
    const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun, '.windsurf');
    stats.created += sCreated;
    stats.skipped += sSkipped;
  }

  // -----------------------------------------------------------------------
  // 3. Create workflows
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
   - @maat for database changes
   - @temis for code review and security audit
   - @ra for infrastructure changes
3. Review results and iterate as needed
4. Run tests to verify: \`npm test\`
`;
  const orchestratePath = join(workflowsDir, 'orchestrate.md');
  const orchStatus = writeIfChanged(orchestratePath, orchestrateWorkflow, dryRun);
  if (orchStatus === 'created') stats.created++;
  else stats.skipped++;

  const reviewWorkflow = `# Code review with Temis

Use this workflow to run a code review and security audit.

1. Examine the recent changes (use \`git diff\` or @apollo)
2. Invoke @temis for security audit and code quality review
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

This project uses the Pantheon multi-agent framework with 16 specialized agents.

## Available Agents

| Agent | Role | How to invoke |
|-------|------|---------------|
| @zeus | Central orchestrator | Full feature orchestration |
| @athena | Strategic planner | Architecture & planning |
| @apollo | Codebase discovery | Research & exploration |
| @hermes | Backend (FastAPI) | API implementation |
| @aphrodite | Frontend (React) | UI components |
| @maat | Database | Schema & optimization |
| @temis | Quality & security | Code review |
| @ra | Infrastructure | Docker & deployment |
| @hefesto | AI pipelines | RAG & LangChain |
| @quiron | Model routing | Provider configuration |
| @eco | Conversational AI | NLU & dialogue |
| @nix | Observability | Monitoring & tracing |
| @gaia | Remote sensing | LULC analysis |
| @iris | GitHub operations | PRs & releases |
| @mnemosyne | Documentation | Memory bank |
| @talos | Hotfixes | Rapid repairs |

## Workflows

- \`/orchestrate\` — Full feature orchestration
- \`/code-review\` — Code review with Temis

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
function installContinue(target, dryRun) {
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

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
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
 * - Copies skills/ to .github/skills/
 * - Configures .vscode/settings.json for plugin + subagents
 */
function installCopilot(target, dryRun) {
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
  // 2. Install skills to .github/skills/
  // -----------------------------------------------------------------------
  const skillNames = collectSkillNames();
  if (skillNames.length > 0) {
    console.log(`  📚 Installing ${skillNames.length} skills...`);
    // For VS Code, skills need the .github/skills/ directory with SKILL.md
    // Also reference them in plugin.json
    const skillsDir = join(target, '.github', 'skills');
    if (!dryRun) mkdirSync(skillsDir, { recursive: true });
    // Copy skills using existing installSkills function
    const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun, '.github');
    stats.created += sCreated;
    stats.skipped += sSkipped;
  }

  // -----------------------------------------------------------------------
  // 3. Configure .vscode/settings.json
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

  // Add skill tool references if skills exist
  if (skillNames.length > 0) {
    settings['github.copilot.chat.skills'] = skillNames;
  }

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
        installOpenCode(target, args.dryRun);
        break;
      case 'claude':
        console.log(`🔧 Claude Code`);
        installClaude(target, args.dryRun);
        break;
      case 'cursor':
        console.log(`🔧 Cursor`);
        installCursor(target, args.dryRun);
        break;
      case 'windsurf':
        console.log(`🔧 Windsurf`);
        installWindsurf(target, args.dryRun);
        break;
      case 'copilot':
        console.log(`🔧 VS Code / Copilot`);
        installCopilot(target, args.dryRun);
        break;
      case 'continue':
        console.log(`🔧 Continue.dev`);
        installContinue(target, args.dryRun);
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
