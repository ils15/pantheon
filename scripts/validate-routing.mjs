#!/usr/bin/env node
/**
 * validate-routing.mjs — Validate routing.yml consistency
 *
 * Checks:
 * - All 18 canonical agents present in routing.yml
 * - All routing.yml agents have canonical files
 * - Skills referenced exist in skills/
 * - Handoffs reference valid agents
 * - Routing matrix references valid agents
 *
 * Usage:
 *   node scripts/validate-routing.mjs
 *   node scripts/validate-routing.mjs --verbose   # show all entries checked
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const VERBOSE = process.argv.includes('--verbose');

let exitCode = 0;
let checks = 0;
let failures = 0;

function check(condition, message) {
  checks++;
  if (!condition) {
    console.error(`  ❌ ${message}`);
    failures++;
    exitCode = 1;
  } else if (VERBOSE) {
    console.log(`  ✅ ${message}`);
  }
}

function warn(message) {
  console.warn(`  ⚠️  ${message}`);
}

// Load routing.yml
const routingPath = join(ROOT, 'routing.yml');
if (!existsSync(routingPath)) {
  console.error('❌ routing.yml not found');
  process.exit(1);
}
const routing = yaml.load(readFileSync(routingPath, 'utf8'));

console.log('🔍 Validating routing.yml...\n');

// A1. Agents in routing.yml must have canonical files
const routingAgents = Object.keys(routing.agents || {});
console.log(`  Agents in routing.yml: ${routingAgents.length}`);

// Get canonical agent files
const agentsDir = join(ROOT, 'agents');
const canonicalFiles = readdirSync(agentsDir)
  .filter(f => f.endsWith('.agent.md'))
  .map(f => f.replace('.agent.md', ''))
  .sort();

console.log(`  Canonical agent files: ${canonicalFiles.length}`);

for (const name of routingAgents) {
  if (name === 'zen' || name === 'zeus_copilot') continue; // legacy aliases, skip
  check(
    canonicalFiles.includes(name),
    `Agent "${name}" in routing.yml has no canonical file`
  );
}

// A2. Canonical files must be in routing.yml
for (const name of canonicalFiles) {
  check(
    routingAgents.includes(name),
    `Canonical agent "${name}" missing from routing.yml`
  );
}

// B. Skill validation
const skillsDir = join(ROOT, 'skills');
const existingSkills = existsSync(skillsDir)
  ? readdirSync(skillsDir).filter(d => {
      const skillDir = join(skillsDir, d);
      try {
        return existsSync(join(skillDir, 'SKILL.md'));
      } catch { return false; }
    })
  : [];

console.log(`\n  Skills in skills/: ${existingSkills.length}`);

for (const [name, info] of Object.entries(routing.agents || {})) {
  const agentSkills = info.skills || [];
  for (const skill of agentSkills) {
    if (!existingSkills.includes(skill)) {
      warn(`Agent "${name}" references skill "${skill}" but skills/${skill}/SKILL.md not found`);
    }
  }
}

// C. Handoff validation
console.log(`\n  Handoff definitions: ${Object.keys(routing.handoffs || {}).length} agents with handoffs`);

for (const [agentName, handoffs] of Object.entries(routing.handoffs || {})) {
  for (const [key, handoff] of Object.entries(handoffs)) {
    // Skip if handoff is just a string (auto-generated)
    if (typeof handoff !== 'object') continue;
    const targetAgent = handoff.agent;
    check(
      routingAgents.includes(targetAgent),
      `Handoff "${agentName}/${key}" references unknown agent "${targetAgent}"`
    );
  }
}

// D. Routing matrix validation
console.log(`\n  Routing matrix entries: ${(routing.routing_matrix || []).length}`);

for (const entry of routing.routing_matrix || []) {
  check(
    routingAgents.includes(entry.primary_agent),
    `Routing matrix "${entry.category}" references unknown primary agent "${entry.primary_agent}"`
  );
  
  for (const parallel of entry.parallel_with || []) {
    check(
      routingAgents.includes(parallel),
      `Routing matrix "${entry.category}" references unknown parallel agent "${parallel}"`
    );
  }
}

// E. Subagent delegation validation
console.log(`\n  Subagent delegation rules:`);

for (const [name, info] of Object.entries(routing.agents || {})) {
  const delegates = info.subagent_can_delegate_to || [];
  for (const target of delegates) {
    check(
      routingAgents.includes(target),
      `Agent "${name}" can delegate to unknown agent "${target}"`
    );
  }
}

// Summary
console.log(`\n${'='.repeat(50)}`);
const status = failures === 0 ? '✅ PASSED' : `❌ FAILED (${failures}/${checks} checks failed)`;
console.log(` ${status}`);
console.log(` ${checks} total checks${VERBOSE ? ', see verbose output above' : ''}`);
if (!VERBOSE && failures > 0) {
  console.log(' Run with --verbose to see all passing checks.');
}
console.log('');

process.exit(exitCode);
