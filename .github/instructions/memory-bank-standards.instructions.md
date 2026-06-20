---
applyTo: '**'
name: "Memory Bank Standards"
description: "Memory strategy for Pantheon: native /memories/ scopes + docs/memory-bank/ structure"
---

# Memory Bank Standards

> **Template/boilerplate** — not a prescriptive product structure.
> When adopting Pantheon in a product, initialize your own `docs/memory-bank/` in that repo.

---

## Memory Architecture

Two complementary systems. Use each for what it was designed for.

---

### Primary: VS Code Native Memory — `/memories/`

The main agent memory system. Agents use it directly — no Mnemosyne handoff needed.

| Scope | Path | Loading | Use for |
|-------|------|---------|---------|
| **User** | `/memories/` | Auto (first 200 lines) | User preferences, general patterns |
| **Session** | `/memories/session/` | Listed in context; explicit read | Conversation plans, work-in-progress |
| **Repository** | `/memories/repo/` | Auto-loaded | Atomic facts: stack, commands, conventions |

#### `/memories/repo/` — Permanent repository facts

Any agent writes here on discovery. No handoff needed.

```json
{
  "subject": "Tech stack",
  "fact": "FastAPI 0.115 + SQLAlchemy 2.0 + Alembic + React 18 + TypeScript strict",
  "citations": ["pyproject.toml", "package.json"],
  "reason": "Runtime context for all implementation agents",
  "category": "tech-stack"
}
```

#### `/memories/session/` — Conversation plans and WIP

Plans, findings, and work-in-progress live here during a conversation. Discarded when the conversation ends.

```
Sprint plan     → /memories/session/sprint-plan.md   (not in docs/)
Apollo findings → /memories/session/apollo-findings.md
❌ Never create plan.md or phase-N.md in the repository
```

---

### Secondary: `docs/memory-bank/` — Persistent Project Context

See `instructions/documentation-standards.instructions.md` for the structure, golden rules, agent access patterns, and who-writes-what.

See `skills/memory-bank/SKILL.md` for optimization/compression rules and maintenance commands.

---

## Adopting in a Product

When using Pantheon in a product repo:

```bash
# Copy the framework (agents, instructions, prompts, skills)
cp -r agents/ instructions/ prompts/ skills/ /path/to/your-product/

# Bootstrap an empty memory bank
mkdir -p docs/memory-bank/_tasks docs/memory-bank/_notes docs/memory-bank/decisions
touch docs/memory-bank/_tasks/.gitkeep docs/memory-bank/_notes/.gitkeep

# Initialize
# @mnemosyne Initialize the memory bank for this repository
```

Add to your `.github/copilot-instructions.md`:
```markdown
Always read docs/memory-bank/01-active-context.md before answering.
Always read docs/memory-bank/00-project.md for project scope.
```

> **Do NOT copy** `docs/memory-bank/` content from Pantheon — it describes the framework itself, not your product.

---

## Maintenance Rules

- **Keep `01-active-context.md` current** — stale active context is worse than no context (agents make wrong assumptions)
- **`02-progress-log.md` is append-only** — never edit history, only add entries
- **`_notes/` decisions are immutable** — never edit a decision note; create a new one that supersedes it
- **Zero overhead rule** — if information can be found via a codebase search, do not duplicate it in the memory bank
- **Obsolete `/memories/repo/` facts must be replaced** — do not accumulate stale atomic facts
- **Session memory is disposable** — never depend on `/memories/session/` across conversations

---

## Compression & Recovery

The `context-compression` skill automatically compresses completed phase artifacts into the memory bank.

### Compressed Content Location
- **Completed subtask_summaries (CRITICAL)**: 3-line expanded entries in `01-active-context.md`
- **Completed subtask_summaries (MEDIUM)**: 1-line table rows in `01-active-context.md`
- **Completed subtask_summaries (LOW)**: 0.5-line (filename only) in `01-active-context.md`
- **ZZ phase context**: Full compressed context in `docs/memory-bank/.tmp/ZZ-phase<N>-context.md`
- **Archived IMPL artifacts**: Structured entries in `02-progress-log.md`
- **Cross-references**: Entity/decision index in `_xref/index.md`

### Size Budgets
- `01-active-context.md`: 100 lines max for `## Completed Phases` (enforced by budget allocation)
- `02-progress-log.md`: Keep last 30 entries. Older entries archived at sprint close
- `_xref/index.md`: Append-only, max 500 entries (prune oldest at sprint close)

### Recovery
All compression is lossless — git preserves every intermediate state:
```bash
git log -p docs/memory-bank/01-active-context.md    # view all changes
git show <sha>:docs/memory-bank/01-active-context.md  # restore specific version
```

### What NEVER gets compressed
- `_notes/` (ADR notes — permanent, immutable)
- Active PLAN artifacts (current sprint plan)
- REVIEW artifacts with NEEDS_REVISION or FAILED verdict
- subtask_summaries with in_progress, escalated, or blocked status
