#!/usr/bin/env python3
"""Pantheon path resolution — global install + project root detection.

Provides two functions used by all MCP servers and utility scripts:

    pantheon_home() -> Path
        Pantheon global installation directory.
        Priority: $PANTHEON_HOME → $XDG_CONFIG_HOME/opencode → ~/.config/opencode

    pantheon_project() -> Path | None
        Current Pantheon project root.
        Priority: $PANTHEON_PROJECT → os.getcwd() → None (resources disabled)

Usage:
    from _pantheon_paths import pantheon_home, pantheon_project
"""

from __future__ import annotations

import os
from pathlib import Path


def pantheon_home() -> Path:
    """Return the Pantheon global installation directory.
    
    Resolution priority:
    1. $PANTHEON_HOME env var (explicit user override)
    2. $XDG_CONFIG_HOME/opencode (XDG Base Directory spec)
    3. ~/.config/opencode (POSIX default)
    
    Returns:
        Absolute Path to the Pantheon global config directory.
    """
    env = os.environ.get("PANTHEON_HOME")
    if env:
        return Path(env).expanduser().resolve()

    xdg = os.environ.get("XDG_CONFIG_HOME")
    if xdg:
        return Path(xdg).expanduser().resolve() / "opencode"

    return Path.home() / ".config" / "opencode"


def pantheon_project() -> Path | None:
    """Return the Pantheon project root directory.
    
    Resolution priority:
    1. $PANTHEON_PROJECT env var (explicit override)
    2. Current working directory (set by MCP client's cwd in opencode.json)
    
    Returns:
        Absolute Path to the project root, or None if neither is available
        (project-scoped resources like deepwork/memory-bank are unavailable).
    """
    env = os.environ.get("PANTHEON_PROJECT")
    if env:
        return Path(env).expanduser().resolve()

    cwd = os.getcwd()
    if cwd:
        return Path(cwd).resolve()

    return None


def pantheon_venv_python() -> str | None:
    """Return the Python interpreter from the Pantheon venv, if available.
    
    Checks $PANTHEON_HOME/.venv/bin/python3 first, then falls back to
    the system python3. Returns None only if python3 is not found at all.
    """
    for candidate in [
        pantheon_home() / ".venv" / "bin" / "python3",
        Path.home() / ".pantheon" / ".venv" / "bin" / "python3",
    ]:
        if candidate.exists():
            return str(candidate)
    # Fallback: system python3
    import shutil
    return shutil.which("python3")
