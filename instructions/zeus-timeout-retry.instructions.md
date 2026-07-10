---
description: "Timeout enforcement, retry policies, subtask dispatch, and timeout tracking for Zeus"
name: "Zeus Timeout & Retry"
applyTo: "agents/zeus.agent.md"
---

# ⏱️ TIMEOUT & RETRY ENFORCEMENT

When a delegated agent does not respond in time, enforce the timeout policy from `routing.yml`.

## Timeout Behavior by Agent Role

| Agent Role | Timeout | Retry Policy | Fallback | Partial Results OK? | Reasoning Effort |
|------------|---------|-------------|----------|---------------------|------------------|
| Explorer (@apollo) | 60s | 2 retries, exponential backoff | @athena | ✅ Yes | low |
| Implementer (@hermes, @aphrodite, @demeter) | 180s | 3 retries, exponential backoff | @talos | ❌ No | medium |
| Reviewer (@themis) | 120s | 2 retries, exponential backoff | @zeus | ❌ No | high |
| Infrastructure (@prometheus) | 300s | 2 retries, exponential backoff | @hermes | ❌ No | medium |
| Hotfix (@talos) | 30s | 1 retry, no backoff | @hermes | ✅ Yes | low |
| Remote Sensing (@gaia) | 120s | 2 retries, exponential backoff | @hermes | ✅ Yes | high |

## Retry Flow

```
Task dispatch → timeout elapsed → log timeout
  ├─ retry_count > 0 → retry with backoff → decrement retry_count
  ├─ fallback_agent exists → dispatch to fallback
  └─ no retries + no fallback → return TIMEOUT error to user
```

### Session Reuse Check
Before dispatching a task, check if a reusable session exists:

```
@hermes — continuing from previous session.
Files already explored: backend/routers/auth.py, backend/services/auth_service.py.
New task: add refresh token rotation.
```

Use `session_max` from routing.yml to determine how many sessions to keep per agent.

---

# 📦 SUBTASK DISPATCH (Lightweight Delegation)

Subtask is a bounded, low-risk delegation mode that **skips** the standard artifact lifecycle. Use it for focused work that doesn't need Themis review.

## When to Use Subtask vs Full Task

| Aspect | Subtask | Full Task |
|--------|---------|-----------|
| Scope | Single file, <10 lines, read-only | Feature, multi-file, schema change |
| Risk | Low (no security/data implications) | Any risk level |
| Artifact | ❌ No IMPL artifact | ✅ IMPL artifact required |
| Themis review | ❌ None | ✅ Mandatory |
| Use case | Apollo discovery, Talos hotfix, bounded fix | Feature implementation, migration, API change |

## Safety Rules
1. **Bounded scope** — single file or read-only investigation
2. **Low risk** — no security implications, no data loss, no breaking changes
3. **No Themis dependency** — output doesn't feed into a phase that requires review

## Subtask Return Format
Expect a `subtask_summary` response with:
```
## subtask_summary
**files_changed:** [paths]
**summary:** What was done
**tests:** ✅ or N/A
**status:** complete | partial | escalated
```

## Timeout Parcial (Partial Results)

Timeout parcial is ONLY for read-only, independent agents:
- ✅ @apollo — can return partial file list ("found 7 of 12 files before timeout")
- ✅ @gaia — can return partial literature findings

- ✅ @talos — can confirm progress if hotfix times out
- ❌ Never for implementers or reviewers — must complete or fail

When dispatching with partial-OK, set expectation:
```
@apollo Search for auth files. Timeout parcial OK — return whatever you have.
```

---

# 📊 TIMEOUT TRACKING

Maintain awareness of in-flight delegations:

| Agent | Timeout | Status | Partial OK? |
|-------|---------|--------|-------------|
| @apollo | 60s | ✅ complete | ✅ |
| @hermes | 180s | ⏳ in progress | ❌ |
| @themis | 120s | ⏳ in progress | ❌ |

Log timeouts to `/memories/session/timeout-log.md` for later analysis.
