#!/usr/bin/env node

/**
 * canonical.mjs — Parse canonical Pantheon .agent.md files
 *
 * Reads VS Code Copilot .agent.md files and returns structured:
 *   { name, frontmatter (object), body (string) }
 *
 * The canonical format is the VS Code .agent.md spec (richest schema),
 * from which all other platform formats are derived.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/**
 * Parse a single canonical .agent.md file.
 * @param {string} filePath - Absolute path to the .agent.md file
 * @returns {{ name: string, frontmatter: object, body: string }}
 */
export function parseCanonical(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const name = path.basename(filePath, '.agent.md');

  // Extract YAML frontmatter between the first two '---' delimiters
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) {
    throw new Error(`No frontmatter found in ${filePath}`);
  }

  const frontmatter = yaml.load(fmMatch[1]);
  const body = content.slice(fmMatch[0].length);

  return { name, frontmatter, body };
}

/**
 * Parse all canonical agents from a directory.
 * @param {string} agentsDir - Path to the agents/ directory
 * @returns {Array<{ name: string, frontmatter: object, body: string }>}
 */
export function parseAllCanonical(agentsDir) {
  const files = fs.readdirSync(agentsDir)
    .filter(f => f.endsWith('.agent.md'))
    .sort();

  return files.map(f => parseCanonical(path.join(agentsDir, f)));
}

/**
 * Load a platform adapter.json.
 * @param {string} adapterPath - Path to the adapter.json file
 * @returns {object}
 */
export function loadAdapter(adapterPath) {
  const abs = path.resolve(adapterPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Adapter not found: ${abs}`);
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}
