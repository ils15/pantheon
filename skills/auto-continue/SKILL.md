---
name: auto-continue
description: "Auto-continue through todos with idle detection and safety gates. Use for multi-step orchestration."
context: fork
globs: []
alwaysApply: false
---

# Auto-Continue & Relentless Mode

Disciplined automatic continuation through multi-step tasks. Eliminates unnecessary pauses while preserving mandatory safety gates. Includes aggressive relentless mode for autonomous execution.

---

## Core Principle

> **Auto-continue through unambiguous work. Stop only at real decision points.**

---

## Mandatory Gates (ALWAYS STOP)

| Gate | Trigger | What happens |
|---|---|---|
| **GATE 0 — Agora Gate** | Agora outputs `AWAITING_APPROVAL` OR `## 🏛️ Agora Council` synthesis block appears | **HARD STOP.** Do not call any tool, do not continue any todo, do not suggest next steps. Wait for user to type: APPROVE / REQUEST CHANGES / DISCARD. "ok", "yes", "sure", "continue" are NOT valid. |
| **GATE 1 — Plan Approval** | Athena generates a plan | User confirms scope before code is written |
| **GATE 2 — Phase Review** | Themis reviews implementation | User sees changes before next phase |
| **GATE 3 — Git Commit** | After each phase is approved | User controls git history; no auto-commit |

> **Agora is always GATE 0**: any response containing `AWAITING_APPROVAL` or a `## 🏛️ Agora Council` block overrides all auto-continue rules, including relentless mode.

---

## Auto-Continue Rules

**Continue automatically when:**
- Next todo is a direct consequence of the current one
- Action is reversible (file edits, tests, linting)
- Scope is within the approved plan
- No new ambiguity has emerged

**Stop and ask when:**
- A todo requires a decision not covered by the plan
- An unexpected error changes the approach
- A dependency is missing or broken
- A task would exceed remaining `steps` budget

---

## Relentless Mode (Aggressive Auto-Continue)

**Activation:** Type `relentless-mode "task description"` in chat (text activation, not a registered command)

**When to use:** Complex multi-step tasks (5+ todos), autonomous execution needed.

**How it works:**
```
User invokes relentless mode
  ↓
Agent creates todos and starts working
  ↓
Agent goes idle with incomplete todos
  ↓
Hook injects: "[SYSTEM REMINDER] Complete ALL todos before responding"
  ↓
Agent resumes work
  ↓
Loop ends when: <promise>DONE</promise> detected OR user cancels
```

**DONE Detection:** Loop ends only when `<promise>DONE</promise>` appears in response.

**Cancellation:** `/stop-continuation` (all) or `/stop-continuation --relentless` (relentless only), or `Esc×2`

**Relentless respects all 4 safety gates** — auto-continues BETWEEN gates, not THROUGH them.

---

## Implementation Pattern

```
1. Create todos for all steps at start
2. Mark first todo in_progress
3. Complete work → mark completed immediately
4. Mark next todo in_progress → repeat
5. Do NOT ask "should I continue?" between clear steps
6. Stop at Gate 1, 2, or 3
7. After gate approval, resume with next todo
```

**Never batch-complete todos.** Mark each completed as soon as done.

---

## Safety Checks Before Continuing

- [ ] Previous step completed successfully (tests pass, no errors)
- [ ] Next step is within approved plan scope
- [ ] No new blocking issues emerged
- [ ] `steps` counter has sufficient budget remaining

---

## Cooldown Pattern

Between phases, execute a brief synthesis handoff to prevent context drift and prepare the next phase:

### Phase Summary Template
```
Phase N complete. Summary:
- What was done: <2 bullet points>
- What changed: <files modified>
- What's next: <Gate 2 review OR next phase>
- Will continue: <YES / after gate approval>
```

### Cooldown Rules
1. **Between parallel waves (no dependency):** No cooldown needed — wave results are independent
2. **Between sequential waves (with dependency):** Always run cooldown — dependencies may have changed context
3. **After Themis review (GATE 2):** Cooldown is mandatory — review findings may change the plan
4. **Session reuse check:** Before starting next phase, check if a specialist session from a previous phase can be reused (see session-goal skill)

### Relentless Mode Cooldown
In relentless mode, the cooldown is abbreviated to one line:
```
→ Phase N done. Next: Phase N+1. [auto-continuing]
```
Only expand to full cooldown when hitting a mandatory gate.

---

## Timeout & Retry Enforcement

When a delegated agent does not respond in time, enforce the timeout policy from routing.yml.

### Behavior by Agent Role

| Agent Role | Timeout | Retry Policy | Fallback | Timeout Parcial? |
|------------|---------|-------------|----------|------------------|
| Explorer (apollo) | 60s | 2 retries, exponential backoff | athena | ✅ Yes — partial results OK |
| Implementer (hermes, aphrodite) | 180s | 3 retries, exponential backoff | talos | ❌ No — must produce artifact |
| Reviewer (themis) | 120s | 2 retries, exponential backoff | zeus | ❌ No — must produce verdict |
| Infrastructure (prometheus) | 300s | 2 retries, exponential backoff | hermes | ❌ No |
| Hotfix (talos) | 30s | 1 retry, no backoff | hermes | ✅ Yes — one-liner fix OK |


### Timeout Parcial (Partial Results)

Timeout parcial is **only** allowed for read-only, independent agents:
- ✅ @apollo (codebase search) — can return partial file list
- ✅ @gaia (literature review) — can return partial findings
- ✅ @talos (hotfix confirmation) — can return without fix if timeout
- ❌ Never for implementers (@hermes, @aphrodite, @demeter) — must complete or fail
- ❌ Never for reviewers (@themis) — must produce a verdict

**How to signal timeout parcial:**
When dispatching, set the expectation explicitly:
```
@apollo Search for all auth-related files. If you hit timeout, return whatever you have found so far — partial results are acceptable.
```

### Timeout Tracking Table

Maintain a mental table of in-flight delegations:

| Agent | Started | Timeout | Status | Partial OK? |
|-------|---------|---------|--------|-------------|
| apollo | T+0s | T+60s | ✅ complete | ✅ |
| hermes | T+0s | T+180s | ⏳ in progress | ❌ |

---

## Examples

**Good (auto-continues):**
```
✅ Wrote migration file.
→ Running migration tests...
✅ Tests pass (3/3).
→ Next: write UserRepository query methods.
```

**Good (stops at Gate 2):**
```
✅ Phase 1 complete: migration + repository layer.
⏸️ GATE 2 — Themis review summary:
  - Coverage: 87% ✅ | No OWASP issues ✅
Ready for Phase 2? Waiting for go-ahead.
```

**Bad (stops unnecessarily):**
```
✅ Wrote the migration file.
Should I now run the migration tests? [waiting]
```

---

## Scope

**Applies to:** Zeus (multi-phase), Hermes/Aphrodite/Demeter (TDD cycles), Apollo (parallel searches), Talos (bug fixes).

**Does NOT apply to:** Athena planning (always presents plan = Gate 1), Iris (confirms before push), destructive operations (always ask).
