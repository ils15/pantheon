"""Tests for Level 3 Vector Memory system."""

import os
import sys

import pytest

# Set in-memory database before any imports that use it
os.environ["PANTHEON_VECTOR_DB"] = ":memory:"

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from vector_memory.index import content_hash, has_entry
from vector_memory.query import recall
from vector_memory.schema import init_db


@pytest.fixture
def db():
    """Create in-memory database for testing."""
    conn = init_db()
    yield conn
    conn.close()


@pytest.fixture
def mock_entry():
    """Create a mock memory entry."""
    return {
        "content": "## Test Entry\n**Date:** 2026-06-26\n\nThis is a test entry about JWT token authentication.",
        "summary": "Test Entry about JWT",
        "source_type": "subtask_summary",
        "source_path": "test.md",
        "agent": "hermes",
        "tags": "auth,jwt",
        "created_at": "2026-06-26",
    }


def test_schema_creation():
    """Test that all tables are created."""
    conn = init_db()
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()
    table_names = {row[0] for row in tables}
    assert "memory_meta" in table_names
    assert "memory_content" in table_names
    assert "memory_fts" in table_names
    # vec_memory is optional — skip assertion if sqlite-vec not loaded
    conn.close()


def test_content_hash():
    """Test SHA-256 idempotency key."""
    text = "same text"
    assert content_hash(text) == content_hash(text)
    assert content_hash("text a") != content_hash("text b")


def test_idempotency(db, mock_entry):
    """Test that re-indexing same content doesn't create duplicates."""
    h = content_hash(mock_entry["content"])
    assert not has_entry(db, h)

    # Insert via direct SQL (not via index_file)
    db.execute(
        """
        INSERT INTO memory_meta
            (source_type, source_path, agent, tags, created_at, char_count, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            mock_entry["source_type"],
            mock_entry["source_path"],
            mock_entry["agent"],
            mock_entry["tags"],
            mock_entry["created_at"],
            len(mock_entry["content"]),
            h,
        ),
    )
    db.commit()

    assert has_entry(db, h)


def test_recall_empty(db):
    """Test recall with empty database."""
    results = recall("test query")
    assert isinstance(results, list)
    assert len(results) == 0


def test_recall_with_content(db, mock_entry):
    """Test recall returns results after indexing."""
    # Insert entry
    h = content_hash(mock_entry["content"])
    cur = db.execute(
        """
        INSERT INTO memory_meta
            (source_type, source_path, agent, tags, created_at, char_count, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            mock_entry["source_type"],
            mock_entry["source_path"],
            mock_entry["agent"],
            mock_entry["tags"],
            mock_entry["created_at"],
            len(mock_entry["content"]),
            h,
        ),
    )
    mid = cur.lastrowid
    db.execute(
        """
        INSERT INTO memory_content (memory_id, content, summary)
        VALUES (?, ?, ?)
    """,
        (mid, mock_entry["content"], mock_entry["summary"]),
    )
    db.commit()

    results = recall("JWT", top_k=5)
    assert len(results) > 0
    assert results[0]["agent"] == "hermes"


def test_filter_source_type(db, mock_entry):
    """Test filtering by source type."""
    # Insert as 'adr'
    h = content_hash(mock_entry["content"] + "unique")
    cur = db.execute(
        """
        INSERT INTO memory_meta
            (source_type, source_path, agent, tags, created_at, char_count, content_hash)
        VALUES ('adr', ?, ?, ?, ?, ?, ?)
    """,
        (
            mock_entry["source_path"],
            mock_entry["agent"],
            mock_entry["tags"],
            mock_entry["created_at"],
            len(mock_entry["content"]),
            h,
        ),
    )
    mid = cur.lastrowid
    db.execute(
        """
        INSERT INTO memory_content (memory_id, content, summary)
        VALUES (?, ?, ?)
    """,
        (mid, mock_entry["content"], mock_entry["summary"]),
    )
    db.commit()

    results = recall("JWT", top_k=5, source_type="adr")
    assert len(results) > 0
    assert results[0]["source_type"] == "adr"


def test_filter_agent(db, mock_entry):
    """Test filtering by agent."""
    h = content_hash("unique content for agent filter")
    cur = db.execute(
        """
        INSERT INTO memory_meta
            (source_type, source_path, agent, tags, created_at, char_count, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            "subtask_summary",
            "test.md",
            "zeus",
            "general",
            "2026-06-26",
            len(mock_entry["content"]),
            h,
        ),
    )
    mid = cur.lastrowid
    db.execute(
        """
        INSERT INTO memory_content (memory_id, content, summary)
        VALUES (?, ?, ?)
    """,
        (mid, mock_entry["content"], "Test"),
    )
    db.commit()

    h2 = content_hash("another unique content")
    cur2 = db.execute(
        """
        INSERT INTO memory_meta
            (source_type, source_path, agent, tags, created_at, char_count, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            "subtask_summary",
            "test.md",
            "hermes",
            "general",
            "2026-06-26",
            len(mock_entry["content"]),
            h2,
        ),
    )
    mid2 = cur2.lastrowid
    db.execute(
        """
        INSERT INTO memory_content (memory_id, content, summary)
        VALUES (?, ?, ?)
    """,
        (mid2, mock_entry["content"], "Test"),
    )
    db.commit()

    results = recall("JWT", top_k=5, agent="zeus")
    assert len(results) > 0
    for r in results:
        assert r["agent"] == "zeus"


def test_backend_fallback():
    """Test that recall gracefully degrades through backends."""
    conn = init_db()

    # Insert test content with a distinctive term
    content = "## Test\n**Date:** 2026-06-26\n\nUniqueGrepTermXYZ123 for grep fallback testing."
    h = content_hash(content)
    cur = conn.execute(
        """
        INSERT INTO memory_meta
            (source_type, source_path, agent, tags, created_at, char_count, content_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            "subtask_summary",
            "test.md",
            "test",
            "general",
            "2026-06-26",
            len(content),
            h,
        ),
    )
    mid = cur.lastrowid
    conn.execute(
        """
        INSERT INTO memory_content (memory_id, content, summary)
        VALUES (?, ?, ?)
    """,
        (mid, content, "Test grep fallback"),
    )
    conn.commit()

    # Query with the distinctive term — FTS5 should find it
    # If FTS5 fails, grep fallback should find it
    results = recall("UniqueGrepTermXYZ123", top_k=5)
    conn.close()

    assert len(results) > 0
    assert results[0]["backend"] in ("fts5", "grep")
    assert "UniqueGrepTermXYZ123" in results[0]["content"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
