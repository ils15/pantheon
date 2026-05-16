#!/usr/bin/env node
/**
 * Smoke tests for sync-platforms.mjs
 *
 * Tests the core pure functions by re-implementing them inline
 * (they are not exported from the module), plus an integration
 * test via spawn for the full dry-run.
 *
 * Run: node scripts/test-sync.mjs
 */

import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

// ===========================================================================
// Inline re-implementation of pure functions from sync-platforms.mjs
// (These are not exported, so we duplicate them here for unit testing.)
// ===========================================================================

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return {
    fm: yaml.load(match[1]) ?? {},
    body: match[2],
  };
}

function serializeFm(fm) {
  return yaml.dump(fm, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true,
  });
}

function mapTools(tools, toolMap) {
  if (!tools || !Array.isArray(tools)) return tools;
  if (!toolMap || Object.keys(toolMap).length === 0) return [...tools];

  const seen = new Set();
  const result = [];
  for (const tool of tools) {
    if (tool in toolMap) {
      const mapped = toolMap[tool];
      if (!seen.has(mapped)) {
        seen.add(mapped);
        result.push(mapped);
      }
    }
  }
  return result;
}

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

    if (key === 'tools' && Array.isArray(value)) {
      if (adapter.excludeTools && adapter.excludeTools.length > 0) {
        const excluded = new Set(adapter.excludeTools);
        value = value.filter(t => !excluded.has(t));
      }
      value = mapTools(value, toolMap);

      if (adapter.ensureAgentTool && !value.includes('agent')) {
        value = ['agent', ...value];
      }

      if (value.length === 0) continue;

      if (adapter.toolsFormat === 'permission') {
        const perm = {};
        for (const tool of value) {
          perm[tool] = 'allow';
        }
        result.permission = perm;
        continue;
      }

      if (adapter.toolsFormat === 'object') {
        const obj = {};
        for (const tool of value) {
          obj[tool] = true;
        }
        value = obj;
      }
    }

    if (strategy === 'comma-separated' && Array.isArray(value)) {
      if (value.length === 0) continue;
      value = value.join(', ');
    }

    result[key] = value;
  }

  if (adapter.frontmatter.addFields) {
    for (const [key, value] of Object.entries(adapter.frontmatter.addFields)) {
      if (!(key in result)) {
        result[key] = JSON.parse(JSON.stringify(value));
      }
    }
  }

  return result;
}

function omitSection(text, pattern) {
  const lines = text.split('\n');
  const result = [];
  let inSection = false;
  let sectionDepth = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch && !inCodeBlock) {
      const depth = headingMatch[1].length;
      const title = headingMatch[2].trim();
      if (title.startsWith(pattern)) {
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

function buildOutputFile(fm, body, skipFrontmatter = false) {
  if (skipFrontmatter) return body;
  const fmStr = serializeFm(fm);
  const normalizedBody = body.startsWith('\n') ? body : '\n' + body;
  return `---\n${fmStr}---\n${normalizedBody}`;
}

// ===========================================================================
// Test 1: parseFrontmatter
// ===========================================================================

console.log('\n📋 Test 1: parseFrontmatter');

const sampleContent = `---
name: test-agent
description: A test agent for smoke testing
tools: ['read/readFile', 'edit/editFiles', 'execute/runInTerminal']
agents: ['apollo']
user-invocable: true
---

# Test Agent Body

Some content here with **markdown**.

\`\`\`javascript
const x = 42;
\`\`\`

More content after the code block.
`;

const parsed = parseFrontmatter(sampleContent);

assert(parsed !== null, 'parseFrontmatter returns non-null for valid frontmatter');
assert(parsed.fm.name === 'test-agent', `fm.name === 'test-agent' (got '${parsed.fm.name}')`);
assert(parsed.fm.description === 'A test agent for smoke testing', 'fm.description matches');
assert(Array.isArray(parsed.fm.tools), 'fm.tools is an array');
assert(parsed.fm.tools.length === 3, `fm.tools has 3 items (got ${parsed.fm.tools.length})`);
assert(parsed.fm.tools[0] === 'read/readFile', 'fm.tools[0] === read/readFile');
assert(parsed.fm.agents[0] === 'apollo', 'fm.agents[0] === apollo');
assert(parsed.fm['user-invocable'] === true, 'fm.user-invocable === true');
assert(parsed.body.includes('# Test Agent Body'), 'body contains heading');
assert(parsed.body.includes('Some content here'), 'body contains text');
assert(parsed.body.includes('```javascript'), 'body preserves code blocks');

// No frontmatter case
const noFm = parseFrontmatter('# Just a heading\nNo frontmatter here.');
assert(noFm === null, 'parseFrontmatter returns null for content without frontmatter');

// ===========================================================================
// Test 2: transformFrontmatter (include/exclude logic)
// ===========================================================================

console.log('\n📋 Test 2: transformFrontmatter');

const sampleFm = {
  name: 'hermes',
  description: 'Backend specialist',
  tools: ['read/readFile', 'edit/editFiles', 'execute/runInTerminal', 'read/problems', 'browser/openBrowserPage'],
  agents: ['apollo'],
  model: ['GPT-5'],
  'user-invocable': false,
  handoffs: ['themis'],
};

// 2a: OpenCode-style adapter (toolsFormat: 'object', exclude model/handoffs)
const opencodeAdapter = {
  frontmatter: {
    include: ['name', 'description', 'tools', 'agents', 'user-invocable'],
    exclude: ['model', 'disable-model-invocation'],
    transform: { tools: { strategy: 'identity' } },
  },
  toolMap: {
    'read/readFile': 'read',
    'edit/editFiles': 'edit',
    'execute/runInTerminal': 'bash',
    'read/problems': 'problems',
    'browser/openBrowserPage': 'browser',
  },
  excludeTools: ['read/problems', 'browser/openBrowserPage'],
  toolsFormat: 'object',
};

const opencodeResult = transformFrontmatter(sampleFm, opencodeAdapter);

assert(opencodeResult.name === 'hermes', 'OpenCode: name preserved');
assert(opencodeResult.description === 'Backend specialist', 'OpenCode: description preserved');
assert(!('model' in opencodeResult), 'OpenCode: model excluded');
assert(!('handoffs' in opencodeResult), 'OpenCode: handoffs not in include list → excluded');
assert(typeof opencodeResult.tools === 'object', 'OpenCode: tools converted to object format');
assert(opencodeResult.tools['read'] === true, 'OpenCode: read/readFile mapped to read');
assert(opencodeResult.tools['edit'] === true, 'OpenCode: edit/editFiles mapped to edit');
assert(opencodeResult.tools['bash'] === true, 'OpenCode: execute/runInTerminal mapped to bash');
assert(!('problems' in opencodeResult.tools), 'OpenCode: excluded tool read/problems not in output');
assert(!('browser' in opencodeResult.tools), 'OpenCode: excluded tool browser/openBrowserPage not in output');

// 2b: Claude Code-style adapter (comma-separated tools)
const claudeAdapter = {
  frontmatter: {
    include: ['name', 'description', 'tools', 'agents'],
    exclude: ['handoffs', 'user-invocable'],
    transform: { tools: { strategy: 'comma-separated' } },
  },
  toolMap: {
    'read/readFile': 'Read',
    'edit/editFiles': 'Edit',
    'execute/runInTerminal': 'Bash',
    'read/problems': 'Problems',
    'browser/openBrowserPage': 'Browser',
  },
  excludeTools: ['read/problems', 'browser/openBrowserPage'],
};

const claudeResult = transformFrontmatter(sampleFm, claudeAdapter);

assert(typeof claudeResult.tools === 'string', 'Claude: tools is comma-separated string');
assert(claudeResult.tools.includes('Read'), 'Claude: Read tool present');
assert(claudeResult.tools.includes('Edit'), 'Claude: Edit tool present');
assert(claudeResult.tools.includes('Bash'), 'Claude: Bash tool present');
assert(!claudeResult.tools.includes('Problems'), 'Claude: excluded Problems not present');
assert(!('handoffs' in claudeResult), 'Claude: handoffs excluded');

// 2c: Empty toolMap → passthrough
const passthroughAdapter = {
  frontmatter: {
    include: ['name', 'tools'],
    exclude: [],
    transform: {},
  },
  toolMap: {},
};

const passthroughResult = transformFrontmatter(sampleFm, passthroughAdapter);

assert(Array.isArray(passthroughResult.tools), 'Passthrough: tools remains array');
assert(passthroughResult.tools.length === 5, `Passthrough: all 5 tools preserved (got ${passthroughResult.tools.length})`);

// 2d: Omit strategy
const omitAdapter = {
  frontmatter: {
    include: ['name', 'description', 'tools'],
    exclude: [],
    transform: { description: { strategy: 'omit' } },
  },
  toolMap: {},
};

const omitResult = transformFrontmatter(sampleFm, omitAdapter);

assert(omitResult.name === 'hermes', 'Omit: name preserved');
assert(!('description' in omitResult), 'Omit: description omitted via strategy');

// ===========================================================================
// Test 3: buildOutputFile
// ===========================================================================

console.log('\n📋 Test 3: buildOutputFile');

const testFm = { name: 'test', description: 'Test agent' };
const testBody = '# Hello\n\nSome body content.';

// 3a: Normal mode (with frontmatter)
const normalOutput = buildOutputFile(testFm, testBody);

assert(normalOutput.startsWith('---\n'), 'Normal: starts with ---');
assert(normalOutput.includes('name: test'), 'Normal: contains name field');
assert(normalOutput.includes('description: Test agent'), 'Normal: contains description field');
assert(normalOutput.includes('# Hello'), 'Normal: contains body heading');
assert(normalOutput.includes('Some body content.'), 'Normal: contains body text');

// Verify round-trip: parse the output back
const roundTrip = parseFrontmatter(normalOutput);
assert(roundTrip !== null, 'Normal: round-trip parse succeeds');
assert(roundTrip.fm.name === 'test', 'Normal: round-trip name matches');
assert(roundTrip.body.includes('# Hello'), 'Normal: round-trip body preserved');

// Verify structure: opening ---, YAML, closing ---, body
assert(normalOutput.startsWith('---\n'), 'Normal: starts with opening ---');
const closingIndex = normalOutput.indexOf('\n---\n');
assert(closingIndex > 0, 'Normal: has closing --- delimiter after YAML');

// ===========================================================================
// Test 4: omitSection — code-block awareness
// ===========================================================================

console.log('\n📋 Test 4: omitSection code-block awareness');

const sectionWithCodeBlock = `# Introduction

This is the intro section.

## VS Code Integration

This section should be removed entirely.

## After Removed Section

This content is preserved.

\`\`\`python
## This is NOT a heading, it's inside a code block
def hello():
    pass
\`\`\`

## Final Section

This should also be preserved.
`;

const omitResult1 = omitSection(sectionWithCodeBlock, 'VS Code Integration');

assert(!omitResult1.includes('This section should be removed entirely.'), 'omitSection: removes targeted section content');
assert(omitResult1.includes('## This is NOT a heading'), 'omitSection: preserves heading-like text inside code blocks');
assert(omitResult1.includes('def hello()'), 'omitSection: preserves code block content');
assert(omitResult1.includes('# Introduction'), 'omitSection: preserves preceding sections');
assert(omitResult1.includes('## After Removed Section'), 'omitSection: preserves content after removed section');
assert(omitResult1.includes('## Final Section'), 'omitSection: preserves sections after code block');

// 4b: Multiple code blocks outside the removed section
const multiCodeBlock = `## Section A

Content A.

## Section B

Content B — this gets removed.

## Section C

Content C.

\`\`\`
## Fake heading in code block 1
\`\`\`

Some text between code blocks.

\`\`\`js
## Fake heading in code block 2
const x = 1;
\`\`\`

## Section D

Content D.
`;

const omitResult2 = omitSection(multiCodeBlock, 'Section B');

assert(!omitResult2.includes('Content B'), 'omitSection: removes Section B content');
assert(omitResult2.includes('Content A.'), 'omitSection: preserves Section A');
assert(omitResult2.includes('Content C.'), 'omitSection: preserves Section C');
assert(omitResult2.includes('Content D.'), 'omitSection: preserves Section D');
assert(omitResult2.includes('## Fake heading in code block 1'), 'omitSection: preserves fake heading in first code block');
assert(omitResult2.includes('## Fake heading in code block 2'), 'omitSection: preserves fake heading in second code block');

// 4c: No matching section → text unchanged
const noMatch = omitSection('# Hello\n\nWorld.', 'Nonexistent');
assert(noMatch === '# Hello\n\nWorld.', 'omitSection: returns unchanged text when no match');

// ===========================================================================
// Test 5: Full sync dry-run
// ===========================================================================

console.log('\n📋 Test 5: Full sync dry-run');

const result = spawnSync('node', ['scripts/sync-platforms.mjs', '--dry-run'], {
  cwd: ROOT,
  stdio: 'pipe',
  encoding: 'utf8',
});

assert(result.status === 0 || result.status === 1,
  `sync-platforms.mjs --dry-run exits with 0 or 1 (got ${result.status})`);

// Exit code 1 in dry-run means "files would be updated" — that's expected behavior
// Exit code 0 means "all files up-to-date" — also valid
const isExpectedExit = result.status === 0 || result.status === 1;
assert(isExpectedExit, `dry-run exit code is expected (0=up-to-date, 1=would-update)`);

// Verify output contains expected markers
const stdout = result.stdout || '';
const stderr = result.stderr || '';
const combined = stdout + stderr;

assert(combined.includes('Dry-run') || combined.includes('dry-run') || combined.includes('🔍'),
  'dry-run output mentions dry-run mode');

// Verify no crash / unhandled exception
assert(!combined.includes('TypeError') && !combined.includes('SyntaxError') && !combined.includes('ReferenceError'),
  'dry-run: no runtime errors in output');

// Verify it processes at least one platform
assert(combined.includes('opencode') || combined.includes('claude') || combined.includes('cursor'),
  'dry-run: processes at least one known platform');

// ===========================================================================
// Summary
// ===========================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All smoke tests passed!');
}
