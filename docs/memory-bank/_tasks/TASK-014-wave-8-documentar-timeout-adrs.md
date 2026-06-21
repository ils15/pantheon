# TASK-014: Wave 8 — Documentar Timeout + Decisões (ADRs)

**Date:** 2026-05-25
**Status:** Planned

## Objective
Document chunkTimeout and key architectural decisions.

## Files to modify
- `docs/memory-bank/00-project.md` — add chunkTimeout section
- `docs/memory-bank/_notes/` — create ADRs

## Steps
1. Add to `00-project.md`:
   - `chunkTimeout: 120000` — where it lives, what it controls, how to change
   - Provider: `opencode.json` → `provider.opencode.options.chunkTimeout`
   - Typical values: 60000 (1min), 120000 (2min default), 300000 (5min)
2. Create ADR for: Removal of agora agent (why, what replaced it)
3. Create ADR for: Single source of truth (.agent.md frontmatter)

## Dependencies
- TASK-008 (agora removal decision)

## Completion criteria
- `chunkTimeout: 120000` documented in `00-project.md` with path, purpose, and typical values
- ADR created for agora agent removal (rationale, replacement)
- ADR created for single source of truth decision
