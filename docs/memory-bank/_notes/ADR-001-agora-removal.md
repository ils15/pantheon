# ADR-001: Removal of Agora Agent — Inline Council via /pantheon

**Date:** 2026-05-25
**Status:** Accepted

## Context
The `agora` agent was a hidden subagent (`mode: subagent`, `hidden: true`) responsible for multi-perspective council synthesis. It dispatched task() calls to 2-4 specialists in parallel and synthesized their responses.

## Problem
1. **Invisibility:** Agora ran inside a subagent context — all dispatches were hidden from the user. The user couldn't see which specialists were being consulted or whether any had timed out.
2. **Fragility:** If a sub-specialist hung (step limit, timeout), the entire agora dispatch froze indefinitely with no visibility into what went wrong.
3. **Duplication:** A separate `/council` command already did inline dispatch via Zeus (visible to user), duplicating agora's logic.
4. **Complexity:** Maintaining a dedicated agent with its own frontmatter, handoffs, routing.yml entries, and platform copies across 5+ directories was disproportionate to its value vs inline dispatch.

## Decision
Replace the hidden `agora` agent with inline council dispatch via `/pantheon` → `agent: zeus`. Zeus dispatches specialists directly in the visible conversation context.

## Key Changes
- `/pantheon` command now targets `zeus` instead of `agora`
- `/council` command removed (unified into `/pantheon`)
- `agora.agent.md` and all 4 platform copies deleted
- `zeus.agent.md` gained a "Inline Council Synthesis" section with timeout rules
- routing.yml: agora removed from agents, delegation, handoffs

## Timeout Rule (Critical Addition)
If a specialist does not respond after others have responded, Zeus proceeds with partial results:
- Includes "X of Y specialists responded" in output
- Notes timed-out specialists
- Adjusts confidence level downward

## Consequences
- ✅ Visible dispatch — user sees which specialists are being consulted
- ✅ No hangs — timeout rule prevents indefinite blocking
- ✅ Simpler architecture — one less agent, one less command
- ✅ No duplicated logic between /council and /pantheon
- ❌ Slightly more context consumed in Zeus's session (inline vs subagent)
