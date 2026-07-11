# 🏛️ Pantheon Architecture

> **Audience:** Developers extending the framework, platform integrators, and anyone who
> wants to understand why Pantheon works the way it does.
>
> **Scope:** Architectural rationale and design patterns — not agent behavior or setup.

---

## Table of Contents

1. [Conductor-Delegate Pattern](#1-conductor-delegate-pattern)
2. [Canonical → Adapter → Sync](#2-canonical--adapter--sync)
3. [DAG Wave Execution](#3-dag-wave-execution)
4. [Two-Tier Memory Strategy](#4-two-tier-memory-strategy)
5. [Platform Adapter Design Pattern](#5-platform-adapter-design-pattern)
6. [Model Configuration](#6-model-configuration)
7. [Summary: Why This Architecture](#7-summary-why-this-architecture)

---

## 1. Conductor-Delegate Pattern

### Problem

Traditional single-agent coding forces one agent to plan, implement, test, review, and
document simultaneously. This produces context fragmentation (80%+ on logistics, ~20% on
reasoning), skipped tests, generic code, and no quality accountability.

### Solution

**Zeus orchestrates but never implements.** Zeus has a `premium` model assignment and
a restricted tool set (no `edit/editFiles`). His only job is routing work to the right
specialist agent at the right time, managing the 3 approval gates, and conserving context.

```
User Request
     │
     ▼
┌─────────┐
│  ZEUS   │  Orchestrator — delegates, never edits
└────┬────┘
     │
     ├──► Athena (planning, research)
     ├──► Hermes (backend, FastAPI)
     ├──► Aphrodite (frontend, React)
     ├──► Demeter (database, SQLAlchemy)
     ├──► Themis (quality gate, mandatory review)
     └──► ...
```

### Why this matters

| Metric | Single Agent | Conductor-Delegate (Pantheon) |
|--------|-------------|-------------------------------|
| Reasoning-to-logistics ratio | 10–20% reasoning | 70–80% reasoning |
| Test coverage | 65–75% | **92%** |
| TDD enforcement | Optional | **Enforced RED→GREEN→REFACTOR** |
| Bugs reaching production | 3–5 per feature | **Near zero** |
| Code review cadence | End of feature | **After every phase** |

The key insight: **specialization beats generalization at every layer.** Hermes knows
FastAPI async patterns and nothing about React. Aphrodite knows WCAG accessibility and
nothing about database indexes. Gaia knows remote sensing and nothing about Docker.
The result is expert-quality code at each layer, assembled by Zeus into a coherent
feature.

### Delegation decisions

Zeus uses explicit rules to decide whether to delegate or not:

| Agent | Delegate when | Don't delegate when |
|-------|--------------|---------------------|
| Athena | Feature >3 components, unknown codebase | Simple single-file change |
| Apollo | Needs >3 parallel searches | Single known file location |
| Themis | After any implementation phase | Hotfix (no code change) |

---

## 2. Canonical → Adapter → Sync

### Problem (before v3.4.0)

Each platform (OpenCode, Claude Code, Cursor, Windsurf, Cline, Continue) had its own agent
format with different field capabilities, different tool naming conventions, and different
configuration patterns. A single change required editing 6 files — and they were never quite
identical. Bugs like `temis_delegate` (missing the "h") propagated across platforms because
there was no single source of truth.

### Solution

A three-layer architecture:

```
┌─────────────────────────────────────────────────────┐
│                  1. CANONICAL                        │
│  agents/*.agent.md — single source of truth          │
│  Rich YAML frontmatter + full body text              │
│  Fields: name, description, tools, model, skills,     │
│          handoffs, permission, hooks, mcpServers,      │
│          temperature, steps, globs                    │
└──────────────────────┬──────────────────────────────┘
                       │ read by
                       ▼
┌─────────────────────────────────────────────────────┐
│                  2. ADAPTER                           │
│  platform/*/adapter.json — translation rules         │
│  Defines: include, exclude, transform, toolMap,      │
│           bodyFilters, handoffStrategy, skillsOutput  │
│                                                       │
│  Example (OpenCode adapter):                          │
│  - Canonical "execute/runInTerminal" → "bash"         │
│  - Canonical "agent" → "createAndRunTask"             │
│  - Excluded: handoffs, disable-model-invocation       │
└──────────────────────┬──────────────────────────────┘
                       │ consumed by
                       ▼
┌─────────────────────────────────────────────────────┐
│                  3. SYNC ENGINE                       │
│  scripts/sync-platforms.mjs — generates outputs      │
│  - Reads canonical agents                            │
│  - Applies adapter translation rules                 │
│  - Generates platform-native files                   │
│  - Validates body tool references                    │
│  - Deploys skills in platform format                 │
│  - Reports validation warnings                       │
└─────────────────────────────────────────────────────┘
```

### What the sync engine does

- **Parses frontmatter** — Extracts YAML from `---` blocks
- **Applies adapter rules** — Includes/excludes fields per platform, transforms values
- **Maps tools** — Converts canonical tool names to platform equivalents (e.g.,
  `execute/runInTerminal` → `bash` for OpenCode)
- **Transforms body references** — Rewrites tool references in agent body text to
  platform-correct equivalents
- **Deploys skills** — Copies skill files to platform-specific skill directories
- **Validates** — Checks that every tool mentioned in body text exists in the agent's
  tool list (catching stale references at sync time, not at runtime)
- **Reports warnings** — Missing skills, deprecated fields, unmapped tools

### Deduplication

The sync engine uses composite dedup keys (`${tool}:${mapped}`) to correctly handle
platforms where the same canonical tool maps to different platform tools. This prevents
false duplicates while ensuring no tool appears twice.

### Real-world impact (v3.4.0)

- **416 files changed** — 119 modified + 297 new skill deployment files
- **`temis_delegate` fixed** — 11 occurrences across canonical source, generated files,
  and stale deployment copies
- **174 skills deployed** — 29 skills × 6 platforms, each in the format their runtime
  expects
- **Zero manual platform editing** required for the entire v3.4.0 migration

---

## 3. DAG Wave Execution

### Problem

Sequential phase execution (plan → implement backend → implement frontend → review →
deploy) wastes agent idle time. Backend and frontend have no interdependencies — they
could execute in parallel.

### Solution

Instead of a flat sequential list, Zeus organizes work into **DAG waves** — groups of
tasks that have no interdependencies and can execute simultaneously. Waves flow
sequentially only where dependencies exist.

```
Wave 1: [demeter: schema] + [apollo: research]        ← parallel (no deps)
                    │
Wave 2: [hermes: backend] + [aphrodite: frontend]     ← parallel (both use Wave 1 schema)
                    │
Wave 3: [themis: review]                              ← sequential (depends on Waves 1+2)
                    │
Wave 4: [prometheus: deploy]                          ← sequential (depends on approval)
```

### Wave declaration format

When Zeus dispatches a wave, it announces the parallel execution explicitly:

```
🔀 WAVE 2 — Parallel Execution
Tasks in this wave (no interdependencies):
  ├─ @hermes   → POST /reviews endpoint + tests
  └─ @aphrodite → ReviewCard component with mocked data
Both execute simultaneously. Wave 3 starts after both complete.
```

### Benefits

| Aspect | Sequential | DAG Wave |
|--------|-----------|----------|
| Total time | Sum of all phases | **Longest path only** |
| Idle agents | Waiting for previous to finish | **Always busy** |
| Context reuse | One agent at a time | **Parallel specialized agents** |
| Risk detection | Late (at integration) | **Early (per wave)** |
| Feedback loop | End of each phase | **End of each wave** |

### When DAG is not used

- **Simple features** (single implementation agent) — no parallelization needed
- **Hotfixes** (Talos) — express lane bypasses orchestration entirely
- **Sequential dependencies** — must chain (e.g., Themis always waits for implementation)

---

## 4. Two-Tier Memory Strategy

### Problem

Project memory was a single bucket: everything went into `.pantheon/memory-bank/`. But not all
knowledge has the same access pattern. Permanent facts (stack, commands) should always be
available at zero token cost. Sprint narratives should be read only when needed.

### Solution

Three tiers with distinct storage, loading policies, and update frequency:

```
Tier 1: Native Memory (Facts)
  Location:  /memories/repo/                ← auto-managed by VS Code
  Content:   Stack, test commands, directory structure, immutable truths
  Access:    ✅ Auto-loaded — zero token cost
  Updated:   Rarely (when stack changes)
  Written by: Any agent, automatically

Tier 2: Reference Memory (Narrative)
  Location:  .pantheon/memory-bank/              ← committed to repo
  Content:   Project overview (00), architecture (01), components (02),
             tech context (03), active sprint (04), progress log (05),
             ADRs (_notes/), task records (_tasks/)
  Access:    ❌ Loaded on demand — read cost per file
  Updated:   Sprint boundaries, decision milestones
  Written by: Mnemosyne (on explicit request)

Tier 3: Session Memory (Ephemeral)
  Location:  /memories/session/             ← auto-managed by VS Code
  Content:   Current conversation plans, work-in-progress, temporary findings
  Access:    One read per conversation session
  Updated:   Continuously within session
  Written by: Any agent, automatically
```

### Learning Routing Triple

Knowledge is categorized to prevent duplication:

| Category | Where | Auto-loaded? | Example |
|----------|-------|-------------|---------|
| **Facts** | `/memories/repo/` | ✅ Yes | "Project uses FastAPI + SQLAlchemy" |
| **Patterns** | `skills/` | ❌ On demand | "How to create a new API endpoint with TDD" |
| **Conventions** | `.github/copilot-instructions.md` | ✅ Yes | "Use snake_case for Python" |

**Rule:** If content belongs in a different category, **move it — don't duplicate**.

---

## 5. Platform Adapter Design Pattern

### Problem

Seven platforms (VS Code, OpenCode, Claude Code, Cursor, Windsurf, Cline, Continue),
each with different agent file formats, tool naming conventions, and configuration
patterns. A design without abstraction would require maintaining 7 parallel copies of
every agent.

### Solution

A **platform adapter** is a JSON configuration file (`platform/<name>/adapter.json`)
that defines how to translate the canonical agent format into a platform-specific
format:

```jsonc
{
  "name": "opencode",
  "outputDir": "agents",
  "fileExtension": ".md",

  // What frontmatter fields to include/exclude/transform
  "frontmatter": {
    "include": ["name", "description", "tools", "skills", "instructions"],
    "exclude": ["handoffs", "disable-model-invocation", "permission",
                "hooks", "mcpServers", "temperature", "steps", "globs"],
    "transform": {
      "tools": { "strategy": "identity" },
      "model": { "strategy": "omit" }
    }
  },

  // Canonical tool name → platform tool name mapping
  "toolMap": {
    "search/codebase": "search/codebase",
    "edit/editFiles": "edit/editFiles",
    "execute/runInTerminal": "bash"         // <-- renamed for OpenCode
  },

  // Body text filters (omit sections that don't apply)
  "bodyFilters": [
    { "pattern": "Copilot Workflow", "action": "omit-section" }
  ],

  // Skill deployment configuration
  "skillsOutputDir": "skills",
  "deploySkills": true,
  "handoffStrategy": "exclude",
  "ensureAgentTool": false
}
```

### Adapter fields in detail

| Field | Purpose | Example values |
|-------|---------|---------------|
| `frontmatter.include` | Fields to include in output | `["name", "tools", "skills"]` |
| `frontmatter.exclude` | Fields to strip | `["handoffs", "hooks"]` |
| `frontmatter.transform` | Field-level transformations | `{tools: {strategy: "map"}}` |
| `toolMap` | Canonical → platform tool mapping | `"execute/runInTerminal": "bash"` |
| `bodyFilters` | Section-level body text filtering | Omit "Copilot Workflow" section |
| `skillsOutputDir` | Where to deploy skill files | `"skills"` |
| `deploySkills` | Whether to sync skills | `true` / `false` |
| `handoffStrategy` | How to handle handoff YAML | `"exclude"` / `"include"` / `"body-only"` |
| `ensureAgentTool` | Add `agent` tool if missing | `true` / `false` |

### Platform capability matrix

| Feature | VS Code | OpenCode | Claude Code | Cursor | Windsurf | Cline | Continue |
|---------|:-------:|:--------:|:-----------:|:-----:|:--------:|:-----:|:--------:|
| Parallel subagents | ✅ | ✅ | ⚠️ | ✅ | ❌ | ⚠️ | ⚠️ |
| Handoff UI | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Agent hooks | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MCP servers | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Skills system | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Template for new platforms

A template adapter is at `platform/_template/adapter.json`. To add a new platform:
1. Create `platform/<name>/adapter.json` with translation rules
2. Add a setup guide to `docs/platforms/<name>.md`
3. Extend `scripts/install.mjs` and `scripts/sync-platforms.mjs` for the new platform
4. Run `node scripts/sync-platforms.mjs <name>` to generate the first set of files

---

## 6. Model Configuration

Pantheon does NOT hardcode models by default. Each agent uses your
platform's account default model.

### Provider prefix

The model ID prefix determines which provider OpenCode uses:
- `opencode-go/...` → OpenCode Go provider (recommended)
- `openai/...` → OpenAI provider

### Reference configs

Example model configurations are in `platform/examples/`.
These are documentation only — not used at runtime.

---

## 7. Summary: Why This Architecture

| Decision | Problem it solves | Key benefit |
|----------|------------------|-------------|
| **Conductor-Delegate** | Context fragmentation in single-agent coding | 70-80% reasoning, 92% coverage |
| **Canonical → Adapter → Sync** | 6 copies of every agent, divergent formats | Change once, deploy to all platforms |
| **DAG Wave Execution** | Sequential idle time, slow feedback | Total time = critical path only |
| **Two-Tier Memory** | Mixed knowledge with wrong access patterns | Facts free, narrative on demand |
| **Platform Adapter** | 7 different agent runtimes to support | Pluggable architecture, easy to extend |
| **Model Configuration** | Hardcoded model names across subscriptions | Any provider, no config needed |

> **Design philosophy:** Pantheon is configuration, not code. There are zero framework
> Python/TypeScript source files. The entire system is `.agent.md` (agent definitions),
> `adapter.json` (translation rules), `.instructions.md` (quality gates), and
> `SKILL.md` (domain expertise). This makes it trivially extensible — adding an agent is
> creating a markdown file, not writing a class.
