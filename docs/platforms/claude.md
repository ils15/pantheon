# Pantheon for Claude Code

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) installed globally:
  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  ```
- Active [Anthropic subscription](https://console.anthropic.com/) with API access
- Git, Node.js 18+, and npm

## Installation

The fastest way to set up Pantheon is with the universal install script:

```bash
node scripts/install.mjs --target /path/to/your-project
```

This auto-detects the platform and installs agents, config files, and instructions.

### Manual Setup

Clone the repository:

```bash
git clone https://github.com/ils15/pantheon.git
```

Copy the pre-generated Claude Code agents into your project:

```bash
mkdir -p .claude/agents
cp -r pantheon/platform/claude/agents/. .claude/agents/
```

Copy skills and instructions:

```bash
cp -r skills/ .claude/skills/
cp -r instructions/ .claude/instructions/
```

The Claude Code adapter (v2.0.0) maps canonical VS Code tool names to native Claude Code tools (`Agent`, `Read`, `Edit`, `Bash`, etc.) and excludes browser tools not available in Claude.

## Configuration

### Directory Structure

```
.claude/
├── agents/          # Agent definitions (.md files)
├── skills/          # Skill files loaded by agents
├── commands/        # Custom commands (legacy, merged into skills)
├── rules/           # Path-scoped instruction rules
└── CLAUDE.md        # Shared project knowledge
```

### Agent Format (Frontmatter Reference)

Agents use `.md` files with YAML frontmatter. Claude Code now supports 16+ frontmatter fields:

```yaml
---
name: hermes
description: Backend specialist for FastAPI, Python, async. PROACTIVELY called for API work.
tools: Agent, Grep, Read, Edit, Bash
---
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Unique identifier using lowercase letters and hyphens |
| `description` | string | Yes | When Claude should delegate; include "PROACTIVELY" for auto-invocation |
| `tools` | string | No | Comma-separated tool allowlist (`Agent`, `Read`, `Edit`, `Bash`, `Glob`, `Grep`, `WebFetch`, `AskUserQuestion`). Inherits all if omitted |
| `disallowedTools` | string[] | No | **NEW:** Explicitly forbidden tools, removed from inherited or specified list |
| `model` | string | No | **NEW:** Model alias (`haiku`, `sonnet`, `opus`), full model ID (e.g. `claude-opus-4-7`), or `inherit`. Default: `inherit` |
| `permissionMode` | string | No | **NEW:** Permission level: `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | number | No | **NEW:** Maximum agentic turns before forced stop |
| `skills` | string[] | No | **NEW:** Skills to preload into subagent context at startup |
| `mcpServers` | string[] | No | **NEW:** MCP servers available to this agent (inline definition or name reference) |
| `hooks` | object | No | **NEW:** Agent-specific lifecycle hooks (`PreToolUse`, `PostToolUse`, `Stop`) |
| `memory` | string | No | **NEW:** Persistent memory scope: `user`, `project`, or `local` |
| `background` | boolean | No | **NEW:** Always run as background task. Default: `false` |
| `effort` | string | No | **NEW:** Cognitive effort: `low`, `medium`, `high`, `xhigh`, `max` |
| `isolation` | string | No | **NEW:** Set to `worktree` for isolated Git worktree environment |
| `initialPrompt` | string | No | **NEW:** Auto-submitted as first user turn when agent runs via `--agent` |
| `color` | string | No | **NEW:** Display color in statusline: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan` |

### Agent Priority System

Claude Code resolves agent definitions by location with the following priority:

| Location | Scope | Priority |
|---|---|---|
| Managed settings | Organization-wide | 1 (highest) |
| `--agents` CLI flag | Current session | 2 |
| `.claude/agents/` | Current project | 3 |
| `~/.claude/agents/` | All your projects | 4 |
| Plugin's `agents/` directory | Where plugin is enabled | 5 |

When multiple agents share the same name, the higher-priority location wins. Project agents are discovered by walking up from the current working directory. Use `claude agents` to list all configured agents from the command line.

### The `/agents` Command

Claude Code provides an interactive `/agents` command to manage subagents:

- **Running tab**: Shows live subagents with controls to open or stop them
- **Library tab**: View all available agents (built-in, user, project, plugin)
  - Create new agents with guided setup or Claude generation
  - Edit existing agent configurations and tool access
  - Delete custom agents
  - See which agents are active when duplicates exist

To list agents from the CLI without starting a session:

```bash
claude agents
```

## Agent Format Differences from VS Code

| Feature | VS Code (.agent.md) | Claude Code (.md, adapter v2.0.0) |
|---|---|---|
| `tools` field | YAML list, VS Code tool names | Comma-separated string, **Claude-native names** (`Read`, `Edit`, `Bash`, etc.) |
| `handoffs` YAML | Supported | Not supported — uses different orchestration |
| `mode` field | Not supported | **Added** — `plan`, `implement`, `review` |
| Browser tools | `openBrowserPage`, etc. | **Excluded** — not available in Claude |
| Skills loading | Part of agent definition | Loaded from `.claude/skills/` directory |
| File location | `agents/` directory | `.claude/agents/` directory |
| Frontmatter fields | ~5 basic fields | **16+ fields** including `model`, `memory`, `hooks`, `mcpServers`, `skills`, `permissionMode`, `isolation`, `effort`, `color`, `background`, `initialPrompt`, `disallowedTools` |

### Example: VS Code vs Claude Code

**VS Code format (canonical):**
```yaml
---
name: hermes
tools:
  - agent
  - search/codebase
  - search/usages
  - read/readFile
  - edit/editFiles
  - execute/runInTerminal
  - execute/testFailure
  - execute/getTerminalOutput
  - search/changes
  - web/fetch
---
```

**Claude Code format (generated by `npm run sync`, adapter v2.0.0):**
```yaml
---
name: hermes
tools: "Agent, AskUserQuestion, Read, Edit, Bash, Glob, Grep, WebFetch"
---
```

## Claude Code-Specific Features

### Project Knowledge

Place project-wide context in `.claude/`:

```
.claude/
└── CLAUDE.md        # Shared project knowledge (auto-loaded every session)
```

Claude Code also supports auto memory at `~/.claude/projects/<project>/memory/` for cross-session learnings that Claude writes itself.

### Skills with `context: fork`

Skills can run in a forked subagent context, giving them an isolated environment:

```yaml
---
name: deep-research
description: Research a topic thoroughly in an isolated context
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly using codebase exploration tools.
```

Key fields for forked skills:

| Field | Type | Description |
|---|---|---|
| `context` | string | Set to `fork` to run in a forked subagent context |
| `agent` | string | Subagent type to use: `Explore`, `Plan`, `general-purpose`, or any custom agent |

When `context: fork` is set, the skill content becomes the prompt for the subagent. The subagent inherits the model, tools, and permissions from the specified agent type. Results are summarized and returned to the main conversation.

### MCP Server Integration

Claude Code supports MCP servers for extending agent capabilities in three ways:

**Option 1: Remote HTTP server (recommended)**
```bash
claude mcp add --transport http <name> <url>
```

**Option 2: Remote SSE server** (deprecated, prefer HTTP)
```bash
claude mcp add --transport sse <name> <url>
```

**Option 3: Local stdio server**
```bash
claude mcp add --transport stdio <name> -- npx -y <package>
```

**Managing servers:**
```bash
claude mcp list       # List all configured servers
claude mcp get <name> # Get server details
claude mcp remove     # Remove a server
/mcp                  # In-session server management
```

**Installation scopes:**
| Scope | Loads in | Shared | Stored in |
|---|---|---|---|
| Local (default) | Current project only | No | `~/.claude.json` |
| Project | Current project only | Yes (via VCS) | `.mcp.json` |
| User | All your projects | No | `~/.claude.json` |

**Per-agent MCP scoping:** Use the `mcpServers` frontmatter field to scope servers to specific agents:
```yaml
---
name: browser-tester
description: Tests features with Playwright
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
---
```

### Model Recommendations

| Agent type | Recommended model | Use case |
|---|---|---|
| Exploration | `haiku` | Fast codebase search, file discovery, quick lookups |
| Code review | `sonnet` | Quality checks, security audits, balanced analysis |
| Architecture | `opus` | Deep reasoning, complex planning, critical decisions |

Set the model per-agent in frontmatter:
```yaml
---
name: explorer
model: haiku
---
```

### Mode-Based Agent Switching

```bash
claude --mode architect   # Athena-style planning
claude --mode implement   # Hermes-style implementation
claude --mode review      # Temis-style code review
```

Define custom modes in `.claude/modes.json`.

### Claude Agent SDK

The Claude Agent SDK (Python + TypeScript) lets you programmatically create agents with the same tools that power Claude Code:

**Python:**
```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Find and fix the bug in auth.py",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
):
    print(message)
```

**TypeScript:**
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.ts",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  console.log(message);
}
```

Key features: built-in tools (Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch), MCP server integration, subagent spawning, hooks, session management, and permission controls.

Install:
```bash
npm install @anthropic-ai/claude-agent-sdk  # TypeScript
pip install claude-agent-sdk                 # Python
```

### CLI-Based Agent Definition

Pass agents as JSON via the `--agents` flag for session-only use:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

## Troubleshooting

| Problem | Solution |
|---|---|
| Agents not found | Verify `.claude/agents/` exists and files have valid frontmatter. Check the priority system: managed > `--agents` > `.claude/agents/` > `~/.claude/agents/` > plugin |
| Agent priority confusion | Check all agent locations. `--agents` flag overrides project agents; managed settings override everything |
| Tools not available | Check `tools` field uses comma-separated string with Claude-native names (`Agent`, `Read`, `Edit`, `Bash`, `Glob`, `Grep`, `WebFetch`, `AskUserQuestion`). Use `disallowedTools` to block specific tools |
| Skills not loading | Verify path in `.claude/skills/<name>/SKILL.md`. Skills use `context: fork` for isolated execution. Use `/agents` to reload |
| Skills not triggering | Check `description` includes keywords users naturally say. Add "PROACTIVELY" to encourage auto-invocation. Verify skill appears in "What skills are available?" |
| Permission issues | Check `permissionMode` in agent frontmatter: `default` (prompts), `acceptEdits` (auto-approve edits), `auto` (classifier-based), `bypassPermissions` (skip all prompts) |
| MCP server errors | Validate `claude.json` or `.mcp.json` syntax and server path. Use `/mcp` in-session for diagnostic status. Check server scope (local/project/user) |
| Permission denied | Ensure scripts have `+x` permission: `chmod +x scripts/*` |
| Subagent not spawning | Subagents cannot spawn other subagents. Use skills with `context: fork` for nested isolation |
| Memory not persisting | Set `memory` field in frontmatter: `user` (~/.claude/agent-memory/), `project` (.claude/agent-memory/), or `local` (.claude/agent-memory-local/) |

---

[Main Documentation](../../README.md)
