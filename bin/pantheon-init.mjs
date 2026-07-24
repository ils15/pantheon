#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { homedir, platform } from 'os';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CFG = path.join(homedir(), '.config', 'opencode');

function printUsage() {
  console.log('Pantheon Orchestrator — Multi-agent orchestration platform');
  console.log('');
  console.log('Usage:');
  console.log('  npx pantheon-orchestrator init           # Install everything globally');
  console.log('  npx pantheon-orchestrator init --project # Install in project (.opencode/)');
  console.log('  npx pantheon-orchestrator init --dry-run # Preview without writing');
  console.log('  npx pantheon-orchestrator init --no-mcp  # Skip MCP + venv (agents only)');
  console.log('  npx pantheon-orchestrator --help         # Show this help');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (args.includes('--help')) { printUsage(); process.exit(0); }

  if (command === 'init' || !command) {
    const isProject = args.includes('--project');
    const isDryRun = args.includes('--dry-run');
    const skipMCP = args.includes('--no-mcp');
    const base = isProject
      ? path.join(process.cwd(), '.opencode')
      : CFG;

    console.log(`Pantheon Orchestrator — ${isDryRun ? 'DRY RUN' : 'Installing...'}`);
    console.log(`Target: ${base}${isProject ? ' (project-local)' : ' (global)'}`);
    console.log('');

    // 1. Agents (14 files)
    console.log('  Agents:');
    let count = 0;
    for (const agent of FILES.agents.list) {
      const s = path.join(ROOT, 'src', 'agents', `${agent}.md`);
      const d = path.join(base, 'agents', `${agent}.md`);
      if (fs.existsSync(s)) {
        if (!isDryRun) {
          fs.mkdirSync(path.join(base, 'agents'), { recursive: true });
          fs.copyFileSync(s, d);
        }
        count++;
      }
    }
    console.log(`    ${count} agent files → ${isDryRun ? '(preview)' : `${base}/agents/`}`);

    // 2. Skills (14 directories)
    console.log('  Skills:');
    const skillsSrc = path.resolve(ROOT, 'src', 'skills');
    if (fs.existsSync(skillsSrc)) {
      const skills = fs.readdirSync(skillsSrc).filter(f => fs.statSync(path.join(skillsSrc, f)).isDirectory());
      if (!isDryRun) {
        for (const skill of skills) {
          const s = path.join(skillsSrc, skill);
          const d = path.join(base, 'skills', skill);
          fs.cpSync(s, d, { recursive: true, force: true });
        }
      }
      console.log(`    ${skills.length} skills → ${isDryRun ? '(preview)' : `${base}/skills/`}`);
    }

    // 3. Instructions
    console.log('  Instructions:');
    const instrSrc = path.resolve(ROOT, 'src', 'instructions');
    if (fs.existsSync(instrSrc)) {
      const instrs = fs.readdirSync(instrSrc).filter(f => f.endsWith('.instructions.md'));
      if (!isDryRun) {
        fs.mkdirSync(path.join(base, 'instructions'), { recursive: true });
        for (const f of instrs) {
          fs.copyFileSync(path.join(instrSrc, f), path.join(base, 'instructions', f));
        }
      }
      console.log(`    ${instrs.length} files → ${isDryRun ? '(preview)' : `${base}/instructions/`}`);
    }

    // 4. Commands
    console.log('  Commands:');
    const cmdSrc = path.resolve(ROOT, 'commands');
    if (fs.existsSync(cmdSrc)) {
      const cmds = fs.readdirSync(cmdSrc).filter(f => f.endsWith('.md'));
      if (!isDryRun) {
        fs.mkdirSync(path.join(base, 'commands'), { recursive: true });
        for (const f of cmds) {
          fs.copyFileSync(path.join(cmdSrc, f), path.join(base, 'commands', f));
        }
      }
      console.log(`    ${cmds.length} commands → ${isDryRun ? '(preview)' : `${base}/commands/`}`);
    }

    // 5. TUI plugin
    console.log('  TUI Plugin:');
    const tuiSrc = path.resolve(ROOT, 'src', 'plugins', 'tui');
    if (fs.existsSync(tuiSrc)) {
      if (!isDryRun) {
        fs.cpSync(tuiSrc, path.join(base, 'plugins', 'pantheon-tui'), { recursive: true, force: true });
        // Update tui.json
        const tuiJson = path.join(base, 'tui.json');
        const tuiConfig = { $schema: 'https://opencode.ai/tui.json', plugin: ['plugins/pantheon-tui'] };
        fs.writeFileSync(tuiJson, JSON.stringify(tuiConfig, null, 2));
      }
      console.log(`    Plugin → ${isDryRun ? '(preview)' : `${base}/plugins/pantheon-tui/`}`);
      console.log(`    tui.json → ${isDryRun ? '(preview)' : `${base}/tui.json`}`);
    }

    // 6. AGENTS.md
    const agentsMd = path.resolve(ROOT, 'AGENTS.md');
    if (fs.existsSync(agentsMd) && !isDryRun) {
      fs.copyFileSync(agentsMd, path.join(base, 'AGENTS.md'));
    }

    // 7. .venv + MCP servers
    if (!skipMCP && !isDryRun) {
      console.log('');
      console.log('  MCP Servers + .venv...');
      const installScript = path.resolve(ROOT, 'scripts', 'install.mjs');
      if (fs.existsSync(installScript)) {
        try {
          execSync(`node "${installScript}" "${base}"`, { stdio: 'inherit', cwd: ROOT });
        } catch (e) {
          console.log('  ⚠️  MCP install warning (non-fatal):', e.message.split('\n')[0]);
        }
      }
    }

    // 8. Background subagents hint
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ Pantheon Orchestrator installed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('  Next steps:');
    console.log('  1. Enable background subagents:');
    console.log('     echo \'export OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true\' >> ~/.zshrc');
    console.log('  2. Launch OpenCode:');
    console.log('     source ~/.zshrc && opencode');
    console.log('  3. Test background delegation:');
    console.log('     @zeus, dispatch 2 apollo in parallel to research');
    console.log('');
    return;
  }

  printUsage();
  process.exit(1);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
