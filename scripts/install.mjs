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

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'fs';
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
 * Install skills to target project's .opencode/skills/ directory.
 */
function installSkills(skills, target, dryRun) {
  const srcSkillsDir = join(ROOT, 'skills');
  const dstSkillsDir = join(target, '.opencode', 'skills');

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
    const { created: sCreated, skipped: sSkipped } = installSkills(skillNames, target, dryRun);
    stats.created += sCreated;
    stats.skipped += sSkipped;
  } else {
    console.log('  ℹ️  No skills found to install');
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

  // Strip per-agent model overrides — users configure models via their plan
  if (config.agent) {
    for (const [agentName, agentConfig] of Object.entries(config.agent)) {
      if (agentConfig && typeof agentConfig === 'object') {
        delete agentConfig.model;
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

  // Create .claude/settings.json
  const settingsPath = join(target, '.claude', 'settings.json');
  const settings = {
    permissions: {
      allow: ['Bash(npm test *)', 'Bash(git *)'],
    },
  };
  const settingsContent = JSON.stringify(settings, null, 2) + '\n';
  const settingsStatus = writeIfChanged(settingsPath, settingsContent, dryRun);
  if (settingsStatus === 'created') stats.created++;
  else stats.skipped++;

  // Create CLAUDE.md bridge file
  const claudeMdPath = join(target, 'CLAUDE.md');
  const claudeMdContent = `# Pantheon Agent System

This project uses the Pantheon multi-agent framework.

## Instructions
Always read AGENTS.md for shared project conventions, architecture decisions, and coding standards.

## Agents
Custom agents are configured in \`.claude/agents/\`. Use @agent-name to invoke them.
`;
  const claudeMdStatus = writeIfChanged(claudeMdPath, claudeMdContent, dryRun);
  if (claudeMdStatus === 'created') stats.created++;
  else stats.skipped++;

  // Create AGENTS.md if it doesn't exist
  const agentsMdPath = join(target, 'AGENTS.md');
  if (!existsSync(agentsMdPath)) {
    const agentsMdContent = `# Agent System

This project uses the Pantheon multi-agent framework for AI-assisted development.

## Architecture

The system includes 16 specialized agents:
- **Zeus** — Central orchestrator
- **Athena** — Strategic planner
- **Apollo** — Codebase discovery & research
- **Hermes** — Backend implementation (FastAPI)
- **Aphrodite** — Frontend implementation (React)
- **Maat** — Database design & optimization
- **Temis** — Code review & quality assurance
- **Ra** — Infrastructure & deployment
- **Hefesto** — AI pipelines & RAG
- **Quíron** — Model provider routing
- **Eco** — Conversational AI
- **Nix** — Observability & monitoring
- **Gaia** — Remote sensing domain expert
- **Iris** — GitHub operations
- **Mnemosyne** — Documentation & memory
- **Talos** — Hotfixes & rapid repairs

## Invocation

Use @agent-name to invoke any agent in supported editors.

## Learn More

See \`.claude/agents/\` for agent definitions.
`;
    const agentsMdStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
    if (agentsMdStatus === 'created') stats.created++;
    else stats.skipped++;
  } else {
    stats.skipped++;
  }
}

/**
 * Install Cursor platform.
 * - Copies platform/cursor/rules/ → .cursor/rules/
 * - Notes: .mdc files may need description format adaptation
 */
function installCursor(target, dryRun) {
  const stats = summary.cursor;

  // Source: platform/cursor/rules/
  const srcDir = join(PLATFORM_DIR, 'cursor', 'rules');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    stats.errors++;
    return;
  }

  // Target: .cursor/rules/
  const dstDir = join(target, '.cursor', 'rules');
  if (!dryRun) mkdirSync(dstDir, { recursive: true });

  const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
  stats.created += created;
  stats.skipped += skipped;
}

/**
 * Install Windsurf platform.
 * - Copies platform/windsurf/agents/ → .windsurf/agents/
 * - Creates .windsurfrules convenience reference
 */
function installWindsurf(target, dryRun) {
  const stats = summary.windsurf;

  // Source: platform/windsurf/agents/
  const srcDir = join(PLATFORM_DIR, 'windsurf', 'agents');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    stats.errors++;
    return;
  }

  // Target: .windsurf/agents/
  const dstDir = join(target, '.windsurf', 'agents');
  if (!dryRun) mkdirSync(dstDir, { recursive: true });

  const { created, skipped } = copyFiles(srcDir, dstDir, dryRun);
  stats.created += created;
  stats.skipped += skipped;

  // Create .windsurfrules convenience reference
  const rulesPath = join(target, '.windsurfrules');
  const rulesContent = `# Pantheon Agent System — Windsurf (Cascade) Configuration

This project uses the Pantheon multi-agent framework.

## Getting Started

Custom agents are configured in \`.windsurf/agents/\`. Cascade will automatically
discover and make these agents available for invocation.

## Available Agents

${AGENT_NAMES.map(name => `- **${name.charAt(0).toUpperCase() + name.slice(1)}**`).join('\n')}

## Commands

Use @agent-name to invoke any agent in Cascade chat.

For full documentation, see AGENTS.md in the project root.
`;
  const rulesStatus = writeIfChanged(rulesPath, rulesContent, dryRun);
  if (rulesStatus === 'created') stats.created++;
  else stats.skipped++;
}

/**
 * Install VS Code / Copilot platform.
 * - Creates symlinks or copies agents to .github/agents/
 * - Checks .vscode/settings.json for plugin configuration
 */
function installCopilot(target, dryRun) {
  const stats = summary.copilot;

  // Create .github/agents/ directory
  const dstDir = join(target, '.github', 'agents');
  if (!dryRun) mkdirSync(dstDir, { recursive: true });

  // Copy canonical .agent.md files to .github/agents/
  const agentFiles = readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.agent.md'))
    .sort();

  for (const agentFile of agentFiles) {
    const srcFile = join(AGENTS_DIR, agentFile);
    const dstFile = join(dstDir, agentFile);

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

  // Check .vscode/settings.json for plugin config
  const vscodeSettingsPath = join(target, '.vscode', 'settings.json');
  if (!existsSync(vscodeSettingsPath)) {
    if (!dryRun) {
      mkdirSync(join(target, '.vscode'), { recursive: true });
    }
    const settings = {
      'chat.plugins.enabled': true,
      'chat.subagents.allowInvocationsFromSubagents': true,
    };
    const settingsContent = JSON.stringify(settings, null, 2) + '\n';
    const status = writeIfChanged(vscodeSettingsPath, settingsContent, dryRun);
    if (status === 'created') stats.created++;
    else stats.skipped++;
  } else {
    // Check if plugin config exists; warn if not
    try {
      const existingSettings = JSON.parse(readFileSync(vscodeSettingsPath, 'utf8'));
      if (!existingSettings['chat.plugins.enabled']) {
        console.log('  💡 Tip: Add "chat.plugins.enabled": true to .vscode/settings.json');
      }
      if (!existingSettings['chat.subagents.allowInvocationsFromSubagents']) {
        console.log('  💡 Tip: Add "chat.subagents.allowInvocationsFromSubagents": true to .vscode/settings.json');
      }
    } catch {
      console.log('  ⚠️  .vscode/settings.json exists but is not valid JSON');
    }
    stats.skipped++;
  }
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
    console.log('    - Agents are in .claude/agents/');
    console.log('    - Settings in .claude/settings.json');
    console.log('');
  }

  if (platforms.includes('cursor')) {
    console.log('  Cursor:');
    console.log(`    - Rules are in .cursor/rules/`);
    console.log('    - Use @agent-name in Cursor Composer');
    console.log('');
  }

  if (platforms.includes('windsurf')) {
    console.log('  Windsurf:');
    console.log(`    - Agents are in .windsurf/agents/`);
    console.log('    - Cascade auto-discovers agents');
    console.log('');
  }

  if (platforms.includes('copilot')) {
    console.log('  VS Code / Copilot:');
    console.log(`    - Agents are in .github/agents/`);
    console.log('    - Ensure .vscode/settings.json has plugin config');
    console.log('    - Use @agent-name in VS Code Copilot Chat');
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
    platforms = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot'];
  } else if (!platforms) {
    // Auto-detect
    const detected = detectPlatforms(target);
    if (detected.length === 0) {
      console.log(`🔍 No Pantheon platform config detected in ${target}`);
      console.log('   Installing all platforms.\n');
      platforms = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot'];
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
      default:
        console.warn(`  ⚠️  Unknown platform: ${platform} — skipping`);
        break;
    }
  }

  printSummary(target, platforms);

  process.exit(0);
}

main();
