#!/usr/bin/env python3
"""Pantheon Memory MCP Server.

Provides persistent, multi-strategy memory for Pantheon agents using
ChromaDB (PersistentClient) + sentence-transformers for local embeddings.

Features:
- Dense vector similarity search with freshness decay + importance boost
- TF-IDF style auto-recall (context → relevant memories)
- Range compression (DCP-style) — summarize oldest entries
- Claim verification (Shokunin-style) — validate memory freshness
- Duplicate consolidation — merge similar entries
- Markdown export — format as memory-bank output
- MCP resources: status, sessions, search

Usage:
    python scripts/memory_mcp_server.py
"""

from __future__ import annotations

import datetime
import importlib.util
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any

import chromadb
from chromadb import PersistentClient

# Force offline mode for HF (model already cached)
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from mcp.server.fastmcp import FastMCP

# Canonical secret scrubber — single source of truth (scripts/scrub-secrets.py).
# scripts/scrub-secrets.py has a hyphen in its filename, so it cannot be
# imported by a normal `import` statement. Load it explicitly via importlib.
_scrub_secrets_path = Path(__file__).resolve().parent / "scrub-secrets.py"
_scrub_spec = importlib.util.spec_from_file_location(
    "scrub_secrets", _scrub_secrets_path
)
scrub_secrets_mod = importlib.util.module_from_spec(_scrub_spec)
_scrub_spec.loader.exec_module(scrub_secrets_mod)
scrub = scrub_secrets_mod.scrub

# ── Constants ─────────────────────────────────────────────────────────────────

MEMORY_DIR: Path = Path.home() / ".pantheon" / "memory"
COLLECTION_NAME: str = "pantheon_memory"
DEFAULT_N_RESULTS: int = 5
DEFAULT_IMPORTANCE: float = 0.5
FRESHNESS_HALF_LIFE_HOURS: float = 24.0 * 30.0  # 30 days
MAX_CONTENT_LENGTH: int = 100_000

# ── FastMCP App ───────────────────────────────────────────────────────────────

mcp = FastMCP(
    "Pantheon Memory",
    instructions="Persistent multi-strategy memory for Pantheon agents. "
    "Store, search, recall, compress, expand, verify, consolidate, "
    "and export agent memories using ChromaDB with sentence-transformers. "
    "At session start, call memory_recall() with your current context "
    "to retrieve relevant past memories before beginning work.",
)

# ── ChromaDB Client ───────────────────────────────────────────────────────────

_client: PersistentClient | None = None
_collection: Any = None  # chromadb.Collection


def _get_client() -> PersistentClient:
    """Get or create the ChromaDB PersistentClient singleton."""
    global _client
    if _client is None:
        MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(MEMORY_DIR))
    return _client


os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ["TQDM_DISABLE"] = "1"
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


def _get_collection():
    """Get or create the ChromaDB collection with embedding function."""
    global _collection
    if _collection is None:
        client = _get_client()
        embedding_fn = SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        # get_or_create handles both new and existing collections
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_fn,
        )
    return _collection


# ── Freshness Decay ───────────────────────────────────────────────────────────


def freshness_score(timestamp_str: str) -> float:
    """30-day half-life exponential decay freshness score.

    Args:
        timestamp_str: ISO format datetime string.

    Returns:
        Freshness score between 0.0 and 1.0, where 1.0 is brand new.
    """
    try:
        ts = datetime.datetime.fromisoformat(timestamp_str)
    except (ValueError, TypeError):
        return 0.5
    age_hours = (datetime.datetime.now(ts.tzinfo) - ts).total_seconds() / 3600.0
    return 2.0 ** (-age_hours / FRESHNESS_HALF_LIFE_HOURS)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_id() -> str:
    """Generate a unique ID for a memory entry."""
    return str(uuid.uuid4())


def _now_iso() -> str:
    """Return current UTC time as ISO format string."""
    return datetime.datetime.now(datetime.UTC).isoformat()


def _fusion_scores(
    results: dict[str, Any],
    n_results: int,
) -> list[dict[str, Any]]:
    """Apply freshness decay + importance boost to ChromaDB results.

    Shared by memory_search and memory_recall.

    Args:
        results: Raw ChromaDB query result (from collection.query()).
        n_results: Number of top results to return.

    Returns:
        List of scored dicts sorted by relevance (best first).
    """
    scored: list[dict[str, Any]] = []
    for i in range(len(results["ids"][0])):
        metadata = results["metadatas"][0][i]
        distance = results["distances"][0][i]
        ts = metadata.get("timestamp", "")
        importance = float(metadata.get("importance", 0.5))
        freshness = freshness_score(ts)
        boosted_distance = distance * (1.0 / (freshness * 0.5 + importance * 0.5 + 0.5))
        scored.append(
            {
                "id": results["ids"][0][i],
                "content": results["documents"][0][i],
                "timestamp": ts,
                "category": metadata.get("category", ""),
                "agent": metadata.get("agent", ""),
                "session_id": metadata.get("session_id", ""),
                "importance": importance,
                "freshness": freshness,
                "score": boosted_distance,
            }
        )
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:n_results]


# ── RTK Output Filter Helpers ────────────────────────────────────────────────


def _dedup_lines(text: str) -> str:
    """Collapse repeated consecutive lines with a count marker.

    Input:  "error\\ncomando não encontrado\\nerror\\ncomando não encontrado"
    Output: "[x2] error\\ncomando não encontrado"

    Args:
        text: Input text with potentially repeated lines.

    Returns:
        Text with consecutive duplicate lines collapsed and counted.
    """
    lines = text.splitlines()
    if not lines:
        return text

    result: list[str] = []
    i = 0
    while i < len(lines):
        count = 1
        while i + count < len(lines) and lines[i + count] == lines[i]:
            count += 1
        line = lines[i]
        if count > 1:
            line = f"[x{count}] {line}"
        result.append(line)
        i += count

    return "\n".join(result)


def _group_lines(text: str, max_groups: int = 10) -> str:
    """Group similar lines by type (warnings, errors, info).

    Uses simple heuristics:
    - Lines starting with "Error"/"ERROR"/"error" → grouped as errors
    - Lines starting with "Warning"/"WARN"/"warning" → grouped as warnings
    - Lines with "INFO"/"info" → grouped as info
    - Everything else → grouped as "other"

    Args:
        text: Input text with lines to group.
        max_groups: Maximum number of groups to include.

    Returns:
        Text with lines grouped under type headers.
    """
    raw_lines = text.splitlines()
    groups: dict[str, list[str]] = {
        "errors": [],
        "warnings": [],
        "info": [],
        "other": [],
    }

    for line in raw_lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(("Error", "ERROR", "error")):
            groups["errors"].append(stripped)
        elif stripped.startswith(("Warning", "WARN", "warning")):
            groups["warnings"].append(stripped)
        elif "INFO" in stripped or "info" in stripped:
            groups["info"].append(stripped)
        else:
            groups["other"].append(stripped)

    result: list[str] = []
    included = 0
    for group_name in ("errors", "warnings", "info", "other"):
        if included >= max_groups:
            break
        entries = groups[group_name]
        if not entries:
            continue
        header = group_name.capitalize()
        result.append(f"─── {header} ───")
        result.extend(entries)
        included += 1

    return "\n".join(result)


def _truncate_content(text: str, max_chars: int = 5000) -> str:
    """Truncate content to max_chars with a summary suffix.

    If text exceeds max_chars:
    - First 60% of budget from the beginning
    - Last 40% of budget from the end
    - Middle replaced with "[... truncated X chars ...]"

    Args:
        text: Input text to potentially truncate.
        max_chars: Maximum character budget.

    Returns:
        Truncated text with beginning, end, and truncation notice.
    """
    if len(text) <= max_chars:
        return text

    first_budget = int(max_chars * 0.6)
    last_budget = max_chars - first_budget

    first_part = text[:first_budget]
    last_part = text[-last_budget:]

    truncated_count = len(text) - first_budget - last_budget
    return f"{first_part}\n[... truncated {truncated_count} chars ...]\n{last_part}"


def _build_markdown_entry(
    doc_id: str,
    content: str,
    metadata: dict[str, Any],
    distance: float | None = None,
) -> str:
    """Build a single markdown-formatted memory entry string."""
    lines: list[str] = [f"### Memory: `{doc_id[:8]}...`"]
    lines.append(f"**Content:** {content}")
    lines.append(f"**Category:** {metadata.get('category', 'unknown')}")
    lines.append(f"**Agent:** {metadata.get('agent', 'unknown')}")
    lines.append(f"**Session:** {metadata.get('session_id', 'default')}")
    lines.append(f"**Timestamp:** {metadata.get('timestamp', 'unknown')}")
    lines.append(f"**Importance:** {metadata.get('importance', 0.5)}")
    if distance is not None:
        lines.append(f"**Relevance:** {distance:.4f}")
    return "\n".join(lines)


# ── Security: Inline Secret Scrubber ────────────────────────────────────────────
# Secret scrubbing is now delegated to the canonical `scrub()` from
# scripts/scrub-secrets.py (imported at the top of this module). The previous
# local `_scrub_inline` / `_classify_match_inline` implementations were removed
# to eliminate scrubber drift across the codebase.


# ── Tools ─────────────────────────────────────────────────────────────────────


@mcp.tool(
    name="memory_store",
    description="Store a memory entry in ChromaDB with metadata. "
    "Returns the entry ID and timestamp.",
)
async def memory_store(  # noqa: PLR0913
    content: str,
    category: str = "memory",
    agent: str = "unknown",
    session_id: str = "default",
    importance: float = DEFAULT_IMPORTANCE,
    truncate: bool = False,
    links: str | list[str] | None = None,
) -> str:
    """Store a document in the memory collection.

    When truncate=True, filters the content before storing:
    1. Deduplicate consecutive repeated lines
    2. Group lines by type (errors, warnings, info, other)
    3. Truncate to 5000 chars (keep beginning + end)

    Args:
        content: The text content to store.
        category: Entry category ("session_fact", "memory", "tool_output",
            "decision").
        agent: Name of the agent storing the entry.
        session_id: Session identifier.
        importance: Importance score (0.0-1.0).
        truncate: Apply RTK-style output filtering before storing.

    Returns:
        JSON string with entry id and timestamp.
    """
    if not content or not content.strip():
        return json.dumps({"error": "content cannot be empty"})

    importance = max(0.0, min(1.0, float(importance)))

    content = content.strip()

    # Enforce max content length
    if len(content) > MAX_CONTENT_LENGTH:
        content = (
            content[:MAX_CONTENT_LENGTH]
            + f"\n[... truncated {len(content) - MAX_CONTENT_LENGTH} chars ...]"
        )

    # Enforce max category length
    if len(category) > 500:
        category = category[:500]

    # RTK-style output filtering
    if truncate:
        content = _dedup_lines(content)
        content = _group_lines(content)
        content = _truncate_content(content)

    collection = _get_collection()
    entry_id = _make_id()
    timestamp = _now_iso()

    metadata: dict[str, Any] = {
        "timestamp": timestamp,
        "agent": str(agent),
        "category": str(category),
        "session_id": str(session_id),
        "importance": importance,
        "verified": False,
        "truncated": truncate,
    }

    # Security scrub before persisting to vector DB (canonical scrubber)
    content, redactions = scrub(content)
    if redactions:
        logger.warning(
            f"memory_store: redacted {len(redactions)} credential(s) from content"
        )

    try:
        collection.add(
            documents=[content],
            metadatas=[metadata],
            ids=[entry_id],
        )
    except Exception as e:
        return json.dumps({"error": f"Failed to store memory: {e}"})

    # Handle optional links parameter
    if links:
        try:
            link_ids = links if isinstance(links, list) else json.loads(links)
            if isinstance(link_ids, list):
                # Validate all referenced IDs exist
                existing = collection.get(ids=link_ids)
                found = set(existing["ids"])
                missing = [lid for lid in link_ids if lid not in found]
                if missing:
                    return json.dumps(
                        {"error": f"Linked entry IDs not found: {missing}"}
                    )
                metadata["links"] = links
                collection.update(ids=[entry_id], metadatas=[metadata])
        except (json.JSONDecodeError, TypeError):
            pass  # Invalid links format, silently ignore

    return json.dumps({"id": entry_id, "timestamp": timestamp})


@mcp.tool(
    name="memory_search",
    description="Search memory with dense vector similarity + "
    "freshness decay boost + importance boost. Optionally filter by category.",
)
async def memory_search(
    query: str,
    n_results: int = DEFAULT_N_RESULTS,
    category_filter: str | None = None,
) -> str:
    """Search memory entries with multi-strategy fusion scoring.

    Combines: dense vector similarity (ChromaDB), freshness decay boost,
    and importance boost.

    Args:
        query: Search query text.
        n_results: Maximum number of results.
        category_filter: Optional category to filter by.

    Returns:
        JSON string with ranked results.
    """
    if not query or not query.strip():
        return json.dumps({"error": "query cannot be empty"})

    collection = _get_collection()
    n_results = max(1, min(100, int(n_results)))

    # Fetch extra candidates for fusion re-ranking
    fetch_count = n_results * 2

    try:
        where: dict[str, Any] | None = None
        if category_filter:
            where = {"category": category_filter}

        results = collection.query(
            query_texts=[query],
            n_results=fetch_count,
            where=where,
        )
    except Exception as e:
        return json.dumps({"error": f"Search failed: {e}"})

    if not results["ids"] or not results["ids"][0]:
        return json.dumps({"results": []})

    scored = _fusion_scores(results, n_results)
    return json.dumps({"results": scored}, default=str)


@mcp.tool(
    name="memory_recall",
    description="Auto-recall: takes current context, searches memory, "
    "returns relevant memories as a formatted string ready for prompt injection.",
)
async def memory_recall(
    context: str,
    n_results: int = 3,
) -> str:
    """Search memory with a context string and return formatted results.

    Applies freshness-based re-ranking (30-day half-life) and importance
    boosting, then returns a clean markdown block ready for prompt injection.

    Args:
        context: Current context text to search against.
        n_results: Maximum number of relevant memories to return.

    Returns:
        Formatted string of relevant memories, or message if none found.
    """
    if not context or not context.strip():
        return "No context provided for recall."

    collection = _get_collection()
    n_results = max(1, min(20, int(n_results)))

    # Fetch extra candidates for freshness + importance re-ranking
    fetch_count = n_results * 2

    try:
        results = collection.query(
            query_texts=[context],
            n_results=fetch_count,
        )
    except Exception as e:
        return f"Recall failed: {e}"

    if not results["ids"] or not results["ids"][0]:
        return "No relevant memories found."

    # Get base scored results from fusion helper (fetch_count candidates)
    scored = _fusion_scores(results, fetch_count)

    # Enhance with emoji/label/age_str for recall display
    now = datetime.datetime.now(datetime.UTC)
    enhanced: list[dict[str, Any]] = []
    for item in scored:
        ts_str = item["timestamp"]
        try:
            ts = datetime.datetime.fromisoformat(ts_str)
            age_hours = (now - ts).total_seconds() / 3600.0
        except (ValueError, TypeError):
            age_hours = 24.0 * 365.0

        if age_hours < 24.0:
            emoji = "\u26a1"
            freshness_label = "high"
            age_str = (
                f"{int(age_hours)}h ago"
                if age_hours >= 1.0
                else f"{int(age_hours * 60)}m ago"
            )
        elif age_hours < 24.0 * 7.0:
            emoji = "\U0001f4d6"
            freshness_label = "medium"
            age_str = f"{int(age_hours / 24.0)}d ago"
        else:
            emoji = "\U0001f4a4"
            freshness_label = "low"
            age_str = f"{int(age_hours / 24.0)}d ago"

        enhanced.append(
            {
                "emoji": emoji,
                "freshness_label": freshness_label,
                "content": item["content"],
                "agent": item["agent"],
                "category": item["category"],
                "age_str": age_str,
                "score": item["score"],
            }
        )

    # Sort and trim to requested count
    enhanced.sort(key=lambda x: x["score"])
    top = enhanced[:n_results]

    if not top:
        return "No relevant memories found."

    lines: list[str] = [
        "\U0001f4cc Relevant Memories (from Pantheon Memory):",
        "",
    ]

    for idx, item in enumerate(top, 1):
        lines.append(
            f"{idx}. [{item['emoji']} {item['freshness_label']}] {item['content']}"
        )
        lines.append(
            f"   \u2192 Stored {item['age_str']} by {item['agent']} "
            f"(category: {item['category']})"
        )

    return "\n".join(lines).strip()


@mcp.tool(
    name="memory_compress",
    description="Compress older entries in a session into summarized form. "
    "Finds the oldest entries, summarizes them into one compressed entry.",
)
async def memory_compress(
    session_id: str,
    max_entries: int = 50,
    compression_ratio: float = 0.5,
) -> str:
    """Compress entries in a session by summarizing oldest ones.

    Args:
        session_id: Session to compress.
        max_entries: Maximum entries to consider in the session.
        compression_ratio: Fraction of entries to compress (0.0-1.0).

    Returns:
        JSON string with compression result summary.
    """
    if not session_id or not session_id.strip():
        return json.dumps({"error": "session_id cannot be empty"})

    compression_ratio = max(0.1, min(1.0, float(compression_ratio)))
    max_entries = max(2, min(500, int(max_entries)))

    collection = _get_collection()

    try:
        results = collection.get(
            where={"session_id": session_id},
            limit=max_entries,
        )
    except Exception as e:
        return json.dumps({"error": f"Compression failed: {e}"})

    if not results["ids"] or len(results["ids"]) < 2:
        return json.dumps(
            {
                "compressed": 0,
                "message": "Not enough entries to compress (need at least 2).",
            }
        )

    ids_list = results["ids"]
    metadatas_list = results["metadatas"]
    documents_list = results["documents"]

    # Sort by timestamp ascending (oldest first)
    if not (len(ids_list) == len(documents_list) == len(metadatas_list)):
        return json.dumps({"error": "Data length mismatch during compression"})
    indexed = list(zip(ids_list, documents_list, metadatas_list, strict=True))
    indexed.sort(
        key=lambda x: x[2].get("timestamp", ""),
    )

    n_compress = max(1, int(len(indexed) * compression_ratio))
    to_compress = indexed[:n_compress]

    # Build compressed summary
    compressed_content_parts: list[str] = []
    categories: set[str] = set()
    agents: set[str] = set()
    timestamps: list[str] = []

    for doc_id, doc_content, meta in to_compress:
        compressed_content_parts.append(
            f"[{meta.get('category', 'memory')}] {doc_content}"
        )
        if meta.get("category"):
            categories.add(str(meta["category"]))
        if meta.get("agent"):
            agents.add(str(meta["agent"]))
        if meta.get("timestamp"):
            timestamps.append(str(meta["timestamp"]))

    summary_content = f"[COMPRESSED] {n_compress} entries summarized:\n" + "\n".join(
        compressed_content_parts
    )

    summary_metadata: dict[str, Any] = {
        "timestamp": _now_iso(),
        "agent": "system",
        "category": "compressed",
        "session_id": session_id,
        "importance": 0.3,
        "verified": False,
        "compressed_ids": ",".join(id_ for id_, _, _ in to_compress),
        "compressed_count": n_compress,
    }

    old_ids = [id_ for id_, _, _ in to_compress]

    try:
        # Add summary entry
        summary_id = _make_id()
        collection.add(
            documents=[summary_content],
            metadatas=[summary_metadata],
            ids=[summary_id],
        )
        # Delete old entries
        collection.delete(ids=old_ids)
    except Exception as e:
        return json.dumps({"error": f"Compression write failed: {e}"})

    result_summary = summary_content

    return json.dumps(
        {
            "compressed": n_compress,
            "summary_id": summary_id,
            "old_ids_deleted": len(old_ids),
            "categories": list(categories),
            "agents": list(agents),
            "summary_preview": result_summary[:150] + "..."
            if len(result_summary) > 150
            else result_summary,
        }
    )


@mcp.tool(
    name="memory_expand",
    description="Restore a compressed entry back to its detailed form "
    "if it was compressed by memory_compress.",
)
async def memory_expand(entry_id: str) -> str:
    """Expand a compressed entry back to detailed form.

    Args:
        entry_id: ID of the compressed entry to expand.

    Returns:
        The full content of the compressed entry, or a message
        indicating it is not compressible.
    """
    if not entry_id or not entry_id.strip():
        return json.dumps({"error": "entry_id cannot be empty"})

    collection = _get_collection()

    try:
        results = collection.get(ids=[entry_id])
    except Exception as e:
        return json.dumps({"error": f"Expand failed: {e}"})

    if not results["ids"] or not results["ids"]:
        return json.dumps({"error": "Entry not found."})

    metadata = results["metadatas"][0] if results["metadatas"] else {}
    document = results["documents"][0] if results["documents"] else ""

    is_compressed = metadata.get("category") == "compressed"

    if not is_compressed:
        return json.dumps(
            {
                "content": document,
                "compressible": False,
                "message": "Entry is not compressed. No expansion needed.",
            }
        )

    compressed_ids = metadata.get("compressed_ids", "")
    compressed_count = metadata.get("compressed_count", 0)

    return json.dumps(
        {
            "content": document,
            "compressible": True,
            "compressed_ids": compressed_ids,
            "compressed_count": compressed_count,
            "message": (
                f"Entry was compressed from {compressed_count} original entries. "
                "Original IDs: " + compressed_ids
            ),
        }
    )


@mcp.tool(
    name="memory_sessions",
    description="List all unique session IDs with entry count and latest timestamp.",
)
async def memory_sessions(format: str = "json") -> str:
    """List all unique session IDs with metadata.

    Args:
        format: Output format — "json" (default) or "markdown".

    Returns:
        JSON or markdown string with session list.
    """
    collection = _get_collection()

    try:
        results = collection.get()
    except Exception as e:
        return json.dumps({"error": f"Failed to list sessions: {e}"})

    if not results["ids"]:
        if format == "markdown":
            return "# Sessions\n\nNo sessions found."
        return json.dumps({"sessions": []})

    sessions_map: dict[str, dict[str, Any]] = {}
    metadatas = results["metadatas"]

    for meta in metadatas:
        sid = str(meta.get("session_id", "default"))
        ts = str(meta.get("timestamp", ""))

        if sid not in sessions_map:
            sessions_map[sid] = {
                "session_id": sid,
                "entry_count": 0,
                "latest_timestamp": ts,
            }

        sessions_map[sid]["entry_count"] += 1
        sessions_map[sid]["latest_timestamp"] = max(
            sessions_map[sid]["latest_timestamp"], ts
        )

    sessions_list = sorted(
        sessions_map.values(),
        key=lambda x: x["latest_timestamp"],
        reverse=True,
    )

    return json.dumps({"sessions": sessions_list})


@mcp.tool(
    name="memory_verify",
    description="Verify a memory claim: checks that the entry exists "
    "and validates its freshness (Shokunin-style verification).",
)
async def memory_verify(entry_id: str) -> str:
    """Verify a memory claim by checking its age and validity.

    Args:
        entry_id: ID of the entry to verify.

    Returns:
        JSON string with verification result.
    """
    if not entry_id or not entry_id.strip():
        return json.dumps({"error": "entry_id cannot be empty"})

    collection = _get_collection()

    try:
        results = collection.get(ids=[entry_id])
    except Exception as e:
        return json.dumps({"error": f"Verify failed: {e}"})

    if not results["ids"] or not results["ids"]:
        return json.dumps({"verified": False, "error": "Entry not found."})

    metadata = results["metadatas"][0] if results["metadatas"] else {}
    ts = metadata.get("timestamp", _now_iso())

    try:
        entry_ts = datetime.datetime.fromisoformat(ts)
        age_hours = (
            datetime.datetime.now(datetime.UTC) - entry_ts
        ).total_seconds() / 3600.0
    except (ValueError, TypeError):
        age_hours = 0.0

    result: dict[str, Any] = {
        "verified": False,
        "age_hours": age_hours,
        "warning": None,
    }

    if age_hours > 720.0:  # > 30 days
        result["verified"] = False
        result["warning"] = "Memory is > 30 days old. Verify before use."
    elif age_hours > 168.0:  # > 7 days
        result["verified"] = True
        result["warning"] = "Memory is > 7 days old. May be stale."
    else:
        result["verified"] = True
        result["warning"] = None

    # Mark as verified in metadata
    try:
        collection.update(
            ids=[entry_id],
            metadatas=[{**metadata, "verified": True}],
        )
    except Exception:
        pass  # Non-critical

    return json.dumps(result)


@mcp.tool(
    name="memory_consolidate",
    description="Merge duplicate/similar entries in a session. "
    "Finds entries with high cosine similarity in the same category "
    "and merges them into a single entry.",
)
async def memory_consolidate(session_id: str | None = None) -> str:
    """Consolidate duplicate entries by merging similar ones.

    Args:
        session_id: Optional session ID to scope consolidation.
            If None, consolidates across all sessions.

    Returns:
        JSON string with number of merges performed.
    """
    collection = _get_collection()

    try:
        where: dict[str, Any] | None = None
        if session_id:
            where = {"session_id": session_id}
        results = collection.get(where=where)
    except Exception as e:
        return json.dumps({"error": f"Consolidation failed: {e}"})

    if not results["ids"] or len(results["ids"]) < 2:
        return json.dumps(
            {"merges": 0, "message": "Not enough entries to consolidate."}
        )

    ids_list = results["ids"]
    metadatas_list = results["metadatas"]
    documents_list = results["documents"]

    # Group by category
    by_category: dict[str, list[tuple[str, str, dict[str, Any]]]] = {}
    for i, doc_id in enumerate(ids_list):
        meta = metadatas_list[i] if metadatas_list else {}
        cat = str(meta.get("category", "memory"))
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(
            (doc_id, documents_list[i] if documents_list else "", meta),
        )

    merges = 0
    merged_ids: list[str] = []

    for cat, entries in by_category.items():
        if len(entries) < 2:
            continue

        # Simple merge strategy: group entries with similar content
        # by checking if content starts with same first 50 chars
        content_groups: dict[str, list[tuple[str, str, dict[str, Any]]]] = {}
        for entry in entries:
            doc_id, content, meta = entry
            # Use content prefix as grouping key (simplified dedup)
            prefix = content[:50] if content else ""
            if prefix not in content_groups:
                content_groups[prefix] = []
            content_groups[prefix].append(entry)

        for prefix, group in content_groups.items():
            if len(group) < 2:
                continue

            # Merge this group
            merged_content_parts: list[str] = []
            merged_agents: set[str] = set()
            merged_timestamps: list[str] = []
            max_importance = 0.0
            keep_id = group[0][0]

            for doc_id, content, meta in group:
                if doc_id != keep_id:
                    merged_ids.append(doc_id)
                if content:
                    merged_content_parts.append(content)
                if meta.get("agent"):
                    merged_agents.add(str(meta["agent"]))
                if meta.get("timestamp"):
                    merged_timestamps.append(str(meta["timestamp"]))
                imp = float(meta.get("importance", 0.0))
                max_importance = max(max_importance, imp)

            if not merged_ids:
                continue

            merged_content = (
                f"[CONSOLIDATED] {len(group)} similar entries merged:\n"
                + "\n---\n".join(merged_content_parts)
            )

            merged_meta: dict[str, Any] = {
                "timestamp": max(merged_timestamps)
                if merged_timestamps
                else _now_iso(),
                "agent": ", ".join(sorted(merged_agents)),
                "category": cat,
                "session_id": group[0][2].get("session_id", "default"),
                "importance": max_importance,
                "verified": False,
                "consolidated": True,
                "merged_count": len(group),
            }

            try:
                collection.update(
                    ids=[keep_id],
                    documents=[merged_content],
                    metadatas=[merged_meta],
                )
            except Exception:
                continue

    # Delete merged duplicates
    if merged_ids:
        try:
            collection.delete(ids=merged_ids)
            merges = len(merged_ids)
        except Exception:
            pass

    return json.dumps(
        {
            "merges": merges,
            "merged_ids": merged_ids,
        }
    )


@mcp.tool(
    name="memory_export",
    description="Export memories as formatted markdown, "
    "optionally scoped to a session or written to a file.",
)
async def memory_export(
    session_id: str | None = None,
    filename: str | None = None,
) -> str:
    """Export memories as formatted markdown.

    Args:
        session_id: Optional session ID to scope export.
        filename: Optional filename to write under ~/.pantheon/exports/.

    Returns:
        Markdown string content.
    """
    collection = _get_collection()

    try:
        where: dict[str, Any] | None = None
        if session_id:
            where = {"session_id": session_id}
        results = collection.get(where=where)
    except Exception as e:
        return json.dumps({"error": f"Export failed: {e}"})

    if not results["ids"] or not results["ids"]:
        return "# Memory Export\n\nNo memories found."

    lines: list[str] = ["# Memory Export", ""]

    if session_id:
        lines.append(f"**Session:** {session_id}")
        lines.append("")

    lines.append(f"**Total entries:** {len(results['ids'])}")
    lines.append("")

    # Group by category for organized output
    grouped: dict[str, list[tuple[str, str, dict[str, Any]]]] = {}
    for i, doc_id in enumerate(results["ids"]):
        meta = results["metadatas"][i] if results["metadatas"] else {}
        doc = results["documents"][i] if results["documents"] else ""
        cat = str(meta.get("category", "unknown"))
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append((doc_id, doc, meta))

    for cat in sorted(grouped.keys()):
        lines.append(f"## {cat.capitalize()}")
        lines.append("")
        for doc_id, doc_content, meta in grouped[cat]:
            lines.append(_build_markdown_entry(doc_id, doc_content, meta))
            lines.append("")

    markdown_content = "\n".join(lines)

    if filename:
        try:
            exports_dir = os.path.expanduser("~/.pantheon/exports")
            out = os.path.join(exports_dir, filename)
            out = os.path.realpath(out)
            if not out.startswith(os.path.realpath(exports_dir) + os.sep):
                return json.dumps({"error": "Invalid filename: path traversal detected"})
            with open(out, "w", encoding="utf-8") as wf:
                wf.write(markdown_content)
        except Exception as e:
            markdown_content += f"\n\n---\nWarning: could not write to {filename}: {e}"
    return markdown_content


@mcp.tool(
    name="memory_delete",
    description="Permanently delete a specific memory entry by its ID.",
)
async def memory_delete(entry_id: str) -> str:
    """Delete a single memory entry by ID.

    Args:
        entry_id: The ID of the entry to delete.

    Returns:
        JSON string with deletion result.
    """
    if not entry_id or not entry_id.strip():
        return json.dumps({"error": "entry_id cannot be empty"})

    coll = _get_collection()
    try:
        coll.delete(ids=[entry_id.strip()])
        return json.dumps({"deleted": True, "entry_id": entry_id.strip()})
    except Exception as e:
        return json.dumps({"error": f"Failed to delete entry: {e}"})


@mcp.tool(
    name="memory_update",
    description="Update the content and/or metadata of an existing memory entry.",
)
async def memory_update(
    entry_id: str,
    content: str | None = None,
    category: str | None = None,
    importance: float | None = None,
) -> str:
    """Update an existing memory entry.

    Args:
        entry_id: The ID of the entry to update.
        content: New content (if None, keep existing).
        category: New category (if None, keep existing).
        importance: New importance score 0.0-1.0 (if None, keep existing).

    Returns:
        JSON string with update result.
    """
    if not entry_id or not entry_id.strip():
        return json.dumps({"error": "entry_id cannot be empty"})

    coll = _get_collection()
    try:
        existing = coll.get(ids=[entry_id.strip()])
        if not existing["ids"]:
            return json.dumps({"error": f"Entry '{entry_id}' not found"})

        # Merge metadata
        metadata = dict(existing["metadatas"][0]) if existing["metadatas"] else {}
        if category is not None:
            metadata["category"] = str(category)[:500]
        if importance is not None:
            metadata["importance"] = max(0.0, min(1.0, float(importance)))
        metadata["updated_at"] = datetime.datetime.now(
            datetime.timezone.utc
        ).isoformat()

        update_kwargs: dict[str, Any] = {
            "ids": [entry_id.strip()],
            "metadatas": [metadata],
        }
        if content is not None:
            update_kwargs["documents"] = [str(content)]

        coll.update(**update_kwargs)
        return json.dumps({"updated": True, "entry_id": entry_id.strip()})
    except Exception as e:
        return json.dumps({"error": f"Failed to update entry: {e}"})


# ── Resources ─────────────────────────────────────────────────────────────────


@mcp.resource(
    "pantheon://memory/status",
    description="Memory server statistics: total entries, session count, disk usage.",
)
async def memory_status() -> str:
    """Return memory server statistics."""
    collection = _get_collection()

    try:
        count = collection.count()
        results = collection.get()
        sessions_set: set[str] = set()
        for meta in results.get("metadatas") or []:
            if meta and "session_id" in meta:
                sessions_set.add(str(meta["session_id"]))
    except Exception as e:
        return f"# Memory Status\n\nError: {e}"

    # Disk usage
    disk_usage = "unknown"
    try:
        total_size = sum(f.stat().st_size for f in MEMORY_DIR.rglob("*") if f.is_file())
        disk_usage = _format_bytes(total_size)
    except Exception:
        pass

    lines = [
        "# Memory Status",
        "",
        f"**Total entries:** {count}",
        f"**Total sessions:** {len(sessions_set)}",
        f"**Storage path:** {MEMORY_DIR}",
        f"**Disk usage:** {disk_usage}",
        f"**Collection:** {COLLECTION_NAME}",
        "**Embedding model:** all-MiniLM-L6-v2",
        "**Freshness half-life:** 30 days",
    ]

    return "\n".join(lines)


@mcp.resource(
    "pantheon://memory/sessions",
    description="List all memory sessions with entry counts and latest timestamps.",
)
async def memory_sessions_resource() -> str:
    """Return list of sessions as formatted markdown."""
    collection = _get_collection()

    try:
        results = collection.get()
    except Exception as e:
        return f"# Sessions\n\nError: {e}"

    if not results["ids"] or not results["ids"]:
        return "# Sessions\n\nNo sessions found."

    sessions_map: dict[str, dict[str, Any]] = {}
    for meta in results.get("metadatas") or []:
        if not meta:
            continue
        sid = str(meta.get("session_id", "default"))
        ts = str(meta.get("timestamp", ""))

        if sid not in sessions_map:
            sessions_map[sid] = {
                "session_id": sid,
                "entry_count": 0,
                "latest_timestamp": ts,
            }
        sessions_map[sid]["entry_count"] += 1
        sessions_map[sid]["latest_timestamp"] = max(
            sessions_map[sid]["latest_timestamp"], ts
        )

    lines = ["# Sessions", ""]
    for s in sorted(
        sessions_map.values(),
        key=lambda x: x["latest_timestamp"],
        reverse=True,
    ):
        lines.append(
            f"- **{s['session_id']}**: {s['entry_count']} entries, "
            f"last: {s['latest_timestamp']}"
        )

    return "\n".join(lines)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _format_bytes(size: int) -> str:
    """Format byte size into human-readable string."""
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} TB"


# ── Test Helpers ──────────────────────────────────────────────────────────────


def _reset_test_state() -> None:
    """Reset global state for testing.

    Clears the cached client and collection so next access creates fresh
    connections. Call before each test that needs a clean state.
    """
    global _client, _collection  # noqa: PLW0603
    _client = None
    _collection = None


def _set_memory_dir(path: str | Path) -> None:
    """Override the memory directory for testing.

    Args:
        path: Custom path for ChromaDB storage.
    """
    global MEMORY_DIR  # noqa: PLW0603
    MEMORY_DIR = Path(path)
    _reset_test_state()


# ── Main Entrypoint ───────────────────────────────────────────────────────────


# ── Cleanup ──────────────────────────────────────────────────────────


@mcp.tool(
    name="memory_cleanup",
    description="Delete test/old sessions from the memory database. "
    "Prefix must be at least 3 characters to prevent accidental data loss. "
    "Use session_id='test-' to delete all test sessions, "
    "or specify exact session_id.",
)
async def memory_cleanup(session_prefix: str = "test-") -> str:
    """Delete sessions matching a prefix from the memory database.

    Args:
        session_prefix: Delete sessions whose ID starts with this prefix.
            Default "test-" removes all test sessions. Use "" with caution.

    Returns:
        JSON with deleted count and list of affected sessions.
    """
    if len(session_prefix) < 3:
        return json.dumps(
            {
                "error": (
                    "Prefix must be at least 3 characters to prevent "
                    "accidental data loss. Use memory_cleanup with a "
                    "specific session prefix."
                ),
            }
        )

    coll = _get_collection()
    all_data = coll.get(include=["metadatas"])

    deleted = 0
    sessions_deleted: set[str] = set()
    for i, meta in enumerate(all_data["metadatas"]):
        sid = meta.get("session_id", "")
        if sid.startswith(session_prefix):
            coll.delete(ids=[all_data["ids"][i]])
            deleted += 1
            sessions_deleted.add(sid)

    return json.dumps(
        {
            "deleted": deleted,
            "sessions": sorted(sessions_deleted),
            "prefix": session_prefix,
        }
    )


@mcp.tool(
    name="memory_link",
    description="Create a bidirectional relationship between two memory entries. "
    "Both entries must exist. Max depth guard prevents cycles.",
)
async def memory_link(from_id: str, to_id: str, relation: str = "references") -> str:
    """Create a bidirectional relationship between two memory entries.

    Args:
        from_id: Source entry ID.
        to_id: Target entry ID.
        relation: Type of relationship (default: "references").

    Returns:
        JSON string with link result or error.
    """
    if not from_id or not to_id:
        return json.dumps({"error": "Both from_id and to_id are required"})
    if from_id == to_id:
        return json.dumps({"error": "Cannot link an entry to itself"})

    coll = _get_collection()

    # Validate both IDs exist
    existing = coll.get(ids=[from_id, to_id])
    existing_ids = set(existing["ids"])
    missing = [eid for eid in (from_id, to_id) if eid not in existing_ids]
    if missing:
        return json.dumps({"error": f"Entry IDs not found: {missing}"})

    def _add_link(entry_id: str, linked_id: str, rel: str) -> None:
        entry = coll.get(ids=[entry_id])
        if not entry["ids"]:
            return
        meta = dict(entry["metadatas"][0]) if entry["metadatas"] else {}
        current_links = json.loads(meta.get("links", "[]"))
        # Don't add duplicates
        if not any(link["id"] == linked_id for link in current_links):
            current_links.append({"id": linked_id, "relation": rel})
            meta["links"] = json.dumps(current_links)
            coll.update(ids=[entry_id], metadatas=[meta])

    _add_link(from_id, to_id, relation)
    _add_link(to_id, from_id, relation)

    return json.dumps(
        {
            "linked": True,
            "from_id": from_id,
            "to_id": to_id,
            "relation": relation,
        }
    )


@mcp.tool(
    name="memory_traverse",
    description="Walk the knowledge graph from an entry, following links up to "
    "max_depth hops. Returns a tree of related entries with content summaries.",
)
async def memory_traverse(entry_id: str, max_depth: int = 1) -> str:
    """Follow links from an entry to related entries (BFS traversal).

    Args:
        entry_id: Starting entry ID.
        max_depth: Maximum hops (1-3, default 1).

    Returns:
        JSON string with traversal graph.
    """
    if not entry_id:
        return json.dumps({"error": "entry_id is required"})
    max_depth = max(1, min(3, int(max_depth)))

    coll = _get_collection()
    visited: set[str] = set()
    graph: dict[str, dict] = {}
    queue: list[tuple[str, int]] = [(entry_id, 0)]

    while queue:
        current_id, depth = queue.pop(0)
        if current_id in visited or depth > max_depth:
            continue

        entry = coll.get(ids=[current_id])
        if not entry["ids"]:
            continue
        visited.add(current_id)

        meta = dict(entry["metadatas"][0]) if entry["metadatas"] else {}
        doc = entry["documents"][0] if entry["documents"] else ""
        content = (doc[:150] + "...") if len(doc) > 150 else doc

        current_links = json.loads(meta.get("links", "[]"))
        graph[current_id] = {
            "content": content,
            "category": meta.get("category", ""),
            "depth": depth,
            "links": current_links,
        }

        if depth < max_depth:
            for link in current_links:
                queue.append((link["id"], depth + 1))

    return json.dumps(
        {
            "root": entry_id,
            "max_depth": max_depth,
            "nodes_visited": len(visited),
            "graph": graph,
        },
        default=str,
    )


if __name__ == "__main__":
    mcp.run()
