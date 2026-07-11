# Level 3 — Vector Memory Design

**Status:** Proposed
**Date:** 2026-06-20
**Author:** Hephaestus
**Dependencies:** Level 1 (built), Level 2 (designing)

---

## Problem Statement

Pantheon agents have no persistent semantic memory. Decision history from 3+ sprints ago requires reading entire markdown files — wasting tokens on every context load. The current Level 1 compression (subtask_summaries → 1-line table rows) and Level 2 intelligent compression (priority scoring, semantic summarization) still produce flat text. Agents cannot ask: "What did we decide about auth token rotation?" without re-reading the entire progress log.

**Level 3 adds vector search to the memory hierarchy.**

---

## 1. Vector Store Choice: sqlite-vec

**Chosen: `sqlite-vec` v0.1.9**

### Comparison

| Criterion | sqlite-vec | ChromaDB | FAISS | JSON + numpy |
|-----------|-----------|----------|-------|-------------|
| Server dependency | None (SQLite extension) | Embedded mode available but heavy | None (C++ lib) | None |
| File portability | Single `.db` file | Directory of parquet + sqlite3 | Binary index file | JSON file |
| ANN search | `vec0` virtual table (KNN) | HNSW index (fast) | IVF/HNSW (fast) | Brute-force only |
| Install weight | 1 C file, pip install | ~200MB (onnxruntime, hnswlib) | ~30MB compiled | 0 (stdlib) |
| Python API | `sqlite3` stdlib + `sqlite_vec.load()` | `chromadb.Client()` | `faiss.IndexFlatL2()` | `numpy.linalg.norm` |
| Concurrent reads | ✅ SQLite WAL mode | ⚠️ Single-writer | ❌ Manual locking | ✅ Read-only |
| Metadata filtering | SQL WHERE clauses | ChromaDB `where=` filter | Manual post-filter | Manual |
| Maturity | Pre-v1, 7K GitHub stars | v1.5, stable | v1.7, Meta-backed | N/A |
| Node.js binding | ✅ `npm install sqlite-vec` | ✅ `npm install chromadb` | ❌ Native C++ | N/A |

### Justification

sqlite-vec is the only option that satisfies ALL constraints:

1. **Portable (no server):** Pure C extension loaded into Python's `sqlite3` stdlib. No daemon, no process, no network. A single `.db` file that can be copied between machines.
2. **File-based:** Output is a standard SQLite database. `docs/memory-bank/.vectordb/pantheon-memory.db` is gitignored but persists on disk.
3. **ANN search built-in:** `vec0` virtual tables support `MATCH` with `k=N` for KNN queries. Cosine distance, L2, and L1 supported.
4. **SQL filtering:** Metadata filters are standard `WHERE` clauses — no separate query language.
5. **No dependency cascade:** ChromaDB pulls in onnxruntime, hnswlib, pydantic, etc. sqlite-vec is a single C file compiled to a shared library. Installs in under 1 second.
6. **Node.js fallback:** If we ever move the pipeline to JS, the npm package exists.

### Trade-off

sqlite-vec uses brute-force KNN (no HNSW/IVF index). For Pantheon's volume (hundreds to low thousands of vectors at 384 dimensions), brute-force is sub-millisecond. HNSW indexing overhead would exceed query time for this scale.

---

## 2. Embedding Model: Local sentence-transformers

**Chosen: `all-MiniLM-L6-v2` via `sentence-transformers`**

### Comparison

| Criterion | all-MiniLM-L6-v2 (local) | text-embedding-3-small (OpenAI) |
|-----------|--------------------------|--------------------------------|
| Dimensions | 384 | 1536 |
| Model size | ~90MB download, once | 0 (API call) |
| Cost per embedding | $0 | $0.02 / 1M tokens |
| Latency (cold) | ~2s (first load) | ~200ms network |
| Latency (warm) | ~5ms per text | ~200ms per text |
| Offline capable | ✅ Yes | ❌ Requires internet |
| API key required | ❌ No | ✅ Yes |
| Quality (MTEB avg) | 60.0 | 62.3 |
| Max tokens | 256 | 8191 |
| Install | `pip install sentence-transformers` | `pip install openai` |

### Justification

Pantheon's use case is agent memory recall — finding the right decision among 500-2000 entries. 384 dimensions is sufficient. The 2.3-point quality gap on MTEB benchmarks is negligible for this task.

**Zero recurring cost** is the decisive factor. A typical sprint produces ~20-50 embeddable entries. At ~200 tokens each, OpenAI would cost ~$0.004/sprint — trivially cheap, but requiring internet, API key management, and an account dependency. The local model works in air-gapped environments and costs nothing after the initial `pip install`.

### Cold-start mitigation

The first `SentenceTransformer('all-MiniLM-L6-v2')` call downloads ~90MB and takes ~5 seconds. Subsequent calls in the same Python process are instant. The indexing script keeps the model loaded for the entire pipeline session.

### Fallback

If `sentence-transformers` is not installed, the pipeline degrades gracefully:
1. Log a warning: `sentence-transformers not installed. Run: pip install sentence-transformers`
2. Skip vector indexing for the session
3. Agents fall back to Level 1 (flat text search) for recall queries

---

## 3. Storage Layout

```
docs/memory-bank/
├── .vectordb/                      # ← NEW, gitignored (inherits from docs/memory-bank/)
│   ├── pantheon-memory.db          # SQLite database with vec0 tables
│   └── schema_version.txt          # Migration tracking
├── .tmp/                           # Ephemeral artifacts
├── _notes/                         # Permanent ADRs
├── _tasks/                         # Task records
├── 00-project.md
├── 01-active-context.md
└── 02-progress-log.md
```

### Why NOT XDG?

XDG (`$XDG_DATA_HOME/pantheon/vectordb/`) was considered but rejected:
- The vector DB is tightly coupled to the memory bank — it indexes its content
- Moving the repo = losing the index, requiring full rebuild
- Gitignoring is simpler than cross-platform XDG resolution

### Database schema

```sql
-- Vector index table (vec0 virtual table for KNN search)
CREATE VIRTUAL TABLE vec_memory USING vec0(
    memory_id INTEGER PRIMARY KEY,
    embedding float[384],           -- all-MiniLM-L6-v2 384-dim vectors
    +source_type TEXT,               -- 'subtask_summary' | 'adr' | 'wisdom' | 'impl_artifact' | 'decision'
    +source_path TEXT,               -- relative path to the original file
    +agent TEXT,                     -- originating agent (zeus, hermes, etc.)
    +phase TEXT,                     -- phase label (e.g., 'phase2-backend-auth')
    +sprint TEXT,                    -- sprint identifier
    +priority INTEGER,              -- 1=low, 2=medium, 3=high (from Level 2 scoring)
    +tags TEXT,                      -- comma-separated: 'auth,security,jwt'
    +created_at TEXT,               -- ISO 8601 timestamp
    +content_hash TEXT              -- SHA-256 of text content (idempotency key)
);

-- Metadata-only table (for filtering before KNN)
CREATE TABLE memory_meta (
    memory_id INTEGER PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_path TEXT NOT NULL,
    agent TEXT,
    phase TEXT,
    sprint TEXT,
    priority INTEGER DEFAULT 2,
    tags TEXT,
    created_at TEXT NOT NULL,
    content_hash TEXT UNIQUE NOT NULL,
    char_count INTEGER NOT NULL
);

-- Lookup table for full text retrieval after KNN match
CREATE TABLE memory_content (
    memory_id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,            -- original text (not chunked, full entry)
    FOREIGN KEY (memory_id) REFERENCES memory_meta(memory_id)
);
```

The `+` prefix on `vec0` columns means they are **auxiliary** — stored alongside the vector but not indexed in the vector space. They are accessible in `SELECT` queries and usable in `WHERE` clauses for filtering.

---

## 4. Indexing Pipeline

### Trigger points

| Event | What gets embedded | Trigger |
|-------|-------------------|---------|
| **Phase completion** | All subtask_summaries from completed phase | `@mnemosyne compress_context` handoff (Level 1) fires Level 3 indexing after compression |
| **ADR creation** | The ADR's full markdown content | `@mnemosyne Create artifact: ADR-XXXX` |
| **Wisdom learning** | Extracted wisdom from `wisdom-accumulation` skill | After `compress_context`, Mnemosyne scans for new wisdom entries |
| **Manual re-index** | All files in `_notes/`, `02-progress-log.md`, active context | `@hephaestus Rebuild vector index` |
| **Sprint close** | Remaining un-indexed entries | `@mnemosyne Close sprint` triggers final batch |

### Pipeline flow

```
Phase completes → Themis APPROVES
    ↓
Zeus delegates compress_context → Mnemosyne
    ↓
Mnemosyne compression (Level 1):
  1. subtask_summaries → 1-line table rows in 01-active-context.md
  2. IMPL artifacts → archive to 02-progress-log.md
    ↓
Mnemosyne calls Hephaestus for embedding (Level 3):
  1. Hephaestus loads sentence-transformers model (once per session)
  2. Scans 01-active-context.md and 02-progress-log.md for new entries
  3. Computes content_hash for each entry
  4. Skips entries already in memory_meta (idempotency via content_hash)
  5. Embeds each new entry → serialize_f32 → INSERT INTO vec_memory
  6. Returns: "Indexed 12 new entries, skipped 45 existing, 0 errors"
```

### Idempotency

Each entry's `content_hash` is `sha256(text_content)`. Before embedding, the pipeline checks `SELECT 1 FROM memory_meta WHERE content_hash = ?`. If found, the entry is skipped. Re-running the indexing pipeline is safe and cheap.

### Embedding script location

```
scripts/vector-memory/
├── index.py              # Main indexing script
├── query.py              # Semantic recall query
├── rebuild.py            # Full re-index from scratch
└── requirements.txt      # sentence-transformers, sqlite-vec
```

---

## 5. Query Interface

### New Mnemosyne command: `@mnemosyne Recall`

```
@mnemosyne Recall "auth token rotation decision"
@mnemosyne Recall "jwt" --top-k 5 --agent hermes --since 2026-05-01
@mnemosyne Recall "database migration pattern" --type adr
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` (positional) | string | required | Natural language query |
| `--top-k` | int | 5 | Number of results |
| `--type` | enum | all | Filter: `subtask`, `adr`, `wisdom`, `impl`, `decision` |
| `--agent` | string | all | Filter by originating agent |
| `--phase` | string | all | Filter by phase label |
| `--since` | ISO date | none | Only entries after this date |
| `--min-priority` | int | 0 | Minimum priority score |
| `--tags` | string | none | Comma-separated tag filter |
| `--include-content` | bool | true | Include full text in results |

### Return format

```
## 🔍 Semantic Recall: "auth token rotation decision"

**Top 5 results** (searched 187 entries in 12ms):

| # | Score | Type | Agent | Date | Source |
|---|-------|------|-------|------|--------|
| 1 | 0.94 | decision | hermes | 2026-05-15 | ADR-0005-jwt-rotation.md |
| 2 | 0.87 | subtask | hermes | 2026-05-15 | 02-progress-log.md: L142 |
| 3 | 0.82 | wisdom | zeus | 2026-05-16 | 01-active-context.md: L88 |
| 4 | 0.71 | impl | hermes | 2026-05-14 | IMPL-phase2-hermes.md |
| 5 | 0.65 | subtask | themis | 2026-05-15 | 02-progress-log.md: L150 |

---
### Result 1 (score: 0.94)
**Source:** `_notes/ADR-0005-jwt-rotation.md`
**Agent:** @hermes | **Date:** 2026-05-15
**Decision:** Adopt refresh token rotation with 30-day absolute expiry.
...

### Result 2 (score: 0.87)
**Source:** `02-progress-log.md: L142`
**Agent:** @hermes | **Date:** 2026-05-15
**Summary:** Implemented JWT refresh token rotation: /auth/refresh returns new access+refresh pair,...
```

### Implementation

`scripts/vector-memory/query.py`:
```python
def recall(query: str, top_k: int = 5, filters: dict = None) -> list[dict]:
    model = _get_model()
    query_vec = model.encode(query).tolist()
    serialized = struct.pack(f"{len(query_vec)}f", *query_vec)

    sql = """
        SELECT
            vm.memory_id,
            vm.distance,
            mm.source_type,
            mm.source_path,
            mm.agent,
            mm.phase,
            mm.sprint,
            mm.priority,
            mm.tags,
            mm.created_at,
            mc.content
        FROM vec_memory vm
        JOIN memory_meta mm ON vm.memory_id = mm.memory_id
        JOIN memory_content mc ON vm.memory_id = mc.memory_id
        WHERE vm.embedding MATCH ?
          AND vm.k = ?
    """
    # Append dynamic filters
    if filters.get('source_type'):
        sql += " AND mm.source_type = ?"
    if filters.get('agent'):
        sql += " AND mm.agent = ?"
    # ...
    sql += " ORDER BY vm.distance"

    return db.execute(sql, params).fetchall()
```

---

## 6. Agent Integration

### Direct invocation

Any agent can call `@mnemosyne Recall "query"` directly in their prompt:

```
@hermes Implement JWT token rotation. Before starting:
@mnemosyne Recall "token rotation decisions"
```

### Auto-context injection (Zeus orchestration)

When Zeus reads `01-active-context.md`, Mnemosyne automatically injects relevant historical context:

```
@zeus Plan feature: add refresh token rotation

[Zeus reads 01-active-context.md]
[Mmemosyne intercepts: semantically relevant memories found]
→ Injecting 3 related memories from past sprints...
```

This is controlled by a setting in `opencode.json`:
```json
{
  "vector_memory": {
    "auto_inject_on_read": true,
    "max_injected_entries": 3,
    "min_similarity_score": 0.75
  }
}
```

### Which agents use it?

| Agent | Use case | Frequency |
|-------|----------|-----------|
| **Zeus** | Before planning: recall relevant past decisions | Every sprint |
| **Hermes/Aphrodite/Demeter** | Before implementing: recall related implementations | Per task |
| **Themis** | Before review: recall past review findings on similar code | Per review |
| **Athena** | During planning: check for conflicting past decisions | Per plan |
| **Apollo** | During discovery: recall past research on similar patterns | Per research |
| **Mnemosyne** | During compression: auto-tag and index new content | Per phase |

### Integration pattern

Each agent's prompt template includes a pre-action hook:
```
Before {action}, run: @mnemosyne Recall "{action_description}" --top-k 3
```

Example (in `agents/hermes.agent.md`):
```
## Pre-Implementation Checklist
1. Read 01-active-context.md
2. @mnemosyne Recall "related implementations for {feature}" --top-k 5 --agent hermes
3. Read relevant ADRs from recall results
```

---

## 7. Metadata Schema

### Field definitions

| Field | Type | Source | Example |
|-------|------|--------|---------|
| `memory_id` | INTEGER PK | Auto-increment | 42 |
| `source_type` | TEXT | Classified during indexing | `adr`, `subtask_summary`, `wisdom`, `impl_artifact`, `decision` |
| `source_path` | TEXT | File path where content originated | `_notes/ADR-0005.md`, `02-progress-log.md:L142` |
| `agent` | TEXT | Extracted from metadata or context | `hermes`, `zeus`, `themis` |
| `phase` | TEXT | From artifact filename or context | `phase2-auth-backend` |
| `sprint` | TEXT | From active-context or timestamp | `sprint-2026-05-15` |
| `priority` | INTEGER | Level 2 priority score | 1 (low), 2 (medium), 3 (high) |
| `tags` | TEXT | Auto-extracted or manual | `auth,security,jwt,backend` |
| `created_at` | TEXT | ISO 8601, from artifact/file | `2026-05-15T14:30:00Z` |
| `content_hash` | TEXT | SHA-256 of text | `a1b2c3d4...` |
| `char_count` | INTEGER | Length of original content | 342 |

### Tag auto-extraction

During indexing, Hephaestus runs a lightweight keyword extraction:
1. Normalize text (lowercase, strip punctuation)
2. Match against a curated keyword list for Pantheon domains:
   - `auth, jwt, oauth, token, session, password`
   - `database, migration, schema, query, index`
   - `api, endpoint, route, handler, middleware`
   - `frontend, component, ui, css, responsive`
   - `docker, deploy, ci, pipeline, infrastructure`
   - `security, vulnerability, injection, xss, csrf`
   - `vector, embedding, rag, langchain, model`
3. Also extract any `@agent-name` mentions as tags
4. Merge with manual tags from artifact frontmatter

### Priority inheritance

When a Level 2 priority score exists for the entry, it's stored directly. When no score exists, defaults:
- ADRs: priority 3 (high — permanent decisions)
- Impl artifacts: priority 2 (medium)
- Subtask summaries: priority 1 (low)
- Wisdom learnings: priority 3 (high)

---

## 8. Chunking Strategy: Embed Entire Entries

### Decision: No chunking

Subtask summaries, ADRs, wisdom learnings, and artifact summaries are already small by design:

| Content type | Typical size | Chars | Tokens |
|-------------|-------------|-------|--------|
| subtask_summary | 2-3 sentences | ~250 | ~60 |
| ADR (per the 50-line rule) | ~20 lines | ~800 | ~200 |
| Wisdom learning | 1-2 sentences | ~150 | ~35 |
| Impl artifact summary | 5-10 bullet points | ~500 | ~120 |

`all-MiniLM-L6-v2` has a **256 token limit**. Every entry type fits comfortably within this limit. Chunking would fragment semantic meaning (a 2-sentence summary split across two vectors is worse than one). The retrieval unit is always the full entry.

### Exception: 02-progress-log.md

The progress log is a large append-only file. When indexing it, Hephaestus:
1. Splits the file on `## [YYYY-MM-DD]` or `---` separators
2. Each milestone section becomes a separate entry
3. Entry text is the section header + first 3 lines (summary)
4. `source_path` includes line number: `02-progress-log.md:L142`

---

## 9. Cost Estimate

### Per-entry cost

| Component | Resource | Cost |
|-----------|----------|------|
| Embedding (384-dim) | ~5ms CPU | $0 (local) |
| Vector storage (384 floats) | 1,536 bytes | $0 (disk, ~1.5KB) |
| Metadata row | ~200 bytes | $0 (disk) |
| Content row | ~500 bytes avg | $0 (disk) |
| **Total per entry** | ~5ms, ~2.2KB | **$0.00** |

### Per-sprint cost (typical session: 50 entries)

| Metric | Value |
|--------|-------|
| Embeddings computed | 50 |
| CPU time | ~250ms (one-time, parallelized) |
| Disk space | ~110KB |
| Query latency (KNN over 500 vectors) | ~2-8ms |
| **Total cost** | **$0.00** |

### Per-year cost (50 sprints × 50 entries)

| Metric | Value |
|--------|-------|
| Total entries | 2,500 |
| Total disk | ~5.5MB |
| Query latency (KNN over 2,500 vectors) | ~15-40ms |
| **Total cost** | **$0.00** |

### Startup cost (model download)

| Component | Size | Time |
|-----------|------|------|
| `pip install sentence-transformers` | ~200MB | ~30s |
| `pip install sqlite-vec` | ~2MB | ~2s |
| First `SentenceTransformer('all-MiniLM-L6-v2')` | ~90MB | ~5s |
| **Total one-time** | ~292MB | ~37s |

---

## 10. Implementation Phases

### Phase 1: Core infrastructure (Hephaestus)
- [ ] `scripts/vector-memory/requirements.txt`
- [ ] `scripts/vector-memory/index.py` — embedding pipeline
- [ ] `scripts/vector-memory/query.py` — semantic recall
- [ ] `scripts/vector-memory/schema.py` — DB initialization + migrations
- [ ] Unit tests: index idempotency, query correctness, metadata filtering

### Phase 2: Mnemosyne integration
- [ ] Add `@mnemosyne Recall` command handler
- [ ] Wire `compress_context` handoff → auto-index new entries
- [ ] Wire `Close sprint` → final batch index
- [ ] Return formatting for recall results

### Phase 3: Agent pre-action hooks
- [ ] Update `agents/zeus.agent.md` — pre-planning recall hook
- [ ] Update `agents/hermes.agent.md` — pre-implementation recall hook
- [ ] Update `agents/themis.agent.md` — pre-review recall hook
- [ ] Update `agents/athena.agent.md` — plan validation recall hook

### Phase 4: Auto-tagging & optimization
- [ ] Keyword-based auto-tagging during indexing
- [ ] `scripts/vector-memory/rebuild.py` — full re-index
- [ ] `opencode.json` vector_memory config block
- [ ] Performance: embed in batches, keep model warm

### Phase 5: Node.js binding (optional, future)
- [ ] `scripts/vector-memory/index.mjs` — JS-native pipeline
- [ ] `scripts/vector-memory/query.mjs` — JS-native recall

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `sentence-transformers` not installed | Medium | Recall returns empty; agents fall back to Level 1 | Graceful degradation: log warning, skip indexing |
| sqlite-vec pre-v1 API breakage | Low | Upgrade breaks index | Pin version in requirements.txt; rebuild script handles migration |
| Model context window (256 tokens) truncates long entries | Low | Semantic signal loss on >256 token entries | ADRs capped at 50 lines (~200 tokens); progress log entries are summaries |
| 384-dim vectors insufficient for 2,500+ entries | Low | Recall quality degrades | Monitor; switch to `all-mpnet-base-v2` (768-dim) if needed |
| Index file corruption | Low | Recall returns garbage or fails | `content_hash` enables full rebuild from source files; index is derived data |
| Agents over-rely on vector recall and skip reading source | Medium | Stale/incomplete context | Recall results always include `source_path`; agents must read the original |

---

## 12. Decision Log

| Decision | Chosen | Alternatives rejected | Rationale |
|----------|--------|----------------------|-----------|
| Vector store | sqlite-vec | ChromaDB, FAISS, JSON+numpy | Zero server, single file, SQL filtering, pure C |
| Embedding model | all-MiniLM-L6-v2 | text-embedding-3-small, all-mpnet-base-v2 | Free, offline, 384-dim sufficient for agent memory |
| Storage location | `docs/memory-bank/.vectordb/` | XDG data dir | Co-located with memory bank, auto-gitignored |
| Chunking | None (embed full entries) | Semantic chunking, fixed-size chunks | All entries under 256-token limit by design |
| Query interface | `@mnemosyne Recall` | New agent, direct script call | Natural fit with existing Mnemosyne memory ownership |
| Tag extraction | Keyword matching | LLM-based classification, manual only | Fast, deterministic, zero token cost |

---

## References

- `docs/memory-bank/` — existing memory bank structure
- `docs/memory-bank/01-active-context.md` — active context (Level 1 compression target)
- `docs/memory-bank/02-progress-log.md` — progress log (append-only archive)
- `agents/mnemosyne.agent.md` — Mnemosyne agent definition
- `agents/hephaestus.agent.md` — Hephaestus agent definition (AI pipelines owner)
- `routing.yml` — `compress_context` handoff (zeus → mnemosyne)
- `instructions/artifact-protocol.instructions.md` — artifact lifecycle
- `skills/memory-bank/SKILL.md` — memory bank compression rules
- https://alexgarcia.xyz/sqlite-vec/ — sqlite-vec documentation
- https://www.sbert.net/ — sentence-transformers documentation
