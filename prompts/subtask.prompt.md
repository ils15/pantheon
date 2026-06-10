---
name: subtask
description: "Delegate a bounded child task to a specialist agent and get a structured result back — use for isolated, well-scoped work within a larger session"
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

---

## Subtask Summary Format

Every subtask worker MUST end its response with this structured block:

```
<subtask_summary>
Status: completed | blocked | partial | timed_out
Agent: <agent-name>
Scope: <what was requested>

Changes:
- <file> — <what changed>

Findings:
- <key finding>

Validation:
- <test results or verification>

Risks / Follow-up:
- <issues discovered>

Duration: <N>s
Session alias: <agent-N>
</subtask_summary>
```

Zeus should parse this summary and decide next action based on `Status`:

| Status | Zeus Action |
|--------|-------------|
| `completed` | Integrate results, proceed |
| `blocked` | Check blocker, re-delegate or escalate |
| `partial` | Use available results, note missing parts |
| `timed_out` | Retry once or use fallback agent |

---

## Timeout & Retry

Subtasks have a configurable timeout. Default: 120s.

```
When a subtask times out:
  1. Wait 30s (cooldown)
  2. Retry once
  3. If retry fails → fallback to direct task() delegation
  4. If direct task() also fails → escalate to user
```

---

## Timeout Parcial (Partial Results)

For long-running subtasks where partial results are acceptable, set `partial_ok: true`:

```
SUBTASK BRIEF
Agent: apollo
Scope: Scan all route files for auth patterns
Partial OK: true
Timeout: 60s
```

If the worker times out but has already found some results, it returns:

```
<subtask_summary>
Status: partial
...
Partial results: [auth.py, login.py scanned; 3 files pending]
</subtask_summary>
```

Zeus uses the partial results and re-delegates the remaining scope.

---

## Subtask vs Task Decision Tree

```
Is the task bounded (single scope, < 10 lines)?
  ├── YES → Does it need Themis review or artifact tracking?
  │   ├── NO → Use SUBTASK (fast, lightweight)
  │   └── YES → Use TASK (full artifact cycle)
  └── NO → Use TASK (full orchestration phase)
```

Use subtask as a **performance optimization** — skip ceremony when the risk is low and the scope is narrow.
