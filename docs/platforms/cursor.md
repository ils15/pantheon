# mythic-agents for Cursor

Complete setup and usage guide for running mythic-agents in [Cursor](https://cursor.com) — the AI-native code editor.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Cursor IDE** installed | Download from [cursor.com](https://cursor.com) |
| **Cursor Pro** subscription | Required for AI features including Agent mode |
| **Node.js 18+** | Only needed for the sync engine (`npm run sync`) and installer script |
| **Git** | Any recent version |

---

## Installation

```bash
# Clone the repo
git clone https://github.com/ils15/mythic-agents.git
cd mythic-agents
npm install

# Auto-configure for Cursor
node scripts/install.mjs cursor
```

The installer copies generated `.mdc` rule files from `platform/cursor/rules/` to `.cursor/rules/` in your project root.

### What Gets Installed

```
your-project/
└── .cursor/
    └── rules/
        ├── zeus.mdc
        ├── athena.mdc
        ├── apollo.mdc
        ├── hermes.mdc
        ├── aphrodite.mdc
        ├── maat.mdc
        ├── temis.mdc
        ├── ra.mdc
        ├── iris.mdc
        ├── mnemosyne.mdc
        ├── talos.mdc
        └── gaia.mdc
```

### Manual Installation

If you prefer to copy manually:

```bash
cp -r platform/cursor/rules/*.mdc .cursor/rules/
```

---

## Configuration

### Rules Directory

Cursor loads agents from `.cursor/rules/` at your project root. Each `.mdc` file is a **rule** that Cursor makes available as an `@agent` mention.

No additional configuration files are needed — rules in `.cursor/rules/` are auto-discovered.

### Model Configuration

Model selection is configured per-agent in Cursor's **Settings → Models**. Unlike VS Code where model is specified in agent frontmatter, Cursor handles model routing through its own settings UI.

To assign models per agent:
1. Open Cursor Settings (`Ctrl+Shift+J`)
2. Navigate to **Models** section
3. Assign preferred models for each agent invocation pattern

### Cursor Rules Settings

For additional control, create a `.cursorrules` file (deprecated) or use `rules/` with `globs` in `.mdc` frontmatter:

```yaml
---
name: hermes
description: "Backend specialist — FastAPI, Python, async, TDD"
globs: "**/*.py"
---
```

The `globs` field limits when the rule/agent is active to matching file patterns.

---

## Agent Format

Cursor uses `.mdc` (Markdown Cursor) files as agent definitions. The sync engine (`npm run sync`) converts canonical VS Code `.agent.md` files into Cursor's `.mdc` format automatically.

### Basic Structure

```yaml
---
name: zeus
description: "Central orchestrator — delegates to specialized agents"
---
> This is an AI agent definition for Cursor. Use @<name> to invoke this agent.

[agent body content...]
```

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Agent identifier — use `@name` to invoke |
| `description` | Yes | Shown in agent autocomplete |
| `globs` | No | File globs that activate this rule automatically |

### What Gets Stripped

The Cursor adapter strips these VS Code frontmatter fields during conversion:
- `model` — Cursor handles models in its own settings
- `tools` — Not supported in `.mdc` frontmatter
- `handoffs` — Cursor uses native subagent delegation instead
- `skills` — Not supported
- `instructions` — Not supported
- `agents` — Not supported
- `argument-hint` — Not used by Cursor
- `user-invocable` — Not used by Cursor

### Adapter Configuration

The conversion rules are defined in `platform/cursor/adapter.json`:

```json
{
  "name": "cursor",
  "displayName": "Cursor",
  "outputDir": "rules",
  "fileExtension": ".mdc",
  "frontmatter": {
    "include": ["name", "description"],
    "exclude": ["model", "tools", "skills", "handoffs", "agents", "disable-model-invocation"]
  },
  "bodyFilters": [
    {
      "action": "prepend",
      "content": "> This is an AI agent definition for Cursor. Use @<name> to invoke this agent."
    }
  ]
}
```

---

## Cursor-Specific Features

### Cursor Agent Mode

Cursor's **Agent mode** (`Ctrl+Shift+I` or `Cmd+Shift+I`) is the primary interface for invoking mythic-agents. Use `@agent-name` followed by your task:

```
@zeus: Implement JWT authentication for the API
@hermes: Create a FastAPI endpoint for user registration
@temis: Review the auth router for security issues
```

### Agent Autocomplete

Type `@` in the chat input to see all available agents. The `description` field from each `.mdc` file is shown in the autocomplete dropdown.

### Cursor Tab Autocomplete

Cursor's Tab autocomplete works independently from the agent system. The agents influence the codebase context but do not directly control Tab completions.

### Rules-Based Agent Behavior

Each `.mdc` rule becomes an agent with its own system prompt (the body of the `.mdc` file). When you invoke `@agent-name`, Cursor loads that rule's content as context for the conversation.

Rules with `globs` are automatically activated when editing matching files — their instructions are prepended to the context.

### MCP Server Support in Cursor

Cursor supports MCP servers for extending agent capabilities. Configure in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "internet-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@opencontext/mcp-server-search"]
    }
  }
}
```

MCP tools are automatically available to agents in Cursor.

### Native Subagent Delegation

Cursor supports subagent-style delegation internally. Zeus orchestration works through sequential `@` mentions rather than a `handoffs` UI:

```
1. @athena Plan the user dashboard with TDD approach
2. @hermes + @aphrodite + @maat Implement in parallel
3. @temis Review all changes
```

---

## Troubleshooting

### Agents Not Showing in Autocomplete

- Verify `.cursor/rules/` exists in your project root
- Confirm `.mdc` files have valid YAML frontmatter with `name` and `description`
- Restart Cursor to reload rules
- Check that files end with `.mdc` extension (not `.md`)

### Agent Doesn't Follow Instructions

- Ensure the `.mdc` file body contains the full instruction set
- Cursor uses the rule body as the agent's system prompt — omit-sections from the adapter may remove critical content
- Run `npm run sync` to regenerate `.mdc` files if you modified the source `.agent.md`

### Model Performance Issues

- Adjust model assignments in Cursor Settings → Models
- Use faster models (GPT-4o Mini, Claude Haiku) for exploration agents (Apollo, Talos)
- Use powerful models (Claude Opus, GPT-4) for implementation and review agents
- Cursor does not support per-agent model pinning via frontmatter — use settings

### MCP Server Not Connecting

- Verify `~/.cursor/mcp.json` syntax is valid JSON
- Check the server command is installed globally or use `npx`
- Restart Cursor after modifying MCP config
- Run the server command directly to test connectivity

### Sync Issues

- Run `npm run sync` to regenerate all platform files from canonical agents
- The installer (`node scripts/install.mjs cursor`) copies from `platform/cursor/rules/`
- Check `platform/cursor/adapter.json` for transformation rules

### Missing Features Compared to VS Code

| Feature | VS Code | Cursor |
|---|---|---|
| Handoff UI buttons | ✅ | ❌ — use direct @-mentions |
| Agent lifecycle hooks | ✅ | ❌ |
| Per-agent model routing | ✅ (frontmatter) | ⚠️ (settings) |
| Tool declarations | ✅ (frontmatter) | ❌ |
| Skills system | ✅ | ❌ |
| Nested subagents | ✅ (runSubagent) | ⚠️ (native, different model) |

---

[Main Documentation](../../README.md)
