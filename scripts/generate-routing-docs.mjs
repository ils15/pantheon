#!/usr/bin/env node
/**
 * generate-routing-docs.mjs — Generate routing docs from routing.yml
 *
 * Reads the canonical routing.yml and outputs markdown documentation
 * to stdout. Pipe to a file to save: node generate-routing-docs.mjs > ROUTING.md
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const routingPath = join(ROOT, 'routing.yml')
if (!existsSync(routingPath)) {
  console.error('❌ routing.yml not found')
  process.exit(1)
}
const routing = yaml.load(readFileSync(routingPath, 'utf8'))

const agents = routing.agents || {}
const matrix = routing.routing_matrix || []
const handoffs = routing.handoffs || {}

let doc = ''

// Title
doc += `# Pantheon Routing Reference\n\n`
doc += `Auto-generated from \`routing.yml\` (v${routing.version || '?'})\n\n`
doc += `${Object.keys(agents).length} agents · ${matrix.length} routing rules · ${Object.keys(handoffs).length} agent handoff groups\n\n`

// Agent Registry
doc += `---\n\n## Agent Registry\n\n`
doc += `All ${Object.keys(agents).length} Pantheon agents with roles, model tiers, and capabilities.\n\n`
doc += `| Agent | Role | Model Tier | User-Invocable | Delegates To | Skills |\n`
doc += `|-------|------|-----------|----------------|-------------|--------|\n`

for (const [name, info] of Object.entries(agents)) {
  const role = info.role || '—'
  const tier = info.model_tier || '—'
  const invocable = info.user_invocable ? '✅ Yes' : '❌ No'
  const delegates = (info.subagent_can_delegate_to || []).join(', ') || '—'
  const agentSkills = (info.skills || []).map((s) => `\`${s}\``).join(', ') || '—'
  doc += `| **@${name}** | ${role} | ${tier} | ${invocable} | ${delegates} | ${agentSkills} |\n`
}

// Routing Matrix
doc += `\n---\n\n## Routing Matrix\n\n`
doc += `Task category → primary agent mapping. Use this to decide which agent to invoke.\n\n`
doc += `| Category | Primary Agent | Model Tier | Can Run Parallel With |\n`
doc += `|----------|--------------|-----------|----------------------|\n`

for (const entry of matrix) {
  const primary = `@${entry.primary_agent}`
  const tier = entry.model_tier || '—'
  const parallel = entry.parallel_with ? entry.parallel_with.map((a) => `@${a}`).join(', ') : '—'
  doc += `| ${entry.category} | ${primary} | ${tier} | ${parallel} |\n`
}

// Handoff Reference
doc += `\n---\n\n## Handoff Reference\n\n`
doc += `Structured delegation contracts between agents.\n\n`

for (const [agentName, agentHandoffs] of Object.entries(handoffs)) {
  doc += `### @${agentName}\n\n`
  doc += `| Handoff | Target Agent | Model Tier | Description |\n`
  doc += `|---------|-------------|-----------|-------------|\n`

  for (const [key, handoff] of Object.entries(agentHandoffs)) {
    if (typeof handoff !== 'object') continue
    const target = `@${handoff.agent}`
    const tier = handoff.model_tier || '—'
    const desc = handoff.description || handoff.prompt?.substring(0, 80) || '—'
    doc += `| **${key}** | ${target} | ${tier} | ${desc} |\n`
  }
  doc += `\n`
}

// Deployment platforms
doc += `---\n\n## Deployment Platforms\n\n`
doc += `Supported platforms and their configuration details.\n\n`
doc += `| Platform | Directory | Format | Handoff Strategy |\n`
doc += `|----------|-----------|--------|-----------------|\n`

const PLATFORM_INFO = {
  opencode: { dir: '.opencode/agents/', format: '.md with YAML', handoff: 'native (YAML)' },
  claude: { dir: '.claude/agents/', format: '.md with YAML', handoff: 'embed (body)' },
  cursor: { dir: '.cursor/rules/', format: '.mdc rule files', handoff: 'embed (body)' },
  windsurf: { dir: '.windsurf/rules/', format: '.md rule files', handoff: 'embed (body)' },
  cline: { dir: '.clinerules/', format: 'plain text', handoff: 'embed (body)' },
  copilot: { dir: '.github/agents/', format: '.agent.md with YAML', handoff: 'native (YAML)' },
  continue: { dir: '.continue/rules/', format: '.md rules', handoff: 'embed (body)' },
}

for (const [platform, info] of Object.entries(PLATFORM_INFO)) {
  doc += `| **${platform}** | ${info.dir} | ${info.format} | ${info.handoff} |\n`
}

doc += `\n---\n\n*Generated on ${new Date().toISOString().split('T')[0]} from \`routing.yml\`*\n`

console.log(doc)
