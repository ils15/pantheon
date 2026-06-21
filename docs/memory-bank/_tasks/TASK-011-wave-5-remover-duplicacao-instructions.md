# TASK-011: Wave 5 — Remover Duplicação Instructions vs Agent Bodies

**Date:** 2026-05-25
**Status:** Planned

## Objective
Agents reference `instructions/*.instructions.md` instead of embedding standards inline.

## Files to modify
- `agents/hermes.agent.md` — remove Code Quality Standards (lines ~142-147), add reference
- `agents/aphrodite.agent.md` — remove inline frontend standards, add reference
- `agents/demeter.agent.md` — remove inline database standards (lines ~201-224), add reference
- `agents/prometheus.agent.md` — remove inline infra standards, add reference
- `agents/themis.agent.md` — remove inline review checklist, add reference
- `agents/README.md` — remove or mark as auto-generated

## Steps
1. For each agent, identify the inline standards section
2. Replace with: `See instructions/[relevant-file].instructions.md`
3. Ensure the instruction file itself is comprehensive enough
4. Remove `agents/README.md` or add generation comment

## Dependencies
- None

## Completion criteria
- No agent `.agent.md` file embeds inline standards that duplicate an `instructions/*.instructions.md` file
- All agent files that had inline standards now reference the canonical instruction file
- `agents/README.md` either removed or marked as auto-generated
- No information loss — referenced instruction files are comprehensive enough
