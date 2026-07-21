---
name: auto-continue-template
description: "Reusable auto-continue template that can be injected into any agent YAML config"
---

# ⚡ Auto-Continue Template

Embed this section into any agent YAML file to enable disciplined automatic continuation through multi-step tasks, while preserving mandatory safety gates.

---

## Core Principle

> **Auto-continue through unambiguous work. Stop only at real decision points.**

---

## When Auto-Continue Is Active

- ✅ Multi-step tasks with clear sequential steps
- ✅ TDD cycles (RED→GREEN→REFACTOR)
- ✅ Batch operations on multiple files
- ❌ After Themis review (stop for approval)
- ❌ After unexpected errors
- ❌ Before destructive operations
- ❌ When requirements are ambiguous

## Auto-Continue Protocol

1. Create todos for all steps at start
2. Mark first todo in_progress
3. Complete work → mark completed immediately
4. Mark next todo in_progress without asking
5. Stop at safety gates (Themis review, errors, human approval)
6. After gate approval, resume with next todo

**Never batch-complete todos.** Mark each completed as soon as done.

## Session Heartbeat

- Every 5 turns, call `pantheon-code-mode execute_code_script checkpoint_session.py save <slug>`
- Saves checkpoint-N.json with current state
- Updates heartbeat.json timestamp
- If interrupted, use `pantheon://deepwork/<slug>/checkpoint-N.json` to resume

## Idle Detection

- No tool call for 60s → log heartbeat warning
- No tool call for 120s → trigger anti-stall
- No tool call for 300s → auto-checkpoint and pause

## Progress Reporting

- Every 5 turns: update STATUS.md with current phase, completed, and pending
- Use markdown checklist format
- Flag blockers immediately

## Safety Checks Before Continuing

- [ ] Previous step completed successfully (tests pass, no errors)
- [ ] Next step is within approved plan scope
- [ ] No new blocking issues emerged
- [ ] Steps counter has sufficient budget remaining

## Cooldown Pattern

### Phase Summary Template
```
Phase N complete. Summary:
- What was done: <2 bullet points>
- What changed: <files modified>
- What's next: <Gate 2 review OR next phase>
- Will continue: <YES / after gate approval>
```

### Abbreviated Cooldown
When auto-continuing between sequential non-gated phases:
```
→ Phase N done. Next: Phase N+1. [auto-continuing]
```

## Platform Compatibility

| Platform | Auto-Continue | Background Agents | Checkpoints |
|----------|--------------|-------------------|-------------|
| OpenCode v1.16+ | ✅ Native | ✅ Background dispatch | ✅ File-based |
| OpenCode v1.17+ | ✅ Enhanced | ✅ Session snapshots | ✅ Native + file |
| Claude Code | ⚠️ Limited | ❌ No background | ✅ File-based |
| Cursor | ⚠️ Limited | ❌ No background | ⚠️ Partial |
| Windsurf | ⚠️ Limited | ❌ No background | ⚠️ Partial |
| Continue.dev | ⚠️ Limited | ❌ No background | ✅ File-based |

## Per-Agent Customization

Each agent should customize this template by specifying:

1. **Checkpoint frequency** — how often to save state (every N turns, after phases, never)
2. **Stopping conditions** — what events require a full stop vs auto-continue
3. **Partial results policy** — whether timeout parcial results are acceptable
4. **Idle detection thresholds** — custom timeouts for tool call inactivity

See individual agent auto-continue sections for per-agent configurations.
