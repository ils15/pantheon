---
name: subtask
description: "Delegate a bounded child task to a specialist agent and get a structured result back — use for isolated, well-scoped work within a larger session"
argument-hint: "<agent> <task description>"
agent: zeus
tools: ['agent', 'search']
---

# Subtask — Bounded Delegation (Zeus)

## Task

$input

---

## Delegation Protocol

1. **Parse the request** — identify the target agent and the task scope.
2. **Confirm isolation** — the subtask must be self-contained (no unresolved dependencies on other in-progress work).
3. **Delegate with a structured brief:**
   - Agent: who receives the task
   - Scope: exactly what to do (no more, no less)
   - Inputs: files, context, or data the agent needs
   - Output format: what structured result to return
   - Constraints: time/token limits, what NOT to change

4. **Receive the result** — summarize what was done and any decisions made.
5. **Integrate** — connect the result back into the parent session context.

---

## Subtask Brief Format

```
SUBTASK BRIEF
Agent: <target agent>
Scope: <specific task>
Inputs: <files or context>
Expected output: <structured result format>
Constraints: <what not to touch, time limit>
```

---

## When to Use

- You need a focused investigation without polluting the main context
- A specialist agent can complete the work independently
- You want an auditable, isolated result before integrating

## When NOT to Use

- The task depends on unfinished work in the same session
- The task is trivial (< 2 steps) — just do it inline
- The task requires continuous back-and-forth — use a direct agent instead
