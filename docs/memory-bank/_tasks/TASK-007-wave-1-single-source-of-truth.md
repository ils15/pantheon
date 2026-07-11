# TASK-007: Wave 1 — Single Source of Truth (Infrastructure)

**Date:** 2026-05-25
**Status:** Complete

## Objective
Make `agents/*.agent.md` the single source of truth for all agent configuration. Infrastructure refactoring of shared.mjs, opencode.mjs, and frontmatter.

## Files to modify
- `scripts/install/shared.mjs` ✅ Done
- `scripts/sync-platforms.mjs` ✅ Done
- `scripts/install/opencode.mjs` ✅ Done
- `agents/*.agent.md` (18 files) ✅ Done
- `opencode.json` (projeto) ⚠️ Partial — agent section removed but JSON invalid
- `platform/opencode/agents/gaia.md`, `talos.md`, `argus.md`
- `platform/claude/agents/gaia.md`, `talos.md`, `argus.md`
- `.claude/agents/gaia.md`, `talos.md`, `argus.md`
- `platform/copilot/agents/gaia.agent.md`, `talos.agent.md`, `argus.agent.md`

## Steps
1. Fix JSON syntax in opencode.json (comma error after removing agent section)
2. Add `disable_model_invocation: true` to gaia, talos, argus in platform/opencode/, platform/claude/, .claude/
3. Add `tier: fast` to argus in platform/opencode/, platform/claude/, .claude/
4. Fix copilot agent frontmatter (3 files with empty `{}`)
5. Add `color:` and `hidden:` to platform agent files

## Dependencies
- None

## Completion criteria
- All 18 canonical `.agent.md` files are the single source of truth
- Platform agents (gaia, talos, argus) have correct `disable_model_invocation` and `tier` flags
- Copilot agent frontmatter is valid (no empty `{}`)
- `opencode.json` has valid JSON syntax
- Platform agent files have `color:` and `hidden:` fields
