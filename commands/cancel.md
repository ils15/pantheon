---
description: "Stop auto-continuation. Use --relentless to stop only relentless mode. Aliases: /stop-continuation, /cancel-relentless"
agent: "zeus"
---
# /cancel — Stop Auto-Continuation

**What:** Stops auto-continuation mechanisms. By default stops ALL (relentless + auto-continue + task system). Use `--relentless` to stop only relentless mode.

**Usage:**
- `/cancel` — Stop ALL continuation (default)
- `/cancel --relentless` — Stop only relentless mode
- `/stop-continuation` — Alias: same as `/cancel`
- `/stop-continuation --relentless` — Alias: same as `/cancel --relentless`

**Alias:** `/stop-continuation` also works and does the same thing.

**Migration:** The old `/cancel-relentless` command has been consolidated into the `--relentless` flag. Use `/cancel --relentless` or `/stop-continuation --relentless` instead.

**Preserves:** Manual tools, agent delegation, hooks, safety gates.
**Safety:** Does NOT discard changes, close session, or delete tasks.
