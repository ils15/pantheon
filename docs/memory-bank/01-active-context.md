# Active Context

> Priority file — agents read first. Keep current. Stale is worse than none.

## Current Focus
v3.13.0 Released — Level 2 Compression Complete + OpenCode-Only Agent Cleanup

## What Changed (2026-06-20)
- **v3.13.0 released** — commit 620189a, tag v3.13.0, published at https://github.com/ils15/pantheon/releases/tag/v3.13.0
- **Level 2 Context Compression** fully implemented: priority scoring (5 deterministic dimensions), budget allocation (100-line cap), cross-references (D/E/M/C IDs), ZZ artifact format, SKILL.md, xref index
- **TUI Plugin** removed temporarily — files moved to `plugins-disabled/`, removed from OpenCode config
- **Frontmatter Cleanup** — stripped all non-OpenCode fields from 14 agent `.agent.md` files (removed deprecated `tools:`, non-standard `handoffs:`, `agents:`, `color:`, `hidden:`, etc.)
- **Stale Agent References Removed** — chiron, echo, argus, agora references cleaned from platforms, docs, tests, commands
- **Agent Count Unified** — all files now consistently say "14 agents"
- **Missing Infrastructure Created** — `_xref/_next_id.json` created with full key names, `scripts/scrub-secrets.py` made executable

## Key Decisions
- Level 2 compression replaces Level 1 entirely — priority-scored summaries with budget allocation
- All agent `.agent.md` files now only use OpenCode-recognized frontmatter fields
- Missing skills (`code-discipline`, `architecture-diagrams`) removed from agent references
- `_xref/_next_id.json` uses full key names (decisions/entities/milestones/tasks)

## Next
- Test Level 2 compression end-to-end in a deepwork session ✅ (validated 2026-06-20)
- Consider vector memory (Level 3) when LLM providers support dynamic-prefix caching

## Blockers
None
