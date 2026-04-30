#!/usr/bin/env node

/**
 * transform.mjs — Transform canonical agents into platform-specific formats
 *
 * Each platform has an adapter.json that declares:
 *   - frontmatter: { include, transform } — which fields to keep and how
 *   - toolMap: canonical tool names → platform tool names
 *   - bodyFilters: patterns to strip from body
 *   - fileNaming: how output files are named
 *   - outputDir: where to write generated files
 */

/**
 * Transform a canonical agent for a target platform.
 * @param {{ name: string, frontmatter: object, body: string }} canonical
 * @param {object} adapter - Platform adapter config
 * @returns {{ name: string, frontmatter: object, body: string }}
 */
export function transformAgent(canonical, adapter) {
  // 1. Apply frontmatter transforms
  let fm = { ...canonical.frontmatter };

  if (adapter.frontmatter?.include) {
    // Keep only whitelisted fields
    fm = Object.fromEntries(
      Object.entries(fm).filter(([key]) =>
        adapter.frontmatter.include.includes(key)
      )
    );
  }

  if (adapter.frontmatter?.exclude) {
    // Remove blacklisted fields
    for (const key of adapter.frontmatter.exclude) {
      delete fm[key];
    }
  }

  if (adapter.frontmatter?.transform) {
    for (const [key, rule] of Object.entries(adapter.frontmatter.transform)) {
      if (fm[key] !== undefined) {
        switch (rule.strategy) {
          case 'comma-separated':
            fm[key] = Array.isArray(fm[key]) ? fm[key].join(', ') : fm[key];
            break;
          case 'omit':
            delete fm[key];
            break;
          case 'identity':
          default:
            break;
        }
      }
    }
  }

  // 2. Map tool names (BEFORE comma-separated transform, so tools is still an array)
  if (adapter.toolMap && fm.tools && Array.isArray(fm.tools)) {
    fm.tools = fm.tools.map(t => adapter.toolMap[t] || t);
  }

  // 3. Apply body filters
  let body = canonical.body;
  if (adapter.bodyFilters) {
    for (const filter of adapter.bodyFilters) {
      switch (filter.action) {
        case 'omit-section':
          body = omitSection(body, filter.pattern);
          break;
        case 'replace':
          body = body.replace(new RegExp(filter.pattern, 'gm'), filter.replacement);
          break;
        case 'prepend':
          body = filter.content + '\n\n' + body;
          break;
        case 'append':
          body = body + '\n\n' + filter.content;
          break;
        default:
          break;
      }
    }
  }

  // 4. Determine output filename
  const ext = adapter.fileExtension || '.md';
  const outputName = adapter.frontmatter?.omitNameSuffix
    ? canonical.name
    : canonical.name.replace('.agent', '');

  return {
    name: `${outputName}${ext}`,
    frontmatter: fm,
    body,
  };
}

/**
 * Remove a section of markdown starting with a heading that matches pattern.
 * E.g., omit-section "### Copilot" removes that heading + its content until next heading.
 */
function omitSection(body, headingPattern) {
  const lines = body.split('\n');
  const result = [];
  let skipping = false;

  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      if (skipping) {
        skipping = false;
        // Don't include this heading either — it's the next section start
      }
      if (line.includes(headingPattern) || new RegExp(headingPattern, 'i').test(line)) {
        skipping = true;
        continue;
      }
    }
    if (!skipping) {
      result.push(line);
    }
  }

  return result.join('\n');
}

import yaml from 'js-yaml';

/**
 * Serialize a transformed agent to a platform file.
 * @param {{ name: string, frontmatter: object, body: string }} agent
 * @returns {string} Complete file content with frontmatter
 */
export function serializeAgent(agent) {
  const fm = agent.frontmatter;

  // Clean up frontmatter — remove empty objects / nulls
  const clean = {};
  for (const [key, value] of Object.entries(fm)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue;
    clean[key] = value;
  }

  const fmYaml = Object.keys(clean).length > 0
    ? '---\n' + yaml.dump(clean, { lineWidth: 200, noCompatMode: true, quotingType: '"', forceQuotes: false }) + '---\n'
    : '';

  return fmYaml + agent.body;
}
