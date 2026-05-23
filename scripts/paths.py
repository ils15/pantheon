"""
Pantheon XDG Path Utilities — XDG Base Directory compliant path resolution.

Usage:
    from paths import xdg_config_home, plans_dir

Per the XDG Base Directory spec (XDG_CONFIG_HOME, XDG_DATA_HOME, XDG_STATE_HOME, XDG_CACHE_HOME).
All fallback to their spec defaults when the env var is unset.
"""

import os
from pathlib import Path


def _from_env(var: str, default: str) -> Path:
    return Path(os.environ.get(var, os.path.expanduser(default)))


def xdg_config_home() -> Path:
    """~/.config/ or $XDG_CONFIG_HOME"""
    return _from_env("XDG_CONFIG_HOME", "~/.config")


def xdg_data_home() -> Path:
    """~/.local/share/ or $XDG_DATA_HOME"""
    return _from_env("XDG_DATA_HOME", "~/.local/share")


def xdg_state_home() -> Path:
    """~/.local/state/ or $XDG_STATE_HOME"""
    return _from_env("XDG_STATE_HOME", "~/.local/state")


def xdg_cache_home() -> Path:
    """~/.cache/ or $XDG_CACHE_HOME"""
    return _from_env("XDG_CACHE_HOME", "~/.cache")


def opencode_config_dir() -> Path:
    """$XDG_CONFIG_HOME/opencode"""
    return xdg_config_home() / "opencode"


def opencode_plans_dir() -> Path:
    """$XDG_CONFIG_HOME/opencode/platform/plans"""
    return opencode_config_dir() / "platform" / "plans"


def opencode_data_dir() -> Path:
    """$XDG_DATA_HOME/opencode"""
    return xdg_data_home() / "opencode"


def opencode_sync_repo_dir() -> Path:
    """$XDG_DATA_HOME/opencode/opencode-synced/repo"""
    return opencode_data_dir() / "opencode-synced" / "repo"


def pantheon_log_dir() -> Path:
    """$XDG_STATE_HOME/pantheon/logs"""
    return xdg_state_home() / "pantheon" / "logs"
