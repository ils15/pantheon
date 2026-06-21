# ADR-002: agents/*.agent.md as Single Source of Truth

**Date:** 2026-05-25
**Status:** Accepted

## Context
Agent configuration was split across 4 locations:
1. `agents/*.agent.md` — agent role descriptions and workflows
2. `opencode.json` agent section — runtime config (color, steps, mode, etc.)
3. `opencode.mjs` hardcoded `agentDefaults` — mode, hidden, bash permissions
4. `routing.yml agents:` — skills, delegation, subagent lists

This led to inconsistent values: hermes had different skills in routing.yml vs .agent.md, hidden flags were set in opencode.json but not in .agent.md, and mode values contradicted between sources.

## Decision
Consolidate ALL agent configuration into `agents/*.agent.md` YAML frontmatter. Install/generation scripts read FROM this single source.

## Changes
- Added `color`, `hidden`, `disable_model_invocation` to all 18 .agent.md frontmatters
- `opencode.mjs`: removed `agentDefaults` hardcoded map — now reads from .agent.md via parseFrontmatter()
- `shared.mjs`: added parseFrontmatter() utility, AGENT_NAMES auto-detected from directory
- `opencode.json`: agent section removed (redundant)
- `routing.yml`: agent skills synced with .agent.md values

## Consequences
- ✅ Single edit point — change an agent's config in one file
- ✅ Auto-discovery — adding/removing agents is automatic
- ✅ Platform consistency — all platform-specific copies derive from canonical
- ❌ Slightly slower install (must parse 18 frontmatter files instead of reading pre-built JSON)
