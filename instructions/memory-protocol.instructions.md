---
description: "Universal memory protocol rules for all Pantheon agents with agent-specific overrides"
name: "Memory Protocol"
applyTo: "agents/*.agent.md"
---

# 🧠 Memory Protocol — Universal Rules

These rules apply to ALL Pantheon agents. Agent-specific overrides are defined
in each agent's `## 🧠 Memory Protocol` section.

## Universal Rules

### 1. Pre-Work Recall
**Call `memory_recall()` or `memory_search()` at task start before any file reads.**
- Use domain-specific context matching your agent's focus area
- Single call per task, not per turn

### 2. Auto-Store on Subtask Summary
**`memory_store()` is called automatically by Zeus when you return a subtask_summary.**
- Include a clear `summary` field in your return
- No explicit `memory_store()` call needed from your side
- Read-only agents (Apollo, Themis, Athena, Gaia, Iris, Talos): results are persisted by Zeus

### 3. Relevance Threshold
**Skip recall results if relevance score < 0.3.**
- Prevents noise from unrelated past entries
- Applies to `memory_recall()` results only

### 4. Permanent Documentation
**ADR-level decisions → delegate to `@mnemosyne`.**
- Use for: architecture decisions, significant trade-offs, pattern changes
- Not for: routine task summaries (handled by Auto-Store)

## Per-Agent Overrides

Each agent file defines overrides in its `## 🧠 Memory Protocol` section:
- Domain-specific `memory_recall()` context string
- Read-only vs read-write memory access
- Agent-specific rules (session-end, sprint close, quick-index, etc.)
