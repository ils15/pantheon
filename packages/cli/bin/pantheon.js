#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const REPO = 'https://github.com/ils15/pantheon';

const cmd = process.argv[2];
const args = process.argv.slice(3);

function detectPlatform() {
  const env = process.env;
  if (env.OPENCODE) return 'opencode';
  if (env.CURSOR) return 'cursor';
  if (env.CLINE_ALLOWED_TOOLS) return 'cline';
  if (env.VSCODE_CWD || env.TERM_PROGRAM === 'vscode') return 'vscode';
  return 'unknown';
}

function printHelp() {
  console.log(`
  Pantheon CLI v${PKG.version} — Multi-agent orchestration

  USAGE
    npx pantheon init        Setup Pantheon for this project
    npx pantheon update      Update to latest version
    npx pantheon doctor      Validate installation
    npx pantheon status      Show version and platform info
    npx pantheon scan        Run Themis heuristic scan
    npx pantheon verify      Run hash-anchored edit verification
`);
}

async function cmdInit() {
  const platform = detectPlatform();
  console.log(`🔍 Detected platform: ${platform}`);
  console.log(`📦 Pantheon v${PKG.version}`);
  console.log(`\nTo install Pantheon, clone the repo:\n  git clone ${REPO}.git\n  cd pantheon\n  npm run sync\n`);
  console.log(`Or visit: ${REPO}`);
}

function cmdDoctor() {
  const checks = [];
  checks.push({ name: 'Node.js', pass: process.version >= 'v18.' });
  checks.push({ name: 'Git', pass: !!execSync('git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim() });
  const hasOpencode = !!process.env.OPENCODE;
  checks.push({ name: 'OpenCode detected', pass: hasOpencode });
  
  console.log(`🏥 Pantheon Doctor v${PKG.version}\n`);
  for (const c of checks) {
    console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
  }
}

function cmdStatus() {
  console.log(`📊 Pantheon v${PKG.version}`);
  console.log(`  Platform: ${detectPlatform()}`);
  console.log(`  Agents: 14 (zeus, athena, apollo, hermes, aphrodite, demeter, themis, prometheus, hephaestus, nyx, gaia, iris, mnemosyne, talos)`);
  console.log(`  Skills: 44`);
  console.log(`  Commands: 14 (/pantheon-*)`);
  console.log(`  Platforms: 7 (opencode, vscode, cursor, windsurf, cline, claude, continue)`);
}

function cmdScan() {
  const script = resolve(__dirname, '../../../scripts/themis_heuristic_scan.py');
  if (!existsSync(script)) { console.log('⚠️  Script not found. Run from repo root.'); return; }
  execSync(`python3 "${script}" ${args.join(' ')}`, { stdio: 'inherit' });
}

function cmdVerify() {
  const script = resolve(__dirname, '../../../scripts/hash_verify.py');
  if (!existsSync(script)) { console.log('⚠️  Script not found. Run from repo root.'); return; }
  execSync(`python3 "${script}" ${args.join(' ')}`, { stdio: 'inherit' });
}

const commands = {
  init: cmdInit, update: () => execSync('git pull && npm run sync', { stdio: 'inherit', cwd: resolve(__dirname, '../..') }),
  doctor: cmdDoctor, status: cmdStatus, scan: cmdScan, verify: cmdVerify,
  help: printHelp, '--help': printHelp, '-h': printHelp,
};

if (commands[cmd]) commands[cmd]();
else { printHelp(); process.exit(1); }
