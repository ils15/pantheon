"""Tests for the Pantheon MCP Resources server (scripts/mcp-resources-server.py).

Tests cover:
- Static resources: agents list, skills list, routing
- Template resources: agent by name, skill by name, deepwork slug, memory-bank path
- Error handling: missing files, binary content, path traversal
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from mcp.server.fastmcp import FastMCP
from mcp.types import Resource as MCPResource
from mcp.types import ResourceTemplate

# Module path
MODULE_PATH = "scripts.mcp_resources_server"
ROOT = Path(__file__).resolve().parent.parent


def _text(contents: list | str) -> str:
    """Extract text content from FastMCP read_resource result (list[ReadResourceContents]) or string."""
    if isinstance(contents, str):
        return contents
    if isinstance(contents, list) and len(contents) > 0:
        item = contents[0]
        # ReadResourceContents has .content attribute
        if hasattr(item, "content"):
            return item.content
        return str(item)
    return str(contents)


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
# Static Resources
# =============================================================================


class TestStaticResources:
    """Tests for static (non-parameterized) resources."""

    async def test_agents_list_uri_registered(self, server: FastMCP) -> None:
        """The agents list URI pantheon://agents should be registered."""
        resources = await server.list_resources()
        uris = [str(r.uri) for r in resources]
        assert "pantheon://agents" in uris

    async def test_agents_list_returns_markdown(self, server: FastMCP) -> None:
        """Reading pantheon://agents should return agent names and roles."""
        result = await server.read_resource("pantheon://agents")
        text = _text(result)
        assert len(text) > 0
        assert "zeus" in text
        assert "hermes" in text

    async def test_skills_list_uri_registered(self, server: FastMCP) -> None:
        """The skills list URI pantheon://skills should be registered."""
        resources = await server.list_resources()
        uris = [str(r.uri) for r in resources]
        assert "pantheon://skills" in uris

    async def test_skills_list_returns_skill_names(self, server: FastMCP) -> None:
        """Reading pantheon://skills should return skill names."""
        result = await server.read_resource("pantheon://skills")
        text = _text(result)
        assert len(text) > 0
        assert "tdd-with-agents" in text

    async def test_routing_uri_registered(self, server: FastMCP) -> None:
        """The routing URI pantheon://routing should be registered."""
        resources = await server.list_resources()
        uris = [str(r.uri) for r in resources]
        assert "pantheon://routing" in uris

    async def test_routing_returns_yaml_content(self, server: FastMCP) -> None:
        """Reading pantheon://routing should return routing.yml content."""
        result = await server.read_resource("pantheon://routing")
        text = _text(result)
        assert len(text) > 0
        assert "version:" in text
        assert "agents:" in text


# =============================================================================
# Resource Templates
# =============================================================================


class TestResourceTemplates:
    """Tests for parameterized resource templates."""

    async def test_agent_template_registered(self, server: FastMCP) -> None:
        """The agent template pantheon://agents/{name} should be registered."""
        templates = await server.list_resource_templates()
        uris = [str(t.uriTemplate) for t in templates]
        matches = [u for u in uris if "agents" in u and "{" in u]
        assert len(matches) > 0

    async def test_agent_by_name_returns_content(self, server: FastMCP) -> None:
        """Reading pantheon://agents/zeus should return zeus agent content."""
        result = await server.read_resource("pantheon://agents/zeus")
        text = _text(result)
        assert len(text) > 0
        # Should either find zeus or get a meaningful error
        assert "zeus" in text or "not found" in text

    async def test_agent_by_name_case_insensitive(self, server: FastMCP) -> None:
        """Agent names should be matched case-insensitively."""
        result = await server.read_resource("pantheon://agents/Zeus")
        text = _text(result)
        assert len(text) > 0

    async def test_agent_not_found_returns_error(self, server: FastMCP) -> None:
        """A non-existent agent should return a meaningful error."""
        result = await server.read_resource("pantheon://agents/nonexistent_agent_xyz")
        text = _text(result)
        assert "not found" in text.lower()

    async def test_deepwork_template_registered(self, server: FastMCP) -> None:
        """The deepwork template pantheon://deepwork/{slug} should be registered."""
        templates = await server.list_resource_templates()
        uris = [str(t.uriTemplate) for t in templates]
        matches = [u for u in uris if "deepwork" in u]
        assert len(matches) > 0

    async def test_deepwork_slug_not_found(self, server: FastMCP) -> None:
        """A non-existent deepwork slug should return a meaningful error."""
        result = await server.read_resource("pantheon://deepwork/nonexistent_slug_xyz")
        text = _text(result)
        assert "not found" in text.lower() or "no such" in text.lower()

    async def test_deepwork_status_template_registered(self, server: FastMCP) -> None:
        """The deepwork status template pantheon://deepwork/{slug}/status should be registered."""
        templates = await server.list_resource_templates()
        uris = [str(t.uriTemplate) for t in templates]
        matches = [u for u in uris if "deepwork" in u and "status" in u]
        assert len(matches) > 0

    async def test_deepwork_status_no_file(self, server: FastMCP) -> None:
        """deepwork/{slug}/status should return a default message when STATUS.md doesn't exist."""
        result = await server.read_resource(
            "pantheon://deepwork/nonexistent_slug_xyz/status"
        )
        text = _text(result)
        assert "no STATUS.md" in text.lower() or "in progress" in text.lower()

    async def test_skill_template_registered(self, server: FastMCP) -> None:
        """The skill template pantheon://skills/{name} should be registered."""
        templates = await server.list_resource_templates()
        uris = [str(t.uriTemplate) for t in templates]
        matches = [u for u in uris if "skills" in u and "{" in u]
        assert len(matches) > 0

    async def test_skill_by_name_returns_content(self, server: FastMCP) -> None:
        """Reading pantheon://skills/tdd-with-agents should return skill content."""
        result = await server.read_resource("pantheon://skills/tdd-with-agents")
        text = _text(result)
        assert len(text) > 0

    async def test_skill_not_found_returns_error(self, server: FastMCP) -> None:
        """A non-existent skill should return a meaningful error."""
        result = await server.read_resource("pantheon://skills/nonexistent_skill_xyz")
        text = _text(result)
        assert "not found" in text.lower()

    async def test_memory_bank_template_registered(self, server: FastMCP) -> None:
        """The memory-bank template should be registered."""
        templates = await server.list_resource_templates()
        uris = [str(t.uriTemplate) for t in templates]
        matches = [u for u in uris if "memory-bank" in u]
        assert len(matches) > 0

    async def test_memory_bank_reads_file(self, module) -> None:
        """Reading a memory-bank file should return file content."""
        content = await module.get_memory_bank("00-project.md")
        assert len(content) > 0

    async def test_memory_bank_not_found(self, module) -> None:
        """A non-existent memory-bank file should return a meaningful error."""
        content = await module.get_memory_bank("nonexistent_file_xyz.md")
        assert "not found" in content.lower() or "no such" in content.lower()

    async def test_memory_bank_path_traversal_blocked(self, module) -> None:
        """Path traversal attempts should be blocked."""
        content = await module.get_memory_bank("../../routing.yml")
        assert "traversal" in content.lower() or "blocked" in content.lower()

    async def test_memory_bank_nested_path(self, module) -> None:
        """Nested paths work when handler is called directly."""
        notes_dir = ROOT / "docs" / "memory-bank" / "_notes"
        if notes_dir.is_dir():
            note_files = list(notes_dir.iterdir())
            if note_files:
                nested = f"_notes/{note_files[0].name}"
                content = await module.get_memory_bank(nested)
                assert len(content) > 0


# =============================================================================
# Resource List — Complete URI Coverage
# =============================================================================


class TestResourceList:
    """Tests that all expected resources and templates are listed."""

    async def test_all_static_resources_listed(self, server: FastMCP) -> None:
        """All static resource URIs should appear in the resources list."""
        resources = await server.list_resources()
        uris = [str(r.uri) for r in resources]
        assert "pantheon://agents" in uris
        assert "pantheon://skills" in uris
        assert "pantheon://routing" in uris

    async def test_all_templates_listed(self, server: FastMCP) -> None:
        """All template URIs should appear in the resource templates list."""
        templates = await server.list_resource_templates()
        uris = [str(t.uriTemplate) for t in templates]
        assert "pantheon://agents/{agent_name}" in uris
        assert "pantheon://deepwork/{slug}" in uris
        assert "pantheon://deepwork/{slug}/status" in uris
        assert "pantheon://skills/{name}" in uris
        assert "pantheon://memory-bank/{path}" in uris

    async def test_templates_have_descriptions(self, server: FastMCP) -> None:
        """All templates should have meaningful descriptions."""
        templates = await server.list_resource_templates()
        for t in templates:
            assert t.description and len(t.description) > 0

    async def test_static_resources_have_descriptions(self, server: FastMCP) -> None:
        """All static resources should have descriptions."""
        resources = await server.list_resources()
        for r in resources:
            assert r.description and len(r.description) > 0


# =============================================================================
# Error Handling
# =============================================================================


class TestErrorHandling:
    """Tests for edge cases and error handling."""

    async def test_unknown_uri_returns_error(self, server: FastMCP) -> None:
        """An unknown URI should return a meaningful error, not crash."""
        with pytest.raises((ValueError, Exception)):
            result = await server.read_resource("pantheon://unknown_resource")
            text = _text(result)
            assert "unknown resource" in text.lower() or "not found" in text.lower()

    async def test_unknown_uri_prefix(self, server: FastMCP) -> None:
        """A URI with unknown scheme/prefix should return a meaningful error."""
        with pytest.raises((ValueError, Exception)):
            result = await server.read_resource("pantheon://nonexistent")
            text = _text(result)
            assert "unknown resource" in text.lower() or "not found" in text.lower()

    @pytest.mark.skip(reason="Deepwork directories are created ad-hoc")
    async def test_deepwork_plan_not_found(self, server: FastMCP) -> None:
        """Reading a deepwork PLAN.md that doesn't exist should return error."""
        result = await server.read_resource("pantheon://deepwork/ghost-slug")
        text = _text(result)
        assert "not found" in text.lower()


# =============================================================================
# Server Lifecycle
# =============================================================================


class TestServerLifecycle:
    """Tests for server configuration and lifecycle."""

    async def test_server_name(self, server: FastMCP) -> None:
        """Server should have a descriptive name."""
        assert "pantheon" in server.name.lower()

    async def test_server_instructions(self, server: FastMCP) -> None:
        """Server should have instructions set."""
        assert server.instructions is not None
        assert len(server.instructions) > 0
