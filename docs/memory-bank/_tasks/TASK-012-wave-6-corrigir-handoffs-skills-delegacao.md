# TASK-012: Wave 6 — Corrigir Handoffs, Skills e Delegação

**Date:** 2026-05-25
**Status:** Planned

## Objective
Fix identified handoff/skill/delegation issues.

## Files to modify
- `agents/zeus.agent.md` — add `internet-search` to skills
- `agents/talos.agent.md` — remove `tdd-with-agents` from skills
- `agents/prometheus.agent.md` — align agents list with body
- `routing.yml` — sync skills lists

## Steps
1. Zeus: add `internet-search` skill to YAML frontmatter
2. Talos: remove `tdd-with-agents` skill (contradicts "no TDD ceremony" in body)
3. Prometheus: add `@apollo` mention to body's "When to Delegate" section
4. routing.yml: sync hermes skills (+simplify, +test-architecture), demeter skills (+simplify)

## Dependencies
- TASK-009 (routing.yml consolidation includes skill sync)

## Completion criteria
- Zeus has `internet-search` in its skills list
- Talos no longer lists `tdd-with-agents` (matches "no TDD ceremony" body)
- Prometheus body references `@apollo` for delegation
- routing.yml skills lists match actual .agent.md skills for hermes and demeter
