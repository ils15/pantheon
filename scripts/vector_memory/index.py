"""
Vector Memory Indexer — Dual indexing (FTS5 + optional embeddings)
- Scans memory bank files for new entries
- Idempotent via content_hash
- FTS5 always, embeddings when available
"""

import hashlib
import re
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

# Ensure the parent directory is on the path for package imports
_SCRIPT_DIR = Path(__file__).resolve().parent.parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from vector_memory.schema import init_db  # noqa: E402

# Known Pantheon agent names (for @mention tag extraction)
KNOWN_AGENTS = frozenset({
    "zeus", "athena", "apollo", "hermes", "aphrodite", "demeter",
    "themis", "prometheus", "hephaestus", "nyx", "gaia", "iris",
    "mnemosyne", "talos",
})

# Cache for embedding model (loaded once)
_MODEL = None


def _get_model():
    """Load sentence-transformers model lazily (once per session)."""
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    try:
        from sentence_transformers import SentenceTransformer

        _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        return _MODEL
    except ImportError:
        return None


def content_hash(text: str) -> str:
    """SHA-256 of text content (idempotency key)."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def has_entry(conn: sqlite3.Connection, hash_val: str) -> bool:
    """Check if entry already exists (idempotency)."""
    cur = conn.execute("SELECT 1 FROM memory_meta WHERE content_hash = ?", (hash_val,))
    return cur.fetchone() is not None


def extract_entries_from_file(filepath: Path) -> list[dict]:
    """Extract entries from a memory bank markdown file.

    Returns list of dicts with: content, summary, source_type,
    source_path, agent, tags, created_at.
    """
    entries = []
    text = filepath.read_text(encoding="utf-8")

    if "01-active-context" in filepath.name:
        # Active context: each ## heading is an entry section
        source_type = "subtask_summary"
    elif "02-progress-log" in filepath.name:
        # Progress log: split on ## [YYYY-MM-DD] sections
        source_type = "subtask_summary"
    else:
        source_type = "adr"

    # Split on markdown headings level 2
    sections = re.split(r"(?=^## )", text, flags=re.MULTILINE)

    for section in sections:
        section = section.strip()
        if not section or len(section) < 50:
            continue

        # Extract date from heading
        date_match = re.search(r"\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})", section)
        created_at = (
            date_match.group(1) if date_match else datetime.now().strftime("%Y-%m-%d")
        )

        # First line as summary
        first_line = section.split("\n")[0].strip("# ")
        summary = first_line[:200] if len(first_line) > 200 else first_line

        # Content
        content = section

        # Extract agent mentions
        agents = re.findall(r"@(\w+)", section)
        agent = agents[0] if agents else "unknown"

        # Tags from content (keyword categories)
        tag_keywords = {
            "auth": [
                "auth",
                "jwt",
                "oauth",
                "token",
                "session",
                "password",
            ],
            "database": [
                "database",
                "migration",
                "schema",
                "query",
                "index",
                "sql",
            ],
            "api": ["api", "endpoint", "route", "handler", "middleware"],
            "frontend": [
                "frontend",
                "component",
                "ui",
                "css",
                "responsive",
            ],
            "infra": [
                "docker",
                "deploy",
                "ci",
                "pipeline",
                "infrastructure",
            ],
            "security": [
                "security",
                "vulnerability",
                "injection",
                "xss",
                "csrf",
            ],
            "ai": ["vector", "embedding", "rag", "langchain", "model"],
            "monitoring": [
                "monitoring",
                "observability",
                "telemetry",
                "metrics",
                "logging",
                "tracing",
            ],
            "testing": [
                "test",
                "pytest",
                "coverage",
                "tdd",
            ],
            "deployment": [
                "deployment",
                "release",
                "version",
                "rollback",
            ],
            "documentation": [
                "documentation",
                "docs",
                "readme",
                "changelog",
            ],
            "performance": [
                "performance",
                "optimization",
                "latency",
                "throughput",
                "scalability",
            ],
        }
        found_tags = []
        for tag, keywords in tag_keywords.items():
            if any(kw in section.lower() for kw in keywords):
                found_tags.append(tag)

        # Extract @agent mentions as tags (filtered to known agent names)
        all_mentions = set(re.findall(r"@(\w+)", section))
        agent_mentions = all_mentions & KNOWN_AGENTS
        for agent_name in sorted(agent_mentions):
            tag = f"agent:{agent_name}"
            if tag not in found_tags:
                found_tags.append(tag)

        # Extract reference IDs (TASK-XXX, ADR-XXX, NOTE-XXXX) as tags
        ref_ids = re.findall(r"\b(TASK-\d+)\b", section)
        ref_ids += re.findall(r"\b(ADR-\d+)\b", section)
        ref_ids += re.findall(r"\b(NOTE\d{4})\b", section)
        for ref_id in ref_ids:
            tag = f"ref:{ref_id}"
            if tag not in found_tags:
                found_tags.append(tag)

        tags = ",".join(found_tags) if found_tags else "general"

        entries.append(
            {
                "content": content,
                "summary": summary,
                "source_type": source_type,
                "source_path": f"{filepath.name}",
                "agent": agent,
                "tags": tags,
                "created_at": created_at,
            }
        )

    return entries


def _insert_entry(conn: sqlite3.Connection, entry: dict) -> int:
    """Insert a single entry into the database. Returns memory_id."""
    h = content_hash(entry["content"])
    cur = conn.execute(
        """
        INSERT INTO memory_meta
            (source_type, source_path, agent, tags, created_at, char_count, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            entry["source_type"],
            entry["source_path"],
            entry["agent"],
            entry["tags"],
            entry["created_at"],
            len(entry["content"]),
            h,
        ),
    )
    memory_id = cur.lastrowid
    conn.execute(
        """
        INSERT INTO memory_content (memory_id, content, summary)
        VALUES (?, ?, ?)
    """,
        (memory_id, entry["content"], entry["summary"]),
    )
    return memory_id


def index_file(conn: sqlite3.Connection, filepath: Path) -> dict:
    """Index all entries from a file. Returns stats."""
    stats = {"new": 0, "skipped": 0, "errors": 0}

    entries = extract_entries_from_file(filepath)
    model = _get_model()
    has_vec = _has_vec_table(conn)

    for entry in entries:
        try:
            h = content_hash(entry["content"])
            if has_entry(conn, h):
                stats["skipped"] += 1
                continue

            # Insert metadata (triggers FTS5 sync via memory_content insert)
            cur = conn.execute(
                """
                INSERT INTO memory_meta
                    (source_type, source_path, agent, tags, created_at, char_count, content_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    entry["source_type"],
                    entry["source_path"],
                    entry["agent"],
                    entry["tags"],
                    entry["created_at"],
                    len(entry["content"]),
                    h,
                ),
            )
            memory_id = cur.lastrowid

            # Insert content (FTS5 syncs via trigger)
            conn.execute(
                """
                INSERT INTO memory_content (memory_id, content, summary)
                VALUES (?, ?, ?)
            """,
                (memory_id, entry["content"], entry["summary"]),
            )

            # Insert vector embedding if available
            if model and has_vec:
                embedding = model.encode(entry["content"]).tolist()
                _insert_vec(conn, memory_id, embedding)

            stats["new"] += 1
        except Exception as e:
            stats["errors"] += 1
            print(f"Error indexing entry: {e}")

    conn.commit()
    return stats


def _has_vec_table(conn: sqlite3.Connection) -> bool:
    """Check if vec_memory table exists."""
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='vec_memory'"
    )
    return cur.fetchone() is not None


def _insert_vec(conn: sqlite3.Connection, memory_id: int, embedding: list[float]):
    """Insert vector embedding (handles serialization)."""
    import struct

    serialized = struct.pack(f"{len(embedding)}f", *embedding)
    conn.execute(
        "INSERT INTO vec_memory (memory_id, embedding) VALUES (?, ?)",
        (memory_id, serialized),
    )


def index_all(conn: sqlite3.Connection | None = None) -> dict:
    """Index all memory bank files. Returns combined stats."""
    if conn is None:
        conn = init_db()

    total = {"new": 0, "skipped": 0, "errors": 0}

    # Files to index
    memory_dir = Path("docs/memory-bank")
    files_to_index = [
        memory_dir / "01-active-context.md",
        memory_dir / "02-progress-log.md",
    ]

    # Also index _notes/ ADRs
    notes_dir = memory_dir / "_notes"
    if notes_dir.exists():
        for f in sorted(notes_dir.glob("*.md")):
            if f.name != "_index.md":
                files_to_index.append(f)

    for filepath in files_to_index:
        if filepath.exists():
            stats = index_file(conn, filepath)
            total["new"] += stats["new"]
            total["skipped"] += stats["skipped"]
            total["errors"] += stats["errors"]

    return total


if __name__ == "__main__":
    print("=== Pantheon Vector Memory Indexer ===")
    conn = init_db()
    stats = index_all(conn)
    print(
        f"Indexed: {stats['new']} new, {stats['skipped']} skipped, {stats['errors']} errors"
    )
    conn.close()


def quick_index(
    conn: sqlite3.Connection,
    summary: str,
    agent: str,
    files_changed: list[str] | None = None,
    status: str = "complete",
    source_type: str = "subtask_summary",
    tags: str | None = None,
) -> dict:
    """Index a single agent result inline (no file scanning).

    Called by Zeus/Mnemosyne when a background agent completes.
    Idempotent via content_hash — safe to call multiple times.

    Args:
        conn: Open DB connection.
        summary: Subtask_summary text (what the agent did).
        agent: Agent name (hermes, apollo, etc.).
        files_changed: Optional list of file paths.
        status: complete | partial | escalated.
        source_type: memory category.
        tags: Comma-separated tags (auto-generated if None).

    Returns:
        {"memory_id": int, "new": bool, "hash": str}
    """
    from datetime import datetime

    content = summary
    if files_changed:
        content = f"{summary}\n\nFiles: {', '.join(files_changed)}"

    h = content_hash(content)

    if has_entry(conn, h):
        return {"memory_id": None, "new": False, "hash": h}

    # Auto-tag from keywords
    if tags is None:
        tag_keywords = {
            "auth": ["auth", "jwt", "oauth", "token", "session", "password", "login", "refresh"],
            "database": ["database", "migration", "schema", "query", "index", "sql", "alembic"],
            "api": ["api", "endpoint", "route", "handler", "middleware"],
            "frontend": ["frontend", "component", "ui", "css", "responsive", "react"],
            "infra": ["docker", "deploy", "ci", "pipeline", "infrastructure"],
            "security": ["security", "vulnerability", "injection", "xss", "csrf"],
            "ai": ["vector", "embedding", "rag", "langchain", "model"],
            "testing": ["test", "pytest", "coverage", "tdd"],
            "documentation": ["documentation", "docs", "readme"],
        }
        found = [tag for tag, kws in tag_keywords.items()
                 if any(kw in summary.lower() for kw in kws)]
        tags = ",".join(found) if found else "general"

    source_path = "inline:background-agent"
    created_at = datetime.now().strftime("%Y-%m-%d")

    cur = conn.execute(
        "INSERT INTO memory_meta (source_type, source_path, agent, tags, created_at, char_count, content_hash) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (source_type, source_path, agent, tags, created_at, len(content), h),
    )
    memory_id = cur.lastrowid

    # Summary = first 200 chars
    summ = summary[:200] if len(summary) > 200 else summary
    conn.execute(
        "INSERT INTO memory_content (memory_id, content, summary) VALUES (?, ?, ?)",
        (memory_id, content, summ),
    )

    # Vector embedding if available
    model = _get_model()
    if model and _has_vec_table(conn):
        embedding = model.encode(content).tolist()
        _insert_vec(conn, memory_id, embedding)

    conn.commit()
    return {"memory_id": memory_id, "new": True, "hash": h}


if __name__ == "__main__":
    import sys
    # If called with a summary string, index it
    if len(sys.argv) > 1:
        conn = init_db()
        result = quick_index(conn, summary=sys.argv[1], agent=sys.argv[2] if len(sys.argv) > 2 else "auto")
        conn.close()
        print(f"Indexed: id={result['memory_id']}, new={result['new']}, hash={result['hash']}")
