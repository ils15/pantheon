#!/usr/bin/env python3
"""Pantheon Code Mode MCP Server.

Provides a confined execution environment for orchestration scripts
via MCP tools and resources.

Usage:
    python scripts/code_mode_server.py

Or via MCP client (stdio transport):
    pantheon-code-mode:
        command: python
        args: ["scripts/code_mode_server.py"]
"""

from __future__ import annotations

import asyncio
import os
import stat
from contextlib import suppress
from pathlib import Path

from _pantheon_paths import pantheon_home, pantheon_project
from mcp.server.fastmcp import FastMCP

# ── Constants ─────────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS: frozenset[str] = frozenset({".sh", ".py"})
SCRIPT_TIMEOUT: int = 30

# ── Scripts Directory Resolution ─────────────────────────────────────────────
# Priority:
# 1. /.opencode/.pantheon/code-mode/  (project install)
# 2. /.pantheon/code-mode/            (legacy fallback)
# 3. /.pantheon/code-mode/               (global fallback)
_PANTHEON_HOME: Path = pantheon_home()
_SCRIPTS_DIR_CANDIDATES: list[Path] = []
_proj = pantheon_project()
if _proj is not None:
    _SCRIPTS_DIR_CANDIDATES.append(_proj / ".opencode" / ".pantheon" / "code-mode")
    _SCRIPTS_DIR_CANDIDATES.append(_proj / ".pantheon" / "code-mode")
_SCRIPTS_DIR_CANDIDATES.append(_PANTHEON_HOME / ".pantheon" / "code-mode")

SCRIPTS_DIR: Path = _PANTHEON_HOME / ".pantheon" / "code-mode"  # default
for _candidate in _SCRIPTS_DIR_CANDIDATES:
    if _candidate.is_dir():
        SCRIPTS_DIR = _candidate
        break

# ── FastMCP App ───────────────────────────────────────────────────────────────
mcp = FastMCP(
    "Pantheon Code Mode",
    instructions="Confined script execution for Pantheon orchestration. "
    "Scripts live in .pantheon/code-mode/ and must be .sh or .py files.",
)

# ── Helpers ───────────────────────────────────────────────────────────────────


def _validate_script_name(script_name: str) -> Path:
    """Validate a script name and return its resolved path.

    Raises ValueError if the name is invalid, traverses paths, or
    has a disallowed extension.
    """
    if not script_name:
        raise ValueError("Script name cannot be empty")

    name = script_name.strip()
    if name.startswith("."):
        raise ValueError(f"Invalid script name: '{script_name}'")
    if "/" in name or "\\" in name:
        raise ValueError(f"Invalid script name: '{script_name}'")

    ext = Path(name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(f"Extension '{ext}' not allowed. Allowed: {allowed}")

    script_path = (SCRIPTS_DIR / name).resolve()
    if not str(script_path).startswith(str(SCRIPTS_DIR.resolve())):
        raise ValueError(f"Invalid script name: '{script_name}'")
    if not script_path.exists():
        raise ValueError(f"Script '{script_name}' not found")

    return script_path


def _format_output(
    stdout: str, stderr: str, exit_code: int, timed_out: bool = False
) -> str:
    """Format script execution output into a readable string."""
    parts: list[str] = []
    if timed_out:
        parts.append(f"[TIMEOUT] Script exceeded {SCRIPT_TIMEOUT}s limit")
    if stdout:
        parts.append(stdout)
    if stderr:
        parts.append(f"[stderr]\n{stderr}")
    parts.append(f"--- exit code: {exit_code}")
    return "\n".join(parts)


# ── Static Resources ──────────────────────────────────────────────────────────


@mcp.resource(
    "pantheon://code-mode/scripts",
    description="List of available code-mode scripts",
)
async def list_code_mode_scripts() -> str:
    """Return a list of available scripts in the code-mode directory."""
    if not SCRIPTS_DIR.is_dir():
        return "Code mode directory not found."

    scripts: list[str] = []
    for f in sorted(SCRIPTS_DIR.iterdir()):
        if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS:
            scripts.append(f"- {f.name}")

    return "\n".join(scripts) if scripts else "No scripts found."


# ── Template Resources ────────────────────────────────────────────────────────


@mcp.resource(
    "pantheon://code-mode/scripts/{script_name}",
    description="Content of a code-mode script by name",
)
async def get_code_mode_script(script_name: str) -> str:
    """Return the source content of a code-mode script."""
    try:
        script_path = _validate_script_name(script_name)
        return script_path.read_text(encoding="utf-8")
    except ValueError as e:
        return str(e)


# ── Tools ─────────────────────────────────────────────────────────────────────


@mcp.tool(
    name="execute_code_script",
    description="Run a .sh/.py script from .pantheon/code-mode/ "
    "with optional args. 30s timeout.",
)
async def execute_code_script(script_name: str, args: list[str] | None = None) -> str:
    """Execute a code-mode script with confinement and timeout.

    Args:
        script_name: Name of the script in the code-mode directory.
        args: Optional CLI arguments forwarded to the subprocess (e.g.
            ``["compress", "--text", "..."]``). Defaults to no args.
    """
    args = args or []
    try:
        script_path = _validate_script_name(script_name)
    except ValueError as e:
        return str(e)

    # Ensure script is executable
    if not os.access(script_path, os.X_OK):
        with suppress(OSError):
            mode = script_path.stat().st_mode
            script_path.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    script_dir = script_path.parent
    try:
        proc = await asyncio.create_subprocess_exec(
            str(script_path),
            *args,
            cwd=str(script_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=SCRIPT_TIMEOUT
            )
            return _format_output(
                stdout.decode("utf-8", errors="replace"),
                stderr.decode("utf-8", errors="replace"),
                proc.returncode or 0,
            )
        except TimeoutError:
            proc.kill()
            await proc.wait()
            return _format_output("", "", -1, timed_out=True)
    except FileNotFoundError:
        return (
            f"Script '{script_name}' not found "
            f"or interpreter missing.\n--- exit code: -1"
        )
    except OSError as e:
        return f"Failed to execute script: {e}\n--- exit code: -1"


# ── Main Entrypoint ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run()
