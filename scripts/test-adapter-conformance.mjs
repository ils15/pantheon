#!/usr/bin/env node
/**
 * test-adapter-conformance.mjs
 *
 * Comprehensive conformance test suite for Pantheon platform adapters.
 * Validates schema, agent output, tool mapping, capability mapping,
 * agent mode, mcpServers schema, and MCP tool reference conformance
 * for ALL platform adapters.
 *
 * Usage:
 *   node scripts/test-adapter-conformance.mjs
 *   node scripts/test-adapter-conformance.mjs --verbose
 *   node scripts/test-adapter-conformance.mjs --platform opencode
 *   node scripts/test-adapter-conformance.mjs --json
 *
 * Exit code: 0 if ALL platforms pass ALL checks, 1 if any check fails.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { validateMcpServers } from './install/shared.mjs'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AGENTS_DIR = join(ROOT, 'agents')
const PLATFORM_DIR = join(ROOT, 'platform')

const VERBOSE = process.argv.includes('--verbose')
const JSON_OUTPUT = process.argv.includes('--json')

const platformArgIndex = process.argv.indexOf('--platform')
const TARGET_PLATFORM =
  platformArgIndex !== -1 && process.argv[platformArgIndex + 1]
    ? process.argv[platformArgIndex + 1]
    : null

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

/** @type {{ platform: string, category: string, status: 'pass'|'fail'|'warn', message: string }[]} */
const results = []

let exitCode = 0

function pass(platform, category, message) {
  results.push({ platform, category, status: 'pass', message })
  if (VERBOSE) console.log(`  ✅ ${message}`)
}

function fail(platform, category, message) {
  results.push({ platform, category, status: 'fail', message })
  exitCode = 1
  console.error(`  ❌ ${message}`)
}

function warn(platform, category, message) {
  results.push({ platform, category, status: 'warn', message })
  console.warn(`  ⚠️  ${message}`)
}

// ---------------------------------------------------------------------------
// Canonical taxonomy (mirrors CAPABILITY_TAXONOMY from sync-platforms.mjs)
// ---------------------------------------------------------------------------

const CAPABILITY_TAXONOMY = {
  'search/codebase': { class: 'core-discovery', portability: 'portable' },
  'search/usages': { class: 'core-discovery', portability: 'portable' },
  'search/fileSearch': { class: 'exact-search', portability: 'portable' },
  'search/textSearch': { class: 'exact-search', portability: 'portable' },
  'search/listDirectory': { class: 'exact-search', portability: 'portable' },
  'search/changes': { class: 'core-discovery', portability: 'mappable' },
  'read/readFile': { class: 'file-io', portability: 'portable' },
  'edit/editFiles': { class: 'file-io', portability: 'portable' },
  'execute/runInTerminal': { class: 'execution', portability: 'portable' },
  'execute/testFailure': { class: 'execution', portability: 'portable' },
  'execute/getTerminalOutput': { class: 'execution', portability: 'portable' },
  'execute/createAndRunTask': { class: 'execution', portability: 'local-only' },
  'read/problems': { class: 'diagnostics', portability: 'optional-accelerator' },
  agent: { class: 'orchestration', portability: 'mappable' },
  'vscode/askQuestions': { class: 'approval', portability: 'mappable' },
  'vscode/runCommand': { class: 'ide-local', portability: 'local-only' },
  'browser/openBrowserPage': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/navigatePage': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/readPage': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/clickElement': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/typeInPage': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/hoverElement': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/dragElement': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/handleDialog': { class: 'browser-ui', portability: 'optional-accelerator' },
  'browser/screenshotPage': { class: 'browser-ui', portability: 'optional-accelerator' },
  'web/fetch': { class: 'external-service', portability: 'portable' },
}

const VALID_ACTION_TYPES = new Set(['omit-section', 'prepend', 'append', 'inject-routing'])
const VALID_MODE_VALUES = new Set(['primary', 'subagent'])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all unique canonical tool names from agent files. */
function collectCanonicalTools(agentFiles) {
  const tools = new Set()
  for (const f of agentFiles) {
    const raw = readFileSync(f, 'utf8')
    const parsed = parseFrontmatter(raw)
    if (!parsed?.fm.tools) continue
    const toolEntries = Array.isArray(parsed.fm.tools)
      ? parsed.fm.tools
      : Object.keys(parsed.fm.tools)
    for (const t of toolEntries) tools.add(t)
  }
  return tools
}

/** Collect all unique frontmatter keys across all canonical agents. */
function collectCanonicalFrontmatterKeys(agentFiles) {
  const keys = new Set()
  for (const f of agentFiles) {
    const raw = readFileSync(f, 'utf8')
    const parsed = parseFrontmatter(raw)
    if (!parsed) continue
    for (const key of Object.keys(parsed.fm)) keys.add(key)
  }
  return keys
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null
  return {
    fm: yaml.load(match[1]) ?? {},
    body: match[2],
  }
}

/** Load an adapter.json for a platform. */
function loadAdapter(platformName) {
  const adapterPath = join(PLATFORM_DIR, platformName, 'adapter.json')
  if (!existsSync(adapterPath)) return null
  return JSON.parse(readFileSync(adapterPath, 'utf8'))
}

/** Get canonical agent file paths. */
function getCanonicalAgentFiles() {
  return readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.agent.md'))
    .sort()
    .map((f) => join(AGENTS_DIR, f))
}

/** Get canonical agent file names (without .agent.md extension). */
function getCanonicalAgentNames() {
  return readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.agent.md'))
    .map((f) => f.replace('.agent.md', ''))
    .sort()
}

/** Strip file extension from a filename. */
function basenameWithoutExt(filename, ext) {
  if (ext && filename.endsWith(ext)) {
    return filename.slice(0, -ext.length)
  }
  // Also try common extensions
  for (const knownExt of ['.md', '.mdc', '.agent.md', '.txt']) {
    if (filename.endsWith(knownExt)) {
      return filename.slice(0, -knownExt.length)
    }
  }
  return filename
}

/** Get agents that use a specific canonical tool. */
function getAgentsUsingTool(canonicalAgentNames, canonicalTool) {
  const using = []
  for (const name of canonicalAgentNames) {
    const agentFile = join(AGENTS_DIR, `${name}.agent.md`)
    const raw = readFileSync(agentFile, 'utf8')
    const parsed = parseFrontmatter(raw)
    if (parsed && Array.isArray(parsed.fm.tools) && parsed.fm.tools.includes(canonicalTool)) {
      using.push(name)
    }
  }
  return using
}

// ---------------------------------------------------------------------------
// Test: Schema Conformance (Category 1)
// ---------------------------------------------------------------------------

function testSchemaConformance(platformName, adapter, canonicalToolSet, canonicalFmKeys) {
  const category = 'Schema'

  // Check required fields at top level
  const requiredFields = ['name', 'displayName', 'version', 'outputDir', 'frontmatter', 'toolMap']
  for (const field of requiredFields) {
    if (adapter[field] === undefined) {
      fail(platformName, category, `Missing required top-level field: "${field}"`)
    } else {
      pass(platformName, category, `Required field "${field}" present`)
    }
  }

  // Check frontmatter has required sub-fields
  if (adapter.frontmatter) {
    const fmRequired = ['include']
    for (const field of fmRequired) {
      if (adapter.frontmatter[field] === undefined) {
        fail(platformName, category, `Missing frontmatter field: "${field}"`)
      } else {
        pass(platformName, category, `frontmatter.${field} present`)
      }
    }

    // Validate include fields exist in canonical frontmatter keys
    if (adapter.frontmatter.include && Array.isArray(adapter.frontmatter.include)) {
      for (const key of adapter.frontmatter.include) {
        if (key === '*') continue
        if (canonicalFmKeys.has(key)) {
          pass(
            platformName,
            category,
            `frontmatter.include field "${key}" exists in canonical agents`,
          )
        } else {
          warn(
            platformName,
            category,
            `frontmatter.include field "${key}" not found in canonical agents (may be intentional)`,
          )
        }
      }
    }

    // Validate exclude fields exist in canonical frontmatter keys
    if (adapter.frontmatter.exclude && Array.isArray(adapter.frontmatter.exclude)) {
      const wildcardExclude = adapter.frontmatter.exclude.includes('*')
      if (!wildcardExclude) {
        for (const key of adapter.frontmatter.exclude) {
          if (canonicalFmKeys.has(key)) {
            pass(
              platformName,
              category,
              `frontmatter.exclude field "${key}" exists in canonical agents`,
            )
          } else {
            warn(
              platformName,
              category,
              `frontmatter.exclude field "${key}" not found in canonical agents (may be intentional)`,
            )
          }
        }
      } else {
        pass(platformName, category, 'frontmatter.exclude uses wildcard "*" — skip key validation')
      }
    }
  }

  // Validate toolMap keys are valid canonical tool names
  if (adapter.toolMap) {
    const toolMapKeys = Object.keys(adapter.toolMap)
    if (toolMapKeys.length > 0) {
      for (const key of toolMapKeys) {
        if (canonicalToolSet.has(key)) {
          pass(platformName, category, `toolMap key "${key}" is a valid canonical tool`)
        } else {
          fail(platformName, category, `toolMap key "${key}" is NOT a valid canonical tool`)
        }
      }

      // Check for conflicting mappings (same platform value from different canonical tools)
      const valueToCanonical = {}
      for (const [canonical, platformVal] of Object.entries(adapter.toolMap)) {
        if (valueToCanonical[platformVal]) {
          valueToCanonical[platformVal].push(canonical)
        } else {
          valueToCanonical[platformVal] = [canonical]
        }
      }
      for (const [platformVal, canonicals] of Object.entries(valueToCanonical)) {
        if (canonicals.length > 1) {
          warn(
            platformName,
            category,
            `toolMap value "${platformVal}" is shared by ${canonicals.length} canonical tools: ${canonicals.join(', ')}`,
          )
        }
      }
    } else {
      pass(platformName, category, 'toolMap is empty (passthrough mode)')
    }
  }

  // Validate excludeTools entries are valid canonical tools
  if (adapter.excludeTools && Array.isArray(adapter.excludeTools)) {
    // Build master list: all known tools from canonical set + taxonomy
    const allKnownTools = new Set([...canonicalToolSet, ...Object.keys(CAPABILITY_TAXONOMY)])
    for (const tool of adapter.excludeTools) {
      // Allow glob patterns like "browser/*" — check the base prefix
      const baseTool = tool.endsWith('*') ? tool.replace(/\/?\*$/, '') : tool
      const matches = [...allKnownTools].filter((t) => t.startsWith(baseTool))
      if (tool.endsWith('*') && matches.length > 0) {
        pass(
          platformName,
          category,
          `excludeTools pattern "${tool}" matches ${matches.length} known tools`,
        )
      } else if (tool.endsWith('*') && matches.length === 0) {
        warn(platformName, category, `excludeTools pattern "${tool}" matches no known tools`)
      } else if (allKnownTools.has(tool)) {
        pass(platformName, category, `excludeTools entry "${tool}" is a valid known tool`)
      } else {
        warn(
          platformName,
          category,
          `excludeTools entry "${tool}" is not a known canonical tool (may be intentional)`,
        )
      }
    }
  }

  // Validate bodyFilters reference valid action types
  if (adapter.bodyFilters && Array.isArray(adapter.bodyFilters)) {
    for (let i = 0; i < adapter.bodyFilters.length; i++) {
      const filter = adapter.bodyFilters[i]
      if (!VALID_ACTION_TYPES.has(filter.action)) {
        fail(platformName, category, `bodyFilters[${i}] has invalid action "${filter.action}"`)
      } else {
        pass(platformName, category, `bodyFilters[${i}] action "${filter.action}" is valid`)
      }
      // Check required fields per action
      if (filter.action === 'omit-section' && !filter.pattern) {
        fail(
          platformName,
          category,
          `bodyFilters[${i}] action "omit-section" missing required "pattern" field`,
        )
      }
      if (
        (filter.action === 'prepend' || filter.action === 'append') &&
        filter.content === undefined
      ) {
        fail(
          platformName,
          category,
          `bodyFilters[${i}] action "${filter.action}" missing required "content" field`,
        )
      }
    }
  } else {
    pass(platformName, category, 'No bodyFilters defined')
  }
}

// ---------------------------------------------------------------------------
// Test: Agent Output Conformance (Category 2)
// ---------------------------------------------------------------------------

function testAgentOutputConformance(platformName, adapter, canonicalAgentNames) {
  const category = 'Output'

  const outDir = join(PLATFORM_DIR, platformName, adapter.outputDir)
  const ext = adapter.fileExtension ?? '.md'
  const skipFrontmatter = adapter.frontmatter?.skipFrontmatter ?? false

  // Check output directory exists
  if (!existsSync(outDir)) {
    for (const name of canonicalAgentNames) {
      fail(
        platformName,
        category,
        `Output directory "${outDir}" does not exist — agent "${name}" cannot be verified`,
      )
    }
    return
  }

  // List generated files (files only, not directories like skills/)
  let generatedFiles
  try {
    generatedFiles = readdirSync(outDir).filter((f) => {
      const fullPath = join(outDir, f)
      try {
        return statSync(fullPath).isFile()
      } catch {
        return false
      }
    })
  } catch {
    generatedFiles = []
  }

  // Check ALL canonical agents have generated files
  for (const name of canonicalAgentNames) {
    const expectedFile = `${name}${ext}`
    const exists = generatedFiles.includes(expectedFile)

    if (exists) {
      pass(platformName, category, `Generated file "${expectedFile}" exists`)
    } else {
      fail(
        platformName,
        category,
        `Missing generated file for agent "${name}" (expected: "${expectedFile}")`,
      )
    }
  }

  // Check for unexpected extra agent-like files
  const generatedAgentNames = new Set(generatedFiles.map((f) => basenameWithoutExt(f, ext)))
  for (const gName of generatedAgentNames) {
    if (!canonicalAgentNames.includes(gName)) {
      warn(platformName, category, `Unexpected generated file for unknown agent: "${gName}"`)
    }
  }

  // Validate frontmatter structure for each generated file
  for (const name of canonicalAgentNames) {
    const filePath = join(outDir, `${name}${ext}`)
    if (!existsSync(filePath)) continue

    const content = readFileSync(filePath, 'utf8')

    // Check for --- wrapper based on skipFrontmatter
    if (skipFrontmatter) {
      if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
        fail(
          platformName,
          category,
          `Agent "${name}" has frontmatter (---) but skipFrontmatter is true`,
        )
      } else {
        pass(
          platformName,
          category,
          `Agent "${name}" correctly has no frontmatter wrappers (skipFrontmatter=true)`,
        )
      }
    } else {
      const parsed = parseFrontmatter(content)
      if (parsed) {
        pass(platformName, category, `Agent "${name}" YAML frontmatter parses correctly`)

        // Validate required fields from include list exist
        // Only fail if the canonical agent has the field but the output doesn't
        const include = adapter.frontmatter?.include ?? []
        const canonicalFile = join(AGENTS_DIR, `${name}.agent.md`)
        const canonicalRaw = readFileSync(canonicalFile, 'utf8')
        const canonicalParsed = parseFrontmatter(canonicalRaw)

        for (const key of include) {
          if (key === '*') continue
          const isInCanonical = canonicalParsed && canonicalParsed.fm[key] !== undefined
          const isInGenerated = parsed.fm[key] !== undefined
          if (isInGenerated) {
            pass(platformName, category, `Agent "${name}" has frontmatter field "${key}"`)
          } else if (isInCanonical) {
            fail(
              platformName,
              category,
              `Agent "${name}" is missing frontmatter field "${key}" (present in canonical but not in generated)`,
            )
          } else {
            // Field not in canonical either — this is fine (optional field)
            pass(
              platformName,
              category,
              `Agent "${name}" omits frontmatter field "${key}" (not in canonical agent)`,
            )
          }
        }

        // Validate excluded fields are NOT present
        const exclude = adapter.frontmatter?.exclude ?? []
        const hasWildcard = exclude.includes('*')
        if (!hasWildcard) {
          for (const key of exclude) {
            if (key === '*') continue
            if (parsed.fm[key] !== undefined) {
              fail(
                platformName,
                category,
                `Agent "${name}" has excluded frontmatter field "${key}"`,
              )
            } else {
              pass(platformName, category, `Agent "${name}" correctly excludes field "${key}"`)
            }
          }
        }
      } else {
        fail(platformName, category, `Agent "${name}" has invalid or unparseable YAML frontmatter`)
      }
    }

    // Soft check: output size relative to canonical
    const canonicalFile = join(AGENTS_DIR, `${name}.agent.md`)
    if (existsSync(canonicalFile)) {
      const canonicalSize = statSync(canonicalFile).size
      const generatedSize = Buffer.byteLength(content, 'utf8')

      const ratio = generatedSize / canonicalSize
      if (ratio < 0.05) {
        warn(
          platformName,
          category,
          `Agent "${name}" output ${generatedSize}B is <5% of canonical ${canonicalSize}B — possibly too small`,
        )
      } else if (ratio > 1.5) {
        warn(
          platformName,
          category,
          `Agent "${name}" output ${generatedSize}B is >150% of canonical ${canonicalSize}B — possibly inflated`,
        )
      } else {
        pass(
          platformName,
          category,
          `Agent "${name}" output ${generatedSize}B is within range of canonical ${canonicalSize}B (ratio: ${ratio.toFixed(2)})`,
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Test: Tool Mapping Conformance (Category 3)
// ---------------------------------------------------------------------------

function testToolMappingConformance(platformName, adapter, canonicalAgentNames, canonicalToolSet) {
  const category = 'ToolMap'

  const toolMap = adapter.toolMap ?? {}
  const excludeToolsSet = new Set(adapter.excludeTools ?? [])
  const passthrough = Object.keys(toolMap).length === 0

  if (passthrough) {
    pass(platformName, category, 'Empty toolMap — passthrough mode, no mapping validation needed')
    return
  }

  const outDir = join(PLATFORM_DIR, platformName, adapter.outputDir)
  const ext = adapter.fileExtension ?? '.md'

  const mappedPlatformValues = new Set(Object.values(toolMap))

  // Validate every tool in each generated agent file is a valid mapped name
  for (const name of canonicalAgentNames) {
    const filePath = join(outDir, `${name}${ext}`)
    if (!existsSync(filePath)) continue

    const content = readFileSync(filePath, 'utf8')
    const parsed = parseFrontmatter(content)
    if (!parsed) continue

    // Collect tools from various formats
    const toolValues = collectToolsFromFm(parsed.fm)

    // Note: We do NOT merge permission keys into toolValues because
    // permission is a separate authorization concept (e.g., bash: allow)
    // not a tool mapping. The tools field is the source of truth.

    for (const tool of toolValues) {
      if (mappedPlatformValues.has(tool)) {
        pass(platformName, category, `Agent "${name}" tool "${tool}" is a valid mapped tool`)
      } else if (tool === 'agent' && adapter.ensureAgentTool) {
        pass(
          platformName,
          category,
          `Agent "${name}" tool "${tool}" is the ensureAgentTool prepend`,
        )
      } else {
        fail(
          platformName,
          category,
          `Agent "${name}" tool "${tool}" is NOT a valid mapped tool name`,
        )
      }
    }
  }

  // Check that excluded tools are NOT present in generated frontmatter
  for (const name of canonicalAgentNames) {
    const filePath = join(outDir, `${name}${ext}`)
    if (!existsSync(filePath)) continue

    const content = readFileSync(filePath, 'utf8')
    const parsed = parseFrontmatter(content)
    if (!parsed) continue

    const fmTools = collectToolsFromFm(parsed.fm)
    for (const tool of fmTools) {
      // Check for canonical tool name leaked through
      // A canonical tool name would not appear as a mapped value unless intentionally
      if (canonicalToolSet.has(tool) && excludeToolsSet.has(tool)) {
        fail(
          platformName,
          category,
          `Agent "${name}" frontmatter contains excluded canonical tool "${tool}"`,
        )
      }
    }

    // Check body for excluded tool references without strikethrough
    for (const excludedTool of excludeToolsSet) {
      const ref = `#tool:${excludedTool}`
      const _strikethroughRef = `~~\`${ref}\``
      // Check if the raw canonical ref appears without strikethrough
      const rawRefCount = (content.match(new RegExp(`\`${escapeRegex(ref)}\``, 'g')) || []).length
      if (rawRefCount > 0) {
        warn(
          platformName,
          category,
          `Agent "${name}" body has ${rawRefCount} non-strikethrough reference(s) to excluded tool "${excludedTool}"`,
        )
      }
    }
  }

  // Check no portable tool (used by at least one agent) is missing from both toolMap AND excludeTools
  for (const [canonicalTool, taxonomy] of Object.entries(CAPABILITY_TAXONOMY)) {
    if (taxonomy.portability === 'portable') {
      if (!(canonicalTool in toolMap) && !excludeToolsSet.has(canonicalTool)) {
        const agentsUsingIt = getAgentsUsingTool(canonicalAgentNames, canonicalTool)
        if (agentsUsingIt.length > 0) {
          fail(
            platformName,
            category,
            `Portable tool "${canonicalTool}" (used by ${agentsUsingIt.length} agents: ${agentsUsingIt.join(', ')}) is neither mapped nor excluded`,
          )
        }
        // else: tool not used by any agent — no gap
      }
    }
  }

  // Check #tool: reference strikethrough for excluded tools
  for (const name of canonicalAgentNames) {
    const filePath = join(outDir, `${name}${ext}`)
    if (!existsSync(filePath)) continue

    const content = readFileSync(filePath, 'utf8')
    const toolRefs = content.match(/`#tool:(\S+)`/g) ?? []

    for (const ref of toolRefs) {
      const match = ref.match(/`#tool:(\S+)`/)
      if (!match) continue
      const toolName = match[1]

      if (excludeToolsSet.has(toolName)) {
        // Check this tool reference has strikethrough
        if (content.includes(`~~${ref}~~`)) {
          pass(
            platformName,
            category,
            `Agent "${name}" excluded tool "${toolName}" properly strikethrough'd`,
          )
        } else {
          warn(
            platformName,
            category,
            `Agent "${name}" excluded tool "${toolName}" NOT strikethrough'd (raw: ${ref})`,
          )
        }
      }
    }
  }
}

/** Extract tool names from frontmatter in any format. */
function collectToolsFromFm(fm) {
  let tools = []
  if (Array.isArray(fm.tools)) {
    tools = [...fm.tools]
  } else if (typeof fm.tools === 'object' && fm.tools !== null) {
    // OpenCode format: { name: true, grep: true, ... }
    tools = Object.keys(fm.tools).filter((k) => fm.tools[k] === true)
  } else if (typeof fm.tools === 'string') {
    // Claude comma-separated format
    tools = fm.tools
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return tools
}

/** Escape special regex characters in a string. */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Test: Capability Mapping Conformance (Category 4)
// ---------------------------------------------------------------------------

function testCapabilityConformance(platformName, adapter) {
  const category = 'Capability'

  const flags = adapter.capabilityFlags
  if (!flags) {
    pass(platformName, category, 'No capabilityFlags defined — skipping capability checks')
    return
  }

  // Validate all flag values are boolean
  for (const [flag, value] of Object.entries(flags)) {
    if (typeof value === 'boolean') {
      pass(platformName, category, `capabilityFlags.${flag} is ${value}`)
    } else {
      fail(platformName, category, `capabilityFlags.${flag} should be boolean, got ${typeof value}`)
    }
  }

  const toolMap = adapter.toolMap ?? {}

  // orchestration: true → must have 'agent' mapped in toolMap
  if (flags.orchestration === true) {
    if ('agent' in toolMap) {
      pass(platformName, category, 'orchestration=true and agent tool is mapped')
    } else {
      fail(platformName, category, 'orchestration=true but agent tool is NOT mapped in toolMap')
    }
  } else {
    pass(platformName, category, 'orchestration not set — no agent mapping required')
  }

  // approval: true → must have vscode/askQuestions mapped
  if (flags.approval === true) {
    if ('vscode/askQuestions' in toolMap) {
      pass(platformName, category, 'approval=true and vscode/askQuestions is mapped')
    } else {
      fail(platformName, category, 'approval=true but vscode/askQuestions is NOT mapped in toolMap')
    }
  } else {
    // Even if approval is false, the tool could still be mapped (enhancement)
    if ('vscode/askQuestions' in toolMap) {
      pass(
        platformName,
        category,
        'approval is not true but vscode/askQuestions is still mapped (optional enhancement)',
      )
    } else {
      pass(platformName, category, 'approval not set — no askUser mapping required')
    }
  }
}

// ---------------------------------------------------------------------------
// Test: Agent Mode Conformance (Category 5)
// ---------------------------------------------------------------------------

function testAgentModeConformance(platformName, adapter, canonicalAgentNames) {
  const category = 'Mode'

  const overrides = adapter.agentModeOverrides
  if (!overrides || Object.keys(overrides).length === 0) {
    pass(platformName, category, 'No agentModeOverrides defined — skipping mode checks')
    return
  }

  // Check all canonical agents have a mode assigned
  let _missingCount = 0
  for (const name of canonicalAgentNames) {
    if (name in overrides) {
      pass(platformName, category, `Agent "${name}" has mode override`)
    } else {
      fail(platformName, category, `Agent "${name}" is missing from agentModeOverrides`)
      _missingCount++
    }
  }

  // Check for extra overrides not in canonical agents
  for (const agentName of Object.keys(overrides)) {
    if (!canonicalAgentNames.includes(agentName)) {
      warn(
        platformName,
        category,
        `agentModeOverrides has entry for non-canonical agent "${agentName}"`,
      )
    }
  }

  // Check mode values are valid
  for (const [agentName, mode] of Object.entries(overrides)) {
    if (VALID_MODE_VALUES.has(mode)) {
      pass(platformName, category, `Agent "${agentName}" mode "${mode}" is valid`)
    } else {
      fail(
        platformName,
        category,
        `Agent "${agentName}" has invalid mode "${mode}" (expected primary|subagent)`,
      )
    }
  }

  // Count mode distribution
  let primaryCount = 0
  let subagentCount = 0
  for (const name of canonicalAgentNames) {
    if (overrides[name] === 'primary') primaryCount++
    else if (overrides[name] === 'subagent') subagentCount++
  }

  if (primaryCount === 0) {
    warn(
      platformName,
      category,
      'No agents assigned "primary" mode — at least one orchestrator expected',
    )
  } else {
    pass(platformName, category, `${primaryCount} agent(s) assigned "primary" mode`)
  }
  if (subagentCount > 0) {
    pass(platformName, category, `${subagentCount} agent(s) assigned "subagent" mode`)
  }
}

// ---------------------------------------------------------------------------
// Test: mcpServers Schema Conformance (Category 6)
// ---------------------------------------------------------------------------

function testMcpServersConformance(platformName, adapter, canonicalAgentNames) {
  const category = 'McpServers'

  // Skip if platform doesn't support mcpServers
  const include = adapter.frontmatter?.include ?? []
  if (!include.includes('mcpServers')) {
    pass(platformName, category, 'mcpServers not in frontmatter.include — skipping')
    return
  }

  const outDir = join(PLATFORM_DIR, platformName, adapter.outputDir)
  const ext = adapter.fileExtension ?? '.md'

  // Validate mcpServers in each generated agent file
  for (const name of canonicalAgentNames) {
    const filePath = join(outDir, `${name}${ext}`)
    if (!existsSync(filePath)) continue

    const content = readFileSync(filePath, 'utf8')
    const parsed = parseFrontmatter(content)
    if (!parsed) continue

    // Only validate if mcpServers is present
    if (parsed.fm.mcpServers !== undefined) {
      // Get agent's tools array for cross-reference validation
      const agentTools = Array.isArray(parsed.fm.tools) ? parsed.fm.tools : []

      const { valid, errors } = validateMcpServers(parsed.fm.mcpServers, agentTools)

      if (valid) {
        pass(platformName, category, `Agent "${name}" mcpServers schema valid`)
      } else {
        for (const error of errors) {
          fail(platformName, category, `Agent "${name}" mcpServers error: ${error}`)
        }
      }
    } else {
      pass(platformName, category, `Agent "${name}" has no mcpServers (optional)`)
    }
  }
}

// ---------------------------------------------------------------------------
// Test: mcpServers Tool Reference Conformance (Category 7)
// ---------------------------------------------------------------------------

function testMcpToolReferencesConformance(platformName, adapter, canonicalAgentNames) {
  const category = 'McpToolRef'

  // Skip if platform doesn't support mcpServers
  const include = adapter.frontmatter?.include ?? []
  if (!include.includes('mcpServers')) {
    pass(platformName, category, 'mcpServers not in frontmatter.include — skipping')
    return
  }

  const outDir = join(PLATFORM_DIR, platformName, adapter.outputDir)
  const ext = adapter.fileExtension ?? '.md'

  // Validate MCP tool references are well-formed (non-empty strings)
  for (const name of canonicalAgentNames) {
    const filePath = join(outDir, `${name}${ext}`)
    if (!existsSync(filePath)) continue

    const content = readFileSync(filePath, 'utf8')
    const parsed = parseFrontmatter(content)
    if (!parsed || !Array.isArray(parsed.fm.mcpServers)) continue

    for (const mcp of parsed.fm.mcpServers) {
      if (!mcp.tools || !Array.isArray(mcp.tools)) continue

      for (const tool of mcp.tools) {
        if (typeof tool === 'string' && tool.trim().length > 0) {
          pass(
            platformName,
            category,
            `Agent "${name}" MCP "${mcp.name}" tool "${tool}" is well-formed`,
          )
        } else {
          fail(
            platformName,
            category,
            `Agent "${name}" MCP "${mcp.name}" has invalid tool reference: "${tool}"`,
          )
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Load canonical data
  const canonicalAgentNames = getCanonicalAgentNames()
  const canonicalAgentFiles = getCanonicalAgentFiles()
  const canonicalToolSet = collectCanonicalTools(canonicalAgentFiles)
  const canonicalFmKeys = collectCanonicalFrontmatterKeys(canonicalAgentFiles)

  // Discover platforms
  const platforms = readdirSync(PLATFORM_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template' && d.name !== 'plans')
    .map((d) => d.name)
    .filter((name) => !TARGET_PLATFORM || name === TARGET_PLATFORM)

  if (TARGET_PLATFORM && platforms.length === 0) {
    console.error(`❌ Platform "${TARGET_PLATFORM}" not found in platform/`)
    process.exit(1)
  }

  let totalPlatforms = 0
  let platformsPassed = 0
  let platformsFailed = 0
  let platformsWarned = 0

  console.log('📋 Adapter Conformance Report')
  console.log('='.repeat(50))

  if (VERBOSE) {
    console.log(`\nCanonical agents: ${canonicalAgentNames.length}`)
    console.log(`Canonical tools: ${canonicalToolSet.size}`)
    console.log(`Canonical frontmatter keys: ${[...canonicalFmKeys].join(', ')}`)
  }

  for (const platform of platforms) {
    const adapter = loadAdapter(platform)
    if (!adapter) {
      console.log(`\n⏭️  ${platform}: no adapter.json — skipping`)
      continue
    }

    totalPlatforms++
    console.log(`\nPlatform: ${adapter.displayName ?? platform} (v${adapter.version ?? '?'})`)

    // Run all 7 test categories
    testSchemaConformance(platform, adapter, canonicalToolSet, canonicalFmKeys)
    if (adapter.skipAgentSync) {
      pass(platform, 'Output', 'Agent output conformance skipped (skipAgentSync: true)')
      pass(platform, 'ToolMap', 'Tool mapping conformance skipped (skipAgentSync: true)')
      pass(platform, 'AgentMode', 'Agent mode conformance skipped (skipAgentSync: true)')
      pass(platform, 'McpServers', 'mcpServers conformance skipped (skipAgentSync: true)')
      pass(platform, 'McpToolRef', 'McpToolRef conformance skipped (skipAgentSync: true)')
    } else {
      testAgentOutputConformance(platform, adapter, canonicalAgentNames)
      testToolMappingConformance(platform, adapter, canonicalAgentNames, canonicalToolSet)
      testAgentModeConformance(platform, adapter, canonicalAgentNames)
      testMcpServersConformance(platform, adapter, canonicalAgentNames)
      testMcpToolReferencesConformance(platform, adapter, canonicalAgentNames)
    }
    testCapabilityConformance(platform, adapter)

    // Per-platform summary
    const platResults = results.filter((r) => r.platform === platform)
    const platFail = platResults.filter((r) => r.status === 'fail')
    const platWarn = platResults.filter((r) => r.status === 'warn')

    if (platFail.length > 0) {
      platformsFailed++
    } else if (platWarn.length > 0) {
      platformsWarned++
    } else {
      platformsPassed++
    }

    const checkCount = platResults.length
    const passCount = platResults.filter((r) => r.status === 'pass').length
    const failCount = platFail.length
    const warnCount = platWarn.length
    const statusIcon = failCount > 0 ? '❌' : warnCount > 0 ? '⚠️' : '✅'
    console.log(
      `  ${statusIcon} ${checkCount} checks: ${passCount} pass, ${failCount} fail, ${warnCount} warn`,
    )
  }

  // Global summary
  console.log(`\n${'='.repeat(50)}`)
  console.log('SUMMARY')
  console.log(`  Platforms checked: ${totalPlatforms}`)
  console.log(`  Pass: ${platformsPassed}, Fail: ${platformsFailed}, Warn: ${platformsWarned}`)

  const totalResults = results.length
  const totalPass = results.filter((r) => r.status === 'pass').length
  const totalFail = results.filter((r) => r.status === 'fail').length
  const totalWarn = results.filter((r) => r.status === 'warn').length
  console.log(`  Total checks: ${totalResults} (${totalPass} ✅, ${totalFail} ❌, ${totalWarn} ⚠️)`)

  if (exitCode === 0) {
    console.log('\n🎉 All adapter conformance checks passed!')
  } else {
    console.log(`\n❌ ${totalFail} check(s) failed — see details above`)
    if (!VERBOSE) {
      console.log('   Run with --verbose for detailed pass/fail per check.')
    }
  }

  // Write JSON output if requested
  if (JSON_OUTPUT) {
    const jsonDir = join(ROOT, 'test-results')
    if (!existsSync(jsonDir)) {
      mkdirSync(jsonDir, { recursive: true })
    }
    const jsonPath = join(jsonDir, 'adapter-conformance.json')
    const jsonOutput = {
      timestamp: new Date().toISOString(),
      summary: {
        platforms: totalPlatforms,
        passed: platformsPassed,
        failed: platformsFailed,
        warned: platformsWarned,
        totalChecks: totalResults,
        totalPass,
        totalFail,
        totalWarn,
      },
      results: results.map((r) => ({
        platform: r.platform,
        category: r.category,
        status: r.status,
        message: r.message,
      })),
    }
    writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf8')
    console.log(`\n📄 JSON results written to ${jsonPath}`)
  }

  process.exit(exitCode)
}

// Execute
try {
  main()
} catch (err) {
  console.error(`\n❌ Fatal error: ${err.message}`)
  if (VERBOSE) console.error(err.stack)
  process.exit(1)
}
