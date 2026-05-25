---
applyTo: '**'
name: "Documentation Standards"
description: 'Documentation Standards — Where, what, and how to document in Pantheon projects'
---

# Documentation Standards

## The Two-System Model

| System | Where | Owner | Lifetime | Purpose |
|--------|-------|-------|----------|---------|
| **Memory Bank** | `docs/memory-bank/` | You (the team) | Permanent, versioned | Project context: architecture, patterns, progress |
| **Copilot Memory** | GitHub Cloud (server-side) | Copilot | 28 days, auto-expires | What the agent learned from PRs, code review, CLI |
| **Native `/memories/`** | VS Code Copilot Chat | Any agent | Repo/session/user scoped | Atomic facts and conversation-scoped plans |

These three systems are complementary. The Memory Bank is **yours** — you write it, it lives in git, and `copilot-instructions.md` points to it by path. The agent memory systems are automatic or ephemeral.

For full details on Memory Bank structure, see `instructions/memory-bank-standards.instructions.md`.

---

## The Golden Rule

**Never create `.md` files outside of `docs/memory-bank/` or the explicitly allowed locations below.**

What is allowed outside `docs/memory-bank/`:
- `README.md` — project overview (only if explicitly requested)
- `CONTRIBUTING.md` — contribution guidelines (only if explicitly requested)
- `.github/` — instructions, agents, skills, prompts (config only, never session output)

What is permanently forbidden:
- `ANALYSIS_*.md`, `SUMMARY_*.md`, `STATUS_*.md` anywhere in the repo
- Any `.md` file in the root created as session or task output
- Duplicating information that already exists in the Memory Bank

---

## Who Writes What

| Content | Written by | Where |
|---------|-----------|-------|
| Project overview, architecture, tech context | Mnemosyne (at project init) | `00-project.md` |
| Sprint focus, recent decisions | Agent completing sprint / Mnemosyne | `01-active-context.md` |
| Milestone completions | Any agent or Mnemosyne | `02-progress-log.md` (append) |
| Task records | Mnemosyne (from handoff) | `_tasks/TASK000X-*.md` |
| Architecture decisions with rationale | Mnemosyne (from handoff) | `_notes/NOTE000X-*.md` |
| Atomic facts (stack, commands, conventions) | Any agent (directly) | `/memories/repo/` |
| Conversation-scoped plans | Athena / any agent (directly) | `/memories/session/` |

---

## Documentation Workflow

### Automatic (no handoff needed)
- Any agent writes atomic facts to `/memories/repo/` on discovery
- Athena writes sprint plan to `/memories/session/` at planning phase start
- Any agent appends to `01-active-context.md` or `02-progress-log.md` after completing work

### Explicit (invoke @mnemosyne)
- Project initialization: `@mnemosyne Initialize memory bank for this repo`
- Task record: `@mnemosyne Create TASK for the JWT implementation we just completed`
- Architecture decision: `@mnemosyne Document decision: using Redis instead of DB sessions`
- Sprint close: `@mnemosyne Update active context and progress log for this sprint`

---

## Anti-Patterns

### ❌ Session output as files
```
# Wrong
Create IMPLEMENTATION_SUMMARY.md with what we did
Create STATUS.md with progress

# Right
@mnemosyne Append to 02-progress-log.md: [summary of what was completed]
```

### ❌ Mandatory automatic handoff after every phase
```
# Wrong (creates overhead, Mnemosyne becomes a bottleneck)
After every Hermes/Aphrodite/Demeter phase → always handoff to @mnemosyne

# Right
After every phase → agent appends to 01-active-context.md directly
At sprint close → explicit @mnemosyne invocation to consolidate
```

### ❌ Duplicating information
```
# Wrong
Write the tech stack in 00-project.md AND in /memories/repo/stack.json

# Right
Write atomic facts to /memories/repo/ (auto-loaded, zero token cost)
Write narrative context to 00-project.md (explicit read, for humans and deep context)
```

### ❌ Bypassing structure
```
# Wrong
Create docs/memory-bank/my-random-notes.md

# Right
Create docs/memory-bank/_notes/NOTE0001-topic.md
Update docs/memory-bank/_notes/_index.md
```
