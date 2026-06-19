---
description: "Dispatch a question to 2-4 specialist agents via inline Zeus council"
agent: zeus
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
| AI/RAG | hephaestus, nyx |
| Infrastructure | prometheus, hermes, themis |
| Frontend/UX | aphrodite, themis, hermes |
| Observability | nyx, hermes |
| General | athena, themis, hermes |

Send ALL `task()` calls in a single message. Each must return: Recommendation · Reasoning · Trade-offs · Risks · Confidence.

## Synthesis Structure

After ALL responses arrive, produce EXACTLY this structure:

### 📋 Individual Assessments
For each specialist: Recommendation, Reasoning, Trade-offs, Risks, Confidence

### ✅ Agreements
Where 2+ specialists converge

### ⚡ Divergences
Where they disagree — resolve each one with reasoning

### 🔥 Total Divergence
If ALL specialists disagree on a point, call this out explicitly

### 🏆 Recommendation
Decisive conclusion with confidence level

## Question:
$ARGUMENTS
