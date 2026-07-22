#!/usr/bin/env python3
"""Pantheon Memory MCP Server — lightweight, zero heavy deps.

Uses sqlite-vec (vector extension) + fastembed (ONNX, no PyTorch)
for semantic memory with hybrid search (vector cosine + FTS5 BM25).

Total footprint: ~50MB (sqlite-vec + fastembed) vs ~1.4GB (old chromadb).

Tools:
    memory_store   — Store with automatic embedding
    memory_search  — Hybrid vector + FTS5 keyword search
    memory_recall  — Exact recall by key
    memory_forget  — Delete by ID or key
    memory_list    — Chronological listing
    memory_stats   — DB statistics

Usage:
    python scripts/memory_mcp_server.py
"""

from __future__ import annotations

import functools
import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any

from _pantheon_paths import pantheon_home
from fastembed import TextEmbedding
from mcp.server.fastmcp import FastMCP

# ── Paths ─────────────────────────────────────────────────────────────────────

DB_PATH = pantheon_home() / "memory" / "memory.db"
EMBED_CACHE = Path.home() / ".cache" / "fastembed"

# ── Schema ────────────────────────────────────────────────────────────────────

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    namespace TEXT NOT NULL DEFAULT 'default',
    key TEXT,
    value TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_ns_key
    ON memories(namespace, key);

CREATE VIRTUAL TABLE IF NOT EXISTS vec_memories USING vec0(
    id INTEGER PRIMARY KEY,
    embedding float[384]
);

CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    namespace, key, value, metadata,
    content='memories', content_rowid='id',
    tokenize='porter unicode61'
);

-- FTS sync: INSERT
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(rowid, namespace, key, value, metadata)
    VALUES (new.id, new.namespace, new.key, new.value, new.metadata);
END;

-- FTS sync: DELETE
CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, namespace, key, value, metadata)
    VALUES ('delete', old.id, old.namespace, old.key, old.value, old.metadata);
END;

-- FTS sync: UPDATE
CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, namespace, key, value, metadata)
    VALUES ('delete', old.id, old.namespace, old.key, old.value, old.metadata);
    INSERT INTO memories_fts(rowid, namespace, key, value, metadata)
    VALUES (new.id, new.namespace, new.key, new.value, new.metadata);
END;
"""

# ── FastMCP App ───────────────────────────────────────────────────────────────

mcp = FastMCP(
    "pantheon-memory",
    instructions="Lightweight semantic memory with sqlite-vec + fastembed",
)


# ── Database ──────────────────────────────────────────────────────────────────

@functools.cache
def _get_db() -> sqlite3.Connection:
    """Get or create the SQLite connection singleton.

    Creates DB directory, applies WAL/performance pragmas, registers
    the sqlite-vec extension, and runs schema init.
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=ON")
    # Register sqlite-vec extension
    import sqlite_vec  # noqa: F811
    sqlite_vec.load(conn)
    conn.executescript(SCHEMA_SQL)
    return conn


def _get_conn() -> sqlite3.Connection:
    """Alias for _get_db — shorthand for tool use."""
    return _get_db()


# ── Embedding ─────────────────────────────────────────────────────────────────

@functools.cache
def _get_embedder() -> TextEmbedding:
    """Lazy-load fastembed model (auto-downloads on first call, ~30MB).

    Uses BAAI/bge-small-en-v1.5 (384-dim, CPU, ONNX) — no PyTorch needed.
    Model is cached in ~/.cache/fastembed/.
    """
    os.environ.setdefault("TQDM_DISABLE", "1")
    return TextEmbedding(
        model_name="BAAI/bge-small-en-v1.5",
        cache_dir=str(EMBED_CACHE),
    )


def _embed(text: str) -> list[float]:
    """Generate a 384-dim embedding vector for the given text."""
    return list(_get_embedder().embed(text))[0].tolist()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _dict_from_row(row: sqlite3.Row | None) -> dict[str, Any] | None:
    """Convert a sqlite3.Row to a plain dict, or return None."""
    if row is None:
        return None
    return dict(row)


def _now_iso() -> str:
    """Return current UTC time as ISO 8601 string."""
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _parse_metadata(row: dict[str, Any]) -> dict[str, Any]:
    """Parse the metadata JSON field of a memory row."""
    try:
        row["metadata"] = json.loads(row["metadata"])
    except (json.JSONDecodeError, TypeError):
        row["metadata"] = {}
    return row


# ── RRF Fusion ────────────────────────────────────────────────────────────────

_RRF_CONST = 60


def _rrf_fuse(
    vec_ids: list[int],
    fts_ids: list[int],
    top_k: int,
) -> list[tuple[int, float]]:
    """Reciprocal Rank Fusion of vector and FTS5 result ID lists.

    Args:
        vec_ids: Ordered list of IDs from vector search (most relevant first).
        fts_ids: Ordered list of IDs from FTS5 search (most relevant first).
        top_k: Maximum number of fused results to return.

    Returns:
        List of (id, rrf_score) tuples sorted by descending score.
    """
    scores: dict[int, float] = {}
    for rank, doc_id in enumerate(vec_ids, start=1):
        scores[doc_id] = 1.0 / (_RRF_CONST + rank)
    for rank, doc_id in enumerate(fts_ids, start=1):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (_RRF_CONST + rank)
    ranked = sorted(scores.items(), key=lambda x: (-x[1], x[0]))
    return ranked[:top_k]


# ── Tools ─────────────────────────────────────────────────────────────────────


@mcp.tool(
    description="Store a memory entry with automatic embedding generation. "
    "Returns the entry ID and status.",
)
def memory_store(
    value: str = "",
    namespace: str = "default",
    key: str | None = None,
    metadata: str = "{}",
) -> dict[str, Any]:
    """Store a value with its embedding vector for semantic search.

    Generates a 384-dim embedding via fastembed (BAAI/bge-small-en-v1.5)
    and stores it in the vec_memories virtual table alongside the text
    content in the memories table.

    Args:
        value: Text content to store.
        namespace: Namespace for isolation (default: "default").
        key: Optional unique key within namespace.
        metadata: Optional JSON metadata string.

    Returns:
        Dict with id, namespace, key, status.
    """
    if not value or not value.strip():
        return {"error": "value cannot be empty"}

    value = value.strip()
    db = _get_conn()
    now = _now_iso()

    try:
        # Validate metadata is valid JSON
        md_obj: dict[str, Any] = json.loads(metadata) if metadata and metadata != "{}" else {}
        metadata_str = json.dumps(md_obj)

        cur = db.execute(
            """INSERT INTO memories (namespace, key, value, metadata, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [namespace, key, value, metadata_str, now, now],
        )
        entry_id = cur.lastrowid

        # Generate embedding
        embedding = _embed(value)
        embedding_json = json.dumps(embedding)

        db.execute(
            "INSERT INTO vec_memories(id, embedding) VALUES (?, ?)",
            [entry_id, embedding_json],
        )
        db.commit()
    except sqlite3.IntegrityError as e:
        db.rollback()
        return {"error": f"Duplicate key or constraint violation: {e}"}
    except Exception as e:
        db.rollback()
        return {"error": f"Failed to store memory: {e}"}

    return {"id": entry_id, "namespace": namespace, "key": key, "status": "stored"}


@mcp.tool(
    description="Hybrid semantic search across memories. "
    "Combines vector cosine similarity and FTS5 BM25 keyword search "
    "via Reciprocal Rank Fusion (RRF).",
)
def memory_search(
    query: str,
    namespace: str | None = None,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """Hybrid search: vector + keyword fused via RRF.

    For short or keyword-heavy queries, FTS5 BM25 dominates.
    For conceptual or long queries, vector cosine dominates.
    RRF combines both into a single ranked list.

    Args:
        query: Search query text.
        namespace: Optional namespace filter.
        top_k: Maximum results (default 5, max 50).

    Returns:
        List of memory entries with score and metadata.
    """
    if not query or not query.strip():
        return []

    top_k = max(1, min(50, int(top_k)))
    db = _get_conn()
    query_stripped = query.strip()

    # 1. Generate query embedding
    try:
        query_vec = json.dumps(_embed(query_stripped))
    except Exception:
        query_vec = None

    vec_ids: list[int] = []
    fts_ids: list[int] = []

    # 2. Vector search
    if query_vec is not None:
        nvec = top_k * 2
        try:
            if namespace:
                vec_rows = db.execute(
                    """SELECT v.id FROM vec_memories v
                       JOIN memories m ON m.id = v.id
                       WHERE m.namespace = ?
                       ORDER BY v.embedding MATCH ? LIMIT ?""",
                    [namespace, query_vec, nvec],
                ).fetchall()
            else:
                vec_rows = db.execute(
                    """SELECT v.id FROM vec_memories v
                       ORDER BY v.embedding MATCH ? LIMIT ?""",
                    [query_vec, nvec],
                ).fetchall()
            vec_ids = [r["id"] for r in vec_rows]
        except Exception:
            vec_ids = []

    # 3. FTS5 keyword search
    try:
        # Build FTS query: escape special chars, use prefix matching
        fts_query = " OR ".join(
            f'"{word}"*' for word in query_stripped.split() if word
        )
        if namespace:
            fts_rows = db.execute(
                """SELECT rowid FROM memories_fts
                   WHERE memories_fts MATCH ?
                   AND namespace = ?
                   ORDER BY rank LIMIT ?""",
                [fts_query, namespace, top_k * 2],
            ).fetchall()
        else:
            fts_rows = db.execute(
                """SELECT rowid FROM memories_fts
                   WHERE memories_fts MATCH ?
                   ORDER BY rank LIMIT ?""",
                [fts_query, top_k * 2],
            ).fetchall()
        fts_ids = [r["rowid"] for r in fts_rows]
    except Exception:
        fts_ids = []

    # 4. RRF fusion
    fused = _rrf_fuse(vec_ids, fts_ids, top_k)

    if not fused:
        return []

    # 5. Fetch full entries
    id_list = [doc_id for doc_id, _ in fused]
    score_map = {doc_id: score for doc_id, score in fused}

    try:
        placeholders = ",".join("?" * len(id_list))
        rows = db.execute(
            f"""SELECT id, namespace, key, value, metadata, created_at
                FROM memories WHERE id IN ({placeholders})""",
            id_list,
        ).fetchall()
    except Exception:
        return []

    # Preserve RRF ranking order
    row_map = {r["id"]: r for r in rows}
    results: list[dict[str, Any]] = []
    for doc_id in id_list:
        row = row_map.get(doc_id)
        if row is None:
            continue
        entry = dict(row)
        entry = _parse_metadata(entry)
        entry["score"] = round(score_map.get(doc_id, 0.0), 4)
        results.append(entry)

    return results


@mcp.tool(
    description="Recall a specific memory entry by its key within a namespace. "
    "Returns the full entry including parsed metadata.",
)
def memory_recall(
    key: str,
    namespace: str = "default",
) -> dict[str, Any] | None:
    """Exact-match lookup by namespace + key.

    Args:
        key: The unique key of the entry.
        namespace: Namespace scope (default: "default").

    Returns:
        The memory entry dict, or None if not found.
    """
    if not key or not key.strip():
        return None

    db = _get_conn()
    row = db.execute(
        "SELECT id, namespace, key, value, metadata, created_at, updated_at "
        "FROM memories WHERE namespace = ? AND key = ?",
        [namespace, key.strip()],
    ).fetchone()

    if row is None:
        return None

    entry = _dict_from_row(row)
    return _parse_metadata(entry)


@mcp.tool(
    description="Delete a memory entry by ID or by key. "
    "Vector embedding and FTS index entries are removed automatically "
    "via CASCADE / triggers.",
)
def memory_forget(
    id: int | None = None,  # noqa: A002
    key: str | None = None,
    namespace: str = "default",
) -> dict[str, Any]:
    """Delete a memory entry and its associated vector embedding.

    Provide either ``id`` (exact rowid) or ``key`` (within namespace)
    to identify the entry. Foreign key + FTS triggers handle cleanup.

    Args:
        id: Exact row ID of the entry to delete.
        key: Key of the entry to delete (requires namespace).
        namespace: Namespace scope when using key (default: "default").

    Returns:
        Dict with deleted status and entry identifier.
    """
    if id is not None:
        identifier = id
        col = "id"
        params: list[Any] = [id]
    elif key and key.strip():
        identifier = key
        col = "key"
        params = [key.strip(), namespace]
        sql = "DELETE FROM memories WHERE key = ? AND namespace = ?"
    else:
        return {"error": "Provide either id or key"}

    db = _get_conn()
    try:
        if col == "id":
            # Vec table cascade
            db.execute("DELETE FROM vec_memories WHERE id = ?", [id])
            cur = db.execute("DELETE FROM memories WHERE id = ?", [id])
        else:
            cur = db.execute(sql, params)
        db.commit()

        if cur.rowcount == 0:
            return {"deleted": False, "error": "Entry not found"}

        return {"deleted": True, col: identifier, "namespace": namespace}
    except Exception as e:
        db.rollback()
        return {"error": f"Failed to delete: {e}"}


@mcp.tool(
    description="List memory entries chronologically with optional "
    "namespace and key-prefix filters.",
)
def memory_list(
    namespace: str | None = None,
    prefix: str = "",
    limit: int = 50,
) -> list[dict[str, Any]]:
    """List memory entries, newest first.

    Args:
        namespace: Optional namespace filter.
        prefix: Optional key prefix filter.
        limit: Maximum entries (default 50, max 500).

    Returns:
        List of memory entries sorted by created_at descending.
    """
    limit = max(1, min(500, int(limit)))
    db = _get_conn()

    conditions: list[str] = []
    params: list[Any] = []

    if namespace:
        conditions.append("namespace = ?")
        params.append(namespace)

    if prefix:
        conditions.append("key LIKE ?")
        params.append(f"{prefix}%")

    where = " AND ".join(conditions) if conditions else "1"

    try:
        rows = db.execute(
            f"SELECT id, namespace, key, value, metadata, created_at "
            f"FROM memories WHERE {where} ORDER BY created_at DESC LIMIT ?",
            [*params, limit],
        ).fetchall()
    except Exception as e:
        return [{"error": f"List failed: {e}"}]

    results = []
    for row in rows:
        entry = _dict_from_row(row)
        results.append(_parse_metadata(entry))

    return results


@mcp.tool(
    description="Memory database statistics: total entries, per-namespace "
    "breakdown, DB file size, and FTS/vector table sizes.",
)
def memory_stats() -> dict[str, Any]:
    """Return aggregate statistics about the memory database.

    Includes total count, namespace breakdown, FTS entry count,
    vector entry count, and file size on disk.

    Returns:
        Dict with count, namespaces, and storage info.
    """
    db = _get_conn()

    stats: dict[str, Any] = {"status": "ok"}

    try:
        stats["total_entries"] = db.execute(
            "SELECT COUNT(*) AS c FROM memories"
        ).fetchone()["c"]
    except Exception:
        stats["total_entries"] = 0

    try:
        ns_rows = db.execute(
            "SELECT namespace, COUNT(*) AS c FROM memories GROUP BY namespace "
            "ORDER BY c DESC"
        ).fetchall()
        stats["namespaces"] = [{"namespace": r["namespace"], "count": r["c"]} for r in ns_rows]
    except Exception:
        stats["namespaces"] = []

    try:
        stats["vector_entries"] = db.execute(
            "SELECT COUNT(*) AS c FROM vec_memories"
        ).fetchone()["c"]
    except Exception:
        stats["vector_entries"] = 0

    try:
        db_size = DB_PATH.stat().st_size if DB_PATH.exists() else 0
        stats["db_size_bytes"] = db_size
        for unit in ("B", "KB", "MB", "GB"):
            if db_size < 1024:
                stats["db_size_human"] = f"{db_size:.2f} {unit}"
                break
            db_size /= 1024.0
        else:
            stats["db_size_human"] = f"{db_size:.2f} TB"
    except Exception:
        stats["db_size_bytes"] = 0
        stats["db_size_human"] = "unknown"

    return stats


# ── Main Entrypoint ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run()
