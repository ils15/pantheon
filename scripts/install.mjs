#!/usr/bin/env node
/**
 * install.mjs — Multi-platform Pantheon agent installer
 *
 * Thin coordinator that imports platform-specific installers.
 * See scripts/install/ for platform modules.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { ROOT, showHelp, parseArgs, resolveTarget, detectPlatforms, printSummary, summary } from './install/shared.mjs';
import { installOpenCode } from './install/opencode.mjs';
import { installClaude } from './install/claude.mjs';
import { installCursor } from './install/cursor.mjs';
import { installWindsurf } from './install/windsurf.mjs';
import { installContinue } from './install/continue.mjs';
import { installCopilot } from './install/copilot.mjs';

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const target = args.target;

  if (!existsSync(target)) {
    console.error(`❌ Target directory does not exist: ${target}`);
    process.exit(1);
  }

  let platforms = args.platforms;

  if (platforms && platforms.includes('all')) {
    platforms = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot', 'continue'];
  } else if (!platforms) {
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

  // Step 0: Sync agents from canonical sources
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

  if (!existsSync(join(ROOT, 'AGENTS.md')) || !existsSync(join(ROOT, 'agents', 'zeus.agent.md'))) {
    console.error(`❌ Cannot find Pantheon source files. Is ${ROOT} the Pantheon repository root?`);
    process.exit(1);
  }

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
