---
applyTo: '**'
name: "Memory Bank Standards"
description: "Memory strategy for mythic-agents: native /memories/ scopes + docs/memory-bank/ structure"
---

# Memory Bank Standards

> **Template/boilerplate** — not a prescriptive product structure.
> When adopting mythic-agents in a product, initialize your own `docs/memory-bank/` in that repo.

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

**This is the Memory Bank. It is permanent, versioned, and referenced by path from `copilot-instructions.md`.**

```
docs/memory-bank/
├── 00-overview.md           ← What is this project?
├── 01-architecture.md       ← System design, agent hierarchy
├── 02-components.md         ← Component breakdown
├── 03-tech-context.md       ← Tech stack, setup, environment
├── 04-active-context.md     ← Current sprint focus, recent decisions  ← most important
├── 05-progress-log.md       ← Completed milestones (append-only)
├── _tasks/                  ← Sprint task tracking (add when needed)
│   ├── _index.md
│   └── TASK0001-name.md
└── _notes/                  ← Architectural findings and decisions
    ├── _index.md
    └── NOTE0001-topic.md
```

**`04-active-context.md` is the priority file.** It is what `copilot-instructions.md` points to and what agents read first when starting a new feature.

### The session→active-context graduation pattern

```
During sprint        → /memories/session/sprint-plan.md   (ephemeral, in-conversation)
At sprint close      → docs/memory-bank/04-active-context.md  (permanent, in git)
                     → docs/memory-bank/05-progress-log.md    (appended)
```

---

## Agent Access Patterns

| Situation | What to read | Cost |
|-----------|-------------|------|
| Any task | `/memories/repo/` (automatic) | Zero — already in context |
| Current conversation plan | `/memories/session/sprint-plan.md` | One explicit read |
| Starting a new feature | `docs/memory-bank/04-active-context.md` | One explicit read |
| Onboarding to a new project | `docs/memory-bank/00-overview.md` + `04-active-context.md` | Two explicit reads |
| Architecture deep-dive | `docs/memory-bank/01-architecture.md` + relevant `_notes/` | Explicit reads |
| Historical decision rationale | `docs/memory-bank/_notes/NOTE000X-*.md` | One explicit read |

---

## Who Writes What

| Content | Written by | Where | When |
|---------|-----------|-------|------|
| Atomic facts (stack, commands, conventions) | Any agent | `/memories/repo/` | On discovery |
| Conversation plan / WIP | Athena or any agent | `/memories/session/` | Sprint start |
| Sprint context (active decisions, blockers) | Agent or Mnemosyne | `04-active-context.md` | Sprint close |
| Completed milestones | Agent or Mnemosyne | `05-progress-log.md` | Sprint close |
| Project overview and architecture | Mnemosyne (once) | `00-03.md` | Project adoption |
| Task records | Mnemosyne (on request) | `_tasks/TASK000X-*.md` | On request |
| Architectural decisions | Mnemosyne (on request) | `_notes/NOTE000X-*.md` | On request |

---

## Adopting in a Product

When using mythic-agents in a product repo:

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
Always read docs/memory-bank/04-active-context.md before answering.
Always read docs/memory-bank/00-overview.md for project scope.
```

> **Do NOT copy** `docs/memory-bank/` content from mythic-agents — it describes the framework itself, not your product.

---

## Maintenance Rules

- **Keep `04-active-context.md` current** — stale active context is worse than no context (agents make wrong assumptions)
- **`05-progress-log.md` is append-only** — never edit history, only add entries
- **`_notes/` decisions are immutable** — never edit a decision note; create a new one that supersedes it
- **Zero overhead rule** — if information can be found via a codebase search, do not duplicate it in the memory bank
- **Obsolete `/memories/repo/` facts must be replaced** — do not accumulate stale atomic facts
- **Session memory is disposable** — never depend on `/memories/session/` across conversations
