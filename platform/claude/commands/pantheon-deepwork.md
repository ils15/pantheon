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

## ⚡ Full-Auto Mode (`--full-auto`)

> ⚠️ **WARNING:** This bypasses human review gates. Only for experienced operators. Tier 1 gates (plan, commit, deploy) still require human approval.

New in v4.0 — **Ultrawork-style execution**. When `--full-auto` is passed:

- **All gates auto-approve** — no waiting for Themis approval between phases
- Only stops if Themis returns a **BLOCKING** verdict
- Equivalent to the "ultrawork" paradigm from OMO (one-minute-optimization)
- Checkpoints still saved at every phase boundary
- Use for: high-confidence tasks, batch processing, experienced operators

```
/pantheon-deepwork --full-auto "Refactor auth service to use JWT"   # Full auto mode
/pantheon-deepwork --full-auto --resume auth-jwt                     # Resume in full-auto
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
/pantheon-deepwork "Add user authentication with OAuth2"         # Start new deepwork session
/pantheon-deepwork --resume auth-oauth2                           # Resume interrupted session
/pantheon-deepwork --status auth-oauth2                           # Show progress
/pantheon-deepwork --list                                         # List all tasks
/pantheon-deepwork --archive auth-oauth2                          # Archive completed task
/pantheon-deepwork --full-auto "Refactor auth service"            # Full auto (ultrawork mode)
/pantheon-deepwork --full-auto --resume auth-refactor             # Resume full-auto session
```

## Safety

- All progress persisted — work is never lost
- Each phase gated by Themis — quality enforced at every step
- Explicit resume required — won't auto-continue without user intent (unless `--full-auto`)
- `.pantheon/deepwork/` is gitignored — no accidental commits

---

## Related: `/pantheon-praxis` (merged)

`/pantheon-praxis` was merged into `/pantheon-deepwork` in v4.0. Use `/pantheon-deepwork` for all multi-phase execution.

For ad-hoc single-phase execution, use normal agent delegation (`@hermes`, `@aphrodite`, etc.) directly.
