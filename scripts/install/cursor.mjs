#!/usr/bin/env node
/**
 * cursor.mjs — Cursor platform installer
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { readCanonicalAgents, generateAgentsMd } from './agents-md.mjs';
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
  const agents = readCanonicalAgents();
  const agentsMdPath = join(target, 'AGENTS.md');
  const agentsMdContent = generateAgentsMd(agents, 'Cursor');
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;
}
