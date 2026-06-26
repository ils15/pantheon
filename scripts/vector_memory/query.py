"""
Vector Memory Query — Hybrid recall with fallback chain
- Auto-selects best available backend
- Returns structured results with score, source, content
"""

import re
import sqlite3
import sys
from pathlib import Path

# Ensure the parent directory is on the path for package imports
_SCRIPT_DIR = Path(__file__).resolve().parent.parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from vector_memory.schema import init_db  # noqa: E402


def recall(
    query: str,
    top_k: int = 5,
    source_type: str | None = None,
    agent: str | None = None,
    since: str | None = None,
    tags: str | None = None,
    min_priority: int = 0,
    include_content: bool = True,
) -> list[dict]:
    """Main recall function. Auto-selects best available backend.

    Priority: vector KNN -> FTS5 BM25 -> flat grep
    """
    conn = init_db()

    # Try vector search first
    results = _vector_recall(conn, query, top_k)
    if results:
        results = _apply_filters(
            conn, results, source_type, agent, since, tags, min_priority
        )
        if results:
            enriched = _enrich_with_content(conn, results, include_content)
            conn.close()
            return enriched

    # Fallback to FTS5
    results = _fts5_recall(conn, query, top_k)
    if results:
        results = _apply_filters(
            conn, results, source_type, agent, since, tags, min_priority
        )
        if results:
            enriched = _enrich_with_content(conn, results, include_content)
            conn.close()
            return enriched

    # Last resort: flat grep
    results = _grep_recall(conn, query, top_k)
    enriched = _enrich_with_content(conn, results, include_content)
    conn.close()
    return enriched


def _vector_recall(conn: sqlite3.Connection, query: str, top_k: int) -> list[dict]:
    """Vector KNN search via sqlite-vec."""
    try:
        import sentence_transformers

        model = sentence_transformers.SentenceTransformer("all-MiniLM-L6-v2")
        query_vec = model.encode(query).tolist()
        import struct

        serialized = struct.pack(f"{len(query_vec)}f", *query_vec)

        cur = conn.execute(
            """
            SELECT vm.memory_id, vm.distance
            FROM vec_memory vm
            WHERE vm.embedding MATCH ?
              AND vm.k = ?
            ORDER BY vm.distance
        """,
            (serialized, top_k),
        )

        return [
            {
                "memory_id": row[0],
                "score": 1.0 - row[1],
                "backend": "vector",
            }
            for row in cur.fetchall()
        ]
    except Exception:
        return []


def _fts5_recall(conn: sqlite3.Connection, query: str, top_k: int) -> list[dict]:
    """FTS5 BM25 search."""
    # Sanitize query for FTS5 (remove special chars)
    safe_query = re.sub(r"[^\w\s]", " ", query)
    terms = [t for t in safe_query.split() if len(t) > 1]
    if not terms:
        return []

    # Limit to 10 terms to avoid overly complex FTS5 queries
    fts_query = " OR ".join(terms[:10])

    try:
        cur = conn.execute(
            """
            SELECT
                mm.memory_id,
                rank
            FROM memory_fts
            JOIN memory_meta mm ON memory_fts.rowid = mm.memory_id
            WHERE memory_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        """,
            (fts_query, top_k),
        )

        return [
            {
                "memory_id": row[0],
                "score": max(0, 1.0 - abs(row[1]) / 100),
                "backend": "fts5",
            }
            for row in cur.fetchall()
        ]
    except Exception:
        return []


def _grep_recall(conn: sqlite3.Connection, query: str, top_k: int) -> list[dict]:
    """Fallback: flat grep across memory_content."""
    try:
        cur = conn.execute(
            """
            SELECT mm.memory_id, mc.content
            FROM memory_content mc
            JOIN memory_meta mm ON mc.memory_id = mm.memory_id
        """
        )

        results = []
        for row in cur.fetchall():
            if query.lower() in row[1].lower():
                # Simple relevance: count occurrences
                score = min(1.0, row[1].lower().count(query.lower()) / 10)
                results.append(
                    {
                        "memory_id": row[0],
                        "score": score,
                        "backend": "grep",
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
    except Exception:
        return []


def _apply_filters(
    conn: sqlite3.Connection,
    results: list[dict],
    source_type: str | None,
    agent: str | None,
    since: str | None,
    tags: str | None,
    min_priority: int,
) -> list[dict]:
    """Apply metadata filters to results."""
    if not (source_type or agent or since or tags or min_priority):
        return results

    if not results:
        return results

    # Build filter query
    id_list = ",".join(str(r["memory_id"]) for r in results)
    where_clauses = [f"memory_id IN ({id_list})"]
    params = []

    if source_type:
        where_clauses.append("source_type = ?")
        params.append(source_type)
    if agent:
        where_clauses.append("agent = ?")
        params.append(agent)
    if since:
        where_clauses.append("created_at >= ?")
        params.append(since)
    if tags:
        where_clauses.append("tags LIKE ?")
        params.append(f"%{tags}%")
    if min_priority:
        where_clauses.append("priority >= ?")
        params.append(min_priority)

    cur = conn.execute(
        f"SELECT memory_id FROM memory_meta WHERE {' AND '.join(where_clauses)}",
        params,
    )
    valid_ids = {row[0] for row in cur.fetchall()}

    return [r for r in results if r["memory_id"] in valid_ids]


def _enrich_with_content(
    conn: sqlite3.Connection,
    results: list[dict],
    include_content: bool,
) -> list[dict]:
    """Add full content and metadata to results."""
    if not results:
        return results

    ids = [r["memory_id"] for r in results]
    placeholders = ",".join("?" for _ in ids)

    cur = conn.execute(
        f"""
        SELECT
            mm.memory_id,
            mm.source_type,
            mm.source_path,
            mm.agent,
            mm.tags,
            mm.created_at,
            mm.priority,
            mc.content,
            mc.summary
        FROM memory_meta mm
        JOIN memory_content mc ON mm.memory_id = mc.memory_id
        WHERE mm.memory_id IN ({placeholders})
    """,
        ids,
    )

    meta = {row[0]: row for row in cur.fetchall()}

    enriched = []
    for r in results:
        m = meta.get(r["memory_id"])
        if m:
            entry = {
                "memory_id": r["memory_id"],
                "score": r["score"],
                "backend": r["backend"],
                "source_type": m[1],
                "source_path": m[2],
                "agent": m[3],
                "tags": m[4],
                "created_at": m[5],
                "priority": m[6],
                "summary": m[8],
            }
            if include_content:
                entry["content"] = m[7]
            enriched.append(entry)

    return enriched


def format_recall_results(results: list[dict], query: str) -> str:
    """Format recall results for agent consumption."""
    if not results:
        return f'## Semantic Recall: "{query}"\n\n**No results found.**'

    lines = [
        f'## Semantic Recall: "{query}"',
        f"\n**Top {len(results)} results** (backend: {results[0]['backend']}):\n",
        "| # | Score | Type | Agent | Date | Source |",
        "|---|-------|------|-------|------|--------|",
    ]

    for i, r in enumerate(results, 1):
        lines.append(
            f"| {i} | {r['score']:.2f} | {r['source_type']} | "
            f"{r['agent']} | {r['created_at']} | {r['source_path']} |"
        )

    lines.append("")
    for i, r in enumerate(results[:3], 1):
        lines.append(f"### Result {i} (score: {r['score']:.2f})")
        lines.append(f"**Source:** `{r['source_path']}`")
        lines.append(f"**Agent:** @{r['agent']} | **Date:** {r['created_at']}")
        lines.append(f"**Summary:** {r.get('summary', '')[:200]}")
        if "content" in r:
            lines.append(f"**Content preview:** {r['content'][:300]}...")
        lines.append("")

    return "\n".join(lines)


if __name__ == "__main__":
    import sys

    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "auth token rotation"
    results = recall(query)
    print(format_recall_results(results, query))
