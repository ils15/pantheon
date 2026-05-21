#!/usr/bin/env node
/**
 * claude.mjs — Claude Code platform installer
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
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
| @demeter | Database | Schema design, migrations, query optimization |
| @themis | Quality & security | Code review, OWASP audit, coverage check |
| @prometheus | Infrastructure | Docker, CI/CD, deployment |
| @hephaestus | AI pipelines | RAG, LangChain, vector search |
| @chiron | Model routing | Provider configuration, cost optimization |
| @echo | Conversational AI | NLU, dialogue flows, chatbots |
| @nyx | Observability | Monitoring, tracing, cost tracking |
| @gaia | Remote sensing | LULC analysis, satellite imagery |
| @iris | GitHub operations | Branches, PRs, issues, releases |
| @mnemosyne | Documentation | Memory bank, ADRs, progress logging |
| @talos | Hotfixes | Rapid bug fixes, CSS corrections |

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

18 specialized agents coordinated by Zeus (orchestrator).
See .claude/agents/ for definitions and CLAUDE.md for agent descriptions.
`;
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;
}
