"""Fixtures and test helpers for Pantheon Context MCP tests.

Adds the source directory to sys.path so tests can import directly
from scoring.py, summarizer.py, and server.py.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Add source directory to path for direct imports
HERE = Path(__file__).resolve().parent  # tests/
SRC_DIR = HERE.parent  # pantheon-context-mcp/
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


@pytest.fixture
def sample_text() -> str:
    """Return a mixed-priority sample text with auth and CSS content."""
    return (
        "Added JWT auth endpoint with refresh token rotation. "
        "The login endpoint returns access+refresh tokens. "
        "Access token lives 15 min, refresh token 7 days. "
        "Also fixed a CSS typo in the button component."
    )


@pytest.fixture
def sample_outputs() -> list[str]:
    """Return a sample list of tool outputs with duplicates."""
    return [
        "Search result: found 3 auth files",
        "Reading backend/routers/auth.py...",
        "Search result: found 3 auth files",  # duplicate
        "Reading backend/routers/auth.py...",  # duplicate
        "Error: file not found",
        "Reading backend/routers/auth.py...",  # third occurrence
    ]


@pytest.fixture
def tool_names() -> list[str]:
    """Return expected MCP tool names for server validation."""
    return ["compress_text", "prune_stale", "context_stats"]


@pytest.fixture
def critical_text() -> str:
    """Return a CRITICAL-priority text about auth/schema."""
    return (
        "Added JWT auth endpoint with login and refresh token rotation. "
        "The new schema migration adds a refresh_tokens table."
    )


@pytest.fixture
def low_text() -> str:
    """Return a LOW-priority text about styles."""
    return (
        "Fixed a CSS style issue in the button component — "
        "changed button color from blue to dark blue. "
        "Also fixed a typo in the label."
    )


@pytest.fixture
def mixed_text() -> str:
    """Return mixed-priority text for compression testing."""
    return (
        "Created new auth service with JWT token rotation and refresh endpoint.\n\n"
        "Migration adds refresh_tokens table with foreign key to users.\n\n"
        "Fixed CSS button styling issue — color change only.\n\n"
        "Refactored the user service to use dependency injection.\n\n"
        "Typo fix in the login page label."
    )
