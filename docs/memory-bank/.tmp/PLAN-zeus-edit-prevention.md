# PLAN-zeus-edit-prevention
**Date:** 2026-06-19  **Status:** Awaiting Approval

## Goal
Prevent Zeus from attempting `edit` tool calls (which don't exist in its toolset).

## Root Cause
Zeus's LLM hallucinates the `edit` tool because training data encodes `read → edit` as a pattern. Behavioral rules ("don't use edit") and `permission: deny` never tell Zeus that `edit` literally does not exist.

## Files to Change
1. `~/.config/opencode/opencode.json` — line 64: `bash: deny` → `bash: allow`
2. `agents/zeus.agent.md` — 4 insertions (Tool Inventory, Negative Examples, strengthen line 84, final mantra)

## Implementation Steps
1. @talos — config fix + agent definition changes (bounded, <10 lines)
2. @themis — review changes
3. @mnemosyne — write ADR

## Risks
- LLM may still hallucinate `edit` for a few sessions until context window stabilizes
- Fix is purely prompt-level; no enforcement mechanism beyond what exists

## Open Questions
- [ ] Any other tools Zeus hallucinates besides `edit`? (May need to add to "DO NOT HAVE" list)
