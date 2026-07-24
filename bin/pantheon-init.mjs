#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const AGENTS = [
  'zeus','athena','apollo','hermes','aphrodite','demeter',
  'themis','prometheus','hephaestus','nyx','gaia','iris',
  'mnemosyne','talos'
];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    await initProject();
  } else {
    console.log('Pantheon v5.0 — Multi-agent orchestration platform');
    console.log('Usage: npx pantheon init   # Initialize local project symlinks');
  }
}

async function initProject() {
  const targetDir = path.join(process.cwd(), '.opencode', 'agents');
  const sourceDir = path.resolve(repoRoot, 'src', 'agents');

  // Check if source agents exist
  for (const agent of AGENTS) {
    const srcFile = path.join(sourceDir, `${agent}.md`);
    if (!fs.existsSync(srcFile)) {
      console.error(`❌ Source agent not found: ${srcFile}`);
      process.exit(1);
    }
  }

  // Create target directory
  fs.mkdirSync(targetDir, { recursive: true });

  // Create symlinks
  let count = 0;
  for (const agent of AGENTS) {
    const src = path.join(sourceDir, `${agent}.md`);
    const dst = path.join(targetDir, `${agent}.md`);

    try {
      // Remove existing if any
      if (fs.existsSync(dst)) {
        fs.unlinkSync(dst);
      }
      // Create relative symlink
      const relative = path.relative(path.dirname(dst), src);
      fs.symlinkSync(relative, dst);
      count++;
    } catch (err) {
      console.error(`⚠️  Failed to link ${agent}: ${err.message}`);
    }
  }

  console.log(`✅ Pantheon initialized — ${count} agent symlinks created in .opencode/agents/`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
