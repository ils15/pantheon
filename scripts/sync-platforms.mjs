#!/usr/bin/env node
/**
 * sync-platforms.mjs
 *
 * Generates platform-specific agent files from canonical agents/*.agent.md
 * using each platform's adapter.json configuration.
 *
 * Usage:
 *   node scripts/sync-platforms.mjs              # sync all platforms
 *   node scripts/sync-platforms.mjs opencode     # sync one platform
 *   node scripts/sync-platforms.mjs --dry-run    # print diff without writing
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { parseFrontmatter, serializeFm } from './install/shared.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AGENTS_DIR = join(ROOT, 'agents');
const PLATFORM_DIR = join(ROOT, 'platform');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const TARGET_PLATFORM = args.find(a => !a.startsWith('--'));

// ---------------------------------------------------------------------------
// YAML helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tool mapping / deduplication
// ---------------------------------------------------------------------------

/**
 * Map tool names through a toolMap.
 * - If toolMap is empty: return tools unchanged.
 * - If toolMap is non-empty: only include tools present as keys, mapped to values.
 * - Deduplicates by canonical+mapped pair so distinct tools mapping to the same
 *   platform tool are preserved (e.g. execute/runInTerminal:bash and
 *   execute/testFailure:bash remain separate entries).
 */
function mapTools(tools, toolMap) {
  if (!tools || !Array.isArray(tools)) return tools;
  if (!toolMap || Object.keys(toolMap).length === 0) return [...tools];

  const seen = new Set();
  const result = [];
  for (const tool of tools) {
    if (tool in toolMap) {
      const mapped = toolMap[tool];
      // Track by canonical name to preserve semantic distinction
      // even when multiple tools map to the same platform tool
      const key = `${tool}:${mapped}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(mapped);
      }
    }
    // tools NOT in a non-empty toolMap are dropped (platform-unsupported)
  }
  return result;
}

// ---------------------------------------------------------------------------
// Capability taxonomy
// ---------------------------------------------------------------------------

/**
 * Canonical capability taxonomy.
 * Maps each known canonical tool to { class, portability }.
 * portability: 'portable' | 'mappable' | 'local-only' | 'optional-accelerator'
 *
 * portable            → works on all platforms natively (no mapping needed)
 * mappable            → works when adapter provides an explicit mapping
 * optional-accelerator → enhances UX but not required; OK to silently exclude
 * local-only          → VS Code IDE feature; must be excluded on non-VS Code platforms
 */
const CAPABILITY_TAXONOMY = {
  // core-discovery
  'search/codebase':           { class: 'core-discovery',   portability: 'portable' },
  'search/usages':             { class: 'core-discovery',   portability: 'portable' },
  'search/fileSearch':         { class: 'exact-search',     portability: 'portable' },
  'search/textSearch':         { class: 'exact-search',     portability: 'portable' },
  'search/listDirectory':      { class: 'exact-search',     portability: 'portable' },
  'search/changes':            { class: 'core-discovery',   portability: 'mappable' },
  // file-io
  'read/readFile':             { class: 'file-io',          portability: 'portable' },
  'edit/editFiles':            { class: 'file-io',          portability: 'portable' },
  // execution
  'execute/runInTerminal':     { class: 'execution',        portability: 'portable' },
  'execute/testFailure':       { class: 'execution',        portability: 'portable' },
  'execute/getTerminalOutput': { class: 'execution',        portability: 'portable' },
  'execute/createAndRunTask':  { class: 'execution',        portability: 'local-only' },
  // diagnostics
  'read/problems':             { class: 'diagnostics',      portability: 'optional-accelerator' },
  // orchestration
  'agent':                     { class: 'orchestration',    portability: 'mappable' },
  // approval
  'vscode/askQuestions':       { class: 'approval',         portability: 'mappable' },
  // ide-local
  'vscode/runCommand':         { class: 'ide-local',        portability: 'local-only' },
  // browser-ui
  'browser/openBrowserPage':   { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/navigatePage':      { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/readPage':          { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/clickElement':      { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/typeInPage':        { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/hoverElement':      { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/dragElement':       { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/handleDialog':      { class: 'browser-ui',       portability: 'optional-accelerator' },
  'browser/screenshotPage':    { class: 'browser-ui',       portability: 'optional-accelerator' },
  // external-service
  'web/fetch':                 { class: 'external-service', portability: 'portable' },
};

/**
 * Parse routing.yml and extract routing data for zeus injection.
 * Returns { agents: {}, routing_matrix: [] } or null on failure.
 */
function loadRoutingYml() {
  const routingPath = join(ROOT, 'routing.yml');
  try {
    if (!existsSync(routingPath)) return null;
    const content = readFileSync(routingPath, 'utf8');
    return yaml.load(content);
  } catch (err) {
    console.warn(`  ⚠️  Could not load routing.yml: ${err.message}`);
    return null;
  }
}

/**
 * Generate a markdown routing reference table from routing.yml data.
 * Only used for zeus agent injection.
 */
function generateRoutingTable(routingData) {
  if (!routingData) return '';
  
  const agents = routingData.agents || {};
  const matrix = routingData.routing_matrix || [];
  
  let table = '## 🗺️ Task Routing Reference\n\n';
  table += 'This routing table is auto-generated from `routing.yml` — the canonical routing source.\n\n';
  
  table += '### Routing Matrix\n\n';
  table += '| Task Category | Primary Agent | Model Tier | Parallel Agents |\n';
  table += '|--------------|--------------|-----------|----------------|\n';
  
  for (const rule of matrix) {
    const primary = rule.primary_agent || '—';
    const tier = rule.model_tier || '—';
    const parallel = rule.parallel_with ? rule.parallel_with.join(', ') : '—';
    table += `| ${rule.category} | @${primary} | ${tier} | ${parallel} |\n`;
  }
  
  table += '\n### Agent Quick Reference\n\n';
  table += '| Agent | Role | Model Tier | Direct Invocable |\n';
  table += '|-------|------|-----------|-----------------|\n';
  
  for (const [name, info] of Object.entries(agents)) {
    if (name === 'zeus') continue;  // skip self-reference
    const role = info.role || '—';
    const tier = info.model_tier || '—';
    const invocable = info.user_invocable ? '✅' : '❌';
    // Truncate long role descriptions
    const shortRole = role.length > 70 ? role.substring(0, 67) + '...' : role;
    table += `| @${name} | ${shortRole} | ${tier} | ${invocable} |\n`;
  }
  
  table += '\n*See `routing.yml` for full delegation rules and handoff definitions.*\n';
  
  return table;
}

/**
 * Collect the set of all unique tool names across all canonical agent files.
 */
function collectCanonicalTools(agentFiles) {
  const tools = new Set();
  for (const f of agentFiles) {
    const raw = readFileSync(f, 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed || !Array.isArray(parsed.fm.tools)) continue;
    for (const t of parsed.fm.tools) tools.add(t);
  }
  return tools;
}

/**
 * Validate that every canonical tool is classified by this adapter.
 * Rules:
 *  - Passthrough adapters (empty toolMap): no gap analysis needed.
 *  - Non-passthrough adapters: every portable/mappable tool must be either
 *    present in toolMap or in excludeTools. Silently excluded tools produce warnings.
 * Returns the number of coverage gaps found.
 */
function validateAdapterCoverage(platformName, adapter, canonicalTools) {
  const toolMap = adapter.toolMap ?? {};
  const excludeTools = new Set(adapter.excludeTools ?? []);
  const passthrough = Object.keys(toolMap).length === 0;
  if (passthrough) return 0;

  let gaps = 0;
  for (const tool of canonicalTools) {
    if (excludeTools.has(tool)) continue;  // explicitly excluded ✓
    if (tool in toolMap) continue;         // mapped ✓
    const entry = CAPABILITY_TAXONOMY[tool];
    const portability = entry?.portability ?? 'unknown';
    // local-only and optional-accelerator gaps are intentional — skip
    if (portability === 'local-only' || portability === 'optional-accelerator') continue;
    console.warn(`  ⚠️  [${platformName}] tool not mapped or excluded: "${tool}" (${portability})`);
    gaps++;
  }
  return gaps;
}

/**
 * Warn when a generated body references tool identifiers that were excluded
 * for this platform. Helps surface documentation that needs platform-specific pruning.
 */
function validateBodyForExcludedTools(body, agentName, platformName, excludeTools) {
  if (!excludeTools || excludeTools.length === 0) return;
  for (const tool of excludeTools) {
    if (tool.length < 10) continue;  // skip short identifiers (too noisy)
    if (body.includes(tool)) {
      console.warn(`  ⚠️  [${platformName}/${agentName}] body mentions excluded tool: "${tool}"`);
    }
  }
}

/**
 * Transform canonical #tool: references in body text to platform-mapped names.
 * - If tool is in excludeTools: strikethrough the reference
 * - If tool is in toolMap: replace with mapped name
 * - Otherwise: leave unchanged
 */
function transformBodyToolReferences(body, toolMap, excludeTools) {
  const excluded = new Set(excludeTools ?? []);
  return body.replace(/`#tool:(\S+)`/g, (match, toolName) => {
    if (excluded.has(toolName)) return `~~${match}~~`;
    if (toolName in toolMap) return match.replace(toolName, toolMap[toolName]);
    return match;
  });
}

function applyPlatformAgentOverrides(platformName, agentName, fm, body) {
  let nextFm = fm;
  let nextBody = body;

  if (platformName === 'opencode' && agentName === 'athena' && typeof nextFm.description === 'string') {
    nextFm = {
      ...nextFm,
      description: nextFm.description.replace('the user should call @agora.', 'the user should run /pantheon.'),
    };
  }

  if (platformName === 'opencode' && agentName === 'agora') {
    nextBody = nextBody.replace(
      /### 3\. Dispatch to Specialists \(PARALLEL\)[\s\S]*?Wait for ALL dispatched agents to respond before proceeding\./,
      `### 3. Dispatch to Specialists (PARALLEL — CRITICAL)

You MUST send ALL \`task()\` calls in a **SINGLE message**. Never dispatch one at a time.

Dispatch the question to 2-4 specialist agents in parallel. For each agent:
- Provide the full question and relevant context
- Ask for their perspective: recommendation, reasoning, trade-offs, risks, confidence
- Request a concise response (2-4 sentences)

**Dispatch pattern (all in one message with named params):**
\`\`\`
task(
  description="Evaluate [topic] for [project]",
  prompt="Question: [full question]. Return: Recommendation, Reasoning, Trade-offs, Risks, Confidence",
  subagent_type="hermes"
)
task(
  description="Evaluate [topic] for [project]",
  prompt="Question: [full question]. Return: Recommendation, Reasoning, Trade-offs, Risks, Confidence",
  subagent_type="demeter"
)
task(
  description="Evaluate [topic] for [project]",
  prompt="Question: [full question]. Return: Recommendation, Reasoning, Trade-offs, Risks, Confidence",
  subagent_type="athena"
)
\`\`\`

**❌ Wrong (positional args — never do this):**
\`\`\`
task("hermes", "Question: ...") → wait → task("demeter", ...) → wait → ...
\`\`\`

Each specialist must return a structured response with:
- **Recommendation:** their answer
- **Reasoning:** why they recommend it
- **Trade-offs:** what's sacrificed
- **Risks:** what could go wrong
- **Confidence:** High / Medium / Low

\`task()\` blocks until the specialist returns — sending all in one message runs them in parallel automatically.`
    );
  }

  return { fm: nextFm, body: nextBody };
}

/**
 * Deploy skill files referenced by canonical agents to the platform output directory.
 * Reads skills from skills/<skill-name>/SKILL.md and copies to <platform>/<skillsOutputDir>/<skill-name>/SKILL.md
 */
function deploySkills(platformName, adapter, agentFiles, outDir) {
  if (!adapter.deploySkills) return 0;
  const skillsDir = adapter.skillsOutputDir;
  if (!skillsDir) return 0;

  const skillsRoot = join(ROOT, 'skills');
  const targetDir = join(PLATFORM_DIR, platformName, skillsDir);

  // Collect all unique skills referenced by agents
  const skills = new Set();
  for (const f of agentFiles) {
    const raw = readFileSync(f, 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed || !Array.isArray(parsed.fm.skills)) continue;
    for (const s of parsed.fm.skills) skills.add(s);
  }

  if (skills.size === 0) return 0;

  let deployed = 0;
  for (const skill of skills) {
    const srcFile = join(skillsRoot, skill, 'SKILL.md');
    if (!existsSync(srcFile)) {
      console.warn(`  ⚠️  [${platformName}] skill not found: ${skill}`);
      continue;
    }
    const destDir = join(targetDir, skill);
    if (!DRY_RUN) mkdirSync(destDir, { recursive: true });
    const destFile = join(destDir, 'SKILL.md');
    const existing = existsSync(destFile) ? readFileSync(destFile, 'utf8') : null;
    const content = readFileSync(srcFile, 'utf8');
    if (existing === content) continue;
    if (!DRY_RUN) writeFileSync(destFile, content, 'utf8');
    console.log(`  📦 ${skill}/SKILL.md → ${skillsDir}/${skill}/`);
    deployed++;
  }
  return deployed;
}

/**
 * Deploy command .md files from commands/ to the platform's commands output directory.
 * Copies all .instructions.md files from instructions/ to
 * <platform>/<instructionsOutputDir>/.
 * The instructions/ directory is the canonical source; this function
 * propagates copies to platform-specific locations (e.g. .github/instructions/).
 */
function deployInstructions(platformName, adapter) {
  if (!adapter.deployInstructions) return 0;
  const instructionsDir = adapter.instructionsOutputDir;
  if (!instructionsDir) return 0;

  const srcDir = join(ROOT, 'instructions');
  // instructionsOutputDir may be relative to platform/<name>/ or absolute-ish
  // Support paths starting with '../../' (relative to platform/<name>/)
  const targetDir = instructionsDir.startsWith('../../')
    ? join(ROOT, instructionsDir.replace(/^\.\.\/\.\.\//, ''))
    : join(PLATFORM_DIR, platformName, instructionsDir);

  if (!existsSync(srcDir)) return 0;

  const srcFiles = readdirSync(srcDir).filter(f => f.endsWith('.instructions.md'));
  if (srcFiles.length === 0) return 0;

  if (!DRY_RUN) mkdirSync(targetDir, { recursive: true });

  let deployed = 0;
  for (const file of srcFiles) {
    const srcFile = join(srcDir, file);
    const destFile = join(targetDir, file);
    const existing = existsSync(destFile) ? readFileSync(destFile, 'utf8') : null;
    const content = readFileSync(srcFile, 'utf8');
    if (existing === content) continue;
    if (!DRY_RUN) writeFileSync(destFile, content, 'utf8');
    console.log(`  📋 ${file} → ${instructionsDir}/`);
    deployed++;
  }
  return deployed;
}

/**
 * Copies all .md files from commands/ to <platform>/<commandsOutputDir>/.
 * Unlike skills, commands are not referenced by agent frontmatter — they are
 * deployed wholesale as standalone prompt files.
 */
function deployCommands(platformName, adapter) {
  if (!adapter.deployCommands) return 0;
  const commandsDir = adapter.commandsOutputDir;
  if (!commandsDir) return 0;

  const srcDir = join(ROOT, 'commands');
  const targetDir = join(PLATFORM_DIR, platformName, commandsDir);

  if (!existsSync(srcDir)) return 0;

  const srcFiles = readdirSync(srcDir).filter(f => f.endsWith('.md'));
  if (srcFiles.length === 0) return 0;

  if (!DRY_RUN) mkdirSync(targetDir, { recursive: true });

  const excludeFields = Array.isArray(adapter.commandsFrontmatterExclude)
    ? new Set(adapter.commandsFrontmatterExclude)
    : null;

  let deployed = 0;
  for (const file of srcFiles) {
    const srcFile = join(srcDir, file);
    const destFile = join(targetDir, file);
    const existing = existsSync(destFile) ? readFileSync(destFile, 'utf8') : null;
    let content = readFileSync(srcFile, 'utf8');

    if (excludeFields && excludeFields.size > 0) {
      // Strip excluded fields from YAML frontmatter
      content = content.replace(/^---\n([\s\S]*?)\n---/, (_, fm) => {
        const stripped = fm
          .split('\n')
          .filter(line => {
            const key = line.match(/^([\w-]+):/)?.[1];
            return !key || !excludeFields.has(key);
          })
          .join('\n');
        return `---\n${stripped}\n---`;
      });
    }

    if (existing === content) continue;
    if (!DRY_RUN) writeFileSync(destFile, content, 'utf8');
    console.log(`  📄 ${file} → ${commandsDir}/`);
    deployed++;
  }
  return deployed;
}

/**
 * Validate that every #tool: reference in the body corresponds to a tool
 * that will actually be available to the agent on this platform.
 * Warns on mismatches (does not fail).
 */
function validateBodyToolReferences(body, agentName, platformName, finalTools, toolMap, excludeTools) {
  const excluded = new Set(excludeTools ?? []);
  const availableTools = new Set(finalTools ?? []);
  const mappedTools = new Set(Object.values(toolMap ?? {}));

  const toolRefs = body.match(/`#tool:(\S+)`/g) ?? [];
  let warnings = 0;

  for (const ref of toolRefs) {
    const match = ref.match(/`#tool:(\S+)`/);
    if (!match) continue;
    const toolName = match[1];

    // Skip if it's a mapped tool that exists on the platform
    if (mappedTools.has(toolName)) continue;

    // Skip if it's excluded (already strikethrough'd by transformer)
    if (excluded.has(toolName)) continue;

    // Check if the canonical tool name is in the final tools list
    if (availableTools.has(toolName)) continue;

    // Check if it's a browser/VS Code tool that's universally excluded
    if (toolName.startsWith('browser/') || toolName.startsWith('vscode/')) continue;

    console.warn(`  ⚠️  [${platformName}/${agentName}] body references tool not available: "${toolName}"`);
    warnings++;
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Frontmatter transform
// ---------------------------------------------------------------------------

/**
 * Build the output frontmatter object according to the adapter rules.
 */
function transformFrontmatter(fm, adapter) {
  const {
    include = [],
    exclude = [],
    transform = {},
  } = adapter.frontmatter;
  const toolMap = adapter.toolMap ?? {};

  const result = {};

  for (const key of include) {
    if (exclude.includes(key)) continue;
    if (!(key in fm)) continue;

    const strategy = transform[key]?.strategy ?? 'identity';
    if (strategy === 'omit') continue;

    let value = fm[key];

    // Apply tool mapping
    if (key === 'tools' && Array.isArray(value)) {
      // OpenCode: ensure `agent` tool is present BEFORE mapping
      // (mapTools converts agent→task, so check must happen first)
      if (adapter.ensureAgentTool && !value.includes('agent')) {
        value = ['agent', ...value];
      }

      // Drop platform-unsupported tools before mapping
      if (adapter.excludeTools && adapter.excludeTools.length > 0) {
        const excluded = new Set(adapter.excludeTools);
        value = value.filter(t => !excluded.has(t));
      }
      value = mapTools(value, toolMap);

      // Drop empty tools arrays
      if (value.length === 0) continue;

      // Convert tools array to permission object (for opencode.json config)
      if (adapter.toolsFormat === 'permission') {
        const perm = {};
        for (const tool of value) {
          perm[tool] = 'allow';
        }
        result.permission = perm;
        continue;  // replaces 'tools' key with 'permission'
      }

      // Convert tools array to object with booleans (Markdown agent format)
      // OpenCode agent .md files use tools: { name: true/false }
      if (adapter.toolsFormat === 'object') {
        const obj = {};
        for (const tool of value) {
          obj[tool] = true;
        }
        value = obj;
      }
    }

    // Apply agent mode override if configured
    if (key === 'mode' && adapter.agentModeOverrides && fm.name && adapter.agentModeOverrides[fm.name]) {
      value = adapter.agentModeOverrides[fm.name];
    }

    // Comma-separated serialization (e.g. Claude Code tools field)
    if (strategy === 'comma-separated' && Array.isArray(value)) {
      if (value.length === 0) continue;
      value = value.join(', ');
    }

    result[key] = value;
  }

  // Add static fields defined in adapter frontmatter config
  // (e.g. alwaysApply, globs, trigger for platforms that need them)
  if (adapter.frontmatter.addFields) {
    for (const [key, value] of Object.entries(adapter.frontmatter.addFields)) {
      if (!(key in result)) {
        result[key] = JSON.parse(JSON.stringify(value));
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Body transforms
// ---------------------------------------------------------------------------

/**
 * Remove a markdown section (heading + its content) from body text.
 * Matches headings whose trimmed text starts with `pattern`.
 * Stops at the next heading of equal or higher level (or EOF).
 */
function omitSection(text, pattern) {
  const lines = text.split('\n');
  const result = [];
  let inSection = false;
  let sectionDepth = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    // Track fenced code blocks (```)
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch && !inCodeBlock) {
      const depth = headingMatch[1].length;
      const title = headingMatch[2].trim();
      if (title.includes(pattern)) {
        inSection = true;
        sectionDepth = depth;
        continue;
      } else if (inSection && depth <= sectionDepth) {
        inSection = false;
      }
    }
    if (!inSection) result.push(line);
  }

  return result.join('\n');
}

/**
 * Apply all body filters from adapter.bodyFilters.
 */
function applyBodyFilters(body, filters, agentName = '') {
  if (!filters || filters.length === 0) return body;

  let result = body;
  const prepends = [];
  const appends = [];

  for (const filter of filters) {
    switch (filter.action) {
      case 'omit-section':
        result = omitSection(result, filter.pattern);
        break;
      case 'prepend':
        prepends.push(filter.content);
        break;
      case 'append':
        appends.push(filter.content);
        break;
      case 'inject-routing':
        if (agentName === 'zeus') {
          const routingData = loadRoutingYml();
          const routingContent = generateRoutingTable(routingData);
          if (routingContent) {
            appends.push(routingContent);
          }
        }
        break;
    }
  }

  if (prepends.length > 0) result = prepends.join('\n\n') + '\n\n' + result;
  if (appends.length > 0) result = result.trimEnd() + '\n\n' + appends.join('\n\n') + '\n';

  return result;
}

// ---------------------------------------------------------------------------
// File assembly
// ---------------------------------------------------------------------------

function buildOutputFile(fm, body, skipFrontmatter = false) {
  if (skipFrontmatter) return body;
  const fmStr = serializeFm(fm);
  // Ensure body starts with a single newline after the closing ---
  const normalizedBody = body.startsWith('\n') ? body : '\n' + body;
  return `---\n${fmStr}---\n${normalizedBody}`;
}

// ---------------------------------------------------------------------------
// Sync one platform
// ---------------------------------------------------------------------------

function syncPlatform(platformName, adapter, agentFiles) {
  const outDir = join(PLATFORM_DIR, platformName, adapter.outputDir);
  if (!DRY_RUN) mkdirSync(outDir, { recursive: true });

  const ext = adapter.fileExtension ?? '.md';
  const toolMap = adapter.toolMap ?? {};
  let written = 0;
  let unchanged = 0;

  // skipAgentSync: platform reads agents from canonical source directly (e.g. VS Code Copilot via plugin.json)
  if (adapter.skipAgentSync) {
    console.log(`  ℹ️  Agent sync skipped (skipAgentSync: true — platform reads agents natively)`);
  } else {
  for (const agentFile of agentFiles) {
    const content = readFileSync(agentFile, 'utf8');
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      console.warn(`  ⚠️  ${basename(agentFile)}: no frontmatter — skipping`);
      continue;
    }

    const { fm, body } = parsed;
    const name = fm.name ?? basename(agentFile).replace('.agent.md', '');

    const newFm = transformFrontmatter(fm, adapter);
    const newBody = applyBodyFilters(body, adapter.bodyFilters, name);
    const transformedBody = transformBodyToolReferences(newBody, toolMap, adapter.excludeTools);
    const overridden = applyPlatformAgentOverrides(platformName, name, newFm, transformedBody);
    const finalFm = overridden.fm;
    const finalBody = overridden.body;
    // Validate body tool references against final tool set
    const finalTools = Array.isArray(finalFm.tools) ? finalFm.tools : (finalFm.permission ? Object.keys(finalFm.permission) : []);
    validateBodyToolReferences(finalBody, name, platformName, finalTools, toolMap, adapter.excludeTools);
    validateBodyForExcludedTools(finalBody, name, platformName, adapter.excludeTools);
    const skipFrontmatter = adapter.frontmatter?.skipFrontmatter ?? false;
    const output = buildOutputFile(finalFm, finalBody, skipFrontmatter);

    const outFile = join(outDir, `${name}${ext}`);
    const existing = existsSync(outFile) ? readFileSync(outFile, 'utf8') : null;

    if (existing === output) {
      unchanged++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ~ ${name}${ext} (would update)`);
    } else {
      writeFileSync(outFile, output, 'utf8');
      console.log(`  ✏️  ${name}${ext}`);
    }
    written++;
  }

  if (unchanged > 0 && written === 0) {
    console.log(`  ✅ all ${unchanged} files already up-to-date`);
  } else if (unchanged > 0) {
    console.log(`  ℹ️  ${unchanged} files unchanged`);
  }
  } // end of skipAgentSync else-block

  // Deploy skill files if configured
  const skillsDeployed = deploySkills(platformName, adapter, agentFiles, outDir);
  if (skillsDeployed > 0) {
    console.log(`  📦 ${skillsDeployed} skills deployed to ${adapter.skillsOutputDir}`);
  }

  // Deploy command files if configured
  const commandsDeployed = deployCommands(platformName, adapter);
  if (commandsDeployed > 0) {
    console.log(`  📄 ${commandsDeployed} commands deployed to ${adapter.commandsOutputDir}`);
  }

  // Deploy instruction files if configured
  const instructionsDeployed = deployInstructions(platformName, adapter);
  if (instructionsDeployed > 0) {
    console.log(`  📋 ${instructionsDeployed} instructions deployed to ${adapter.instructionsOutputDir}`);
  }

  return written;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

// Load canonical agents
const agentFiles = readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.agent.md'))
  .sort()
  .map(f => join(AGENTS_DIR, f));

if (agentFiles.length === 0) {
  console.error('❌ No canonical agents found in agents/');
  process.exit(1);
}

// Collect all unique canonical tools for adapter coverage validation
const allCanonicalTools = collectCanonicalTools(agentFiles);

// Discover platforms
const platforms = readdirSync(PLATFORM_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== '_template' && d.name !== 'plans')
  .map(d => d.name)
  .filter(name => !TARGET_PLATFORM || name === TARGET_PLATFORM);

if (TARGET_PLATFORM && platforms.length === 0) {
  console.error(`❌ Platform "${TARGET_PLATFORM}" not found in platform/`);
  process.exit(1);
}

console.log(DRY_RUN ? '🔍 Dry-run mode — no files will be written\n' : '');

let totalWritten = 0;
let totalPlatforms = 0;

for (const platform of platforms) {
  const adapterPath = join(PLATFORM_DIR, platform, 'adapter.json');
  if (!existsSync(adapterPath)) {
    console.log(`⏭️  ${platform}: no adapter.json — skipping`);
    continue;
  }

  let adapter;
  try {
    adapter = JSON.parse(readFileSync(adapterPath, 'utf8'));
  } catch (err) {
    console.error(`❌ ${platform}: adapter.json parse error — ${err.message}`);
    continue;
  }

  const label = adapter.displayName ?? platform;
  console.log(`🔧 ${label} (${platform})`);

  validateAdapterCoverage(platform, adapter, allCanonicalTools);
  const written = syncPlatform(platform, adapter, agentFiles);
  totalWritten += written;
  totalPlatforms++;
}

const action = DRY_RUN ? 'would update' : 'updated';
console.log(`\n${DRY_RUN ? '🔍' : '✅'} Done — ${totalWritten} files ${action} across ${totalPlatforms} platforms`);
if (DRY_RUN && totalWritten > 0) process.exit(1); // non-zero for CI
