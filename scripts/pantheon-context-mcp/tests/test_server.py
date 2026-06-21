"""Tests for the MCP server.

Uses JSON-RPC over stdio to test tool registration and invocation.
"""

from __future__ import annotations

import asyncio
import json
import subprocess
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
SRC_DIR = HERE.parent
SERVER_PATH = SRC_DIR / "server.py"


class TestServerImport:
    """Tests that server modules import correctly."""

    def test_server_imports(self) -> None:
        """Server module should import without error."""
        # sys.path already includes SRC_DIR from conftest
        import server  # noqa: F811

        assert hasattr(server, "mcp")
        assert hasattr(server, "compress_text")
        assert hasattr(server, "prune_stale")
        assert hasattr(server, "context_stats")

    def test_scoring_import(self) -> None:
        """Scoring module should import correctly."""
        import scoring  # noqa: F811

        assert callable(scoring.score_content)

    def test_summarizer_import(self) -> None:
        """Summarizer module should import correctly."""
        import summarizer  # noqa: F811

        assert callable(summarizer.compress_text)
        assert callable(summarizer.prune_stale_outputs)
        assert callable(summarizer.scrub)


class TestToolsList:
    """Tests for tool registration via JSON-RPC."""

    def test_tools_list_response(self) -> None:
        """Server should respond to tools/list with tool definitions."""
        request = json.dumps({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
        })

        result = subprocess.run(
            [sys.executable, str(SERVER_PATH)],
            input=request,
            capture_output=True,
            text=True,
            timeout=10,
        )

        assert result.returncode == 0, (
            f"Server exited with {result.returncode}: {result.stderr}"
        )
        assert result.stdout, "No stdout from server"

    async def _get_tool_names(self, mcp):
        tools = await mcp.list_tools()
        return [t.name for t in tools]

    def test_tools_registered(self) -> None:
        """Verify expected tool names are registered."""
        import server  # noqa: F811

        mcp = server.mcp
        tool_names = asyncio.run(self._get_tool_names(mcp))
        assert "compress_text" in tool_names, (
            f"Expected compress_text in tools, got {tool_names}"
        )
        assert "prune_stale" in tool_names
        assert "context_stats" in tool_names
        assert len(tool_names) == 3


class TestCompressTextTool:
    """Tests for the compress_text MCP tool."""

    def test_compress_text_tool(self) -> None:
        """compress_text tool should work via direct async call."""
        import server  # noqa: F811

        result = asyncio.run(
            server.compress_text(
                "Added JWT auth endpoint with login. Also fixed a CSS typo.",
                max_chars=500,
            )
        )
        assert isinstance(result, str)
        assert "JWT" in result or "auth" in result


class TestPruneStaleTool:
    """Tests for the prune_stale MCP tool."""

    def test_prune_stale_tool(self) -> None:
        """prune_stale tool should work via direct async call."""
        import server  # noqa: F811

        result = asyncio.run(
            server.prune_stale(["a", "a", "b", "b", "c"], keep_last=3)
        )
        assert isinstance(result, list)
        assert len(result) <= 3


class TestContextStatsTool:
    """Tests for the context_stats MCP tool."""

    def test_context_stats_tool(self) -> None:
        """context_stats tool should work via direct async call."""
        import server  # noqa: F811

        result = asyncio.run(server.context_stats("Hello\nWorld\n"))
        assert isinstance(result, str)
        assert "Tokens:" in result
        assert "Lines:" in result
        assert "Chars:" in result
