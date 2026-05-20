---
name: memory-bank-rules
description: Complete guide to Pantheon memory bank — what each file type is, when to create it, and how to keep it lean
---

# Pantheon Memory Bank Rules

## Structure

```
docs/memory-bank/
├── 00-project.md              ← What is this project? (read first)
├── 01-active-context.md       ← Current sprint focus, blockers, next steps
├── 02-progress-log.md         ← Append-only milestone history
├── _notes/                    ← ADRs (architectural decisions, immutable)
│   ├── _index.md              ← Index of all ADRs
│   └── ADR-0001-topic.md      ← Single decision record
├── _tasks/                    ← Feature plans (temporary, deleted after merge)
│   └── feature-name/
│       ├── PLAN-*.md          ← Implementation plan
│       └── IMPL-*.md          ← Implementation notes
└── .tmp/                      ← Artifact files (gitignored, auto-cleaned)
    ├── PLAN-*.md
    ├── IMPL-*.md
    └── REVIEW-*.md
```

## File Types Explained

### ADR (Architecture Decision Record) — `_notes/ADR-NNNN-topic.md`

**What:** Documents a significant technical decision — the WHY, not the HOW.
**When to create:** When choosing between multiple viable approaches, or when a decision will outlast the sprint.
**When NOT to create:** Obvious choices, reversible decisions, single-function scope.

**Template:**
```markdown
# ADR-NNNN: Short Title

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNNN
**Date:** YYYY-MM-DD

## Context
What problem are we solving? What constraints exist? (2-3 sentences)

## Decision
What did we decide? Be specific. Use active voice: "We use X" not "X should be considered."

## Consequences
- Good: what becomes easier
- Bad: what becomes harder / trade-offs accepted

## Options Considered
### Option A (rejected)
- Why not chosen

### Option B (chosen) ✓
- Why chosen
```

**Rules:**
- Max 1 page (~50 lines)
- Never delete — mark as Deprecated or Superseded
- Link from code: `# See docs/memory-bank/_notes/ADR-0003-auth.md`
- Status flow: Proposed → Accepted → (Deprecated | Superseded)

### PLAN — `.tmp/PLAN-*.md` or `_tasks/*/PLAN-*.md`

**What:** Implementation plan for a feature — what to build, in what order.
**When to create:** When Athena plans a feature before implementation.
**Lifecycle:** Created during planning → Used during implementation → **Deleted after merge**.

**Rules:**
- Lives in `.tmp/` (gitignored) — not committed
- If user wants to keep it, move to `_tasks/feature-name/`
- Max 100 lines
- Contains: scope, tasks, dependencies, acceptance criteria

### NOTE — `_notes/NOTE-NNNN-topic.md`

**What:** Lightweight observation or convention — not significant enough for an ADR.
**When to create:** When discovering a pattern, gotcha, or team convention that isn't an architectural decision.
**Examples:** "Always use async session in FastAPI", "PostgreSQL JSONB for flexible schemas"

**Template:**
```markdown
# NOTE-NNNN: Short Title

**Date:** YYYY-MM-DD

## Observation
What was discovered or established.

## Rule
What agents should do going forward.
```

**Rules:**
- Max 25 lines
- Can be superseded by an ADR if the convention becomes significant
- Indexed in `_notes/_index.md`

### TASK — `_tasks/*/` directory

**What:** Feature-level work tracking — plans, implementation notes, wave summaries.
**When to create:** For complex multi-wave features that need structured tracking.
**Lifecycle:** Created at feature start → Updated during waves → **Archived or deleted after merge**.

**Rules:**
- One directory per feature: `_tasks/feature-name/`
- Contains: PLAN-*.md, IMPL-*.md, WAVE-*.md (if applicable)
- **NOT auto-loaded** — only read when auditing feature history
- Clean up after merge: delete or archive to git history

## What Goes Where

| Content | File Type | Location | Auto-loaded? |
|---|---|---|---|
| "What is this project?" | 00-project.md | Root | On-demand |
| "What are we working on now?" | 01-active-context.md | Root | On-demand (read first) |
| "What was delivered?" | 02-progress-log.md | Root | Append-only |
| "Why did we choose X over Y?" | ADR | `_notes/` | On-demand |
| "What pattern should we follow?" | NOTE | `_notes/` | On-demand |
| "How do we build this feature?" | PLAN | `.tmp/` or `_tasks/` | No |
| "What happened in wave 3?" | WAVE | `_tasks/` | No |

## Anti-Patterns (Don't Do This)

- ❌ Creating ADRs for obvious choices ("We use Python because it's popular")
- ❌ Writing plans that exceed 100 lines (split into phases)
- ❌ Keeping `.tmp/` files after merge (they're gitignored for a reason)
- ❌ Duplicating content from AGENTS.md or code into memory bank
- ❌ Maintaining delivery tables, commit counts, or progress percentages
- ❌ Creating `_tasks/` for simple single-file changes
- ❌ Writing "Last updated" dates (git has this)

## Token Budget

| File | Max Lines | Load Strategy |
|---|---|---|
| 00-project.md | 60 | On-demand |
| 01-active-context.md | 40 | On-demand (read first) |
| 02-progress-log.md | ∞ | Append-only (never read unless auditing) |
| Each ADR | 50 | On-demand |
| Each NOTE | 25 | On-demand |
| Each PLAN | 100 | No (gitignored) |
| _notes/_index.md | 30 | On-demand |

## Maintenance

- **After each feature merge:** Delete `.tmp/` artifacts, archive `_tasks/` if kept
- **Quarterly:** Review ADRs — mark Deprecated/Superseded as needed
- **When AGENTS.md changes:** Update 00-project.md if stack or architecture changed
- **When 01-active-context.md exceeds 40 lines:** Archive old items to 02-progress-log.md
