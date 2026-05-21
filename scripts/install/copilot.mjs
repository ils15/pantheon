#!/usr/bin/env node
/**
 * copilot.mjs — VS Code / Copilot platform installer
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { AGENTS_DIR, summary, writeIfChanged } from './shared.mjs';

export function installCopilot(target, dryRun, clean = false) {
  const stats = summary.copilot;

  // -----------------------------------------------------------------------
  // 1. Copy canonical .agent.md files to .github/agents/
  // -----------------------------------------------------------------------
  const agentsDstDir = join(target, '.github', 'agents');
  if (!dryRun) mkdirSync(agentsDstDir, { recursive: true });

  const agentFiles = readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.agent.md'))
    .sort();

  for (const agentFile of agentFiles) {
    const srcFile = join(AGENTS_DIR, agentFile);
    const dstFile = join(agentsDstDir, agentFile);

    if (!existsSync(srcFile)) continue;

    const content = readFileSync(srcFile, 'utf8');
    const existing = existsSync(dstFile) ? readFileSync(dstFile, 'utf8') : null;

    if (existing === content) {
      stats.skipped++;
      continue;
    }

    if (!dryRun) {
      writeFileSync(dstFile, content, 'utf8');
    }
    stats.created++;
  }

  // -----------------------------------------------------------------------
  // 2. Configure .vscode/settings.json
  // -----------------------------------------------------------------------
  const vscodeSettingsPath = join(target, '.vscode', 'settings.json');
  const vscodeDir = join(target, '.vscode');
  if (!dryRun) mkdirSync(vscodeDir, { recursive: true });

  let settings = {};
  if (existsSync(vscodeSettingsPath)) {
    try {
      settings = JSON.parse(readFileSync(vscodeSettingsPath, 'utf8'));
    } catch {
      settings = {};
    }
  }

  // Ensure plugin and subagent settings
  settings['chat.plugins.enabled'] = true;
  settings['chat.subagents.allowInvocationsFromSubagents'] = true;

  const settingsContent = JSON.stringify(settings, null, 2) + '\n';
  const status = writeIfChanged(vscodeSettingsPath, settingsContent, dryRun);
  if (status === 'created') stats.created++;
  else stats.skipped++;
}
