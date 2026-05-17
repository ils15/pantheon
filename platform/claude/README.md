# Claude Code Platform

## Overview
Brief description of Claude Code platform support in Pantheon.

## Status
✅ **Production Ready** — All 17 agents supported with Claude-specific frontmatter.

## Installation
```bash
node scripts/install.mjs --target /path/to/your-project
```
This installs agents to `.claude/agents/`, skills to `.claude/skills/`, and instructions.

## Agent Format
Claude Code agents use `.md` files with comma-separated tools. The sync engine (in `scripts/sync-platforms.mjs`) converts from canonical format using adapter v2.1.0.

### Frontmatter Fields
| Field | Example | Notes |
|---|---|---|
| `name` | `hermes` | Agent identifier |
| `description` | "Backend specialist..." | Include PROACTIVELY for auto-invocation |
| `tools` | `"Read, Edit, Bash, Glob, Grep"` | Comma-separated string |
| `model` | `sonnet` | `haiku`/`sonnet`/`opus` or full model ID |
| `skills` | `["fastapi-async-patterns", "api-design-patterns"]` | Preloaded skills |
| `mcpServers` | `["filesystem"]` | MCP servers available to agent |

### Tool Mapping
The adapter maps canonical tools to Claude-native names:
| Canonical Tool | Claude Code Tool |
|---|---|
| `agent` | `Agent` |
| `vscode/askQuestions` | `AskUserQuestion` |
| `read/readFile` | `Read` |
| `edit/editFiles` | `Edit` |
| `execute/runInTerminal` | `Bash` |
| `search/codebase` | `Grep` |
| `search/fileSearch` | `Glob` |
| `web/fetch` | `WebFetch` |

### Adapter Configuration
Located at `platform/claude/adapter.json` (v2.1.0):
- Transforms tools from YAML list to comma-separated string
- Maps VS Code tool names to Claude-native names
- Filters out browser tools not available in Claude
- Excludes VS Code-specific frontmatter fields

### Generated Files
The `npm run sync` command generates `.md` files in `platform/claude/agents/` from the canonical `.agent.md` sources.
