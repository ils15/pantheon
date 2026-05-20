---
applyTo: "agents/**/*.agent.md"
---

# Artifact Protocol

This instruction defines how agents produce and consume **structured artifacts**.

---

## Core Concept: Temp Folder

All ephemeral artifacts (PLAN, IMPL, REVIEW, DISC) are written to **`docs/memory-bank/.tmp/`** — a gitignored temporary folder that is automatically wiped:

- On `@mnemosyne Close sprint`
- On `@mnemosyne Clean tmp`
- Manually at any time

**This folder never gets committed to git.** It exists only during an active sprint.

Only **ADR artifacts** (`_notes/`) are permanent and committed.

```
docs/memory-bank/
├── .tmp/                  ← GITIGNORED — ephemeral artifacts live here
│   ├── PLAN-<feature>.md
│   ├── IMPL-phase1-hermes.md
│   ├── IMPL-phase1-aphrodite.md
│   ├── IMPL-phase1-demeter.md
│   └── REVIEW-<feature>.md
├── _notes/                ← COMMITTED — permanent ADRs only
│   └── ADR-<topic>.md
├── 01-active-context.md   ← COMMITTED
└── 02-progress-log.md     ← COMMITTED
```

---

## Who Generates Artifacts?

**Any agent that produces a phase output generates its own artifact** — not only Zeus.

| Situation | Generating agent | Artifact |
|---|---|---|
| `@athena` plans (with or without Zeus) | **Athena** | `PLAN-<feature>.md` |
| `@hermes` / `@aphrodite` / `@demeter` implement | **The worker** | `IMPL-phase<N>-<agent>.md` |
| `` reviews | **Themis** | `REVIEW-<feature>.md` |
| `@agora` council / `#runSubagent Explore` | **Agora / Explore** | `DISC-<topic>.md` |
| Architectural decision (any agent) | **Any → Mnemosyne** | `ADR-<topic>.md` (permanent) |

> [!IMPORTANT]
> **Zeus does NOT generate artifacts.** He orchestrates agents that generate them.
> **`@apollo` direct** is chat-only discovery and does NOT generate artifacts.

---

## Artifact Types

| Prefix | Location | Ephemeral? | Produced by |
|---|---|---|---|
| `PLAN-` | `.tmp/` | ✅ Deleted on sprint close | Athena |
| `IMPL-` | `.tmp/` | ✅ Deleted on sprint close | Hermes / Aphrodite / Demeter |
| `REVIEW-` | `.tmp/` | ✅ Deleted on sprint close | Themis |
| `DISC-` | `.tmp/` | ✅ Deleted on sprint close | Agora (council) / Apollo (`#runSubagent`) |
| `ADR-` | `_notes/` | ❌ Permanent, never deleted | Any agent |

---

## How to Create an Artifact

Agent calls Mnemosyne to write to `.tmp/`:

```
@mnemosyne Create artifact: PLAN-<feature> with the following content:
[plan content here]
```

Mnemosyne writes `docs/memory-bank/.tmp/PLAN-<feature>.md`.

---

## Artifact Lifecycle

```
Agent produces phase output
    │
    ├─ "@mnemosyne Create artifact: PLAN-<feature>"
    │
    ├─ Mnemosyne writes to docs/memory-bank/.tmp/PLAN-<feature>.md
    │
    ├─ ⏸️ Human reads the file and approves
    │
    └─ On sprint close:
        "@mnemosyne Close sprint" → wipes entire .tmp/ folder
```

---

## Artifact Templates

### PLAN (Athena → `.tmp/`)

```markdown
# PLAN-<feature>
**Date:** YYYY-MM-DD  **Status:** Awaiting Approval

## Goal
[One sentence]

## Phases
1. Phase 1 — @hermes
2. Phase 2 — @aphrodite (parallel)
3. Phase 3 — @demeter

## Risks
- [Risk]

## Open Questions (requires your judgment)
- [ ] [Question]
```

### IMPL (Worker → `.tmp/`)

```markdown
# IMPL-<phase>-<agent>
**Date:** YYYY-MM-DD  **Status:** Awaiting Themis Review

## What Was Implemented
- [file] — [what changed]

## Tests
- ✅ X tests / Coverage: Y%

## Notes for Themis
[Area needing extra scrutiny]
```

### REVIEW (Themis → `.tmp/`)

```markdown
# REVIEW-<feature>
**Date:** YYYY-MM-DD  **Status:** APPROVED | NEEDS_REVISION | FAILED

## Verdict
[APPROVED | NEEDS_REVISION | FAILED]

## Issues
- CRITICAL: X / HIGH: Y / MEDIUM: Z

## 🔍 Human Review Focus (requires your judgment)
1. [Item AI cannot fully validate]
2. [Item 2]
```

### DISC (Agora → `.tmp/`)

```markdown
# DISC-<topic>
**Date:** YYYY-MM-DD  **Status:** AWAITING_APPROVAL

## Question
[The original question]

## Specialist Perspectives
[Table: Agent | Position | Reasoning | Trade-offs | Risks | Confidence]

## Agreements
[Where 2+ agents converged]

## Divergences
[Table: Issue | Position A | Position B | Resolution]

## Decision Log
[Table: Decision | Chosen | Rejected Alternatives | Trade-off | Trigger to Revert]

## Recommendation
[Decisive conclusion]

## Decision Gate
**Status:** AWAITING_APPROVAL
Choose: **APPROVE** | **REQUEST CHANGES** | **DISCARD**
```

---

## Human Pause Points

1. **After DISC** → user reads `.tmp/DISC-<topic>.md` and chooses APPROVE / REQUEST CHANGES / DISCARD
2. **After PLAN** → user reads `.tmp/PLAN-<feature>.md` and approves
3. **After REVIEW** → user reads `.tmp/REVIEW-<feature>.md` and validates Human Review Focus items
4. **Before git commit** → user executes manually

---

## Parallel Execution Declaration

```
🔀 PARALLEL EXECUTION — Phase 2
Running simultaneously:
- @hermes   → backend tests   → .tmp/IMPL-phase2-hermes.md
- @aphrodite → frontend       → .tmp/IMPL-phase2-aphrodite.md
- @demeter     → migrations      → .tmp/IMPL-phase2-demeter.md
Themis reviews all three after completion.
```

---

## Cleanup Commands

```
# Wipe .tmp/ entirely (sprint close)
@mnemosyne Close sprint: [summary]

# Wipe .tmp/ without closing sprint
@mnemosyne Clean tmp

# Check what's in .tmp/
@mnemosyne List artifacts
```

---

**Reference:** `instructions/artifact-protocol.instructions.md`
