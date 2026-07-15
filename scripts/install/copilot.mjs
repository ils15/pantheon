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

/**
 * Generate or update `.vscode/mcp.json` from tier-based MCP configuration.
 *
 * Reads `vscode` config blocks from each MCP entry in the expanded tier and
 * produces a VS Code-compatible `.vscode/mcp.json` file. Merges with any
 * existing file (user-added servers are preserved).
 *
 * VS Code format (root key is `"servers"`, NOT `"mcpServers"`):
 *   {
 *     "inputs": [ { "type": "promptString", "id": "...", "description": "..." } ],
 *     "servers": {
 *       "filesystem": {
 *         "type": "stdio",
 *         "command": "npx",
 *         "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
 *       }
 *     }
 *   }
 *
 * @param {Map<string, {key: string, mcp: any, sourceTier: string}>} mcpEntries - Expanded tier entries
 * @param {string} target - Project root directory (where .vscode/ lives)
 * @param {boolean} dryRun - If true, preview without writing
 * @returns {{ generated: boolean, path: string, servers: number, reason?: string }}
 */
export function generateVscodeMcpConfig(mcpEntries, target, dryRun = false) {
  const vscodeDir = join(target, '.vscode');
  if (!dryRun) mkdirSync(vscodeDir, { recursive: true });

  /** @type {Array<{type: string, id: string, description: string, password?: boolean}>} */
  const allInputs = [];
  /** @type {Record<string, any>} */
  const allServers = {};
  let hasConfig = false;

  // Collect vscode config blocks from all tier MCPs
  for (const [, entry] of mcpEntries) {
    const mcp = entry.mcp;
    if (!mcp.vscode || !mcp.vscode.servers) continue;
    hasConfig = true;

    // Merge inputs (deduplicate by id)
    if (Array.isArray(mcp.vscode.inputs)) {
      for (const input of mcp.vscode.inputs) {
        if (input.id && !allInputs.some((i) => i.id === input.id)) {
          allInputs.push(input);
        }
      }
    }

    // Merge servers
    Object.assign(allServers, mcp.vscode.servers);
  }

  if (!hasConfig || Object.keys(allServers).length === 0) {
    return { generated: false, path: join(vscodeDir, 'mcp.json'), servers: 0, reason: 'No VS Code MCP configs in this tier' };
  }

  // Build the new config block
  const config = {};
  if (allInputs.length > 0) config.inputs = allInputs;
  config.servers = { ...allServers };

  // Merge with existing .vscode/mcp.json (user-added servers take priority)
  const mcpJsonPath = join(vscodeDir, 'mcp.json');
  let existing = {};
  if (existsSync(mcpJsonPath)) {
    try {
      existing = JSON.parse(readFileSync(mcpJsonPath, 'utf8'));
    } catch {
      // Corrupt or empty — start fresh
      existing = {};
    }
  }

  // Merge servers: tier servers first, then overlay any user-added servers not in tier
  const mergedServers = { ...config.servers };
  if (existing.servers) {
    for (const [key, server] of Object.entries(existing.servers)) {
      if (!mergedServers[key]) {
        mergedServers[key] = server;
      }
    }
  }

  const merged = { servers: mergedServers };

  // Merge inputs: existing inputs keep their position, new ones appended
  if (existing.inputs || config.inputs) {
    const existingInputs = (existing.inputs || []);
    const newInputs = (config.inputs || []);
    const mergedInputs = [...existingInputs];
    for (const input of newInputs) {
      if (!mergedInputs.some((i) => i.id === input.id)) {
        mergedInputs.push(input);
      }
    }
    if (mergedInputs.length > 0) merged.inputs = mergedInputs;
  }

  const content = JSON.stringify(merged, null, 2) + '\n';

  if (!dryRun) {
    writeFileSync(mcpJsonPath, content, 'utf8');
  }

  return {
    generated: true,
    path: mcpJsonPath,
    servers: Object.keys(allServers).length,
  };
}
