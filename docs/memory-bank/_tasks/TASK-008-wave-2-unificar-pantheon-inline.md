# TASK-008: Wave 2 — Unificar /pantheon Inline

**Date:** 2026-05-25
**Status:** Planned

## Objective
Make `/pantheon` dispatch inline via Zeus (visible to user). Remove `/council`. Remove agora agent. Add **timeout mechanism** for specialist responses so council never hangs.

## Files to modify
- `commands/pantheon.md` — change `agent: agora` → `agent: zeus`
- `commands/council.md` — delete
- `agents/agora.agent.md` — delete
- `platform/opencode/agents/agora.md` — delete
- `platform/claude/agents/agora.md` — delete
- `platform/copilot/agents/agora.agent.md` — delete
- `.claude/agents/agora.md` — delete
- `agents/zeus.agent.md` — add "Council Synthesis (inline)" section with timeout logic
- `opencode.json` (global + projeto) — remove `agora` entry
- `routing.yml` — remove agora sections
- `AGENTS.md` — remove agora line
- `scripts/install/opencode.mjs` — agora will be removed from canonical, auto-detected

## Steps

### Step 1-4: Remove agora and council
1. Read current `commands/pantheon.md` and `commands/council.md`
2. Edit pantheon.md: `agent: agora` → `agent: zeus`
3. Delete council.md
4. Delete all agora.agent.md and agora.md files (5 locations)

### Step 5: Add inline council logic to zeus.agent.md (CRITICAL)

Add a new section "Council Synthesis (inline)" with:

**Dispatch pattern with timeout:**
```markdown
### 5. Dispatch to Specialists (PARALLEL — WITH TIMEOUT)

Send ALL `task()` calls in a single message. Each specialist must respond concisely (2-4 sentences).

⚠️ **TIMEOUT RULE:** If a specialist does not respond within a reasonable time (e.g., after other specialists have responded), proceed with partial results. Do NOT wait indefinitely.

**After dispatch, apply the timeout pattern:**
1. Check which specialists responded
2. Note any specialists that did NOT respond as "TIMEOUT"
3. Include in synthesis: "X of Y specialists responded"
4. Adjust confidence level down if key specialists timed out
5. NEVER block the whole council waiting for one specialist
```

**Synthesis output must include:**
```
## 📋 Quick Summary

| | |
|---|---|
| **Response rate** | X of Y specialists responded |
| **Timed out** | @agent1, @agent2 (if any) |
| **🤝 Consensus** | <what all respondents agree on> |
| **🎯 Bottom Line** | <one-sentence verdict> |
```

### Step 6-7: Cleanup
6. Remove agora entries from opencode.json, routing.yml, AGENTS.md
7. Commit and verify

## Timeout Behavior (Critical Design Decision)

**Why:** Without a timeout, if a specialist agent hangs (step limit, chunk timeout, internal error), the entire `/pantheon` council freezes indefinitely.

**How it works:**
1. Zeus dispatches 2-4 `task()` calls in parallel (single message)
2. Zeus waits for responses but monitors progress
3. If a specialist takes too long (other specialists already responded + reasonable buffer), Zeus notes it as TIMEOUT
4. Synthesis includes partial results: "3 of 4 specialists responded. @echo timed out."
5. Confidence is adjusted: "Medium (1 specialist did not respond)"

**Implementation note:** Since `task()` in OpenCode does not have a native per-call timeout, the mechanism relies on:
- Specialists being instructed to respond concisely (2-4 sentences)
- Zeus checking completion status after receiving some responses
- Proceeding with partial results rather than blocking

## Dependencies
- TASK-007 (infra ready)

## Completion criteria
- `/pantheon` dispatches inline via Zeus (not agora) with visible output
- `/council` command deleted
- All agora agent files removed (5 locations)
- Zeus has inline council synthesis capability with timeout logic documented
- Council never hangs due to unresponsive specialist — always returns with partial results
- No references to agora remain in opencode.json, routing.yml, or AGENTS.md
