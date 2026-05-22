---
description: "Stop all auto-continuation mechanisms. Use --relentless to stop only relentless mode"
---
# /stop-continuation — Stop Auto-Continuation

**What:** Stops auto-continuation mechanisms. By default stops ALL (relentless + auto-continue + task system). Use `--relentless` to stop only relentless mode.

**Usage:**
- `/stop-continuation` — Stop ALL continuation (default)
- `/stop-continuation --relentless` — Stop only relentless mode (alias: `/cancel-relentless`)

**Preserves:** Manual tools, agent delegation, hooks, safety gates.
**Safety:** Does NOT discard changes, close session, or delete tasks.
