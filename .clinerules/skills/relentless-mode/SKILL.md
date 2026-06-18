---
name: relentless-mode
description: "Self-referential development loop — agent continues working until <promise>DONE</promise> is detected. Auto-injects system reminder when idle with incomplete todos. Opt-in via /relentless-mode command."
context: fork
globs: []
alwaysApply: false
---

# Relentless Mode — Modo Implacável

Use this skill to keep the orchestrator working continuously until the task is fully complete. Named after Anthropic's Relentless (escudo de Zeus) plugin.

---

## The Core Principle

> **Don't stop halfway. Push until DONE.**

Agents often stop mid-task due to context limits, uncertainty, or conservative behavior. Relentless Mode prevents this by auto-injecting a continuation reminder when the agent goes idle with incomplete work.

---

## Activation

**Command:** `/relentless-mode "descrição da task"`

**When to activate:**
- Complex multi-step tasks (5+ todos)
- Tasks where explaining full context is tedious
- When you want the agent to figure it out autonomously

**When NOT to activate:**
- Simple single-step tasks
- When you need per-step review/approval
- When the task requires external input at each step

---

## How It Works

```
User: /relentless-mode "Implement JWT authentication"
  ↓
Agent creates todos and starts working
  ↓
Agent goes idle (stops responding)
  ↓
Hook detects: idle + incomplete todos + no <promise>DONE</promise>
  ↓
Hook injects:
  "[SYSTEM REMINDER — RELENTLESS LOOP]
   You have incomplete todos! Complete ALL before responding:
   - [ ] Create JWT service ← IN PROGRESS
   - [ ] Add auth middleware
   - [ ] Write tests

   DO NOT respond until all todos are marked completed.
   If truly blocked, explain the blocker and propose a workaround."
  ↓
Agent resumes work
  ↓
Repeats until:
  - All todos completed + <promise>DONE</promise> detected
  - maxIterations reached (default 100)
  - User cancels with /cancel --relentless or Esc×2
```

---

## DONE Detection

The loop ends when the agent's response contains:

```
<promise>DONE</promise>
```

This tag signals that all work is complete and no further continuation is needed.

**Rules for using DONE:**
- Only use when ALL todos are completed
- Only use when all tests pass
- Only use when no blockers remain
- Never use as a workaround to escape the loop

---

## Safety Gates

Relentless Mode respects the same safety gates as auto-continue:

| Gate | Behavior |
|------|----------|
| **Plan Approval** | Stops for user approval before implementation starts |
| **Phase Review** | Stops for Themis review after each phase |
| **Git Commit** | Stops for user to commit before next phase |

The loop auto-continues BETWEEN gates, not THROUGH gates.

---

## Configuration

```json
{
  "relentlessLoop": {
    "maxIterations": 100,
    "cooldownMs": 3000,
    "autoEnable": false,
    "autoEnableThreshold": 5
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `maxIterations` | 100 | Maximum continuation cycles (1-500) |
| `cooldownMs` | 3000 | Delay before each continuation (0-30000) |
| `autoEnable` | false | Auto-enable when session has enough todos |
| `autoEnableThreshold` | 5 | Number of todos to trigger auto-enable |

---

## Cancellation

**Methods:**
- `/cancel --relentless` — cancels active Relentless Mode
- `/stop-continuation` — stops all continuation mechanisms
- `Esc×2` — cancels during cooldown or after injection

---

## Best Practices

### Good Relentless Mode Usage:
```
/relentless-mode "Refactor the entire auth module to use JWT"
→ Agent creates 8 todos, works through them all
→ Completes all tests, outputs <promise>DONE</promise>
→ Loop ends, user reviews final result
```

### Bad Relentless Mode Usage:
```
/relentless-mode "Fix this typo"
→ Overkill for a single-step task
→ Just prompt normally instead
```

---

## Relationship with Auto-Continue

| Feature | Auto-Continue | Relentless Mode |
|---------|-------------------|------------|
| Trigger | Idle + incomplete todos | Idle + incomplete todos + no DONE |
| Aggressiveness | Moderate (continues if clear) | High (continues until DONE) |
| Detection | Todo state only | Todo state + DONE tag |
| Use case | General multi-step work | Complex autonomous work |

Relentless Mode is the **aggressive** version of auto-continue. Use it when you want the agent to work until the task is truly done, not just until the next clear step.
