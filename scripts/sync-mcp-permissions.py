#!/usr/bin/env python3
"""Auto-propagate MCP permissions to all agent files from .pantheon/mcp-registry.yml.

Usage:
    python3 scripts/sync-mcp-permissions.py              # apply to canonical agents
    python3 scripts/sync-mcp-permissions.py --platforms   # apply to all platform copies
    python3 scripts/sync-mcp-permissions.py --dry-run     # preview only
"""

from __future__ import annotations

import sys
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY_FILE = ROOT / ".pantheon" / "mcp-registry.yml"
AGENTS_DIR = ROOT / "agents"
PLATFORM_DIRS = [
    ROOT / ".claude" / "agents",
    ROOT / "platform" / "claude" / "agents",
    ROOT / "platform" / "opencode" / "agents",
    ROOT / ".clinerules",
    ROOT / ".windsurf" / "rules",
    ROOT / ".cursor" / "rules",
    ROOT / ".continue" / "rules",
]


def load_registry() -> dict:
    with open(REGISTRY_FILE) as f:
        return yaml.safe_load(f)


def get_agent_files(platforms: bool = False) -> list[Path]:
    files = list(AGENTS_DIR.glob("*.agent.md"))
    if platforms:
        for d in PLATFORM_DIRS:
            if d.exists():
                files.extend(d.glob("*.md") if "agents" in str(d) else d.glob("*"))
                files.extend(d.glob("*.mdc"))
    return files


def _line_idx(content: str, pos: int) -> int:
    """Convert character position to 0-based line index."""
    return content[:pos].count("\n")


def _perm_line(filepath: Path) -> tuple[str, str] | None:
    """Detect permission section format: YAML dict or inline list."""
    with open(filepath) as f:
        first = f.read(200)
    if "permission:" in first:
        return ("yaml", "  \"{mcp}_*\": {level}")
    # Could add inline format detection here
    return ("yaml", "  \"{mcp}_*\": {level}")


def update_permissions(filepath: Path, registry: dict, dry_run: bool = False) -> bool:
    with open(filepath) as f:
        lines = f.readlines()
    
    agent_name = filepath.stem.split(".")[0]
    perm_start_line = None
    perm_end_line = None
    last_mcp_line = None
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped == "permission:":
            perm_start_line = i
        elif perm_start_line is not None and stripped.startswith("tools:"):
            perm_end_line = i
            break
        elif perm_start_line is not None and stripped.startswith("skills:"):
            perm_end_line = i
            break
        elif perm_start_line is not None and stripped.startswith("---"):
            perm_end_line = i
            break
        elif perm_start_line is not None and (stripped.startswith('"pantheon-') or stripped.startswith("'pantheon-")):
            last_mcp_line = i
    
    if perm_start_line is None:
        return False
    
    if perm_end_line is None:
        perm_end_line = len(lines)
    
    # Build set of MCPs this agent should have (from registry)
    agent_mcps = set()
    for mcp_name, mcp_config in registry.get("mcps", {}).items():
        if agent_name in mcp_config.get("agents", []):
            agent_mcps.add(mcp_name)
    
    changed = False
    
    # For each MCP in the permission section, check if it should be there
    perm_section_lines = set()
    mcp_keys_in_file = {}
    for i in range(perm_start_line + 1, perm_end_line):
        line = lines[i]
        stripped = line.strip()
        if stripped.startswith('"pantheon-') or stripped.startswith("'pantheon-"):
            mcp_name = stripped.split('"')[1] if '"' in stripped else stripped.split("'")[1]
            mcp_name = mcp_name.replace("_*", "")
            perm_section_lines.add(i)
            mcp_keys_in_file[mcp_name] = i
    
    # Remove MCPS that agent should NOT have
    for mcp_name, line_idx in mcp_keys_in_file.items():
        if mcp_name not in agent_mcps:
            indent = lines[line_idx][:len(lines[line_idx]) - len(lines[line_idx].lstrip())]
            if not dry_run:
                lines[line_idx] = None  # mark for deletion
            changed = True
            print(f"  ➖ {agent_name}: removed {mcp_name}_*")
    
    # Add MCPS that agent SHOULD have but doesn't
    for mcp_name in sorted(agent_mcps):
        if mcp_name not in mcp_keys_in_file:
            mcp_config = registry["mcps"][mcp_name]
            perm_key = f'"{mcp_name}_*"'
            
            # Insert after the last MCP permission line, or after "permission:" line
            insert_after = last_mcp_line if last_mcp_line is not None else perm_start_line
            indent = "  "  # default indent for YAML
            if insert_after is not None and insert_after > 0 and insert_after < len(lines) and lines[insert_after] is not None:
                indent = lines[insert_after][:len(lines[insert_after]) - len(lines[insert_after].lstrip())]
            
            new_line = f'{indent}{perm_key}: {mcp_config["permission"]}\n'
            if not dry_run:
                lines.insert(insert_after + 1, new_line)
            changed = True
            last_mcp_line = insert_after + 1
            print(f"  ➕ {agent_name}: added {mcp_name}_* ({mcp_config['permission']})")
    
    # Remove None placeholders
    lines = [l for l in lines if l is not None]
    
    if changed and not dry_run:
        with open(filepath, "w") as f:
            f.writelines(lines)
    
    return changed


def main():
    dry_run = "--dry-run" in sys.argv
    platforms = "--platforms" in sys.argv
    
    registry = load_registry()
    files = get_agent_files(platforms)
    
    changed = 0
    for f in files:
        if update_permissions(f, registry, dry_run):
            changed += 1
    
    print(f"\n✅ {changed} files updated ({'dry run' if dry_run else 'live'})")


if __name__ == "__main__":
    main()
