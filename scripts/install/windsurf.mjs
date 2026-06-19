#!/usr/bin/env node
/**
 * windsurf.mjs — Windsurf (Cascade) platform installer
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { readCanonicalAgents, generateAgentsMd } from './agents-md.mjs';
import { PLATFORM_DIR, summary, sourceDirValid, copyFiles, writeIfChanged } from './shared.mjs';

export function installWindsurf(target, dryRun, clean = false) {
  const stats = summary.windsurf;

  // -----------------------------------------------------------------------
  // 1. Install Cascade rules (replaces old agents/)
  // -----------------------------------------------------------------------
  const srcDir = join(PLATFORM_DIR, 'windsurf', 'rules');
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Rules source directory not found: ${srcDir}`);
    stats.errors++;
  } else {
    const dstDir = join(target, '.windsurf', 'rules');
    if (!dryRun) mkdirSync(dstDir, { recursive: true });

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun, null, clean);
    stats.created += created;
    stats.skipped += skipped;
  }

  // -----------------------------------------------------------------------
  // 2. Create workflows
  // -----------------------------------------------------------------------
  const workflowsDir = join(target, '.windsurf', 'workflows');
  if (!dryRun) mkdirSync(workflowsDir, { recursive: true });

  const orchestrateWorkflow = `# Orchestrate a feature with Pantheon agents

Use this workflow to orchestrate a full feature implementation.

1. Start by understanding the feature requirements
2. Delegate to @zeus for full orchestration, or invoke specific agents:
   - @athena for planning
   - @apollo for codebase research
   - @hermes for backend implementation
   - @aphrodite for frontend implementation
   - @demeter for database changes
    - @themis for code review and security audit
    - @prometheus for infrastructure changes
3. Review results and iterate as needed
4. Run tests to verify: \`npm test\`
`;
  const orchestratePath = join(workflowsDir, 'orchestrate.md');
  const orchStatus = writeIfChanged(orchestratePath, orchestrateWorkflow, dryRun);
  if (orchStatus === 'created') stats.created++;
  else stats.skipped++;

  const reviewWorkflow = `# Code review with Themis

Use this workflow to run a code review and security audit.

1. Examine the recent changes (use \`git diff\` or @apollo)
2. Invoke @themis for security audit and code quality review
3. Apply any fixes identified
4. Verify tests pass
`;
  const reviewPath = join(workflowsDir, 'code-review.md');
  const reviewStatus = writeIfChanged(reviewPath, reviewWorkflow, dryRun);
  if (reviewStatus === 'created') stats.created++;
  else stats.skipped++;

  // -----------------------------------------------------------------------
  // 4. Create/update AGENTS.md
  // -----------------------------------------------------------------------
  const agents = readCanonicalAgents();
  const agentsMdPath = join(target, 'AGENTS.md');
  const extraSections = `## Workflows

- \`/orchestrate\` — Full feature orchestration
- \`/code-review\` — Code review with Themis`;
  const agentsMdContent = generateAgentsMd(agents, 'Windsurf (Cascade)', extraSections);
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun);
  if (agentsStatus === 'created') stats.created++;
  else stats.skipped++;

  // Remove legacy .windsurfrules if it exists
  const legacyRulesPath = join(target, '.windsurfrules');
  if (existsSync(legacyRulesPath) && !dryRun) {
    try { unlinkSync(legacyRulesPath); } catch {}
  }
}
