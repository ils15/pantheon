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
import { installCline } from './install/cline.mjs';

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
      platforms = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot', 'continue', 'cline'];
    } else if (!platforms) {
    const detected = detectPlatforms(target);
    if (detected.length === 0) {
      console.log(`🔍 No Pantheon platform config detected in ${target}`);
      console.log('   Installing all platforms.\n');
    platforms = ['opencode', 'claude', 'cursor', 'windsurf', 'copilot', 'continue', 'cline'];
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

  const INSTALLERS = {
    opencode: { label: 'OpenCode', fn: (a) => installOpenCode(target, a.dryRun, a.clean, a.components || undefined) },
    claude: { label: 'Claude Code', fn: (a) => installClaude(target, a.dryRun, a.clean) },
    cursor: { label: 'Cursor', fn: (a) => installCursor(target, a.dryRun, a.clean) },
    windsurf: { label: 'Windsurf', fn: (a) => installWindsurf(target, a.dryRun, a.clean) },
    copilot: { label: 'VS Code / Copilot', fn: (a) => installCopilot(target, a.dryRun, a.clean) },
    continue: { label: 'Continue.dev', fn: (a) => installContinue(target, a.dryRun, a.clean) },
    cline: { label: 'Cline', fn: (a) => installCline(target, a.dryRun, a.clean) },
  };

  for (const platform of platforms) {
    const installer = INSTALLERS[platform];
    if (!installer) {
      console.warn(`  ⚠️  Unknown platform: ${platform} — skipping`);
      continue;
    }
    console.log(`🔧 ${installer.label}`);
    installer.fn(args);
  }

  printSummary(target, platforms);
  process.exit(0);
}

main();
