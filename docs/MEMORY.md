# Pantheon Memory System Guide

Pantheon's memory system provides persistent, multi-strategy memory for AI
agents using ChromaDB (vector database) + sentence-transformers (local
embeddings). All 14 tools are accessible via the `pantheon-memory` MCP server.

**Server script:** `scripts/memory_mcp_server.py`
**Storage:** `~/.pantheon/memory/chroma.sqlite3`

---

## How Memory Works

### Architecture

```
Agent tool call → MCP server → ChromaDB PersistentClient
                                    │
                            sentence-transformers
                            (all-MiniLM-L6-v2)
                                    │
                            SQLite storage
                            (~/.pantheon/memory/)
```

### Scoring Strategy

Each memory retrieval uses **fusion scoring** that combines three signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| **Dense vector similarity** | Primary | ChromaDB's built-in cosine similarity between query and stored embeddings |
| **Freshness decay** | Boost | 30-day exponential half-life. Newer entries score higher |
| **Importance boost** | Boost | User-set `importance` (0.0–1.0). Higher = more weight |

**Freshness decay formula:** `score = cosine_sim × freshness × (1 + importance)`

Where `freshness = 2^(-days_since_store / 30)` — after 30 days, an entry's
freshness contribution halves.

### Memory Metadata

Every entry stores:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated unique identifier |
| `content` | str | The text content (max 50,000 chars) |
| `timestamp` | ISO 8601 | When the entry was created/updated |
| `agent` | str | Which agent stored this (e.g., `"hermes"`) |
| `category` | str | Classification (`"memory"`, `"session_fact"`, `"decision"`, `"tool_output"`) |
| `session_id` | str | Logical session grouping |
| `importance` | float | 0.0–1.0 |
| `verified` | bool | Whether claim verification ran |
| `truncated` | bool | Whether RTK output filtering was applied |
| `links` | list[str] \| null | Linked entry IDs (knowledge graph) |

---

## Tool Reference

### 1. `memory_store` — Store a Memory Entry

Stores content with metadata. Returns entry ID and timestamp.

```python
memory_store(
    content: str,                    # The text to store
    category: str = "memory",        # "session_fact", "memory", "decision", "tool_output"
    agent: str = "unknown",          # Your agent name
    session_id: str = "default",     # Session grouping key
    importance: float = 0.5,         # 0.0 (trivial) to 1.0 (critical)
    truncate: bool = False,          # Apply RTK output filtering
    links: str | list[str] | None = None  # Entry IDs to link to
) -> str:                            # JSON: {"id": "...", "timestamp": "..."}
```

**Examples:**

```python
# Store a simple fact
memory_store(
    content="The JWT refresh token rotation uses SHA-256 hashing",
    category="decision",
    agent="hermes",
    session_id="sprint-17",
    importance=0.8
)

# Store with RTK filtering (dedup + truncate)
memory_store(
    content=large_tool_output,
    category="tool_output",
    truncate=True,
    session_id="session-abc"
)

# Store with knowledge graph links
memory_store(
    content="User model updated with role-based access control",
    category="decision",
    links=["abc123", "def456"]
)
```

### 2. `memory_search` — Search with Fusion Scoring

Search by semantic similarity, with freshness and importance boosts.

```python
memory_search(
    query: str,                      # Natural language query
    n_results: int = 5,              # Max results (1–100)
    category_filter: str | None = None  # Optional category filter
) -> str:                            # JSON with ranked results
```

**Examples:**

```python
# General semantic search
memory_search(query="how do we handle JWT refresh tokens?")

# Search within a specific category
memory_search(
    query="database migration strategy",
    category_filter="decision",
    n_results=10
)
```

### 3. `memory_recall` — Auto-Recall for Prompt Injection

Takes your current context, searches memory, and returns a formatted markdown
block ready to inject into your prompt. This is the **primary entry point** for
agents at session start.

```python
memory_recall(
    context: str,                    # Your current task context
    n_results: int = 3               # Number of relevant memories (1–20)
) -> str:                            # Formatted markdown for prompt injection
```

**Example output format:**

```
## 🔍 Relevant Past Memories
- [2026-07-09] JWT: refresh token rotation uses SHA-256 hashing (importance: 0.8)
  Content: The JWT refresh token rotation uses SHA-256 hashing for secure invalidation.
...
```

**Recommended usage — call at session start:**

```python
# At the start of every session, recall relevant context
past = memory_recall(context="implementing user authentication with JWT", n_results=5)
# Inject `past` into your prompt for continuity
```

### 4. `memory_compress` — Compress Old Entries

Summarizes the oldest entries in a session into a single compressed entry.
This frees up search space while preserving key information.

```python
memory_compress(
    session_id: str,                 # Session to compress
    max_entries: int = 50,           # Max entries before compression triggers
    compression_ratio: float = 0.5   # Target compression ratio (0.0–1.0)
) -> str:                            # Status message
```

**When to use:** When a session has accumulated many entries (>50), call
compress to reduce noise. The original entries remain expandable.

### 5. `memory_expand` — Restore Compressed Entry

If a compressed entry's detail is needed, expand it back.

```python
memory_expand(entry_id: str) -> str  # Original detailed content
```

### 6. `memory_consolidate` — Merge Similar Entries

Finds entries with high cosine similarity in the same session/category and
merges them into a single entry (keeping the most recent timestamp).

```python
memory_consolidate(
    session_id: str | None = None    # Session scope (None = all sessions)
) -> str:                            # Status with merge count
```

**When to use:** Periodically, to deduplicate similar memories and reduce
vector search noise.

### 7. `memory_delete` — Delete an Entry

```python
memory_delete(entry_id: str) -> str  # Status message
```

### 8. `memory_update` — Update Entry Content/Metadata

```python
memory_update(
    entry_id: str,
    content: str | None = None,
    category: str | None = None,
    importance: float | None = None
) -> str:                            # Status message
```

### 9. `memory_link` — Create Knowledge Graph Relationship

Creates a bidirectional link between two entries with a relation label.

```python
memory_link(
    from_id: str,                    # Source entry ID
    to_id: str,                      # Target entry ID
    relation: str = "references"     # Relation label
) -> str:                            # Status message
```

**Relation labels:**

| Label | Meaning |
|-------|---------|
| `references` | General reference (default) |
| `supersedes` | New entry replaces old one |
| `contradicts` | Opposing information |
| `supports` | Reinforcing evidence |
| `causes` | Causal relationship |
| `depends_on` | Prerequisite relationship |

### 10. `memory_traverse` — Walk Knowledge Graph

Starting from an entry, follow links up to `max_depth` hops.

```python
memory_traverse(
    entry_id: str,                   # Starting entry
    max_depth: int = 1               # Link traversal depth
) -> str:                            # Tree of related entries with summaries
```

**Example:**

```python
# Find all related decisions linked from this entry
graph = memory_traverse(entry_id="abc123", max_depth=2)
```

### 11. `memory_verify` — Claim Verification

Verifies a memory claim exists and checks its freshness (Shokunin-style).

```python
memory_verify(entry_id: str) -> str  # JSON: {exists, fresh, age_days, ...}
```

An entry is considered **stale** if:
- Age > 90 days (no confidence)
- Age > 30 days and importance below 0.5

### 12. `memory_sessions` — List All Sessions

```python
memory_sessions(format: str = "json") -> str  # Sessions list in JSON or markdown
```

### 13. `memory_export` — Export Memories as Markdown

```python
memory_export(
    session_id: str | None = None,   # Filter by session
    filename: str | None = None      # Optional file path to write to
) -> str:                            # Markdown formatted memories
```

### 14. `memory_cleanup` — Delete Test Sessions

```python
memory_cleanup(session_prefix: str = "test-") -> str  # Status message
```

Minimum prefix length: 3 characters (safety guard).

---

## Knowledge Graph

The memory system supports a bidirectional knowledge graph via `memory_link`
and `memory_traverse`.

### Creating Links

```python
# Store entries first, then link them
r1 = memory_store(content="Decided to use Redis for session caching", category="decision")
r2 = memory_store(content="Implementing Redis adapter in session_service.py", category="session_fact")

# Parse IDs from returned JSON
import json
id1 = json.loads(r1)["id"]
id2 = json.loads(r2)["id"]

# Link them
memory_link(from_id=id1, to_id=id2, relation="causes")
```

### Traversing Links

```python
# Walk the graph
graph = memory_traverse(entry_id=id1, max_depth=3)
```

This returns a tree structure showing all linked entries up to 3 hops away.

### Link Constraints

- Max depth guard prevents cycles (max 10 hops in a single traverse call)
- Links are bidirectional — linking A→B also allows traversal B→A
- Links stored in the entry's `links` metadata field

---

## Freshness Decay

The freshness scoring system ensures recent, important information surfaces
above old, low-importance noise.

### Decay Curve

| Age | Freshness Multiplier |
|-----|---------------------|
| 0 days | 1.0 |
| 30 days | 0.5 (half-life) |
| 60 days | 0.25 |
| 90 days | 0.125 |
| 180 days | ~0.016 |

### Practical Effects

- **Recent decisions** (today–7 days) strongly prioritized
- **Last month's work** still surfaces if important (importance ≥ 0.7)
- **Old tool output** (session noise) naturally fades away
- **High-importance anchors** (importance 0.9–1.0) remain relevant longer

### Verification Staleness

`memory_verify` flags entries as stale using:
- **Stale**: age > 90 days (no confidence in accuracy)
- **Warn**: age > 30 days AND importance < 0.5

---

## Compression System

The compression system (DCP-style range compression) is **deterministic** —
not LLM-based. It groups entries by category and creates summary entries.

### When to Compress

```python
# After a session accumulates many entries
memory_compress(session_id="sprint-17", max_entries=50, compression_ratio=0.5)
```

### What Compression Does

1. Finds the oldest entires in a session
2. Groups them by category
3. Creates a single compressed entry summarizing the group
4. Returns a status message with the compressed entry ID

### Expanding

If you need details from a compressed entry:

```python
details = memory_expand(entry_id="compressed-entry-id")
```

---

## Agent Usage Patterns

### Session Start — Always Recall

Every agent should call `memory_recall` at session start:

```python
# At session start
ctx = "implementing user authentication with refresh tokens"
memories = memory_recall(context=ctx, n_results=5)
# Inject into your system prompt
```

### Important Decisions — Always Store

When you make a decision:

```python
memory_store(
    content="decision details",
    category="decision",
    agent="hermes",
    importance=0.9
)
```

### Cross-Referencing — Link Related Entries

When two memories are related:

```python
memory_link(from_id="decision-id", to_id="implementation-id", relation="causes")
```

### Periodic Maintenance

```python
# Consolidate duplicates
memory_consolidate(session_id="sprint-17")

# Compress old entries
memory_compress(session_id="sprint-17", max_entries=100, compression_ratio=0.5)

# Export for review
memory_export(session_id="sprint-17", filename="/tmp/sprint-17-export.md")
```

---

## Storage & Performance

| Aspect | Detail |
|--------|--------|
| **Database** | ChromaDB PersistentClient (SQLite-backed) |
| **Location** | `~/.pantheon/memory/chroma.sqlite3` |
| **Embedding model** | `all-MiniLM-L6-v2` (~80MB, downloaded once via sentence-transformers) |
| **Max content length** | 50,000 characters per entry |
| **Max results** | 100 per search, 20 per recall |
| **Categories** | Unlimited (user-defined strings) |

### Performance Tips

- Use `category_filter` in `memory_search` for faster, more relevant results
- Use `truncate=True` in `memory_store` for large tool outputs
- Run `memory_consolidate` periodically to reduce vector search noise
- Run `memory_compress` when a session has >50 entries
- Use `memory_cleanup("test-")` to remove test data after development

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `memory_recall` returns empty | No entries match context | Store some content first, try broader query |
| "Failed to store memory" | Content too long (>50k chars) | Use `truncate=True` or reduce content size |
| Search returns irrelevant results | No entries with matching semantics | Store more content, use specific category filters |
| Entry not found in link/traverse | ID was from a different ChromaDB instance | Check `~/.pantheon/memory/` exists and is consistent |
| Export creates empty file | No entries match the session_id | Verify session_id with `memory_sessions()` |
| Model download fails | No internet for first-time download | Ensure network access for `all-MiniLM-L6-v2` download |
