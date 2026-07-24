---
description: "Universal memory protocol rules for all Pantheon agents with agent-specific overrides"
name: "Memory Protocol"
applyTo: "agents/*.agent.md"
---

# 🧠 Memory Protocol — Universal Rules

These rules apply to ALL Pantheon agents. Agent-specific overrides are defined
in each agent's `## 🧠 Memory Protocol` section.

## Universal Rules

### 1. Pre-Work Read-Only Recall
**Call `memory_search()` at task start before any file reads.**
- Use domain-specific context matching your agent's focus area
- Single call per task, not per turn
- Agents have **read-only** memory access — only `memory_search()` is available

### 2. Auto-Store by Zeus on Subtask Summary
**`memory_store()` is called AUTOMATICALLY by Zeus when you return a subtask_summary.**
- Include a clear `summary` field in your return — no explicit `memory_store()` call needed
- This is the **ONLY** persistence path: agent → subtask_summary → Zeus → memory_store
- Zeus persists ALL agent returns (implementers and read-only agents alike)

### 3. Write-Ahead Log (WAL)
Before Zeus calls `memory_store()`, it writes a write-ahead log to:
```
.pantheon/memory-wal/<agent>/<timestamp>.json
```
- WAL format: `{ agent, phase, summary, files_changed, status, timestamp }`
- WAL is written **before** the store operation — if store crashes, WAL is recovered on next session start
- WAL files are ephemeral (auto-cleaned after 7 days)

### 4. Relevance Threshold
**Skip search results if relevance score < 0.3.**
- Prevents noise from unrelated past entries
- Applies to `memory_search()` results only

### 5. Permanent Documentation
**ADR-level decisions → delegate to `@mnemosyne`.**
- Use for: architecture decisions, significant trade-offs, pattern changes
- Not for: routine task summaries (handled by Auto-Store)

## Per-Agent Overrides

Each agent file defines overrides in its `## 🧠 Memory Protocol` section:
- Domain-specific `memory_search()` context string
- Read-only access via `memory_search()` only — no `memory_store` for subagents
- Agent-specific rules (session-end, sprint close, quick-index, etc.)
