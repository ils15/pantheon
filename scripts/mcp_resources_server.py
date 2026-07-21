#!/usr/bin/env python3
"""Pantheon MCP Resources Server.

Provides MCP resources for the Pantheon agent framework:
- Static resources: agents list, skills list, routing.yml
- Template resources: agent by name, skill by name, deepwork
  plans/status, memory-bank files

Usage:
    python scripts/mcp_resources_server.py
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml
from mcp.server.fastmcp import FastMCP

from _pantheon_paths import pantheon_home, pantheon_project

# ── Path Resolution ──────────────────────────────────────────────────────────
_PANTHEON_HOME: Path = pantheon_home()
_PANTHEON_PROJECT: Path | None = pantheon_project()

# ── FastMCP App ───────────────────────────────────────────────────────────────
mcp = FastMCP(
    "Pantheon Resources",
    instructions="MCP Resources for the Pantheon agent framework. "
    "Access agents, skills, routing configuration, deepwork plans, "
    "and memory-bank files via the pantheon:// URI scheme.",
)

# ── Helpers ───────────────────────────────────────────────────────────────────


def _parse_yaml_frontmatter(filepath: Path) -> dict[str, Any]:
    """Parse YAML frontmatter from a markdown file."""
    content = filepath.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}
    try:
        return dict(yaml.safe_load(match.group(1)) or {})
    except yaml.YAMLError:
        return {}


def _get_role_from_frontmatter(frontmatter: dict[str, Any]) -> str:
    """Extract the role/description string from agent frontmatter."""
    desc = frontmatter.get("description", "")
    if not isinstance(desc, str) or not desc:
        return "Pantheon agent"
    if "—" in desc:
        return desc.split("—")[0].strip()
    return desc


# ── Static Resources ──────────────────────────────────────────────────────────


@mcp.resource(
    "pantheon://agents",
    description="List of all Pantheon agents with roles from YAML frontmatter",
)
async def list_agents() -> str:
    """Return a markdown list of all agents with their roles."""
    agents_dir = _PANTHEON_HOME / "agents"
    if not agents_dir.is_dir():
        return "Agents directory not found."

    agents: list[str] = []
    for f in sorted(agents_dir.iterdir()):
        if f.suffix == ".md" and f.stem.lower() != "readme":
            frontmatter = _parse_yaml_frontmatter(f)
            name = frontmatter.get("name", f.stem)
            role = _get_role_from_frontmatter(frontmatter)
            agents.append(f"- **{name}** — {role}")

    return "\n".join(agents) if agents else "No agents found."


@mcp.resource(
    "pantheon://skills",
    description="List of all Pantheon skills with descriptions",
)
async def list_skills() -> str:
    """Return a markdown list of all skills with descriptions."""
    skills_dir = _PANTHEON_HOME / "skills"
    if not skills_dir.is_dir():
        return "Skills directory not found."

    skills: list[str] = []
    for f in sorted(skills_dir.iterdir()):
        if f.is_dir():
            skill_file = f / "SKILL.md"
            if skill_file.exists():
                frontmatter = _parse_yaml_frontmatter(skill_file)
                name = frontmatter.get("name", f.name)
                desc = frontmatter.get("description", "No description")
                skills.append(f"- **{name}** — {desc}")

    return "\n".join(skills) if skills else "No skills found."


@mcp.resource(
    "pantheon://routing",
    description="Full content of routing.yml (canonical routing source)",
)
async def get_routing() -> str:
    """Return the full content of routing.yml."""
    routing_file = _PANTHEON_HOME / "routing.yml"
    if not routing_file.exists():
        return "routing.yml not found."
    return routing_file.read_text(encoding="utf-8")


# ── Template Resources ────────────────────────────────────────────────────────


@mcp.resource(
    "pantheon://agents/{agent_name}",
    description="Content of an agent file by name (case-insensitive lookup)",
)
async def get_agent(agent_name: str) -> str:
    """Return the full content of an agent file, case-insensitively."""
    agents_dir = _PANTHEON_HOME / "agents"
    name_lower = agent_name.lower()
    for f in agents_dir.iterdir():
        if f.suffix == ".md" and f.stem.lower() == name_lower:
            return f.read_text(encoding="utf-8")
    return f"Agent '{agent_name}' not found."


@mcp.resource(
    "pantheon://deepwork/{slug}",
    description="PLAN.md content for a deepwork task slug",
)
async def get_deepwork_plan(slug: str) -> str:
    """Return PLAN.md content for a deepwork slug."""
    if _PANTHEON_PROJECT is None:
        return f"Deepwork '{slug}' not found. (PANTHEON_PROJECT not set)"
    plan_file = _PANTHEON_PROJECT / ".pantheon" / "deepwork" / slug / "PLAN.md"
    if not plan_file.exists():
        return f"Deepwork '{slug}' not found."
    return plan_file.read_text(encoding="utf-8")


@mcp.resource(
    "pantheon://deepwork/{slug}/status",
    description="STATUS.md content for a deepwork task slug "
    "(or default IN_PROGRESS message if missing)",
)
async def get_deepwork_status(slug: str) -> str:
    """Return STATUS.md content for a deepwork slug, or a default message."""
    if _PANTHEON_PROJECT is None:
        return "STATUS.md not found. (PANTHEON_PROJECT not set)"
    status_file = _PANTHEON_PROJECT / ".pantheon" / "deepwork" / slug / "STATUS.md"
    if not status_file.exists():
        return "STATUS.md not found. Current state: IN PROGRESS"
    return status_file.read_text(encoding="utf-8")


@mcp.resource(
    "pantheon://skills/{name}",
    description="Content of a skill's SKILL.md file by name",
)
async def get_skill(name: str) -> str:
    """Return SKILL.md content for a skill directory."""
    skill_file = _PANTHEON_HOME / "skills" / name / "SKILL.md"
    if not skill_file.exists():
        return f"Skill '{name}' not found."
    return skill_file.read_text(encoding="utf-8")


@mcp.resource(
    "pantheon://memory-bank/{path}",
    description="Content of a .pantheon/memory-bank/ file by relative path "
    "(path traversal blocked).",
)
async def get_memory_bank(path: str) -> str:
    """Return content of a memory-bank file.

    Security: resolves absolute path and verifies it stays within
    .pantheon/memory-bank/ to prevent directory traversal attacks.
    """
    if _PANTHEON_PROJECT is None:
        return "Memory bank not available. (PANTHEON_PROJECT not set)"
    resolved = (_PANTHEON_PROJECT / ".pantheon" / "memory-bank" / path).resolve()
    mb_dir = (_PANTHEON_PROJECT / ".pantheon" / "memory-bank").resolve()

    if not str(resolved).startswith(str(mb_dir)):
        return "Path traversal blocked: access denied."

    if not resolved.exists() or not resolved.is_file():
        return f"File '{path}' not found."

    return resolved.read_text(encoding="utf-8")


# ── Main Entrypoint ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run()
