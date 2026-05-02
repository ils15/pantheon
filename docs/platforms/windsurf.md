# Pantheon for Windsurf

**Status:** ✅ **Production Ready** — Modern rule format (Wave 8+).

## Prerequisites

- [Windsurf IDE](https://codeium.com/windsurf) installed
- Active Windsurf subscription (required for Cascade agent mode)

## Installation

Use the universal install script (auto-detects platform):

```bash
node scripts/install.mjs --target /path/to/your-project
```

### Manual Setup

```bash
git clone https://github.com/anomalyco/Pantheon.git
cd Pantheon
npm install
```

Windsurf uses `.windsurf/` for project-level configuration (adapter v3.0.0):

1. Create `.windsurf/` in your project root
2. Copy Pantheon instruction files into `.windsurf/rules/` as rule `.md` files with frontmatter
3. Place workspace-level `AGENTS.md` files in project directories as needed

## Configuration

### Directory Structure

```
.windsurf/
├── rules/              # Project rules (.md with frontmatter)
└── mcp_config.json     # MCP server configuration
```

> **Note:** The legacy `.windsurf/agents/` format is **deprecated**. All agent configuration now uses `.windsurf/rules/` with Wave 8+ frontmatter format.

## Rule Format (Wave 8+)

Windsurf rules use markdown files with YAML frontmatter in `.windsurf/rules/`:

```markdown
---
trigger: model_decision
description: "Description of when Cascade should load this rule"
globs: "**/*.py"
---
Rule content in markdown...
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `trigger` | Yes | Activation mode (see below) |
| `description` | Yes | Human-readable description of when to apply |
| `globs` | No | File glob pattern for `glob` trigger mode |
| `name` | No | Rule name; required for `manual` trigger (`@rule-name`) |

### Trigger Modes

| Mode | Description |
|------|-------------|
| `always_on` | Applied to every conversation unconditionally |
| `manual` | Only activates when explicitly @-mentioned (e.g., `@rule-name`) |
| `model_decision` | Cascade decides based on the `description` field whether to load the rule |
| `glob` | Auto-activates when the user opens or edits files matching the `globs` pattern |

## AGENTS.md Support

Windsurf auto-discovers `AGENTS.md` files throughout the workspace:

- **Root `AGENTS.md`** — Treated as `always_on`; applied to every conversation
- **Subdirectory `AGENTS.md`** — Auto-scoped to that directory; only active when Cascade context is within that subtree
- **No frontmatter required** — Plain markdown; no YAML headers needed

This provides a lightweight alternative to rules for directory-specific conventions:

```
project/
├── AGENTS.md            # Always-on, workspace-wide
├── src/
│   ├── AGENTS.md        # Auto-scoped to src/ and its children
│   └── api/
│       └── AGENTS.md    # Auto-scoped to src/api/
└── tests/
    └── AGENTS.md        # Auto-scoped to tests/
```

## Rule Scopes

| Scope | Location | Purpose | Character Limit |
|-------|----------|---------|-----------------|
| **Global** | Windsurf Settings UI → Cascade → Custom Instructions | Personal preferences, cross-project standards | 6,000 per rule, 12,000 total |
| **Workspace** | `.windsurf/rules/` | Project-level conventions, team standards | 6,000 per rule, 12,000 total |

- Global rules are set via the Windsurf Settings UI (not files)
- Workspace rules live in `.windsurf/rules/` and use frontmatter
- Total combined character limit across all active rules is 12,000

## AGENTS.md vs Rules

| Feature | AGENTS.md | Rules |
|---------|-----------|-------|
| Location | In project directories | `.windsurf/rules/` or global settings |
| Scoping | Auto based on file location | Manual (glob, always_on, etc.) |
| Format | Plain markdown | Markdown with YAML frontmatter |
| Frontmatter | Not needed | Required (trigger, description) |
| Trigger control | Always-on or auto-scoped | 4 activation modes |
| Best for | Directory-specific conventions | Cross-cutting concerns, complex activation |

## Windsurf-Specific Features

### Cascade Agent Mode

Cascade is Windsurf's default agent mode. It provides:
- Multi-file editing capabilities
- Terminal command execution
- Context-aware code generation
- File system operations

### Windsurf Flow

Flow mode enables step-through execution of agent tasks, allowing you to review and approve each action before it runs. This is useful for validating agent behavior when porting agents from VS Code.

### Tab Completion

Windsurf provides AI-powered tab completions inline, which complement agent-generated code by offering real-time suggestions as you type.

### MCP Support

Windsurf supports MCP (Model Context Protocol) servers. Configure MCP servers in:

```json
.windsurf/mcp_config.json
```

Refer to [MCP documentation](../mcp/README.md) for server configuration details compatible with Windsurf.

## Adapter Compatibility

The Pantheon Windsurf adapter (v3.0.0) handles the following automatically:

- **Rule file generation** — Converts Pantheon instruction files into `.windsurf/rules/` format with proper frontmatter
- **Trigger mapping** — Maps instruction types to appropriate trigger modes
- **AGENTS.md placement** — Optionally generates `AGENTS.md` files for directory scoping
- **Tool name mapping** — Translates VS Code tool names to Windsurf-compatible equivalents

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Rules not applying | Verify `.windsurf/rules/` exists with `.md` files containing valid frontmatter |
| AGENTS.md not discovered | Confirm file is directly in the workspace root or a subdirectory; check file permissions |
| Character limit hit | Consolidate related rules; split content across multiple files if under 6,000 each |
| Rule not triggering | Check `trigger` and `globs` frontmatter — `model_decision` requires a clear `description`; `glob` requires a matching `globs` pattern |
| Frontmatter parsing error | Ensure YAML is valid (no tabs, correct indentation) between `---` delimiters |
| Legacy `.windsurfrules` not working | Migrate to `.windsurf/rules/` format — `.windsurfrules` is being deprecated |

### Known Limitations

- **Cascade naming**: Cascade uses Codeium model identifiers rather than OpenAI/Anthropic model names. Rule `description` fields should reference Cascade-native capabilities.
- **VS Code parity**: Some Pantheon features (handoffs, subagent orchestration) depend on VS Code's agent infrastructure and may not have direct Windsurf equivalents.
- **Tool availability**: Windsurf's tool set differs from VS Code — the adapter's `toolMap` handles common mappings, but verify custom tool references.

### Verification Checklist

- [ ] `.windsurf/rules/` directory exists in project root
- [ ] All rule `.md` files have valid YAML frontmatter with `trigger` and `description`
- [ ] `globs` patterns are correct for `glob`-triggered rules
- [ ] Root `AGENTS.md` exists for workspace-wide conventions
- [ ] Subdirectory `AGENTS.md` files placed for auto-scoped conventions
- [ ] Total rule content under 12,000 character limit

---

[Main Documentation](../../README.md)
