#!/usr/bin/env python3
"""Pantheon Context MCP Server.

FastMCP server providing 3 tools for mid-session context compression:
- compress_text: Priority-aware text compression with security scrubbing
- prune_stale: Deduplicate and trim tool output lists
- context_stats: Token/line/character statistics

Usage:
    python3 scripts/pantheon-context-mcp/server.py

    # Test via JSON-RPC:
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \\
        python3 scripts/pantheon-context-mcp/server.py
"""

from __future__ import annotations

import sys
from pathlib import Path

from fastmcp import FastMCP

# Ensure this directory is on sys.path so sibling modules can be imported
# when running directly as a script (e.g. python3 server.py)
HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import scoring  # noqa: E402
import summarizer  # noqa: E402

# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------

mcp = FastMCP("pantheon-context")


@mcp.tool()
async def compress_text(text: str, max_chars: int = 4000) -> str:
    """Compress conversation text using priority-aware compression.

    Scores text sections by priority (CRITICAL/HIGH/MEDIUM/LOW),
    preserves critical content verbatim, summarizes medium-priority
    content, and drops low-priority content. Secrets are scrubbed
    before returning.

    Args:
        text: Raw conversation or tool output text to compress.
        max_chars: Maximum character length for output (default: 4000).

    Returns:
        Compressed text string (never exceeds max_chars).
    """
    return summarizer.compress_text(text, max_chars=max_chars)


@mcp.tool()
async def prune_stale(outputs: list[str], keep_last: int = 3) -> list[str]:
    """Prune a list of tool output strings.

    Removes consecutive duplicates and keeps only the last N unique
    outputs. If the same output appears more than 3 times, only the
    last occurrence is kept.

    Args:
        outputs: List of tool output strings to prune.
        keep_last: Number of most recent unique outputs to keep (default: 3).

    Returns:
        Pruned list of strings.
    """
    return summarizer.prune_stale_outputs(outputs, keep_last=keep_last)


@mcp.tool()
async def context_stats(text: str) -> str:
    """Generate statistics about conversation text.

    Provides approximate token count (using len//4 heuristic), line
    count, and character count.

    Args:
        text: Conversation text to analyze.

    Returns:
        Formatted stats string, e.g. "Tokens: ~1200 | Lines: 45 | Chars: 4800".
    """
    return summarizer.context_stats(text)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Check if running in stdio mode (piped input)
    if not sys.stdin.isatty():
        mcp.run(transport="stdio")
    else:
        # Pretty-print tool listing for human readers
        print("Pantheon Context MCP Server")
        print("=" * 40)
        tools = {k: v for k, v in mcp._local_provider._components.items() if k.startswith("tool:")}
        print(f"Tools: {len(tools)} registered")
        for key, tool_parts in tools.items():
            name = key.split(":")[1].split("@")[0]
            # tool_parts is a list of (attr, value) tuples
            desc = ""
            for attr_name, attr_val in tool_parts:
                if attr_name == "description" and attr_val:
                    desc = str(attr_val)[:80]
                    break
            print(f"  - {name}: {desc}")
        print()
        print("Run with piped input for JSON-RPC mode:")
        print('  echo \'{"jsonrpc":"2.0","id":1,"method":"tools/list"}\' | python3 scripts/pantheon-context-mcp/server.py')
