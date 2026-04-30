# Claude Code Platform

## Installation

```bash
node scripts/install.mjs claude
```

This copies the generated agents to `.claude/agents/` in the user's project.

## Format Notes

Claude Code expects:
- Files in `.claude/agents/` with `.md` extension
- YAML frontmatter with `name`, `description`, `tools` (comma-separated string)
- Tool names are comma-separated (not YAML arrays)

## Agent Config for Claude

Claude also supports a `.claude/settings.json` for global agent configuration:

```json
{
  "agents": {
    "pantheon": {
      "instructions": "../../AGENTS.md"
    }
  }
}
```
