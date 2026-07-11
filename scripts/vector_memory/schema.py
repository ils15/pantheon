"""
Vector Memory Schema — Hybrid FTS5 + sqlite-vec
- Creates all tables for the dual-backend memory system
- Graceful degradation if sqlite-vec not available
"""

import os
import sqlite3
from pathlib import Path

# Storage location
VECTOR_DIR = Path(".pantheon/memory-bank/.vectordb")
VECTOR_DB = VECTOR_DIR / "pantheon-memory.db"
SCHEMA_VERSION_FILE = VECTOR_DIR / "schema_version.txt"
SCHEMA_VERSION = "1"


def get_connection() -> sqlite3.Connection:
    """Get SQLite connection with WAL mode.

    Supports PANTHEON_VECTOR_DB env var override for testing (:memory: or file path).
    """
    db_path = os.environ.get("PANTHEON_VECTOR_DB")
    if db_path == ":memory:":
        # Shared cache allows multiple connections to share the same in-memory DB
        conn = sqlite3.connect("file::memory:?cache=shared", uri=True)
    else:
        path = Path(db_path) if db_path else VECTOR_DB
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(path))
        conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def has_sqlite_vec(conn: sqlite3.Connection) -> bool:
    """Check if sqlite-vec extension is available."""
    try:
        import sqlite_vec

        sqlite_vec.load(conn)
        return True
    except ImportError:
        return False


def create_schema(conn: sqlite3.Connection):
    """Create all tables for the hybrid memory system."""

    # 1. Memory metadata (shared between both backends)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS memory_meta (
            memory_id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT NOT NULL,  -- 'subtask_summary' | 'adr' | 'wisdom' | 'impl_artifact' | 'decision'
            source_path TEXT NOT NULL,  -- relative path to original file
            agent TEXT,                 -- originating agent
            phase TEXT,                 -- phase label
            sprint TEXT,                -- sprint identifier
            priority INTEGER DEFAULT 2, -- 1=low, 2=medium, 3=high
            tags TEXT,                  -- comma-separated
            created_at TEXT NOT NULL,   -- ISO 8601
            char_count INTEGER NOT NULL,
            content_hash TEXT UNIQUE NOT NULL  -- SHA-256 (idempotency key)
        )
    """)

    # 2. Full text content (retrieved after match)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS memory_content (
            memory_id INTEGER PRIMARY KEY,
            content TEXT NOT NULL,
            summary TEXT,
            FOREIGN KEY (memory_id) REFERENCES memory_meta(memory_id)
        )
    """)

    # 3. FTS5 virtual table (always created — no dependencies)
    conn.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
            content,
            summary,
            tags,
            content=memory_content,
            content_rowid=memory_id,
            tokenize='porter unicode61'
        )
    """)

    # 4. Create triggers to keep FTS5 in sync with memory_content
    # Using subqueries on memory_meta to populate the tags column in FTS5
    conn.executescript("""
        CREATE TRIGGER IF NOT EXISTS memory_ai AFTER INSERT ON memory_content BEGIN
            INSERT INTO memory_fts(rowid, content, summary, tags)
            VALUES (
                new.memory_id,
                new.content,
                new.summary,
                COALESCE((SELECT tags FROM memory_meta WHERE memory_id = new.memory_id), '')
            );
        END;

        CREATE TRIGGER IF NOT EXISTS memory_ad AFTER DELETE ON memory_content BEGIN
            INSERT INTO memory_fts(memory_fts, rowid, content, summary, tags)
            VALUES ('delete', old.memory_id, old.content, old.summary, '');
        END;

        CREATE TRIGGER IF NOT EXISTS memory_au AFTER UPDATE ON memory_content BEGIN
            INSERT INTO memory_fts(memory_fts, rowid, content, summary, tags)
            VALUES ('delete', old.memory_id, old.content, old.summary, '');
            INSERT INTO memory_fts(rowid, content, summary, tags)
            VALUES (
                new.memory_id,
                new.content,
                new.summary,
                COALESCE((SELECT tags FROM memory_meta WHERE memory_id = new.memory_id), '')
            );
        END;
    """)

    # 5. Vector index table (only if sqlite-vec available)
    if has_sqlite_vec(conn):
        conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS vec_memory USING vec0(
                memory_id INTEGER PRIMARY KEY,
                embedding float[384]
            )
        """)

    # 6. Secondary indexes for metadata filtering
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_meta_source_type
        ON memory_meta(source_type)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_meta_agent
        ON memory_meta(agent)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_meta_created
        ON memory_meta(created_at)
    """)

    # Track schema version (best-effort; may fail for in-memory or read-only)
    try:
        SCHEMA_VERSION_FILE.parent.mkdir(parents=True, exist_ok=True)
        SCHEMA_VERSION_FILE.write_text(SCHEMA_VERSION)
    except OSError:
        pass

    conn.commit()


def init_db() -> sqlite3.Connection:
    """Initialize database and return connection."""
    conn = get_connection()
    create_schema(conn)
    return conn
