"""Tests for the Pantheon Code Mode MCP Adapter (scripts/code_mode_server.py).

Tests cover:
- Server name and instructions
- Scripts list resource
- Execute valid script (example-sync.sh)
- Execute non-existent script returns error
- Path traversal blocked
- Non-allowed extension blocked
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from mcp.server.fastmcp import FastMCP

# Module path
MODULE_PATH = "scripts.code_mode_server"
ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT / ".pantheon" / "code-mode"


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


@pytest.fixture(scope="session")
def module():
    """Import and return the server module."""
    import importlib

    mod = importlib.import_module(MODULE_PATH)
    importlib.reload(mod)
    return mod


@pytest.fixture
def server(module) -> FastMCP:
    """Return the FastMCP server instance."""
    return module.mcp


# =============================================================================
# Server Lifecycle
# =============================================================================


class TestServerLifecycle:
    """Tests for server configuration."""

    async def test_server_name(self, server: FastMCP) -> None:
        """Server should have a descriptive name."""
        assert "pantheon" in server.name.lower()
        assert "code" in server.name.lower() or "mode" in server.name.lower()

    async def test_server_instructions(self, server: FastMCP) -> None:
        """Server should have instructions set."""
        assert server.instructions is not None
        assert len(server.instructions) > 0
        assert (
            "code-mode" in server.instructions.lower()
            or "execute" in server.instructions.lower()
        )


# =============================================================================
# Tools
# =============================================================================


class TestTools:
    """Tests for tool registration and execution."""

    async def test_execute_tool_registered(self, server: FastMCP) -> None:
        """The execute_code_script tool should be registered."""
        tools = await server.list_tools()
        names = [t.name for t in tools]
        assert "execute_code_script" in names

    async def test_tool_has_description(self, server: FastMCP) -> None:
        """The tool should have a description set."""
        tools = await server.list_tools()
        for t in tools:
            if t.name == "execute_code_script":
                assert t.description is not None
                assert len(t.description) > 0
                break
        else:
            pytest.fail("execute_code_script tool not found")

    async def test_execute_valid_script(self, server: FastMCP) -> None:
        """Executing example-sync.sh should return success output."""
        result = await server.call_tool(
            "execute_code_script", {"script_name": "example-sync.sh"}
        )
        text = _text_from_tool(result)
        assert "Script executed successfully" in text
        assert "exit code: 0" in text

    async def test_execute_nonexistent_script(self, server: FastMCP) -> None:
        """Executing a non-existent script should return an error."""
        result = await server.call_tool(
            "execute_code_script", {"script_name": "nonexistent_script_xyz.sh"}
        )
        text = _text_from_tool(result)
        assert "not found" in text.lower()

    async def test_path_traversal_blocked(self, server: FastMCP) -> None:
        """Path traversal attempts should be blocked."""
        result = await server.call_tool(
            "execute_code_script", {"script_name": "../../etc/passwd"}
        )
        text = _text_from_tool(result)
        assert (
            "traversal" in text.lower()
            or "blocked" in text.lower()
            or "invalid" in text.lower()
        )

    async def test_non_allowed_extension_blocked(self, server: FastMCP) -> None:
        """Non-allowed extensions (.js, .txt, etc.) should be blocked."""
        result = await server.call_tool(
            "execute_code_script", {"script_name": "script.js"}
        )
        text = _text_from_tool(result)
        assert "not allowed" in text.lower() or "extension" in text.lower()

    async def test_script_with_dot_prefix_blocked(self, server: FastMCP) -> None:
        """Script names starting with dot should be blocked."""
        result = await server.call_tool(
            "execute_code_script", {"script_name": ".hidden_script.sh"}
        )
        text = _text_from_tool(result)
        assert "invalid" in text.lower() or "blocked" in text.lower()

    async def test_empty_script_name(self, server: FastMCP) -> None:
        """Empty script name should be rejected."""
        result = await server.call_tool("execute_code_script", {"script_name": ""})
        text = _text_from_tool(result)
        assert "empty" in text.lower() or "invalid" in text.lower()


# =============================================================================
# Resources
# =============================================================================


class TestResources:
    """Tests for resource registration and content."""

    async def test_scripts_list_uri_registered(self, server: FastMCP) -> None:
        """The scripts list URI pantheon://code-mode/scripts should be registered."""
        resources = await server.list_resources()
        uris = [str(r.uri) for r in resources]
        assert "pantheon://code-mode/scripts" in uris

    async def test_scripts_list_returns_content(self, server: FastMCP) -> None:
        """Reading pantheon://code-mode/scripts should return script names."""
        result = await server.read_resource("pantheon://code-mode/scripts")
        text = _text(result)
        assert len(text) > 0
        assert "example-sync.sh" in text

    async def test_script_content_uri_registered(self, server: FastMCP) -> None:
        """The script content template should be registered."""
        templates = await server.list_resource_templates()
        uris = [str(t.uriTemplate) for t in templates]
        matches = [u for u in uris if "code-mode/scripts" in u]
        assert len(matches) > 0

    async def test_script_content_returns_source(self, server: FastMCP) -> None:
        """Reading a specific script should return its source."""
        result = await server.read_resource(
            "pantheon://code-mode/scripts/example-sync.sh"
        )
        text = _text(result)
        assert len(text) > 0
        assert "#!/bin/bash" in text
        assert "Pantheon Code Mode" in text

    async def test_script_content_not_found(self, server: FastMCP) -> None:
        """Reading a non-existent script should return error."""
        result = await server.read_resource(
            "pantheon://code-mode/scripts/nonexistent_script_xyz.sh"
        )
        text = _text(result)
        assert "not found" in text.lower()

    async def test_script_content_traversal_blocked(self, module) -> None:
        """Path traversal on script content should be blocked."""
        content = await module.get_code_mode_script("../../routing.yml")
        assert (
            "traversal" in content.lower()
            or "blocked" in content.lower()
            or "invalid" in content.lower()
        )

    async def test_script_content_bad_extension(self, module) -> None:
        """Non-allowed extension on script content should be blocked."""
        content = await module.get_code_mode_script("script.js")
        assert "not allowed" in content.lower() or "extension" in content.lower()


# =============================================================================
# Helper Validation
# =============================================================================


class TestHelpers:
    """Tests for internal helper functions."""

    async def test_validate_script_name_valid(self, module) -> None:
        """A valid script name should resolve to its path."""
        path = module._validate_script_name("example-sync.sh")
        assert isinstance(path, Path)
        assert path.exists()
        assert path.name == "example-sync.sh"

    async def test_validate_script_name_traversal(self, module) -> None:
        """Path traversal names should raise ValueError."""
        with pytest.raises(ValueError, match=r"(?i)invalid"):
            module._validate_script_name("../../etc/passwd")

    async def test_validate_script_name_bad_extension(self, module) -> None:
        """Bad extensions should raise ValueError."""
        with pytest.raises(ValueError, match="not allowed|extension"):
            module._validate_script_name("script.js")

    async def test_validate_script_name_not_found(self, module) -> None:
        """Non-existent scripts should raise ValueError."""
        with pytest.raises(ValueError, match="not found"):
            module._validate_script_name("ghost_script.sh")

    async def test_validate_script_name_empty(self, module) -> None:
        """Empty names should raise ValueError."""
        with pytest.raises(ValueError, match=r"(?i)empty|cannot be empty"):
            module._validate_script_name("")

    async def test_format_output_with_stderr(self, module) -> None:
        """Format output should include stderr section."""
        result = module._format_output("", "error occurred", 1)
        assert "[stderr]" in result
        assert "error occurred" in result
        assert "exit code: 1" in result

    async def test_format_output_nonzero_exit(self, module) -> None:
        """Format output should show non-zero exit code."""
        result = module._format_output("output text", "error text", 42)
        assert "exit code: 42" in result
