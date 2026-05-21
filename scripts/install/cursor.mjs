#!/usr/bin/env node
/**
 * cursor.mjs — Cursor platform installer
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PLATFORM_DIR, summary, sourceDirValid, copyFiles, writeIfChanged } from './shared.mjs';

export function installCursor(target, dryRun, clean = false) {
  const stats = summary.cursor;

  // -----------------------------------------------------------------------
  // 1. Install .mdc rules
  // -----------------------------------------------------------------------
  const srcDir = join(PLATFORM_DIR, 'cursor', 'rules');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    stats.errors++;
  } else {
    const dstDir = join(target, '.cursor', 'rules');
    if (!dryRun) mkdirSync(dstDir, { recursive: true });

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun, null, clean);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Create/sync AGENTS.md
  // -----------------------------------------------------------------------
  const agentsMdPath = join(target, 'AGENTS.md');
  const agentsMdContent = `# Pantheon Agent System

This project uses the Pantheon multi-agent framework with 18 specialized agents.

## Available Agents

| Agent | Role | Invocation |
|-------|------|------------|
| @zeus | Central orchestrator | Coordinates all agents |
| @athena | Strategic planner | Creates TDD-driven plans |
| @apollo | Codebase discovery | Parallel research |
| @hermes | Backend (FastAPI) | API implementation |
| @aphrodite | Frontend (React) | UI components |
| @demeter | Database | Schema & optimization |
| @themis | Quality & security | Code review |
| @prometheus | Infrastructure | Docker & deployment |
| @hephaestus | AI pipelines | RAG & LangChain |
| @chiron | Model routing | Provider hub |
| @echo | Conversational AI | NLU & dialogue |
| @nyx | Observability | Tracing & monitoring |
| @gaia | Remote sensing | LULC analysis |
| @iris | GitHub operations | PRs & releases |
| @mnemosyne | Documentation | Memory bank |
| @talos | Hotfixes | Rapid repairs |

## Commands

- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`

## Conventions

- TDD: Write failing test first, then implement
- Coverage minimum: 80%
- Async/await on all I/O
- Type hints on all functions
`;
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;
}
