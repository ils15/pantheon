# Pantheon for Cursor

Complete setup and usage guide for running Pantheon in [Cursor](https://cursor.com) — the AI-native code editor.

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
git clone https://github.com/ils15/Pantheon.git
cd Pantheon
npm install

# Auto-configure for Cursor
node scripts/install.mjs --target /path/to/your-project
```

The installer (adapter v2.0.0) detects the platform and copies generated `.mdc` rule files from `platform/cursor/rules/` to `.cursor/rules/` in your project root.

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
        ├── demeter.mdc
        ├── themis.mdc
        ├── prometheus.mdc
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

Cursor uses `.mdc` (Markdown Cursor) files as agent definitions. The sync engine (`npm run sync`, adapter v2.0.0) converts canonical VS Code `.agent.md` files into Cursor's `.mdc` format, applying tool name mapping and platform-specific transformations automatically.

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
| `description` | Yes | Shown in agent autocomplete dropdown when typing `@` |
| `globs` | No | File globs that activate this rule automatically |

### What Gets Stripped

The Cursor adapter strips these VS Code frontmatter fields during conversion:
- `model` — Cursor handles models in its own settings
- `tools` — Not supported in `.mdc` frontmatter
- `handoffs` — Cursor uses native subagent delegation instead
- `skills` — Not supported in `.mdc` frontmatter
- `instructions` — Not supported
- `agents` — Not supported
- `argument-hint` — Not used by Cursor
- `user-invocable` — Not used by Cursor

### Adapter Configuration (v2.0.0)

The conversion rules are defined in `platform/cursor/adapter.json`:

```json
{
  "name": "cursor",
  "version": "2.0.0",
  "displayName": "Cursor",
  "outputDir": "rules",
  "fileExtension": ".mdc",
  "toolMap": {
    "read/readFile": "read",
    "edit/editFiles": "edit",
    "execute/runInTerminal": "runInTerminal",
    "search/codebase": "searchCodebase"
  },
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

Cursor's **Agent mode** (`Ctrl+Shift+I` or `Cmd+Shift+I`) is the primary interface for invoking Pantheon. Use `@agent-name` followed by your task:

```
@zeus: Implement JWT authentication for the API
@hermes: Create a FastAPI endpoint for user registration
: Review the auth router for security issues
```

### Agent Autocomplete

Type `@` in the chat input to see all available agents. The `description` field from each `.mdc` file is shown in the autocomplete dropdown — choose a clear, concise description so developers can quickly identify the right agent.

### Cursor Tab Autocomplete

Cursor's Tab autocomplete works independently from the agent system. The agents influence the codebase context but do not directly control Tab completions.

### Rules-Based Agent Behavior

Each `.mdc` rule becomes an agent with its own system prompt (the body of the `.mdc` file). When you invoke `@agent-name`, Cursor loads that rule's content as context for the conversation.

Rules with `globs` are automatically activated when editing matching files — their instructions are prepended to the context.

### Skills System

Cursor now supports **Skills** — dynamic, on-demand instructions defined in `.cursor/skills/` directory. Skills are **not always in context** like rules; they are loaded only when relevant, conserving token budget.

**Where to define skills:**

```
your-project/
└── .cursor/
    └── skills/
        ├── agent-coordination.skill.md
        ├── rag-pipelines.skill.md
        └── security-audit.skill.md
```

Skills use `SKILL.md` files (equivalent to the OpenCode skill format) with frontmatter:

```yaml
---
name: rag-pipelines
description: "Build RAG pipelines with chunking, embeddings, and vector stores"
---
[skill instructions...]
```

**How skills are loaded:**
- Manually: Type `/skill-name` in chat to invoke a skill
- Automatically: Cursor detects when a skill is relevant to your task and loads it

**Difference between Rules and Skills:**

| | Rules | Skills |
|---|---|---|
| When loaded | Every conversation | Only when relevant |
| Purpose | Always-on conventions | Specialized workflows |
| Context cost | Always uses context | Only when invoked |
| Best for | What agent should know | What agent can do |

### AGENTS.md Support

Cursor supports `AGENTS.md` files for project-level instructions:

- **Root `AGENTS.md`** — Always-on instructions for the entire project (equivalent to `.cursorrules` or always-active rules)
- **Nested `AGENTS.md`** — Auto-scoped to their directory; instructions only apply when working in that subtree

This provides a simpler alternative to `.mdc` rules for teams that prefer plain markdown conventions:

```
your-project/
├── AGENTS.md                    # Always-on project instructions
├── src/
│   ├── AGENTS.md                # Instructions scoped to src/
│   ├── api/
│   │   └── AGENTS.md            # Instructions scoped to src/api/
│   └── components/
│       └── AGENTS.md            # Instructions scoped to src/components/
└── tests/
    └── AGENTS.md                # Instructions scoped to tests/
```

### Plugin System

Cursor supports **Plugins** that package rules, skills, agents, commands, MCP servers, and hooks into a single distributable unit.

**Structure:**

```
your-project/
└── .cursor-plugin/
    ├── plugin.json              # Manifest (required)
    ├── rules/                   # .mdc rule files
    ├── skills/                  # Skill definitions
    ├── agents/                  # Agent definitions
    ├── commands/                # Custom commands
    ├── mcp.json                 # MCP server configs
    └── hooks/                   # Lifecycle hooks
```

**Manifest (`plugin.json`):**

```json
{
  "name": "pantheon",
  "version": "2.0.0",
  "description": "Pantheon multi-agent system for Cursor",
  "components": {
    "rules": ["rules/*.mdc"],
    "skills": ["skills/*.skill.md"],
    "mcp": "mcp.json"
  }
}
```

**Discovery:** Cursor auto-detects plugin components in the standard directories. The plugin marketplace enables sharing and installing community plugins.

### Remote Rule Import

Cursor supports importing rules directly from GitHub repositories via **Cursor Settings → Rules, Commands → Add Remote Rule**.

```
https://raw.githubusercontent.com/ils15/Pantheon/main/platform/cursor/rules/zeus.mdc
```

Remote rules are fetched and cached locally. They update when the source repository changes, making it easy to distribute Pantheon agent definitions without a local install step.

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
2. @hermes + @aphrodite + @demeter Implement in parallel
3.  Review all changes
```

---

## Troubleshooting

### Agents Not Showing in Autocomplete

- Verify `.cursor/rules/` exists in your project root
- Confirm `.mdc` files have valid YAML frontmatter with `name` and `description`
- Restart Cursor to reload rules
- Check that files end with `.mdc` extension (not `.md`)

### Skills Not Loading

- Verify `.cursor/skills/` directory exists in your project root
- Confirm each `.skill.md` file has valid frontmatter with `name` and `description`
- Skills are dynamic — try invoking directly with `/skill-name` in chat
- Check file extension: must be `.skill.md` or `.md` depending on Cursor version

### Plugin Not Working

- Validate `plugin.json` manifest syntax (must be valid JSON)
- Verify referenced paths in `plugin.json` exist (e.g. `rules/*.mdc`)
- Restart Cursor after adding/modifying plugin
- Check `.cursor-plugin/` is in the project root (not a subdirectory)

### Remote Rule Import Fails

- Verify the URL points to a raw `.mdc` file (use `raw.githubusercontent.com` for GitHub repos)
- Ensure the URL is publicly accessible (private repos may not work)
- Check Cursor's network connectivity
- Remote rules are cached locally — try removing and re-adding

### Agent Doesn't Follow Instructions

- Ensure the `.mdc` file body contains the full instruction set
- Cursor uses the rule body as the agent's system prompt — omitted sections from the adapter may remove critical content
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
- The installer (`node scripts/install.mjs --target .`) copies from `platform/cursor/rules/`
- Check `platform/cursor/adapter.json` for transformation rules

### Missing Features Compared to VS Code

| Feature | VS Code | Cursor |
|---|---|---|
| Handoff UI buttons | ✅ | ❌ — use direct @-mentions |
| Agent lifecycle hooks | ✅ | ❌ |
| Per-agent model routing | ✅ (frontmatter) | ⚠️ (settings) |
| Tool declarations | ✅ (frontmatter) | ❌ |
| Skills system | ✅ (runSubagent) | ✅ (.cursor/skills/) |
| Nested subagents | ✅ (runSubagent) | ⚠️ (native, different model) |

---

[Main Documentation](../../README.md)
