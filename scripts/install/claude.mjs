#!/usr/bin/env node
/**
 * claude.mjs — Claude Code platform installer
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { readCanonicalAgents, generateAgentsMd, generateAgentsTable } from './agents-md.mjs';
import { PLATFORM_DIR, summary, sourceDirValid, copyFiles, writeIfChanged } from './shared.mjs';

export function installClaude(target, dryRun, clean = false) {
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

  // Read canonical agents
  const agents = readCanonicalAgents();
  const agentTable = generateAgentsTable(agents);

  // Create CLAUDE.md bridge with rich instructions
  const claudeMdPath = join(target, 'CLAUDE.md');
  const claudeMdContent = `# Pantheon Agent System

This project uses the Pantheon multi-agent framework for AI-assisted development.

## Instructions

Always check AGENTS.md for shared project conventions and architecture decisions.

## Available Agents

${agentTable}

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
  const agentsMdContent = generateAgentsMd(agents, 'Claude');
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;
}
