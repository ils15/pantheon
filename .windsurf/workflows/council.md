---
description: "Dispatch a question to 2-3 specialist agents in parallel and synthesize agreements, divergences, and recommendations"
---
# /council — Multi-Perspective Council

Dispatches the question to 2-3 specialist agents **in parallel** via `task()`, then synthesizes their responses.

## Dispatch Selection

Choose 2-3 agents based on domain. Send ALL `task()` calls in a SINGLE message.

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

Each specialist must return: **Recommendation** · **Reasoning** · **Trade-offs** · **Risks** · **Confidence**

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
