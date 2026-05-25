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
