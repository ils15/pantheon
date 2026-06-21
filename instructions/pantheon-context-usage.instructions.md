---
name: "Pantheon Context Tools Usage"
description: "MCP tools for context management — shared reference for all agents"
---

# Pantheon Context Tools

All agents have access to `pantheon-context` MCP tools:

- `pantheon-context_compress_text(text, max_chars=4000)` — Compress verbose output
- `pantheon-context_prune_stale(outputs, keep_last=3)` — Remove duplicate outputs
- `pantheon-context_context_stats(text)` — Get token/line/char stats

**When to use:** Session feels congested, outputs are repetitive, or you need to trim context.

**Rule:** Only compress outputs from tool calls, never compress user messages or instructions.
