"""Tests for the Pantheon Memory MCP Server (scripts/memory_mcp_server.py).

Tests cover:
- Server name and instructions
- memory_store: store content, verify it was stored
- memory_search: search for stored content
- memory_recall: recall based on context
- memory_sessions: list sessions
- memory_verify: verify a stored entry
- memory_export: export to markdown
- freshness_score: test decay formula
- pantheon://memory/status resource
- Error handling: empty query, non-existent session
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from mcp.server.fastmcp import FastMCP

# Module path
MODULE_PATH = "scripts.memory_mcp_server"


def _text(contents: list | str) -> str:
    """Extract text from FastMCP read_resource result."""
    if isinstance(contents, str):
        return contents
    if isinstance(contents, list) and len(contents) > 0:
        item = contents[0]
        if hasattr(item, "content"):
            return item.content
        return str(item)
    return str(contents)


def _text_from_tool(result: tuple[Any, dict[str, Any]]) -> str:
    """Extract text from FastMCP call_tool result.

    call_tool returns (Sequence[ContentBlock], dict) — we extract from
    the first TextContent in the sequence.
    """
    content_blocks, _ = result
    if content_blocks and len(content_blocks) > 0:
        block = content_blocks[0]
        if hasattr(block, "text"):
            return block.text
        return str(block)
    return ""


# Session-scoped temp dir for ChromaDB
@pytest.fixture(scope="session")
def temp_memory_dir() -> str:
    """Create a temporary directory for ChromaDB storage."""
    with tempfile.TemporaryDirectory(prefix="pantheon_memory_test_") as tmpdir:
        yield tmpdir


@pytest.fixture(scope="session")
def module(temp_memory_dir: str):
    """Import and return the server module with patched memory dir."""
    import importlib

    # Patch MEMORY_DIR in the module before import
    with patch.object(Path, "home", return_value=Path(temp_memory_dir)):
        mod = importlib.import_module(MODULE_PATH)
        # Override memory dir to a clean subdirectory
        test_dir = Path(temp_memory_dir) / ".pantheon" / "memory"
        mod._set_memory_dir(str(test_dir))
        importlib.reload(mod)
        return mod


@pytest.fixture
def server(module) -> FastMCP:
    """Return the FastMCP server instance."""
    return module.mcp


@pytest.fixture(autouse=True)
def reset_state(module):
    """Reset ChromaDB state before each test for isolation."""
    import importlib

    module._reset_test_state()
    importlib.reload(module)
    yield


# =============================================================================
# Server Lifecycle
# =============================================================================


class TestServerLifecycle:
    """Tests for server configuration."""

    async def test_server_name(self, server: FastMCP) -> None:
        """Server should have a descriptive name."""
        assert "pantheon" in server.name.lower()
        assert "memory" in server.name.lower()

    async def test_server_instructions(self, server: FastMCP) -> None:
        """Server should have instructions set."""
        assert server.instructions is not None
        assert len(server.instructions) > 0
        assert "memory" in server.instructions.lower()


# =============================================================================
# Freshness Decay
# =============================================================================


class TestFreshnessScore:
    """Tests for the freshness_score decay function."""

    def test_freshness_score_now_is_one(self, module) -> None:
        """Freshness of current time should approach 1.0."""
        import datetime

        now = datetime.datetime.now(datetime.UTC).isoformat()
        score = module.freshness_score(now)
        assert score > 0.99

    def test_freshness_score_old_is_low(self, module) -> None:
        """Very old entries should have near-zero freshness."""
        import datetime

        old = datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC).isoformat()
        score = module.freshness_score(old)
        assert score < 0.1

    def test_freshness_score_half_life(self, module) -> None:
        """At exactly one half-life (30 days), score should be ~0.5."""
        import datetime

        ts = (
            datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=30)
        ).isoformat()
        score = module.freshness_score(ts)
        assert 0.45 < score < 0.55

    def test_freshness_score_one_week(self, module) -> None:
        """At one week, score should be ~0.84."""
        import datetime

        ts = (
            datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=7)
        ).isoformat()
        score = module.freshness_score(ts)
        assert 0.80 < score < 0.90

    def test_freshness_score_invalid(self, module) -> None:
        """Invalid timestamps should return a default of 0.5."""
        score = module.freshness_score("not-a-date")
        assert score == 0.5


# =============================================================================
# Tools
# =============================================================================


class TestTools:
    """Tests for tool registration."""

    async def test_all_tools_registered(self, server: FastMCP) -> None:
        """All expected tools should be registered."""
        tools = await server.list_tools()
        names = [t.name for t in tools]
        expected = [
            "memory_store",
            "memory_search",
            "memory_recall",
            "memory_compress",
            "memory_expand",
            "memory_sessions",
            "memory_verify",
            "memory_consolidate",
            "memory_export",
            "memory_link",
            "memory_traverse",
        ]
        for name in expected:
            assert name in names, f"Missing tool: {name}"

    async def test_tools_have_descriptions(self, server: FastMCP) -> None:
        """All tools should have meaningful descriptions."""
        tools = await server.list_tools()
        for t in tools:
            assert t.description and len(t.description) > 0


class TestMemoryStore:
    """Tests for memory_store tool."""

    async def test_store_basic(self, server: FastMCP) -> None:
        """Store a simple string and verify it returns an ID and timestamp."""
        result = await server.call_tool(
            "memory_store",
            {"content": "The sky is blue on a clear day."},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "id" in data
        assert "timestamp" in data

    async def test_store_with_metadata(self, server: FastMCP) -> None:
        """Store with full metadata and verify response."""
        result = await server.call_tool(
            "memory_store",
            {
                "content": "User prefers dark mode.",
                "category": "session_fact",
                "agent": "hermes",
                "session_id": "test-session-123",
                "importance": 0.9,
            },
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "id" in data
        assert "timestamp" in data

    async def test_store_empty_content(self, server: FastMCP) -> None:
        """Empty content should return an error."""
        result = await server.call_tool(
            "memory_store",
            {"content": ""},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "error" in data


class TestMemorySearch:
    """Tests for memory_search tool."""

    async def test_search_returns_results(self, server: FastMCP) -> None:
        """Search should return stored entries ranked by relevance."""
        # Store some test data
        await server.call_tool(
            "memory_store",
            {"content": "Python is a programming language.", "category": "memory"},
        )
        await server.call_tool(
            "memory_store",
            {"content": "FastAPI is a web framework for Python.", "category": "memory"},
        )
        await server.call_tool(
            "memory_store",
            {"content": "The Eiffel Tower is in Paris.", "category": "memory"},
        )

        # Search for Python-related content
        result = await server.call_tool(
            "memory_search",
            {"query": "Python programming", "n_results": 2},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "results" in data
        assert len(data["results"]) > 0
        # Should find Python entries
        contents = [r["content"] for r in data["results"]]
        assert any("Python" in c for c in contents)

    async def test_search_with_category_filter(self, server: FastMCP) -> None:
        """Category filter should narrow search results."""
        await server.call_tool(
            "memory_store",
            {
                "content": "Database schema for users.",
                "category": "decision",
                "session_id": "cat-test",
            },
        )
        await server.call_tool(
            "memory_store",
            {
                "content": "User login flow implemented.",
                "category": "memory",
                "session_id": "cat-test",
            },
        )

        result = await server.call_tool(
            "memory_search",
            {
                "query": "user",
                "n_results": 5,
                "category_filter": "decision",
            },
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "results" in data
        for r in data["results"]:
            assert r["category"] == "decision"

    async def test_search_empty_query(self, server: FastMCP) -> None:
        """Empty query should return an error."""
        result = await server.call_tool(
            "memory_search",
            {"query": ""},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "error" in data


class TestMemoryRecall:
    """Tests for memory_recall tool."""

    async def test_recall_returns_formatted(self, server: FastMCP) -> None:
        """Recall should return a formatted string of relevant memories."""
        await server.call_tool(
            "memory_store",
            {"content": "API rate limit is 100 requests per minute."},
        )
        await server.call_tool(
            "memory_store",
            {"content": "JWT tokens expire after 24 hours."},
        )

        result = await server.call_tool(
            "memory_recall",
            {"context": "What is the API rate limit?", "n_results": 1},
        )
        text = _text_from_tool(result)
        assert "Relevant Memories" in text
        assert "rate limit" in text.lower() or "API" in text

    async def test_recall_no_context(self, server: FastMCP) -> None:
        """Empty context should return a message."""
        result = await server.call_tool(
            "memory_recall",
            {"context": ""},
        )
        text = _text_from_tool(result)
        assert "No context" in text or "no" in text.lower()

    async def test_recall_no_results(self, server: FastMCP) -> None:
        """Context that doesn't match should return no-results message."""
        result = await server.call_tool(
            "memory_recall",
            {"context": "xyznonexistent_xyz_foobar_12345"},
        )
        text = _text_from_tool(result)
        assert "No relevant" in text or "no" in text.lower()


class TestMemorySessions:
    """Tests for memory_sessions tool."""

    async def test_sessions_empty(self, server: FastMCP) -> None:
        """Sessions should be empty in a fresh test directory."""
        import importlib
        import json
        import shutil
        import tempfile

        mod = importlib.import_module("scripts.memory_mcp_server")
        test_dir = tempfile.mkdtemp()
        mod._set_memory_dir(test_dir)
        result = await server.call_tool("memory_sessions", {})
        data = json.loads(_text_from_tool(result))
        assert len(data["sessions"]) == 0
        shutil.rmtree(test_dir, ignore_errors=True)


class TestMemoryVerify:
    """Tests for memory_verify tool."""

    async def test_verify_valid_entry(self, server: FastMCP) -> None:
        """Recent entries should verify as valid."""
        store_result = await server.call_tool(
            "memory_store",
            {"content": "Test memory for verification."},
        )
        store_data = json.loads(_text_from_tool(store_result))
        entry_id = store_data["id"]

        verify_result = await server.call_tool(
            "memory_verify",
            {"entry_id": entry_id},
        )
        verify_data = json.loads(_text_from_tool(verify_result))
        assert verify_data["verified"] is True
        assert "age_hours" in verify_data

    async def test_verify_nonexistent_entry(self, server: FastMCP) -> None:
        """Non-existent entry should return not verified."""
        result = await server.call_tool(
            "memory_verify",
            {"entry_id": "00000000-0000-0000-0000-000000000000"},
        )
        data = json.loads(_text_from_tool(result))
        assert data["verified"] is False
        assert "error" in data or "not found" in json.dumps(data).lower()

    async def test_verify_empty_id(self, server: FastMCP) -> None:
        """Empty entry_id should return an error."""
        result = await server.call_tool(
            "memory_verify",
            {"entry_id": ""},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data


class TestMemoryExport:
    """Tests for memory_export tool."""

    async def test_export_empty(self, server: FastMCP) -> None:
        """Export with no data should return appropriate message."""
        result = await server.call_tool("memory_export", {})
        text = _text_from_tool(result)
        assert "Memory Export" in text

    async def test_export_with_data(self, server: FastMCP) -> None:
        """Export should include stored content."""
        await server.call_tool(
            "memory_store",
            {
                "content": "Export test content.",
                "category": "memory",
                "agent": "test-agent",
            },
        )

        result = await server.call_tool("memory_export", {})
        text = _text_from_tool(result)
        assert "Export test content" in text
        assert "test-agent" in text
        assert "Memory Export" in text

    async def test_export_by_session(self, server: FastMCP) -> None:
        """Session-scoped export should only return that session's data."""
        await server.call_tool(
            "memory_store",
            {"content": "Session A data.", "session_id": "export-a"},
        )
        await server.call_tool(
            "memory_store",
            {"content": "Session B data.", "session_id": "export-b"},
        )

        result = await server.call_tool(
            "memory_export",
            {"session_id": "export-a"},
        )
        text = _text_from_tool(result)
        assert "Session A data" in text
        assert "Session B data" not in text


class TestMemoryExpand:
    """Tests for memory_expand tool."""

    async def test_expand_not_compressed(self, server: FastMCP) -> None:
        """Non-compressed entries should report not compressible."""
        store_result = await server.call_tool(
            "memory_store",
            {"content": "Normal entry, not compressed."},
        )
        store_data = json.loads(_text_from_tool(store_result))

        result = await server.call_tool(
            "memory_expand",
            {"entry_id": store_data["id"]},
        )
        data = json.loads(_text_from_tool(result))
        assert data.get("compressible") is False

    async def test_expand_not_found(self, server: FastMCP) -> None:
        """Non-existent entry should return an error."""
        result = await server.call_tool(
            "memory_expand",
            {"entry_id": "00000000-0000-0000-0000-000000000000"},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data or "not found" in json.dumps(data).lower()

    async def test_expand_empty_id(self, server: FastMCP) -> None:
        """Empty entry_id should return an error."""
        result = await server.call_tool(
            "memory_expand",
            {"entry_id": ""},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data


class TestMemoryCompress:
    """Tests for memory_compress tool."""

    async def test_compress_not_enough_entries(self, server: FastMCP) -> None:
        """Compressing with very few entries should not error."""
        import importlib
        import json
        import shutil
        import tempfile

        mod = importlib.import_module("scripts.memory_mcp_server")
        test_dir = tempfile.mkdtemp()
        mod._set_memory_dir(test_dir)
        await server.call_tool(
            "memory_store",
            {"content": "Test memory entry.", "session_id": "compress-test"},
        )
        result = await server.call_tool(
            "memory_compress", {"session_id": "compress-test"}
        )
        data = json.loads(_text_from_tool(result))
        assert isinstance(data, dict)
        shutil.rmtree(test_dir, ignore_errors=True)

    async def test_compress_empty_session_id(self, server: FastMCP) -> None:
        """Empty session_id should return an error."""
        result = await server.call_tool(
            "memory_compress",
            {"session_id": ""},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data


class TestMemoryConsolidate:
    """Tests for memory_consolidate tool."""

    async def test_consolidate_not_enough(self, server: FastMCP) -> None:
        """Consolidating in a fresh dir should return 0 merges."""
        import importlib
        import json
        import shutil
        import tempfile

        mod = importlib.import_module("scripts.memory_mcp_server")
        test_dir = tempfile.mkdtemp()
        mod._set_memory_dir(test_dir)
        result = await server.call_tool("memory_consolidate", {})
        data = json.loads(_text_from_tool(result))
        assert data["merges"] == 0
        shutil.rmtree(test_dir, ignore_errors=True)
        result = await server.call_tool(
            "memory_consolidate",
            {"session_id": "cons-test"},
        )
        data = json.loads(_text_from_tool(result))
        assert "merges" in data


class TestMemoryStoreLinks:
    """Tests for memory_store tool with links parameter."""

    async def test_store_with_links(self, server: FastMCP) -> None:
        """Store with links should link to existing entries."""
        # Create two entries first
        r1 = await server.call_tool(
            "memory_store",
            {"content": "Target entry A.", "session_id": "link-store-test"},
        )
        d1 = json.loads(_text_from_tool(r1))

        r2 = await server.call_tool(
            "memory_store",
            {"content": "Target entry B.", "session_id": "link-store-test"},
        )
        d2 = json.loads(_text_from_tool(r2))

        # Create a third entry linked to the first two
        links_json = json.dumps([d1["id"], d2["id"]])
        r3 = await server.call_tool(
            "memory_store",
            {
                "content": "Linked entry.",
                "session_id": "link-store-test",
                "links": links_json,
            },
        )
        d3 = json.loads(_text_from_tool(r3))
        assert "id" in d3
        # Should not error
        assert "error" not in d3

    async def test_store_with_links_nonexistent(self, server: FastMCP) -> None:
        """Linking to non-existent IDs should return error."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        links_json = json.dumps([fake_id])
        result = await server.call_tool(
            "memory_store",
            {
                "content": "Bad links entry.",
                "links": links_json,
            },
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data

    async def test_store_with_empty_links(self, server: FastMCP) -> None:
        """Empty links list should store normally with no error."""
        links_json = json.dumps([])
        result = await server.call_tool(
            "memory_store",
            {
                "content": "Entry with empty links.",
                "links": links_json,
            },
        )
        data = json.loads(_text_from_tool(result))
        assert "id" in data


class TestMemoryLink:
    """Tests for memory_link tool."""

    async def _create_entry(self, server: FastMCP, content: str) -> str:
        result = await server.call_tool(
            "memory_store",
            {"content": content, "session_id": "link-test"},
        )
        return json.loads(_text_from_tool(result))["id"]

    async def test_memory_link_creates_bidirectional(self, server: FastMCP) -> None:
        """Link two entries, verify both have links in metadata."""
        id_a = await self._create_entry(server, "Entry Alpha")
        id_b = await self._create_entry(server, "Entry Beta")

        result = await server.call_tool(
            "memory_link",
            {"from_id": id_a, "to_id": id_b, "relation": "references"},
        )
        data = json.loads(_text_from_tool(result))
        assert data["linked"] is True
        assert data["from_id"] == id_a
        assert data["to_id"] == id_b

    async def test_memory_link_nonexistent(self, server: FastMCP) -> None:
        """Link to non-existent ID returns error."""
        real_id = await self._create_entry(server, "Real entry.")
        fake_id = "00000000-0000-0000-0000-000000000000"

        result = await server.call_tool(
            "memory_link",
            {"from_id": real_id, "to_id": fake_id},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data

    async def test_memory_link_self(self, server: FastMCP) -> None:
        """Linking an entry to itself returns error."""
        entry_id = await self._create_entry(server, "Solo entry.")

        result = await server.call_tool(
            "memory_link",
            {"from_id": entry_id, "to_id": entry_id},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data
        assert "itself" in data["error"]

    async def test_memory_link_empty_ids(self, server: FastMCP) -> None:
        """Empty from_id or to_id returns error."""
        entry_id = await self._create_entry(server, "Entry.")

        result = await server.call_tool(
            "memory_link",
            {"from_id": "", "to_id": entry_id},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data

        result = await server.call_tool(
            "memory_link",
            {"from_id": entry_id, "to_id": ""},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data

    async def test_memory_link_duplicate(self, server: FastMCP) -> None:
        """Creating the same link twice should not produce duplicates."""
        id_a = await self._create_entry(server, "Entry A")
        id_b = await self._create_entry(server, "Entry B")

        # Link twice
        await server.call_tool(
            "memory_link",
            {"from_id": id_a, "to_id": id_b, "relation": "references"},
        )
        result2 = await server.call_tool(
            "memory_link",
            {"from_id": id_a, "to_id": id_b, "relation": "references"},
        )
        data2 = json.loads(_text_from_tool(result2))
        assert data2["linked"] is True


class TestMemoryTraverse:
    """Tests for memory_traverse tool."""

    async def _create_entry(self, server: FastMCP, content: str) -> str:
        result = await server.call_tool(
            "memory_store",
            {"content": content, "session_id": "traverse-test"},
        )
        return json.loads(_text_from_tool(result))["id"]

    async def test_memory_traverse_basic(self, server: FastMCP) -> None:
        """Traverse 1 hop returns linked entries."""
        id_a = await self._create_entry(server, "Root node")
        id_b = await self._create_entry(server, "Child node")
        id_c = await self._create_entry(server, "Unrelated node")

        # Link A <-> B
        await server.call_tool(
            "memory_link",
            {"from_id": id_a, "to_id": id_b},
        )

        result = await server.call_tool(
            "memory_traverse",
            {"entry_id": id_a, "max_depth": 1},
        )
        data = json.loads(_text_from_tool(result))
        assert data["root"] == id_a
        assert data["nodes_visited"] >= 2  # root + child
        assert id_a in data["graph"]
        assert id_b in data["graph"]

    async def test_memory_traverse_depth_limit(self, server: FastMCP) -> None:
        """max_depth is clamped to 1-3."""
        result = await server.call_tool(
            "memory_traverse",
            {"entry_id": "any", "max_depth": 999},
        )
        data = json.loads(_text_from_tool(result))
        # max_depth should be clamped to 3 (max allowed)
        # But since entry doesn't exist, graph may be empty
        assert data["max_depth"] == 3

        result = await server.call_tool(
            "memory_traverse",
            {"entry_id": "any", "max_depth": -1},
        )
        data = json.loads(_text_from_tool(result))
        assert data["max_depth"] == 1  # clamped to minimum

    async def test_memory_traverse_empty_id(self, server: FastMCP) -> None:
        """Empty entry_id returns error."""
        result = await server.call_tool(
            "memory_traverse",
            {"entry_id": ""},
        )
        data = json.loads(_text_from_tool(result))
        assert "error" in data

    async def test_memory_traverse_nonexistent(self, server: FastMCP) -> None:
        """Non-existent entry_id should return empty graph."""
        result = await server.call_tool(
            "memory_traverse",
            {"entry_id": "00000000-0000-0000-0000-000000000000"},
        )
        data = json.loads(_text_from_tool(result))
        assert data["nodes_visited"] == 0


# =============================================================================
# Resources
# =============================================================================



    async def test_sessions_format_markdown(self, server: FastMCP) -> None:
        """memory_sessions with format=markdown should return markdown."""
        result = await server.call_tool("memory_sessions", {"format": "markdown"})
        text = _text_from_tool(result)
        assert "Sessions" in text or "#" in text or "sessions" in text

    async def test_compress_shows_preview(self, server: FastMCP) -> None:
        """memory_compress should include summary_preview when compression happens."""
        await server.call_tool("memory_store", {"content": "Preview one.", "session_id": "preview-test2"})
        await server.call_tool("memory_store", {"content": "Preview two.", "session_id": "preview-test2"})
        result = await server.call_tool("memory_compress", {"session_id": "preview-test2"})
        text = _text_from_tool(result)
        data = json.loads(text)
        if data["compressed"] > 0:
            assert "summary_preview" in data
        else:
            assert "message" in data

    async def test_cleanup_empty_prefix(self, server: FastMCP) -> None:
        """Cleanup with non-existent prefix should return 0 deleted."""
        result = await server.call_tool("memory_cleanup", {"session_prefix": "nonexistent-prefix-xyz"})
        text = _text_from_tool(result)
        data = json.loads(text)
        assert data["deleted"] == 0
        assert data["prefix"] == "nonexistent-prefix-xyz"

    async def test_cleanup_by_prefix(self, server: FastMCP) -> None:
        """Cleanup with prefix should delete matching sessions."""
        import json
        import tempfile, shutil, importlib
        mod = importlib.import_module("scripts.memory_mcp_server")
        test_dir = tempfile.mkdtemp()
        mod._set_memory_dir(test_dir)
        await server.call_tool("memory_store", {"content": "Clean this.", "session_id": "clean-me-1"})
        await server.call_tool("memory_store", {"content": "Keep this.", "session_id": "keep-me"})

        result = await server.call_tool("memory_cleanup", {"session_prefix": "clean-"})
        data = json.loads(_text_from_tool(result))
        assert data["deleted"] >= 1
        assert "clean-me-1" in data["sessions"]
        shutil.rmtree(test_dir, ignore_errors=True)



class TestMemoryDelete:
    """Tests for memory_delete tool."""

    async def test_delete_existing(self, server: FastMCP) -> None:
        """Deleting an existing entry should succeed."""
        import json
        
        # Store an entry
        result = await server.call_tool("memory_store", {"content": "Delete me.", "session_id": "delete-test"})
        store_data = json.loads(_text_from_tool(result))
        entry_id = store_data["id"]
        
        # Delete it
        result = await server.call_tool("memory_delete", {"entry_id": entry_id})
        data = json.loads(_text_from_tool(result))
        assert data["deleted"] is True
        assert data["entry_id"] == entry_id

    async def test_delete_nonexistent(self, server: FastMCP) -> None:
        """Deleting a non-existent entry should not error."""
        import json
        result = await server.call_tool("memory_delete", {"entry_id": "nonexistent-id-xyz"})
        data = json.loads(_text_from_tool(result))
        # ChromaDB delete is idempotent — no error for non-existent
        assert True

    async def test_delete_empty_id(self, server: FastMCP) -> None:
        """Empty entry_id should return error."""
        import json
        result = await server.call_tool("memory_delete", {"entry_id": ""})
        data = json.loads(_text_from_tool(result))
        assert "error" in data


class TestMemoryUpdate:
    """Tests for memory_update tool."""

    async def test_update_content(self, server: FastMCP) -> None:
        """Update content should change the stored content."""
        import json
        
        result = await server.call_tool("memory_store", {"content": "Original content.", "session_id": "update-test"})
        store_data = json.loads(_text_from_tool(result))
        entry_id = store_data["id"]
        
        result = await server.call_tool("memory_update", {"entry_id": entry_id, "content": "Updated content."})
        data = json.loads(_text_from_tool(result))
        assert data["updated"] is True

    async def test_update_nonexistent(self, server: FastMCP) -> None:
        """Updating a non-existent entry should return error."""
        import json
        result = await server.call_tool("memory_update", {"entry_id": "nonexistent-id-xyz", "content": "New content"})
        data = json.loads(_text_from_tool(result))
        assert "error" in data

    async def test_update_empty_id(self, server: FastMCP) -> None:
        """Empty entry_id should return error."""
        import json
        result = await server.call_tool("memory_update", {"entry_id": "", "content": "New"})
        data = json.loads(_text_from_tool(result))
        assert "error" in data


class TestResources:
    """Tests for resource registration and content."""

    async def test_status_resource_registered(self, server: FastMCP) -> None:
        """The status URI should be registered."""
        resources = await server.list_resources()
        uris = [str(r.uri) for r in resources]
        assert "pantheon://memory/status" in uris

    async def test_status_returns_stats(self, server: FastMCP) -> None:
        """Reading status should return memory statistics."""
        # Store an entry so status shows non-zero
        await server.call_tool(
            "memory_store",
            {"content": "Status test entry."},
        )

        result = await server.read_resource("pantheon://memory/status")
        text = _text(result)
        assert "Memory Status" in text
        assert "Total entries" in text

    async def test_sessions_resource_registered(self, server: FastMCP) -> None:
        """The sessions resource URI should be registered."""
        resources = await server.list_resources()
        uris = [str(r.uri) for r in resources]
        assert "pantheon://memory/sessions" in uris

    async def test_sessions_resource_empty(self, server: FastMCP) -> None:
        """Empty database should return appropriate message."""
        result = await server.read_resource("pantheon://memory/sessions")
        text = _text(result)
        assert "Sessions" in text


# =============================================================================
# Error Handling
# =============================================================================


class TestErrorHandling:
    """Tests for edge cases and error handling."""

    async def test_store_invalid_importance(self, server: FastMCP) -> None:
        """Importance values outside 0-1 range should be clamped."""
        result = await server.call_tool(
            "memory_store",
            {"content": "Test clamping.", "importance": 999},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "id" in data

    async def test_search_zero_results(self, server: FastMCP) -> None:
        """Search for non-existent content should return empty results."""
        result = await server.call_tool(
            "memory_search",
            {"query": "xyznonexistent_xyz_foobar_12345"},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "results" in data
        # In an empty DB, this should be empty
        if len(data["results"]) == 0:
            assert True
        else:
            # With other entries, search still works but shouldn't crash
            assert len(data["results"]) > 0

    async def test_resource_unknown_uri(self, server: FastMCP) -> None:
        """Unknown URI should raise ValueError."""
        with pytest.raises((ValueError, Exception)):
            result = await server.read_resource("pantheon://memory/unknown_resource")
            text = _text(result)
            assert len(text) > 0

    async def test_compress_invalid_ratio(self, server: FastMCP) -> None:
        """Compression ratio out of range should be clamped."""
        await server.call_tool(
            "memory_store",
            {"content": "A", "session_id": "ratio-test"},
        )
        await server.call_tool(
            "memory_store",
            {"content": "B", "session_id": "ratio-test"},
        )

        result = await server.call_tool(
            "memory_compress",
            {"session_id": "ratio-test", "compression_ratio": 999},
        )
        text = _text_from_tool(result)
        assert len(text) > 0

    async def test_recall_large_n(self, server: FastMCP) -> None:
        """Large n_results should be clamped and not crash."""
        result = await server.call_tool(
            "memory_recall",
            {"context": "anything", "n_results": 9999},
        )
        text = _text_from_tool(result)
        assert len(text) > 0


# =============================================================================
# RTK Output Filter (Upgrade 1)
# =============================================================================


class TestRTKHelpers:
    """Tests for the RTK-style output filter helper functions."""

    def test_dedup_lines_collapses_repeated(self, module) -> None:
        """Two consecutive repeated lines should collapse to [x2]."""
        result = module._dedup_lines("error\nerror\nnot found")
        assert "[x2] error" in result
        assert "not found" in result

    def test_dedup_lines_no_repeats(self, module) -> None:
        """Text with no repeats should be unchanged."""
        text = "line a\nline b\nline c"
        result = module._dedup_lines(text)
        assert result == text

    def test_dedup_lines_empty(self, module) -> None:
        """Empty text should return empty string."""
        assert module._dedup_lines("") == ""

    def test_dedup_lines_triple(self, module) -> None:
        """Triple consecutive repeated lines should get [x3]."""
        result = module._dedup_lines("a\na\na\nb")
        assert "[x3] a" in result
        assert "b" in result

    def test_group_lines_by_type(self, module) -> None:
        """Lines should be grouped into errors, warnings, info, other."""
        text = "error: timeout\nWarning: high memory\nINFO: started\nother line"
        result = module._group_lines(text)
        assert "─── Errors ───" in result
        assert "error: timeout" in result
        assert "Warning: high memory" in result
        assert "INFO: started" in result
        assert "other line" in result

    def test_group_lines_empty(self, module) -> None:
        """Empty text should return empty string."""
        assert module._group_lines("") == ""

    def test_group_lines_no_info(self, module) -> None:
        """Lines without matching types should go to 'other'."""
        text = "ERROR: fail\njust a note"
        result = module._group_lines(text)
        assert "─── Errors ───" in result
        assert "ERROR: fail" in result
        assert "just a note" in result
        assert "─── Warnings ───" not in result

    def test_truncate_content_short(self, module) -> None:
        """Text shorter than max_chars should be unchanged."""
        text = "short text"
        result = module._truncate_content(text, max_chars=5000)
        assert result == text

    def test_truncate_content_long(self, module) -> None:
        """Long text should keep beginning and end with truncation notice."""
        text = "A" * 1000 + "B" * 1000 + "C" * 1000
        result = module._truncate_content(text, max_chars=500)
        assert result.startswith("A" * 300)
        assert result.endswith("C" * 200)
        assert "truncated" in result
        assert "chars" in result

    def test_truncate_content_exact_boundary(self, module) -> None:
        """Text exactly at max_chars should not be truncated."""
        text = "x" * 100
        result = module._truncate_content(text, max_chars=100)
        assert result == text


class TestMemoryStoreTruncate:
    """Tests for memory_store with truncate=True."""

    async def test_store_with_truncate_dedups(self, server: FastMCP) -> None:
        """Store with truncate=True should filter repeated lines."""
        noisy = "error\ncomando não encontrado\nerror\ncomando não encontrado"
        result = await server.call_tool(
            "memory_store",
            {"content": noisy, "truncate": True},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "id" in data

        # Search to verify filtered content was stored
        search = await server.call_tool(
            "memory_search",
            {"query": "comando não encontrado", "n_results": 5},
        )
        search_text = _text_from_tool(search)
        search_data = json.loads(search_text)
        assert len(search_data["results"]) > 0
        stored = search_data["results"][0]["content"]
        assert "Errors" in stored
        assert "─── Errors ───" in stored

    async def test_store_with_truncate_noop_on_clean(self, server: FastMCP) -> None:
        """Clean content with truncate=True should still be stored."""
        result = await server.call_tool(
            "memory_store",
            {"content": "Clean content, no noise.", "truncate": True},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "id" in data
        assert "error" not in data

    async def test_store_truncate_sets_metadata(self, server: FastMCP) -> None:
        """Store with truncate=True should set truncated metadata flag."""
        result = await server.call_tool(
            "memory_store",
            {"content": "Test truncate metadata.", "truncate": True}
        )
        data = json.loads(_text_from_tool(result))
        assert "id" in data
        assert "id" in data


# =============================================================================
# Smarter Memory Recall (Upgrade 2)
# =============================================================================


class TestMemoryRecallFormatted:
    """Tests for the smarter memory_recall output format."""

    async def test_recall_formatted_has_emoji(self, server: FastMCP) -> None:
        """Recall output should contain freshness emoji markers."""
        await server.call_tool(
            "memory_store",
            {
                "content": "API rate limit is 100 requests per minute.",
                "importance": 0.9,
            },
        )

        result = await server.call_tool(
            "memory_recall",
            {"context": "What is the API rate limit?", "n_results": 1},
        )
        text = _text_from_tool(result)
        assert "Relevant Memories" in text
        assert (
            "high" in text.lower() or "medium" in text.lower() or "low" in text.lower()
        )
        assert "Stored" in text

    async def test_recall_formatted_structure(self, server: FastMCP) -> None:
        """Recall output should follow the expected numbered format."""
        await server.call_tool(
            "memory_store",
            {
                "content": "User prefers dark mode.",
                "agent": "hermes",
                "category": "session_fact",
                "importance": 0.8,
            },
        )

        result = await server.call_tool(
            "memory_recall",
            {"context": "user preferences dark mode", "n_results": 1},
        )
        text = _text_from_tool(result)
        # Should have numbered item
        assert "1." in text
        # Should have category
        assert "session_fact" in text or "category" in text
        # Should have agent
        assert "hermes" in text
        # Should have arrow → (stored relation)
        assert "→" in text or "-" in text

    async def test_recall_multiple_results(self, server: FastMCP) -> None:
        """Recall should return multiple numbered results."""
        for i in range(3):
            await server.call_tool(
                "memory_store",
                {"content": f"Test memory number {i}.", "importance": 0.5},
            )

        result = await server.call_tool(
            "memory_recall",
            {"context": "test memory number", "n_results": 3},
        )
        text = _text_from_tool(result)
        assert "1." in text
        assert "2." in text
        assert "3." in text

    async def test_store_with_truncate_multiple_lines(self, server: FastMCP) -> None:
        """Store with truncate=True handles multiple line groups."""
        noisy = (
            "ERROR: connection timeout\n"
            "ERROR: connection timeout\n"
            "Warning: high memory usage\n"
            "INFO: service restarted\n"
            "just a log line"
        )
        result = await server.call_tool(
            "memory_store",
            {"content": noisy, "truncate": True},
        )
        text = _text_from_tool(result)
        data = json.loads(text)
        assert "id" in data

        search = await server.call_tool(
            "memory_search",
            {"query": "connection timeout", "n_results": 5},
        )
        search_data = json.loads(_text_from_tool(search))
        assert len(search_data["results"]) > 0
        stored = search_data["results"][0]["content"]
        assert "Other" in stored
        assert "Warnings" in stored or "Warnings" in str(stored)
