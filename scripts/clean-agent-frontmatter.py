#!/usr/bin/env python3
"""
Clean YAML frontmatter from Pantheon agent .md files.

Removes fields that OpenCode doesn't recognize (name, tools, skills, handoffs,
agents, user-invocable, globs) from frontmatter and appends them as a
"## Custom Fields" section in the body. Also moves mcpServers to the body.

Valid frontmatter fields (kept as-is):
  description, mode, permission, temperature, steps, color, model,
  hidden, task_budget, source

Usage:
    python3 scripts/clean-agent-frontmatter.py
"""

import os
import shutil
import sys

import yaml

AGENTS_DIR = "/home/ils15/.config/opencode/agents"

# Fields that OpenCode recognizes — these stay in frontmatter
VALID_FIELDS = {
    "description",
    "mode",
    "permission",
    "temperature",
    "steps",
    "color",
    "model",
    "hidden",
    "task_budget",
    "source",
}

# Human-readable names for fields that get moved to the body
REMOVED_FIELD_NAMES = {
    "name": "Name",
    "tools": "Tools",
    "skills": "Skills",
    "handoffs": "Handoffs",
    "agents": "Subagents",
    "user-invocable": "User Invocable",
    "globs": "Globs",
}

# mcpServers gets special treatment (formatted as its own section)
MCP_SERVER_KEY = "mcpServers"


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def _format_simple(value: object) -> str:
    """Render a scalar YAML value as inline text."""
    if value is None:
        return "None"
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return str(value)


def _format_handoff(item: dict) -> str:
    """Format a single handoff entry: 'label → agent'."""
    label = item.get("label", "")
    agent = item.get("agent", "")
    if label:
        return f"- {label} → {agent}"
    return f"- {agent}"


def _format_mcp_server(server: dict) -> str:
    """Format a single mcpServers entry."""
    name = server.get("name", "unknown")
    tools = server.get("tools", [])
    when = server.get("when", "")
    tool_str = ", ".join(tools) if tools else ""
    line = f"- {name}"
    if tool_str:
        line += f": {tool_str}"
    if when:
        line += f" — {when}"
    return line


def _format_dict_value(value: object) -> str:
    """Render an arbitrary YAML value as a markdown block."""
    if isinstance(value, dict):
        parts = []
        for k, v in value.items():
            if isinstance(v, bool):
                parts.append(f"- {k}")
            else:
                parts.append(f"- {k}: {v}")
        return "\n".join(parts) if parts else "(none)"

    if isinstance(value, list):
        if not value:
            return "(none)"
        lines = []
        for item in value:
            if isinstance(item, dict):
                # Handoff-style entries
                if "label" in item and "agent" in item:
                    lines.append(_format_handoff(item))
                elif "name" in item:
                    # mcpServers-style (shouldn't reach here, but handle safely)
                    lines.append(_format_mcp_server(item))
                else:
                    # Generic dict inline
                    parts = ", ".join(
                        f"{k}: {v}" for k, v in item.items()
                    )
                    lines.append(f"- {parts}")
            else:
                lines.append(f"- {item}")
        return "\n".join(lines)

    # Scalar
    return _format_simple(value)


# ---------------------------------------------------------------------------
# Core processing
# ---------------------------------------------------------------------------

def process_file(filepath: str) -> dict | tuple[None, str]:
    """
    Read, transform, and write a single agent .md file.

    Returns a dict with summary keys on success, or (None, error_msg) on failure.
    """
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    if not content.startswith("---"):
        return None, "No YAML frontmatter (file doesn't start with '---')"

    # Locate the closing '---' delimiter
    second_delim = content.find("---", 3)
    if second_delim == -1:
        return None, "No closing '---' found for frontmatter"

    yaml_text = content[3:second_delim].strip()
    body = content[second_delim + 3 :]  # everything after '---'

    # Parse YAML
    try:
        data = yaml.safe_load(yaml_text)
    except yaml.YAMLError as e:
        return None, f"YAML parse error: {e}"

    if not isinstance(data, dict):
        return None, "Frontmatter content is not a mapping"

    # Separate fields
    keep: dict[str, object] = {}
    removed: dict[str, object] = {}

    for key, value in data.items():
        if key in VALID_FIELDS:
            keep[key] = value
        else:
            removed[key] = value

    # Build new frontmatter (only keep fields)
    new_yaml = yaml.dump(
        keep, default_flow_style=False, allow_unicode=True, sort_keys=False
    ).strip()
    new_frontmatter = f"---\n{new_yaml}\n---"

    # Build "## Custom Fields" body section
    body_sections: list[str] = []
    mcp_servers = None

    for key, value in list(removed.items()):
        if key == MCP_SERVER_KEY:
            mcp_servers = value
            continue
        display_name = REMOVED_FIELD_NAMES.get(
            key, key.replace("-", " ").replace("_", " ").title()
        )
        formatted = _format_dict_value(value)
        body_sections.append(f"### {display_name}\n{formatted}")

    # MCP Servers as a dedicated section
    if mcp_servers is not None:
        if isinstance(mcp_servers, list):
            lines = [
                _format_mcp_server(srv) for srv in mcp_servers
            ]
            formatted_mcp = "\n".join(lines) if lines else "(none)"
        else:
            formatted_mcp = str(mcp_servers)
        body_sections.append(f"### MCP Servers\n{formatted_mcp}")

    # Assemble final content
    cleaned_body = body.lstrip("\n")

    if body_sections:
        custom_block = "\n\n".join(body_sections)
        new_body = f"\n\n## Custom Fields\n\n{custom_block}\n\n{cleaned_body}"
    else:
        new_body = f"\n{cleaned_body}"

    final_content = new_frontmatter + new_body

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(final_content)

    return {
        "keep": sorted(keep.keys()),
        "removed": sorted(k for k in removed if k != MCP_SERVER_KEY),
        "has_mcp": mcp_servers is not None,
        "has_custom_section": bool(body_sections),
    }


# ---------------------------------------------------------------------------
# Main entrypoint
# ---------------------------------------------------------------------------

def main() -> None:
    md_files = sorted(
        f for f in os.listdir(AGENTS_DIR) if f.endswith(".md")
    )
    print(f"Found {len(md_files)} agent .md files in {AGENTS_DIR}\n")

    rows: list[tuple[str, str, str, str, str]] = []

    for filename in md_files:
        filepath = os.path.join(AGENTS_DIR, filename)

        # --- Backup ---
        bak_path = filepath + ".bak"
        try:
            shutil.copy2(filepath, bak_path)
            backup_created = "Y"
        except OSError as e:
            print(f"  ❌  {filename}: backup failed — {e}", file=sys.stderr)
            backup_created = "N"

        # --- Process ---
        result = process_file(filepath)
        if result is None:
            print(f"  ⚠️  {filename}: skipped ({result})")
            rows.append((filename, "SKIPPED", "—", "—", backup_created))
            continue

        fields_removed = ", ".join(result["removed"]) if result["removed"] else "(none)"
        fields_kept = ", ".join(result["keep"]) if result["keep"] else "(none)"
        body_section = "Y" if result["has_custom_section"] else "N"

        rows.append(
            (filename, fields_removed, fields_kept, body_section, backup_created)
        )
        print(f"  ✅  {filename}")

    # --- Summary table ---
    col_w = [22, 48, 38, 6, 8]
    sep = "=" * sum(col_w)

    print(f"\n{sep}")
    header = (
        f"{'Filename':<{col_w[0]}} "
        f"{'Fields Removed':<{col_w[1]}} "
        f"{'Fields Kept':<{col_w[2]}} "
        f"{'Body':<{col_w[3]}} "
        f"{'Backup':<{col_w[4]}}"
    )
    print(header)
    print(sep)

    for filename, removed, kept, body, backup in rows:
        print(
            f"{filename:<{col_w[0]}} "
            f"{removed:<{col_w[1]}} "
            f"{kept:<{col_w[2]}} "
            f"{body:<{col_w[3]}} "
            f"{backup:<{col_w[4]}}"
        )

    print(sep)
    print(f"\nProcessed {len(rows)} files. Backups saved as *.bak alongside originals.")
    print("Run: diff <original>.bak <original>.md to review changes per file.")


if __name__ == "__main__":
    main()
