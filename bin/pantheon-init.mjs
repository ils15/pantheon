#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const AGENTS = [
  'zeus','athena','apollo','hermes','aphrodite','demeter',
  'themis','prometheus','hephaestus','nyx','gaia','iris',
  'mnemosyne','talos'
];

function printUsage() {
  console.log('Pantheon v5.0 — OpenCode-native multi-agent orchestration');
  console.log('');
  console.log('Usage:');
  console.log('  npx pantheon init              # Install agents globally (~/.config/opencode/agents/)');
  console.log('  npx pantheon init --project    # Install agents locally (.opencode/agents/)');
  console.log('  npx pantheon init --dry-run    # Preview without writing');
  console.log('  npx pantheon --help            # Show this help');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--help' || command === '-h' || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (!command || command === 'init') {
    const isProject = args.includes('--project') || args.includes('-p');
    const isDryRun = args.includes('--dry-run');
    await installAgents({ isProject, isDryRun });
  } else {
    printUsage();
    process.exit(1);
  }
}

async function installAgents({ isProject, isDryRun }) {
  const sourceDir = path.resolve(repoRoot, 'src', 'agents');

  // Determine target
  const targetDir = isProject
    ? path.join(process.cwd(), '.opencode', 'agents')
    : path.join(homedir(), '.config', 'opencode', 'agents');

  // Check source agents exist
  for (const agent of AGENTS) {
    const srcFile = path.join(sourceDir, `${agent}.md`);
    if (!fs.existsSync(srcFile)) {
      console.error(`Source agent not found: ${srcFile}`);
      process.exit(1);
    }
  }

  const mode = isProject ? 'project-local' : 'global';
  if (isDryRun) {
    console.log(`[DRY-RUN] Would install ${AGENTS.length} agents to ${targetDir} (${mode})`);
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  let count = 0;
  for (const agent of AGENTS) {
    const src = path.join(sourceDir, `${agent}.md`);
    const dst = path.join(targetDir, `${agent}.md`);

    try {
      fs.copyFileSync(src, dst);
      count++;
    } catch (err) {
      console.error(`Failed to copy ${agent}: ${err.message}`);
    }
  }

  console.log(`Pantheon initialized — ${count} agent files copied to ${targetDir} (${mode})`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
