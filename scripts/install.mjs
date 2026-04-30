#!/usr/bin/env node

/**
 * install.mjs — Pantheon platform installer
 *
 * Copies generated platform configs into a user's project.
 *
 * Usage:
 *   node scripts/install.mjs list                          # List available platforms
 *   node scripts/install.mjs install vscode                # Copy VS Code agents
 *   node scripts/install.mjs install claude                # Copy to .claude/agents/
 *   node scripts/install.mjs install cursor   ./my-project # Copy to specific dir
 *   node scripts/install.mjs install claude --dry-run      # Preview without copying
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PLATFORMS_DIR = path.join(ROOT, 'platforms');

// Target directories for each platform (relative to user's project root)
const TARGET_MAP = {
  vscode:   'agents',
  opencode: 'opencode/agents',
  claude:   '.claude/agents',
  cursor:   '.cursor/rules',
  windsurf: '.windsurf',
};

function getPlatforms() {
  if (!fs.existsSync(PLATFORMS_DIR)) return [];
  return fs.readdirSync(PLATFORMS_DIR)
    .filter(f => {
      if (f === '_template') return false;
      const adapterPath = path.join(PLATFORMS_DIR, f, 'adapter.json');
      return fs.statSync(path.join(PLATFORMS_DIR, f)).isDirectory() && fs.existsSync(adapterPath);
    })
    .sort();
}

function loadAdapter(platformName) {
  const adapterPath = path.join(PLATFORMS_DIR, platformName, 'adapter.json');
  if (!fs.existsSync(adapterPath)) {
    throw new Error(`Platform '${platformName}' not found. Run 'node scripts/install.mjs list' to see available platforms.`);
  }
  return JSON.parse(fs.readFileSync(adapterPath, 'utf8'));
}

function listPlatforms() {
  const platforms = getPlatforms();
  console.log('🎯 Available Pantheon Platforms:\n');
  for (const p of platforms) {
    const adapter = loadAdapter(p);
    const target = TARGET_MAP[p] || `platforms/${p}/`;
    console.log(`  ${p.padEnd(12)} ${adapter.displayName.padEnd(22)} → ${target}`);
  }
  console.log('');
  console.log('Install a platform:');
  console.log('  node scripts/install.mjs install <platform> [target-dir]');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/install.mjs install claude');
  console.log('  node scripts/install.mjs install cursor  ./my-project');
}

function installPlatform(platformName, targetDir, dryRun = false) {
  const adapter = loadAdapter(platformName);
  const sourceDir = path.join(PLATFORMS_DIR, platformName, adapter.outputDir || 'agents');

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ No generated files found for '${platformName}'. Run 'npm run sync' first.`);
    process.exit(1);
  }

  // Resolve target directory
  const defaultTarget = targetDir || TARGET_MAP[platformName] || platformName;
  const absTarget = path.resolve(process.cwd(), defaultTarget);

  // Get list of files to copy
  const files = fs.readdirSync(sourceDir).filter(f => f.startsWith('.'));

  if (files.length === 0) {
    console.error(`❌ No files to install in ${sourceDir}`);
    process.exit(1);
  }

  console.log(`📦 Pantheon — ${adapter.displayName}`);
  console.log(`   Source: ${sourceDir}`);
  console.log(`   Target: ${absTarget}`);
  console.log(`   Files:  ${files.length} agent configs\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN — no files copied:\n');
    for (const f of files) {
      const srcPath = path.join(sourceDir, f);
      const dstPath = path.join(absTarget, f.replace('.agent.md', '.md'));
      const stats = fs.statSync(srcPath);
      console.log(`   📄 ${dstPath}`);
      console.log(`      ${(stats.size / 1024).toFixed(1)} KB`);
    }
    console.log('\n✅ Dry run complete. Run without --dry-run to install.');
    return;
  }

  // Create target directory
  fs.mkdirSync(absTarget, { recursive: true });

  // Copy files
  let copied = 0;
  for (const f of files) {
    const srcPath = path.join(sourceDir, f);
    const dstName = f.endsWith('.agent.md') ? f.replace('.agent.md', '.md') : f;
    const dstPath = path.join(absTarget, dstName);
    fs.copyFileSync(srcPath, dstPath);
    copied++;
  }

  console.log(`✅ Installed ${copied} files to ${absTarget}`);

  // Platform-specific post-install hints
  const hints = {
    vscode: [
      '📌 VS Code: Reference agents/ in your plugin.json:',
      `   "agents": "./${defaultTarget}"`,
    ],
    opencode: [
      '📌 OpenCode: Link the opencode config:',
      '   ln -s platforms/opencode/opencode.json opencode.json',
    ],
    claude: [
      '📌 Claude Code: Agents appear in @-mentions automatically.',
      '   Configure in .claude/settings.json if needed.',
    ],
    cursor: [
      '📌 Cursor: Use @agent-name in chat to invoke agents.',
      '   Rules are loaded from .cursor/rules/ automatically.',
    ],
  };

  if (hints[platformName]) {
    console.log('');
    for (const line of hints[platformName]) {
      console.log(line);
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'list' || args[0] === '--list') {
    listPlatforms();
    process.exit(0);
  }

  if (args[0] === 'install') {
    const platform = args[1];
    const targetDir = args[2] || null;
    const dryRun = args.includes('--dry-run');

    if (!platform) {
      console.error('Usage: node scripts/install.mjs install <platform> [target-dir] [--dry-run]');
      process.exit(1);
    }

    installPlatform(platform, targetDir, dryRun);
    process.exit(0);
  }

  console.error('Usage:');
  console.error('  node scripts/install.mjs list');
  console.error('  node scripts/install.mjs install <platform> [target-dir] [--dry-run]');
  process.exit(1);
}

main();
