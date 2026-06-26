# TASK-016 — Level 3 Vector Memory: Hybrid FTS5 + sqlite-vec

**Status:** In Progress
**Priority:** HIGH
**Created:** 2026-06-26
**Dependencies:** NOTE0009 (design), NOTE0010 (roadmap)

## Architecture Decision

Dual-backend memory system with graceful degradation:

| Backend | Method | When Used |
|---------|--------|-----------|
| **sqlite-vec** (primary) | semantic KNN via sentence-transformers | sentence-transformers installed |
| **FTS5** (fallback) | BM25 keyword search via SQLite FTS5 | Always available (no ML deps) |
| **Flat grep** (last resort) | Line-by-line regex | Both backends unavailable |

Fallback chain: `sqlite-vec KNN` → `FTS5 BM25` → `Level 1 flat grep`

## Phase 1: Core Infrastructure (THIS SPRINT)

### Task 1.1: `scripts/vector-memory/schema.py`
- SQLite connection management (WAL mode)
- Create FTS5 virtual table for keyword search
- Create vec0 virtual table for vector search (sqlite-vec extension)
- Create memory_meta table for metadata + content_hash dedup
- Create memory_content table for full text retrieval
- Migration tracking via schema_version.txt
- Graceful: if sqlite-vec not loaded, skip vec0 table creation

### Task 1.2: `scripts/vector-memory/index.py`
- Load sentence-transformers model (all-MiniLM-L6-v2) — optional, warm
- Scan 01-active-context.md and 02-progress-log.md for new entries
- Compute content_hash (SHA-256) for idempotency
- Dual indexing: embed each entry → insert into vec0 + insert into FTS5
- Graceful: if no sentence-transformers, skip vector indexing, still index FTS5
- Return: "Indexed X new entries, skipped Y existing"

### Task 1.3: `scripts/vector-memory/query.py`
- `recall(query, top_k=5, filters=None)` — main entry point
- Auto-select backend: vector → FTS5 → grep
- Support filters: source_type, agent, phase, since date, tags
- Return structured results with score, source_path, content, metadata

### Task 1.4: `scripts/vector-memory/requirements.txt`
```
sqlite-vec>=0.1.0
sentence-transformers>=2.2.0
```

### Task 1.5: Tests
- Test schema creation with and without sqlite-vec
- Test index idempotency (re-indexing same content = no duplicates)
- Test all 3 query backends
- Test filter chaining

## Architecture Reference

See `docs/memory-bank/_notes/NOTE0009-level3-vector-memory-design.md` for full design.

## Effort
- ~3 sessions for Phase 1
- ~2 sessions for Phase 2 (Mnemosyne integration)
- ~1 session for Phase 3 (agent hooks)
- ~2 sessions for Phase 4+5 (auto-tagging + verification)
