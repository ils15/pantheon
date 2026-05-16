---
name: todo-continuation
description: "Safe auto-continue pattern for multi-step orchestration — how to automatically work through todo lists without unnecessary interruptions while always stopping at mandatory safety gates (plan approval, phase review, git commit). Prevents both premature stopping and runaway execution."
context: fork
argument-hint: "Multi-step task or epic where automatic continuation through todos is needed"
globs: []
alwaysApply: false
---

# Todo Continuation — Safe Auto-Continue

Use this skill to implement disciplined automatic continuation through multi-step tasks. The goal is to eliminate unnecessary pause points while preserving the three mandatory safety gates.

---

## The Core Principle

> **Auto-continue through unambiguous work. Stop only at real decision points.**

Most agent pauses are unnecessary. If a todo is unambiguous and the next action is clear, execute it without asking. Reserve pauses for the three gates where human judgment genuinely matters.

---

## Mandatory Gates (ALWAYS STOP)

These three gates are non-negotiable. Never skip them:

| Gate | When | Why |
|---|---|---|
| **GATE 1 — Plan Approval** | After Athena produces a plan | User must confirm scope, phases, and approach before any code is written |
| **GATE 2 — Phase Review** | After Themis reviews an implementation phase | User must see what changed before continuing to the next phase |
| **GATE 3 — Git Commit** | After each phase is approved | User controls when code is committed; no auto-commit ever |

---

## Auto-Continue Rules

Between gates, apply these rules:

### Continue automatically when:
- The next todo is a direct consequence of completing the current one
- The action is reversible (file edits, tests, linting)
- The scope is within the approved plan
- No new ambiguity has emerged

### Stop and ask when:
- A todo requires a decision not covered by the plan
- An unexpected error changes the approach
- A dependency is missing or broken
- The user's intent becomes unclear
- A task would take more than the remaining `steps` budget

---

## Implementation Pattern

When running a multi-step task:

```
1. Create todos for all planned steps at the start
2. Mark the first todo in_progress
3. Complete the work
4. Mark it completed immediately
5. Mark the next todo in_progress
6. Repeat — do NOT ask "should I continue?" between clear sequential steps
7. Stop at Gate 1, Gate 2, or Gate 3
8. After gate approval, resume with the next todo
```

**Never batch-complete todos.** Mark each one completed as soon as it's done.

---

## Cooldown Pattern

For long orchestration sessions, add a brief synthesis step between phases to prevent context drift:

```
Phase N complete. Summary before continuing:
- What was done: <2 bullet points>
- What changed: <files modified>
- What's next: <Gate 2 review OR next phase>
```

This 3-line summary costs nothing but prevents silent drift in long sessions.

---

## Safety Checks

Before auto-continuing to the next step, verify:

- [ ] The previous step completed successfully (tests pass, no errors)
- [ ] The next step is within the approved plan scope
- [ ] No new blocking issues emerged (compilation errors, test failures)
- [ ] The `steps` counter has sufficient budget remaining

If any check fails, stop and report the issue before continuing.

---

## Example: Good vs Bad Continuation

**Bad (stops unnecessarily):**
```
✅ Wrote the migration file.
Should I now run the migration tests? [waiting for user]
```

**Good (auto-continues):**
```
✅ Wrote the migration file.
→ Running migration tests...
✅ Tests pass (3/3).
→ Next: write the UserRepository query methods.
```

**Good (stops correctly at Gate 2):**
```
✅ Phase 1 complete: migration + repository layer.
⏸️ GATE 2 — Themis review summary:
  - Coverage: 87% ✅
  - No OWASP issues ✅
  - 2 style warnings (non-blocking)
Ready for Phase 2? Waiting for your go-ahead.
```

---

## Scope of This Pattern

This pattern applies to:
- Zeus orchestrating multi-phase features
- Hermes/Aphrodite/Demeter running TDD cycles (RED→GREEN→REFACTOR auto-continues without stopping)
- Apollo running parallel searches (never stops mid-search to ask)
- Talos fixing bugs (completes the fix, runs tests, then reports once)

It does **not** apply to:
- Athena planning (always presents the plan for approval — that IS Gate 1)
- Iris opening PRs (always confirms before pushing)
- Any destructive operation (rm, DROP TABLE, force-push — always ask)
