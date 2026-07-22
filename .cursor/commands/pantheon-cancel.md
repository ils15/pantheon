---
description: "Stop auto-continuation. Aliases: /stop-continuation"
agent: "zeus"
---
# /cancel — Stop Auto-Continuation

**What:** Stops auto-continuation and any task system execution.

**Usage:**
- `/cancel` — Stop auto-continuation (default)
- `/stop-continuation` — Alias: same as `/cancel`

**Alias:** `/stop-continuation` also works and does the same thing.

**Preserves:** Manual tools, agent delegation, hooks, safety gates.
**Safety:** Does NOT discard changes, close session, or delete tasks.
