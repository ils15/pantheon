---
description: "Run a bounded child worker for a specific sub-task. Returns structured subtask_summary. No artifact, no Themis cycle."
---

# /subtask — Bounded Child Worker

**What:** Spawns a bounded child session for a specific sub-task. The worker runs in isolation and returns a structured summary. Unlike a full `task()` delegation, subtask produces **no IMPL artifact** and **no Themis review** — it's for scoped, low-risk work.

**Usage:** `/subtask <task description>`
**Model:** auto (cheapest adequate model)
**SubAgent:** auto (best-fit agent)

---

## When to Use

| Scenario | Example |
|----------|---------|
| Apollo investigation | `/subtask Find all auth-related files in the codebase` |
| Talos hotfix | `/subtask Fix the typo in login button CSS` |
| Bounded Hermes task | `/subtask Run the test suite and report results` |
| Quick data fetch | `/subtask Read the latest migration file and summarize changes` |

## When NOT to Use

- Task is complex (>2 files, >10 lines) — use full `task()` delegation
- Task needs Themis review — use full implementation phase
- Task might expand scope — use full `task()` with artifact tracking
- Task modifies critical infrastructure — use full phase with gates

---

## Return Format

The subtask worker MUST end its response with a structured summary:

```
<subtask_summary>
Status: completed | blocked | partial | timed_out
Agent: <agent-name>
Scope: <what was requested>

Changes:
- <file> — <what changed>

Findings:
- <key finding or result>

Validation:
- <test results or verification>

Risks / Follow-up:
- <any issues discovered>

Duration: <N>s
Session alias: <agent-N>
</subtask_summary>
```

## Timeout

Subtasks have a default timeout of 120s. If the worker does not respond in time, Zeus should either:
1. Retry once after 30s cooldown
2. Fall back to a direct `task()` call if retry also fails
3. Escalate to the user if both fail

---

## Multi-Platform Behavior

| Platform | Subtask Mechanism | Works? |
|----------|------------------|--------|
| OpenCode | `task()` with bounded scope | ✅ Full support |
| Claude Code | `Agent()` with bounded scope | ✅ Full support |
| VS Code Copilot | `task()` with bounded scope | ✅ Full support |
| Cline | `Task()` with bounded scope | ✅ Full support |
| Cursor | Follow @agent instructions manually | ⚠️ No programmatic subagent, but prompt guidance applies |
| Windsurf | Follow @agent instructions manually | ⚠️ Same as Cursor |
| Continue.dev | Follow @agent instructions manually | ⚠️ Same as Cursor |

On Tier 2 platforms (Cursor/Windsurf/Continue), the `/subtask` command acts as a structured prompt template rather than a programmatic subagent call.
