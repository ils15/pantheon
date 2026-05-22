---
description: "Dispatch a question to 2-4 specialist agents via Agora council synthesis"
agent: agora
---
# /pantheon — Council Synthesis

**What:** Dispatches the question to 2-3 specialist agents **in parallel** via `task()`, then synthesizes their responses into a single recommendation with resolved divergences.
**Usage:** `/pantheon <question>`
**When:** Architecture trade-offs, technology selection, security assessments, multi-stakeholder concerns
**Returns:** Structured synthesis with recommendation, confidence level, resolved divergences

## Dispatch Selection

Choose 2-3 agents based on domain:

| Domain | Specialists |
|--------|-------------|
| Architecture | hermes, demeter, themis, athena |
| Security | themis, hermes, prometheus, nyx |
| Database | demeter, hermes, prometheus |
| AI/RAG | hephaestus, chiron, nyx |
| Infrastructure | prometheus, hermes, themis |
| Frontend/UX | aphrodite, themis, hermes |
| Observability | nyx, chiron, hermes |
| General | athena, themis, hermes |

Send ALL `task()` calls in a single message. Each must return: Recommendation · Reasoning · Trade-offs · Risks · Confidence. Then synthesize agreements, divergences, and a final recommendation.

## Question:
$ARGUMENTS
