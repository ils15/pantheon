---
name: session-goal
description: "Pin a session objective so all todos, delegation decisions, and verification steps stay aligned with a single stated goal. Prevents scope creep and drift across long multi-agent sessions."
context: fork
globs: []
alwaysApply: false
---

# Session Goal — Alignment Anchor

Use this skill to pin a session objective at the start of a long or complex session. All subsequent todos, delegation decisions, and verification steps must align with the pinned goal.

---

## Usage

Invoke via the `/focus` command:

```
/focus Implement JWT authentication with refresh token rotation
```

Or state it explicitly at the start of a session:

```
SESSION GOAL: Add product review feature with backend, frontend, and database layers.
All work in this session must serve this goal.
```

---

## What Pinning a Goal Does

1. **Focuses todos** — every todo added must relate to the goal
2. **Focuses delegation** — Zeus only invokes agents relevant to the goal
3. **Focuses verification** — Themis checks that implementations serve the goal
4. **Surfaces drift** — if a task drifts from the goal, flag it before proceeding

---

## Goal Format

A good session goal has 4 components:

```
GOAL: <What to build>
SCOPE: <Which layers/modules are in scope>
SUCCESS CRITERIA: <How we know it's done>
OUT OF SCOPE: <What to explicitly exclude>
```

**Example:**
```
GOAL: Add email verification to the registration flow
SCOPE: Backend (POST /auth/verify, token model), Frontend (VerifyEmail page), DB (verification_tokens table)
SUCCESS CRITERIA: User can register, receive a verification email link, click it, and have their account marked as verified. All layers tested >80% coverage.
OUT OF SCOPE: Password reset, 2FA, email template design
```

---

## Alignment Check Pattern

Before each major delegation or decision, run this quick check:

> "Does this task directly serve the pinned goal?"
> - **Yes** → proceed
> - **Partial** → flag the out-of-scope portion and ask for clarification
> - **No** → defer to a future session, note it as a separate task

---

## Cross-Session Persistence

For goals that span multiple sessions, write the goal to `/memories/session/`:

```
/memories/session/current-goal.md

# Active Session Goal
Goal: Implement JWT authentication
Started: 2026-05-15
Status: Phase 2 of 3 (backend done, frontend in progress)
Next: POST /auth/refresh endpoint
```

This ensures the goal survives context compaction and session restarts.

---

## When to Update the Goal

- When the user explicitly redirects the session
- When a phase completes and the next phase has a different scope
- When an unexpected blocker changes the scope

Never silently drift from the goal — always confirm with the user before changing it.
