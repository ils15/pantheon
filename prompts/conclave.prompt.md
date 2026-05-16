---
name: conclave
description: "Multi-perspective trade-off analysis — Athena convenes specialist agents and synthesizes a decisive recommendation"
agent: athena
tools: ['search', 'usages', 'agent']
---

# Conclave — Multi-Perspective Decision (Athena)

## Question

$input

---

## Council Protocol

1. **Identify perspectives** — Select 2–3 relevant specialist agents for this question (e.g. hermes + demeter for a caching decision, hermes + hephaestus for an AI pipeline decision).
2. **Dispatch in parallel** — Send the same question to all selected specialists simultaneously.
3. **Compare findings** — Note agreements and divergences across perspectives.
4. **Synthesize** — Produce a single decisive recommendation with:
   - **Recommendation:** the chosen approach
   - **Confidence:** High / Medium / Low
   - **Rationale:** why this beats alternatives
   - **Trade-offs:** what you give up
   - **Next step:** implement (→ Zeus) or research more (→ Apollo)

---

## Output Format

```
## Conclave Result

**Question:** <restated question>

**Perspectives consulted:** <agent 1>, <agent 2>, <agent 3>

**Points of agreement:**
- ...

**Points of divergence:**
- ...

**Recommendation:** <chosen approach>
**Confidence:** High | Medium | Low
**Rationale:** <why>
**Trade-offs:** <what you give up>
**Next step:** <implement with Zeus | research more with Apollo>
```
