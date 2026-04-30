# mythic-agents for Claude Code

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) installed globally:
  ```bash
  npm install -g @anthropic/claude-code
  ```
- Active [Anthropic subscription](https://console.anthropic.com/) with API access
- Git, Node.js 18+, and npm

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/mythic-agents.git
cd mythic-agents
npm install
```

### Auto-configure for Claude Code

```bash
npx scripts/install.mjs claude
```

This copies agent files to `.claude/agents/` and sets up skills and instructions.

### Manual Setup

Copy the agent definitions:

```bash
mkdir -p .claude/agents
cp -r agents/*.md .claude/agents/
```

Copy skills and instructions:

```bash
cp -r skills/ .claude/skills/
cp -r instructions/ .claude/instructions/
```

## Configuration

### Directory Structure

```
.claude/
├── agents/          # Agent definitions (.md files)
├── skills/          # Skill files loaded by agents
└── instructions/    # Custom instructions for agents
```

### Agent Format

Agents use `.md` files with Claude-specific YAML frontmatter:

```yaml
---
name: my-agent
description: Description of the agent
tools: "search_codebase, read, edit, execute"
---
```

## Agent Format Differences from VS Code

| Feature | VS Code (.agent.md) | Claude Code (.md) |
|---|---|---|
| `tools` field | YAML list format | Comma-separated string |
| `handoffs` YAML | Supported | Not supported — uses different orchestration |
| Skills loading | Part of agent definition | Loaded from `.claude/skills/` directory |
| File location | `agents/` directory | `.claude/agents/` directory |

### Example: VS Code vs Claude Code

**VS Code format:**
```yaml
---
name: hermes
tools:
  - search/codebase
  - read/readFile
  - edit/editFiles
---
```

**Claude Code format:**
```yaml
---
name: hermes
tools: "search_codebase, read, edit, execute"
---
```

## Claude Code-Specific Features

### Project Knowledge

Place project-wide context in `.claude/`:

```
.claude/
└── PROJECT.md        # Shared project knowledge
```

Claude Code auto-loads this for every session, similar to VS Code's native memory tier.

### MCP Server Integration

Claude Code supports MCP servers for extending agent capabilities. Configure in `claude.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    }
  }
}
```

### Mode-Based Agent Switching

Use `--mode` to switch agent behavior:

```bash
claude --mode architect   # Athena-style planning
claude --mode implement   # Hermes-style implementation
claude --mode review      # Temis-style code review
```

Define custom modes in `.claude/modes.json`.

## Troubleshooting

| Problem | Solution |
|---|---|
| Agents not found | Verify `.claude/agents/` exists and files have valid frontmatter |
| Tools not available | Check `tools` field uses comma-separated string format |
| Skills not loading | Place skills in `.claude/skills/` directory |
| MCP server errors | Validate `claude.json` syntax and server path |
| Permission denied | Ensure scripts have `+x` permission: `chmod +x scripts/*` |

---

[Main Documentation](../../README.md)
