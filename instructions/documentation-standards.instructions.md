---
applyTo: '**'
name: "Documentation Standards"
description: 'Documentation Standards — Where, what, and how to document in Pantheon projects'
---

# Documentation Standards

## The Two-System Model

Three memory systems: **Memory Bank** (`.pantheon/memory-bank/`, team-owned, permanent/versioned), **Copilot Memory** (GitHub Cloud, 28d auto-expire), **Native `/memories/`** (any agent, session-scoped). Complementary — Memory Bank lives in git, agent memories are automatic/ephemeral. For full details see `skill: memory-bank`.

## The Golden Rule

**Never create `.md` files outside of `.pantheon/memory-bank/` or the explicitly allowed locations below.**

What is allowed outside `.pantheon/memory-bank/`:
- `README.md` — project overview (only if explicitly requested)
- `CONTRIBUTING.md` — contribution guidelines (only if explicitly requested)
- `.github/` — instructions, agents, skills, prompts (config only, never session output)

What is permanently forbidden:
- `ANALYSIS_*.md`, `SUMMARY_*.md`, `STATUS_*.md` anywhere in the repo
- Any `.md` file in the root created as session or task output
- Duplicating information that already exists in the Memory Bank

## Who Writes What

- Project overview, architecture, tech context → Mnemosyne → `00-project.md`
- Sprint focus, recent decisions → Agent / Mnemosyne → `01-active-context.md`
- Milestone completions → Any agent → `02-progress-log.md`
- Task records → Mnemosyne → `_tasks/TASK000X-*.md`
- Architecture decisions → Mnemosyne → `_notes/NOTE000X-*.md`
- Atomic facts (stack, commands, conventions) → Any agent → `/memories/repo/`
- Conversation-scoped plans → Athena / any agent → `/memories/session/`

## Documentation Workflow

**Automatic (no handoff):** agents write atomic facts on discovery, Athena writes sprint plans, any agent appends to `01-active-context.md` or `02-progress-log.md`. **Explicit (@mnemosyne):** project init, task records, architecture decisions, sprint close.

## Anti-Patterns

### ❌ Session output as files
Use `@mnemosyne Append to 02-progress-log.md` instead of creating standalone `.md` files.

### ❌ Mandatory automatic handoff after every phase
Agents append to `01-active-context.md` directly. Mnemosyne only at sprint close.

### ❌ Duplicating information
Atomic facts → `/memories/repo/` (auto-loaded). Narrative context → `00-project.md` (explicit read).

### ❌ Bypassing structure
Use `_notes/NOTE0001-topic.md` + update `_index.md`. No random files in memory-bank root.
