# TASK-009: Wave 3 — Consolidar routing.yml

**Date:** 2026-05-25
**Status:** Planned

## Objective
Eliminate duplication within routing.yml (4 sections → 2).

## Files to modify
- `routing.yml`

## Steps
1. Remove `delegation:` section (~400 lines) — redundant with `agents:` + `handoffs:`
2. Remove `routing_matrix:` section (~100 lines) — redundant with `agents:`
3. Add optional `pre_condition` and `post_condition` metadata to `handoffs:` entries
4. Resolve contradictions:
   - `routing_matrix: multi-perspective → zeus` vs `delegation: → agora` (will be moot after Wave 2 removes agora)
   - Hermes skills: add `simplify`, `test-architecture`
   - Demeter skills: add `simplify`
5. Sync routing.yml agent skills lists with actual .agent.md skills

## Dependencies
- TASK-008 (agora removal reduces contradictions)

## Completion criteria
- routing.yml reduced from 4 sections to 2
- No `delegation:` or `routing_matrix:` sections remain
- `pre_condition` and `post_condition` metadata added to `handoffs:` entries
- Agent skills lists in routing.yml match actual .agent.md files
- No contradictions between routing.yml sections
