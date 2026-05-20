---
name: memory-bank-optimization
description: Audit and compress memory bank files — eliminate redundancy, enforce lazy-load, reduce auto-loaded context by 80-90%
---

# Memory Bank Optimization

## Core Principles (from RTK + VS Code docs)

1. **Code is source of truth** — never duplicate routes, entities, endpoints, or commands that exist in code
2. **Git is history** — never maintain delivery logs, wave tables, progress percentages, or commit counts
3. **Progressive disclosure** — auto-load only what every invocation needs; lazy-load everything else
4. **Compress output** — agents return structured compact output, not verbose prose
5. **Measure token budget** — each file has a line limit; exceed it and it gets split or compressed

## Token Budget Targets

| File | Max Lines | Load Strategy | Purpose |
|---|---|---|---|
| `AGENTS.md` | 80 | **Always** (system prompt) | Stack, commands, golden rules, agent roles |
| `copilot-instructions.md` | 100 | **Always** (VS Code) | Coding standards, timeouts, coordination |
| `docs/memory-bank/00-project.md` | 60 | **On-demand** | Project scope, architecture diagram, key decisions |
| `docs/memory-bank/01-active-context.md` | 40 | **On-demand** | Current sprint focus, blockers, next priorities |
| `docs/memory-bank/02-progress-log.md` | ∞ | **Append-only** | Milestone history (never read unless auditing) |
| `docs/memory-bank/_notes/ADR-*.md` | 50 each | **On-demand** | Architectural decisions (immutable) |
| `/memories/repo/*.md` | 15 each | **Auto-load** (zero cost) | Atomic facts: stack, commands, conventions |

## What NOT to Auto-Load (Red Flags)

- ❌ Wave-by-wave delivery tables
- ❌ Legacy cleanup logs ("deleted X lines of dead code")
- ❌ Historical commit counts or delivery history
- ❌ Full entity field tables with types (ORM models are source of truth)
- ❌ Complete endpoint lists (code is source of truth)
- ❌ ASCII architecture diagrams (keep simplified)
- ❌ Progress percentages (use git/issues)
- ❌ "Last updated" dates on every file (git has this)
- ❌ Agent names in skill descriptions (creates maintenance churn)

## What IS Worth Auto-Loading

- ✅ Run commands (dev, test, lint, prod)
- ✅ Golden rules / guardrails
- ✅ Agent roles and orchestration flow (1 line each)
- ✅ Current known issues and next priorities
- ✅ Where to find things (context routing table)

## File Structure (Optimized)

```
docs/memory-bank/
├── 00-project.md              ← What + architecture + decisions (60 lines max)
├── 01-active-context.md       ← Sprint focus + blockers + next (40 lines max)
├── 02-progress-log.md         ← Append-only milestones (no line limit)
├── _notes/                    ← ADRs (immutable, 50 lines each)
├── _tasks/                    ← Task history
└── decisions/                 ← Deprecated, use _notes/
```

**Deleted files** (content moved elsewhere):
- ~~01-architecture.md~~ → merged into 00-project.md
- ~~02-components.md~~ → derivable from code
- ~~03-tech-context.md~~ → merged into 00-project.md

## Compression Rules

### When editing any memory bank file:

1. **Remove duplication** — if info exists in AGENTS.md, copilot-instructions.md, or code, delete it
2. **Use tables over prose** — tables are 40-60% more token-efficient
3. **1 line per agent** — no multi-line descriptions
4. **No examples** — examples belong in skills, not memory bank
5. **No historical context** — git log explains history
6. **No "how to use" instructions** — agents know how to use their own files

### When creating a new file:

1. Ask: "Does this info already exist somewhere?" → if yes, reference it
2. Ask: "Will agents read this on every invocation?" → if no, put in skills/
3. Ask: "Is this derivable from code?" → if yes, don't create the file
4. Ask: "Is this historical record?" → if yes, it belongs in git, not memory bank

## Skills vs Memory Bank vs Instructions

| Content Type | Where | Why |
|---|---|---|
| Coding standards | `.github/instructions/*.md` | Auto-loaded by VS Code per file pattern |
| Operational procedures | `skills/*/SKILL.md` | Lazy-load, only when invoked |
| Project scope | `docs/memory-bank/00-project.md` | On-demand read |
| Sprint state | `docs/memory-bank/01-active-context.md` | On-demand read |
| Atomic facts | `/memories/repo/*.md` | Zero-cost auto-load |
| Agent behavior | `agents/*.agent.md` | On-demand when agent selected |

## Re-Optimize When

- `AGENTS.md` exceeds 80 lines
- Any memory-bank file exceeds its line limit
- New operational procedures need documentation (create a skill)
- After major feature deliveries (move delivery history to git/issues)
