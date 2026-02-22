---
applyTo: '**'
name: "Documentation Standards"
description: 'Documentation Standards — Where, what, and how to document in mythic-agents projects'
---

# Documentation Standards

## The Two-System Model

| System | Where | Owner | Lifetime | Purpose |
|--------|-------|-------|----------|---------|
| **Memory Bank** | `docs/memory-bank/` | You (the team) | Permanent, versioned | Project context: architecture, patterns, progress |
| **Copilot Memory** | GitHub Cloud (server-side) | Copilot | 28 days, auto-expires | What the agent learned from PRs, code review, CLI |
| **Native `/memories/`** | VS Code Copilot Chat | Any agent | Repo/session/user scoped | Atomic facts and conversation-scoped plans |

These three systems are complementary. The Memory Bank is **yours** — you write it, it lives in git, and `copilot-instructions.md` points to it by path. The agent memory systems are automatic or ephemeral.

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

## Memory Bank Structure

This is the **recommended template** for product repos adopting mythic-agents. Copy it once, fill it incrementally.

```
docs/memory-bank/
├── 00-overview.md           ← What is this project? (fill once)
├── 01-architecture.md       ← System design and agent hierarchy (fill once, update rarely)
├── 02-components.md         ← Component breakdown and ownership (update as components are added)
├── 03-tech-context.md       ← Tech stack, setup, environment (fill once)
├── 04-active-context.md     ← Current sprint focus, recent decisions, blockers (update each sprint)
├── 05-progress-log.md       ← What works, what is left, completed milestones (append-only)
├── _tasks/
│   ├── _index.md            ← Task master list with status
│   └── TASK0001-name.md     ← Individual task record
└── _notes/
    ├── _index.md            ← Notes index
    └── NOTE0001-topic.md    ← Architectural decisions, patterns, findings
```

**`04-active-context.md` is the most important file** — it is what `copilot-instructions.md` points to. Keep it current.

### File purposes

| File | Fill when | Update frequency |
|------|-----------|-----------------|
| `00-overview.md` | Project start | Rarely |
| `01-architecture.md` | Project start | On significant architecture changes |
| `02-components.md` | Project start | When components are added/removed |
| `03-tech-context.md` | Project start | On stack changes |
| `04-active-context.md` | Each sprint start | Each sprint / major decision |
| `05-progress-log.md` | First completion | Append-only after each milestone |
| `_tasks/` | When sprint tracking is needed | Per task |
| `_notes/` | On significant findings | Per finding |

---

## Who Writes What

| Content | Written by | Where |
|---------|-----------|-------|
| Project overview, architecture, tech context | Mnemosyne (at project init) | `00-03.md` |
| Sprint focus, recent decisions | Agent completing sprint / Mnemosyne | `04-active-context.md` |
| Milestone completions | Any agent or Mnemosyne | `05-progress-log.md` (append) |
| Task records | Mnemosyne (from handoff) | `_tasks/TASK000X-*.md` |
| Architecture decisions with rationale | Mnemosyne (from handoff) | `_notes/NOTE000X-*.md` |
| Atomic facts (stack, commands, conventions) | Any agent (directly) | `/memories/repo/` |
| Conversation-scoped plans | Athena / any agent (directly) | `/memories/session/` |

**Mnemosyne is the quality owner of `docs/memory-bank/`** — she enforces structure and writes when asked. Other agents may write to `04-active-context.md` and `05-progress-log.md` directly when Mnemosyne is not invoked.

---

## Session Memory → Active Context Graduation

Plans and work-in-progress live in `/memories/session/` during a conversation. At sprint close, the relevant parts graduate to `docs/memory-bank/`.

```
During sprint:
  Athena writes plan → /memories/session/sprint-plan.md   (ephemeral)
  Agents track wip  → /memories/session/wip.md            (ephemeral)

At sprint close:
  @mnemosyne Update 04-active-context.md and append to 05-progress-log.md
  → docs/memory-bank/04-active-context.md                 (permanent)
  → docs/memory-bank/05-progress-log.md                   (permanent, appended)
```

Session memory is never promoted to `_tasks/` or `_notes/` automatically — that requires an explicit handoff.

---

## Documentation Workflow

### Automatic (no handoff needed)
- Any agent writes atomic facts to `/memories/repo/` on discovery
- Athena writes sprint plan to `/memories/session/` at planning phase start
- Any agent appends to `04-active-context.md` or `05-progress-log.md` after completing work

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
@mnemosyne Append to 05-progress-log.md: [summary of what was completed]
```

### ❌ Mandatory automatic handoff after every phase
```
# Wrong (creates overhead, Mnemosyne becomes a bottleneck)
After every Hermes/Aphrodite/Maat phase → always handoff to @mnemosyne

# Right
After every phase → agent appends to 04-active-context.md directly
At sprint close → explicit @mnemosyne invocation to consolidate
```

### ❌ Duplicating information
```
# Wrong
Write the tech stack in 03-tech-context.md AND in /memories/repo/stack.json

# Right
Write atomic facts to /memories/repo/ (auto-loaded, zero token cost)
Write narrative context to 03-tech-context.md (explicit read, for humans and deep context)
```

### ❌ Bypassing structure
```
# Wrong
Create docs/memory-bank/my-random-notes.md

# Right
Create docs/memory-bank/_notes/NOTE0001-topic.md
Update docs/memory-bank/_notes/_index.md
```
