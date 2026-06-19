#!/usr/bin/env python3
"""Validate all OpenCode agent .md files for correct frontmatter."""

import sys
import yaml
from pathlib import Path

VALID_FIELDS = {
    "description", "mode", "permission", "temperature",
    "steps", "color", "hidden", "task_budget", "source",
}
VALID_MODES = {"primary", "subagent"}
VALID_PERMISSION_KEYS = {
    "edit", "bash", "task", "skill", "read", "glob",
    "grep", "webfetch", "websearch", "question", "lsp",
}
VALID_PERMISSION_VALUES = {"allow", "deny", "ask"}

AGENT_DIRS = [
    Path("/home/ils15/pantheon/platform/opencode/agents"),
    Path("/home/ils15/.config/opencode/agents"),
]

errors = []
warnings = []
valid_count = 0


def err(filename, field, msg):
    errors.append(f"❌ [{filename}] {field}: {msg}")


def warn(filename, field, msg):
    warnings.append(f"⚠️  [{filename}] {field}: {msg}")


def validate_permission_value(val, path_ctx, filename):
    if isinstance(val, str):
        if val not in VALID_PERMISSION_VALUES:
            err(filename, f"permission.{path_ctx}",
                f"invalid value '{val}'; must be one of {sorted(VALID_PERMISSION_VALUES)}")
    elif isinstance(val, dict):
        for key, subval in val.items():
            validate_permission_value(subval, f"{path_ctx}.{key}", filename)
    else:
        err(filename, f"permission.{path_ctx}",
            f"unexpected type '{type(val).__name__}'; expected string or dict")


def validate_file(filepath):
    global valid_count
    filename = filepath.name
    text = filepath.read_text(encoding="utf-8")

    if not text.startswith("---"):
        err(filename, "frontmatter", "file does not start with '---'")
        return

    parts = text.split("---")
    if len(parts) < 3:
        err(filename, "frontmatter", "missing closing '---' delimiter")
        return

    raw_yaml = parts[1]
    try:
        data = yaml.safe_load(raw_yaml)
    except yaml.YAMLError as e:
        err(filename, "frontmatter", f"YAML parse error: {e}")
        return

    if not isinstance(data, dict):
        err(filename, "frontmatter", "frontmatter is not a mapping")
        return

    # Check for unknown fields
    unknown = set(data.keys()) - VALID_FIELDS
    for field in sorted(unknown):
        err(filename, field, f"unknown field '{field}'; valid: {sorted(VALID_FIELDS)}")

    # description: must be present
    if "description" not in data:
        err(filename, "description", "description field is required")
    elif not isinstance(data["description"], str) or not data["description"].strip():
        err(filename, "description", "must be a non-empty string")

    # mode: must be present and valid
    if "mode" not in data:
        err(filename, "mode", "mode field is required")
    elif data["mode"] not in VALID_MODES:
        err(filename, "mode",
            f"invalid value '{data['mode']}'; must be one of {sorted(VALID_MODES)}")

    # permission: validate keys and values
    if "permission" in data:
        perm = data["permission"]
        if isinstance(perm, dict):
            for key in perm:
                if key not in VALID_PERMISSION_KEYS:
                    err(filename, f"permission.{key}",
                        f"invalid permission key '{key}'; valid: {sorted(VALID_PERMISSION_KEYS)}")
                validate_permission_value(perm[key], key, filename)
        else:
            err(filename, "permission",
                f"unexpected type '{type(perm).__name__}'; expected mapping")

    # temperature: between 0.0 and 2.0
    if "temperature" in data:
        t = data["temperature"]
        if not isinstance(t, (int, float)):
            err(filename, "temperature",
                f"expected a number, got '{type(t).__name__}'")
        elif t < 0.0 or t > 2.0:
            err(filename, "temperature",
                f"value {t} is out of range [0.0, 2.0]")

    # steps: must be a positive integer
    if "steps" in data:
        s = data["steps"]
        if not isinstance(s, int) or isinstance(s, bool):
            err(filename, "steps",
                f"expected a positive integer, got '{type(s).__name__}'")
        elif s < 1:
            err(filename, "steps", f"value {s} is not a positive integer")

    # Body content checks
    body = "---".join(parts[2:])

    bash_value = None
    if isinstance(data.get("permission"), dict):
        bash_value = data["permission"].get("bash")

    if bash_value == "deny":
        if "⛔ TOOLS NOT AVAILABLE" not in body:
            err(filename, "body",
                "permission.bash is 'deny' but body is missing '## ⛔ TOOLS NOT AVAILABLE' section")
        elif "bash" not in body.split("⛔ TOOLS NOT AVAILABLE")[1].split("\n")[0:20]:
            warn(filename, "body",
                 "permission.bash is 'deny' but 'bash' may not be listed as unavailable in the section")

    edit_value = None
    if isinstance(data.get("permission"), dict):
        edit_value = data["permission"].get("edit")

    if edit_value == "deny":
        edit_mentions = body.lower().count("edit")
        if edit_mentions > 0:
            warn(filename, "body",
                 f"permission.edit is 'deny' but 'edit' appears {edit_mentions} time(s) in body")

    valid_count += 1


def main():
    all_files = []
    for d in AGENT_DIRS:
        if not d.exists():
            print(f"⚠️  Config error: directory not found: {d}", file=sys.stderr)
            sys.exit(2)
        all_files.extend(sorted(d.glob("*.md")))

    if not all_files:
        print("⚠️  Config error: no agent .md files found", file=sys.stderr)
        sys.exit(2)

    for f in all_files:
        validate_file(f)

    for msg in errors:
        print(msg, file=sys.stderr)
    for msg in warnings:
        print(msg, file=sys.stderr)

    print(
        f"✅ {valid_count} files valid, "
        f"{len(warnings)} warnings, "
        f"{len(errors)} errors"
    )

    if errors:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
