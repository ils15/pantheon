---
description: "Start a heavy multi-phase task with persisted checkpoints, phased specialist dispatch, and Themis review gates. Progress saved to .pantheon/deepwork/ for resumability. Usage: /pantheon-deepwork"
agent: "zeus"
---
# /pantheon-deepwork — Heavy Task Workflow

**What:** Starts a structured, checkpointed workflow for complex multi-step tasks. Progress is persisted to `.pantheon/deepwork/<task-slug>/` so work can resume if interrupted. Each phase is gated by Themis review.

## When to Use

- Tasks expected to take 10+ turns
- Multi-agent orchestration with dependencies
- Work that spans multiple sessions
- Anything where losing context mid-way would be costly

## When NOT to Use

- Simple fixes (use @talos)
- Single-file changes (use /subtask)
- Tasks completable in < 5 turns (use normal delegation)

## Workflow

```
Phase 0: SCOPING
  └─ Zeus + Athena define task scope, phases, and acceptance criteria
  └─ Output: .pantheon/deepwork/<slug>/PLAN.md

Phase 1: DISCOVERY
  └─ @apollo maps relevant codebase areas
  └─ Output: .pantheon/deepwork/<slug>/DISCOVERY.md

Phase 2-N: IMPLEMENTATION (parallel per phase)
  └─ @hermes / @aphrodite / @demeter implement phase scope
  └─ Output: .pantheon/deepwork/<slug>/phase-<N>-<agent>.md

GATE after each phase:
  └─ @themis reviews phase output
  └─ FAIL → fix and re-submit
  └─ PASS → continue to next phase

Phase FINAL: VERIFICATION
  └─ @themis full integration review
  └─ All tests pass, coverage >80%
  └─ Output: .pantheon/deepwork/<slug>/REVIEW.md
```

## Checkpoint System

Each phase writes a checkpoint file. If work is interrupted:

```
/pantheon-deepwork --resume <slug>    # Resume from last checkpoint
/pantheon-deepwork --status <slug>    # Show current progress
/pantheon-deepwork --list             # List all deepwork tasks
```

Checkpoint files:

```
.pantheon/deepwork/<slug>/
├── PLAN.md                  # Scope and phase plan
├── DISCOVERY.md             # Codebase map
├── phase-1-hermes.md        # Phase 1 backend work
├── phase-1-aphrodite.md     # Phase 1 frontend work
├── phase-1-review.md        # Phase 1 Themis review
├── phase-2-*.md             # Subsequent phases
├── REVIEW.md                # Final Themis review
└── STATUS.md                # Current state (phase, progress, blockers)
```

## Anti-Stall Integration

Deepwork automatically applies:

- **Stall Detection Protocol** — 3 turns no progress → escalate
- **Phase Reminder** — after each dispatch, continue only independent work
- **Progress Checkpoint** — every 5 turns, summarize completed vs remaining
- **Delegate Retry** — delegation failures retried once with rephrased prompt

If a phase stalls:

1. Checkpoint current progress
2. Report to user: "Phase [N] stalled. Progress saved. Options: (a) retry with different approach, (b) simplify scope, (c) skip phase and revisit."

## Usage

```
/pantheon-deepwork "Add user authentication with OAuth2"     # Start new deepwork session
/pantheon-deepwork --resume auth-oauth2                       # Resume interrupted session
/pantheon-deepwork --status auth-oauth2                       # Show progress
/pantheon-deepwork --list                                     # List all tasks
/pantheon-deepwork --archive auth-oauth2                      # Archive completed task
```

## Safety

- All progress persisted — work is never lost
- Each phase gated by Themis — quality enforced at every step
- Explicit resume required — won't auto-continue without user intent
- `.pantheon/deepwork/` is gitignored — no accidental commits
