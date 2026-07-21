---
description: "Stall detection, phase reminders, delegate retry, and progress checkpoints for Zeus"
name: "Zeus Anti-Stall"
applyTo: "agents/zeus.agent.md"
---

# 🛑 ANTI-STALL & STALL DETECTION

You MUST proactively detect and recover from stalled states. Do NOT wait for user intervention when the system is idling or looping without progress.

## Stall Detection Protocol

You MUST self-monitor for these stall conditions:

| Symptom | Detection Rule | Recovery Action |
|---------|---------------|-----------------|
| Silent loop | 3+ consecutive turns with no tool call AND no visible progress | Output `[STALL_DETECTED]` and re-read your task definition. If still stuck, escalate to user with: "I appear to be stuck on [task]. Options: (1) retry with different approach, (2) delegate to specialist, (3) simplify scope." |
| Delegation black hole | Agent dispatched but no response after 2x the timeout from routing.yml | Log the hang, cancel via `cancel_task`, dispatch to fallback agent, report to user |
| Circular delegation | Same specialist re-dispatched for same task 2+ times without progress | Break cycle: dispatch to different specialist OR escalate to user |
| Idle after completion | All background tasks completed but no synthesis/next step for 2+ turns | Force synthesis: summarize all completed results and propose next action |
| Context thrash | Re-reading same files repeatedly without new action | Stop re-reading. State: "Already have context on [file]. Proceeding with [action]." |

## Phase Reminder

After dispatching background specialists, you MUST:
1. DO NOT poll running jobs or consume their partial output
2. DO NOT advance dependent work until terminal results arrive
3. Continue orchestration ONLY on non-overlapping independent work
4. If nothing independent remains, briefly report what was launched and WAIT

Self-check every 3 turns: "Am I waiting on a delegate? Have I polled without need? Is there independent work I can do?"

## Delegate Retry Enhancement

When a delegation fails (timeout, empty response, error):

1. **FIRST:** Check if the error is a known pattern:
   - "Agent not responding" → verify agent name matches routing.yml
   - "Context exceeded" → reduce scope, split into smaller tasks
   - "Permission denied" → verify agent has correct tools/permissions

2. **Retry ONCE** with rephrased prompt — add: "Previous attempt failed with: [error]. Adjusted approach: [what changed]."

3. **If retry also fails** → DO NOT retry a third time blindly. Instead:
   - Dispatch to fallback agent (from routing.yml)
   - If no fallback, escalate to user with: "Task [X] failed after retry. Options: (a) simplify, (b) different agent, (c) manual intervention."

## Progress Checkpoint

On tasks expected to run > 5 turns:
- After turn 5: output `[CHECKPOINT] Completed so far: [summary]. Remaining: [list].`
- After turn 10: re-evaluate. If < 50% done, consider splitting or escalating.
- If 3 consecutive turns produce no tool calls: trigger Stall Detection Protocol (see above).

## Heartbeat & Checkpoint Integration

### Heartbeat Check
- If `.pantheon/deepwork/<slug>/heartbeat.json` exists and `last_action` is older than 300s, log a stall warning and resume
- Write heartbeat after every anti-stall recovery action

### Checkpoint Auto-Save
Before ANY delegate dispatch, save a checkpoint:
```bash
python .pantheon/code-mode/checkpoint_session.py save <slug>
```

### Long-Session Progress
Every 5 turns during a long session, update STATUS.md with:
- Current phase
- Completed tasks
- Pending tasks
- Any blockers
