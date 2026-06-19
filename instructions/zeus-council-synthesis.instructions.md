---
description: "Council synthesis — dispatch 2-4 specialists inline for multi-perspective decisions"
name: "Zeus Council Synthesis"
applyTo: "agents/zeus.agent.md"
---

# 🏛️ INLINE COUNCIL SYNTHESIS — /pantheon

When a question requires multiple expert perspectives on a trade-off or architecture decision, **dispatch specialists inline** (visible to user) instead of delegating to a hidden subagent.

## Trigger Patterns (detect ANY)
- Trade-off questions: "which is better?", "should we use X or Y?", "compare A and B"
- Architecture decisions with long-term impact
- Security/compliance choices
- Technology selection (databases, frameworks, providers, libraries)
- "Is this safe?", "trade-offs of...", "what are the risks?"
- Cost vs quality decisions
- Multi-stakeholder concerns (frontend + backend + infra)

## Dispatch with Timeout

Send ALL `task()` calls in a single message. Each specialist must respond concisely (2-4 sentences).

⚠️ **TIMEOUT RULE:** If a specialist does not respond after other specialists have responded, proceed with partial results. Do NOT wait indefinitely.

1. Detect multi-perspective trigger pattern
2. Select 2-4 specialists based on domain (see tables below)
3. Dispatch ALL `task()` calls in ONE message
4. Wait for responses — note any specialists that don't respond as TIMEOUT
5. Synthesize: include "X of Y specialists responded" in output
6. Adjust confidence: down if key specialists timed out

## Domain-to-Specialist Mapping

| Domain | Specialists |
|--------|-------------|
| Architecture | hermes, demeter, themis, athena |
| Security | themis, hermes, prometheus, nyx |
| Database | demeter, hermes, prometheus |
| AI/RAG | hephaestus, nyx |
| Infrastructure | prometheus, hermes, themis |
| Frontend/UX | aphrodite, themis, hermes |
| Observability | nyx, hermes |
| General | athena, themis, hermes |

## Synthesis Output Template

```
## 🏛️ Council Synthesis

**Question:** <original question>
**Date:** <date>
**Response rate:** X of Y specialists responded
**Timed out:** @agent1, @agent2 (if any)

### Specialist Perspectives
| Agent | Position | Trade-offs | Confidence |
|-------|----------|------------|------------|
| @agent1 | ... | ... | High/Med/Low |

### Agreements
- <what 2+ specialists agree on>

### Divergences
| Issue | Side A | Side B | Resolution |
|-------|--------|--------|------------|

### Recommendation
<decisive conclusion>

### Decision Gate
**Confidence:** High/Medium/Low (adjusted for response rate)
```

> **Note**: The user can explicitly invoke this via `/pantheon <question>`. The command dispatches to Zeus who runs the council inline.
