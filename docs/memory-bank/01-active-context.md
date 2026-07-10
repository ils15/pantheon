# Active Context

> Priority file — agents read first. Keep current. Stale is worse than none.

## Current Focus
v3.17.0 — Unified Memory MCP Server: ChromaDB + sentence-transformers + FastMCP. Substitui Vector Memory + auto-index + compressão.

## What Changed (2026-07-09)
- **Memory MCP Server** — `scripts/memory_mcp_server.py`: 10 tools + 2 resources em ChromaDB. Multi-strategy search (dense + freshness + importance). Freshness decay (30-day half-life). Range compression (DCP-style). Claim verification. Markdown export. 40 testes, ruff clean.
- **3 MCPs total**: pantheon-resources, pantheon-code-mode, pantheon-memory
- **Permissões**: pantheon-resources + pantheon-memory = allow, code-mode = ask
- **Storage**: `~/.pantheon/memory/chroma.sqlite3` (ChromaDB PersistentClient)
- **Embeddings**: all-MiniLM-L6-v2 via sentence-transformers (~80MB, offline, download único)

## Key Decisions
- **ChromaDB como base** — vector + BM25-ready + SQLite nativo. Substitui bifrost_persistence.
- **Não plugin OpenCode** — MCP server standalone (Pantheon-native). Funciona com qualquer MCP client.
- **sentence-transformers local** — zero API cost, offline, modelo ~80MB (download único).
- **Freshness decay 30-dias** — half-life exponencial. Shokunin-inspired.
- **Range compression (DCP-style)** — não LLM-based. Determinístico, previsível.
- **Inspirações:** Shokunin (9 tools, freshness, verify), DCP (compress/expand), Magic Context (cross-session), RTK (output filtering), LCM (auto-recall), ACP (cache hit reference).

## Next
- ✅ Memory MCP Server — implementado (v3.17.0)
- ✅ P1-P4 Julho 2026 — implementados (v3.16.0)
- 🔜 TUI Plugin — rebuild para OpenCode v1.17.x
- 🔜 Auto-index migrado do bifrost para memory_store
- 🔜 Themis review do Memory Server (para finalizar)

## Blockers
None
