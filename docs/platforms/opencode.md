# mythic-agents for OpenCode

Complete setup and usage guide for running mythic-agents in [OpenCode](https://opencode.ai) — the open-source AI coding agent for the terminal.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **OpenCode** installed | Install via `curl -fsSL https://opencode.ai/install.sh | sh` or `npm install -g @opencode/opencode` |
| **Node.js 18+** | Only needed for the sync engine (`npm run sync`) and installer script |
| **Git** | Any recent version |

---

## Installation

```bash
# Clone the repo
git clone https://github.com/ils15/mythic-agents.git
cd mythic-agents
npm install

# Option A: Use the installer script
node scripts/install.mjs opencode

# Option B: Manual setup — link the opencode config in your project root
ln -s platform/opencode/opencode.json opencode.json
```

The OpenCode agents live in `platform/opencode/agents/` (generated from canonical `agents/` by `npm run sync`).

---

## Configuration

OpenCode uses `opencode.json` (or `opencode.jsonc`) in your project root. Create one with:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "zeus":    { "source": "opencode/agents/zeus.md" },
    "athena":  { "source": "opencode/agents/athena.md" },
    "apollo":  { "source": "opencode/agents/apollo.md" },
    "hermes":  { "source": "opencode/agents/hermes.md" },
    "aphrodite": { "source": "opencode/agents/aphrodite.md" },
    "maat":    { "source": "opencode/agents/maat.md" },
    "temis":   { "source": "opencode/agents/temis.md" },
    "ra":      { "source": "opencode/agents/ra.md" },
    "iris":    { "source": "opencode/agents/iris.md" },
    "mnemosyne": { "source": "opencode/agents/mnemosyne.md" },
    "talos":   { "source": "opencode/agents/talos.md" },
    "gaia":    { "source": "opencode/agents/gaia.md" }
  },
  "instructions": [
    "./AGENTS.md",
    "./instructions/backend-standards.instructions.md",
    "./instructions/frontend-standards.instructions.md",
    "./instructions/database-standards.instructions.md"
  ],
  "permission": {
    "skill": { "*": "allow" }
  }
}
```

| Setting | Purpose |
|---|---|
| `agent` | Maps agent names to their `.md` definition files in `opencode/agents/` |
| `instructions` | Instruction files loaded into agent context on every invocation |
| `permission.skill` | Enables all registered skills for agent use |

### Agent Permissions

Agents have permissions appended to their body by the sync engine:

```
---

## Permissions

- `edit`: deny
- `execute`: deny
- `search`: allow
- `read`: allow
```

Override these per-agent in `opencode.json`:

```json
{
  "agent": {
    "hermes": {
      "source": "opencode/agents/hermes.md",
      "permission": {
        "edit": "allow",
        "bash": "allow",
        "read": "allow",
        "search": "allow"
      }
    }
  }
}
```

---

## Agent Format

OpenCode agents are `.md` files with YAML frontmatter. They live in `.opencode/agents/` (project) or `~/.config/opencode/agents/` (global). The mythic-agents sync engine generates them from the canonical VS Code `.agent.md` sources into `platform/opencode/agents/`.

```yaml
---
name: hermes
description: "Backend specialist — FastAPI, Python, async, TDD"
argument-hint: "Backend task: endpoint, service, router, schema, or test"
model:
  - GPT-5.4 (copilot)
  - Claude Sonnet 4.6 (copilot)
tools:
  - agent
  - vscode/askQuestions
  - vscode/runCommand
  - execute/runInTerminal
  - read/readFile
  - search/codebase
  - search/usages
  - web/fetch
  - search/changes
---
```

### Differences from VS Code Format

| Aspect | VS Code (.agent.md) | OpenCode (.md) |
|---|---|---|
| **File extension** | `.agent.md` | `.md` |
| **Tools format** | YAML list | YAML list (identity) |
| **Model format** | YAML list | YAML list (identity) |
| **Handoffs** | Full support with UI buttons | **Stripped** — not supported |
| **`agents:` field** | Required for subagent delegation | **Stripped** — OpenCode uses Task tool |
| **`disable-model-invocation`** | Supported | **Stripped** |
| **Permissions** | Set via settings.json / hooks | Appended as permission block in body |
| **Skills** | Declared in settings.json | Declared in `opencode.json` skill registry |
| **Instructions** | `.github/copilot-instructions.md` | `instructions` array in `opencode.json` |

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Agent identifier used for `@name` invocation |
| `description` | Yes | Shown in agent picker |
| `argument-hint` | No | Example usage shown when invoking |
| `model` | No | Ordered list of preferred model IDs |
| `tools` | No | Tools the agent may use (YAML list) |
| `temperature` | No | Response randomness (0.0–1.0) |

---

## OpenCode-Specific Features

### Model Configuration

OpenCode uses `provider/model` format for model IDs (e.g., `opencode/kimi-k2.6`). The repo ships with a root [`opencode.json`](../../opencode.json) pre-configured with per-agent models for the **OpenCode Go** plan:

```json
{
  "model": "opencode/kimi-k2.6",
  "small_model": "opencode/deepseek-v4-flash",
  "agent": {
    "zeus":    { "model": "opencode/kimi-k2.6" },
    "athena":  { "model": "opencode/kimi-k2.6" },
    "apollo":  { "model": "opencode/deepseek-v4-flash" },
    "hermes":  { "model": "opencode/kimi-k2.5" },
    "temis":   { "model": "opencode/kimi-k2.6" }
  }
}
```

### Plan-Based Model Selection

The file `platform/plans/` contains **16 model plans** across 5 services. Agents declare abstract **tiers** (`fast`/`default`/`premium`) and the active plan resolves them to concrete model IDs.

```bash
# List all available plans
./platform/select-plan.sh list

# Select OpenCode Go plan
./platform/select-plan.sh opencode-go

# See which models each agent uses
./platform/select-plan.sh models
```

| Agent Tier | OpenCode Go | OpenCode Zen Free |
|---|---|---|
| `fast` | `opencode/deepseek-v4-flash` | `opencode/gpt-5-nano` |
| `default` | `opencode/kimi-k2.5` | `opencode/minimax-m2.5-free` |
| `premium` | `opencode/kimi-k2.6` | `opencode/kimi-k2.5` |

> 🔄 Switch plans anytime with `./platform/select-plan.sh <plan-name>`

### Config Sync with GitHub

OpenCode supports remote configuration via `.well-known/opencode` endpoints, allowing organizations to push default settings. Config is loaded in this precedence order:

1. **Remote** — `.well-known/opencode` (org defaults)
2. **Global** — `~/.config/opencode/opencode.json` (user preferences)
3. **Custom** — `$OPENCODE_CONFIG` env var
4. **Project** — `opencode.json` in project root
5. **`.opencode/`** — agents, commands, plugins

Later sources override earlier ones. Non-conflicting keys are merged.

For GitHub Actions integration, run `opencode github install` to set up automated issue triage, PR review, and fix workflows.

### MCP Server Support

OpenCode supports both local and remote MCP servers via `opencode.json`:

```json
{
  "mcp": {
    "internet-search": {
      "type": "local",
      "command": ["npx", "-y", "@opencontext/mcp-server-search"],
      "enabled": true
    }
  }
}
```

MCP tools are automatically available to agents alongside built-in tools. You can scope them per-agent using the `tools` permission key.

### Theme Customization

OpenCode offers a customizable TUI with built-in themes (tokyonight, catppuccin, gruvbox, nord, etc.) and custom themes. Configure via `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "catppuccin-macchiato"
}

```

Create custom themes in `~/.config/opencode/themes/` or `.opencode/themes/`.

Quick theme switching in-session: `/themes`

---

## File Locations

```
your-project/
├── opencode.json                     # Project config (model, agents, instructions)
├── opencode/agents/                  # Generated agent .md files
│   ├── zeus.md
│   ├── athena.md
│   ├── apollo.md
│   ├── hermes.md
│   ├── aphrodite.md
│   ├── maat.md
│   ├── temis.md
│   ├── ra.md
│   ├── iris.md
│   ├── mnemosyne.md
│   ├── talos.md
│   └── gaia.md
├── agents/                           # Canonical VS Code .agent.md sources
├── skills/                           # Skill definitions
├── instructions/                     # *.instructions.md files
├── prompts/                          # *.prompt.md files
└── AGENTS.md                         # Central orchestrator instructions
```

### Global Location

```
~/.config/opencode/
├── opencode.json                     # Global user preferences
├── agents/                           # Global custom agents
├── themes/                           # Custom theme files
└── tui.json                          # TUI settings (theme, keybinds)
```

---

## Troubleshooting

### Agents Not Showing Up

- Ensure agents are placed in `.opencode/agents/` or referenced via the `agent` key in `opencode.json`
- Run `opencode agent list` to verify agents are registered
- Check that agent `.md` files have valid YAML frontmatter

### Model Not Available

- Models must use `provider/model` format — verify with `opencode models`
- Ensure the provider's API key is set via `opencode auth login` or environment variables
- The VS Code `(copilot)` suffix model IDs will not resolve in OpenCode — override models in `opencode.json`

### Instructions Not Loading

- Paths in the `instructions` array are relative to the config file location
- Verify files exist at the specified paths
- Instructions are merged across all config layers (global + project)

### MCP Server Not Connecting

- Run `opencode mcp list` to check server status
- For OAuth servers, run `opencode mcp auth <server-name>` to authenticate
- Check network connectivity for remote MCP servers
- Increase `timeout` in the MCP config for slow servers

### Skills Not Discovered

- Ensure `"permission": { "skill": { "*": "allow" } }` is set in `opencode.json`
- Skills must be registered via skill-registry or placed in `.opencode/skills/`

### Slow Responses

- Use faster models (Haiku, Gemini Flash) for exploration agents (Apollo, Talos)
- Reduce the number of `instructions` loaded per agent
- Reserve powerful models (Sonnet, Opus) for implementation and review
- Use per-agent `model` overrides to assign cheap models for discovery tasks

### Debugging

- Run `opencode run` with logging: `opencode --log-level DEBUG run "prompt"`
- Check logs at `~/.local/share/opencode/log/`
- Use `/troubleshoot #session` in-session for real-time diagnostics

---

## Quick Reference

| Action | Command / Config |
|---|---|
| Start OpenCode | `opencode` |
| Run non-interactive | `opencode run "prompt"` |
| Invoke an agent | `@zeus: Implement email verification` |
| List agents | `opencode agent list` |
| List models | `opencode models` |
| Add MCP server | `opencode mcp add` |
| Add provider key | `opencode auth login` |
| Switch theme | `/themes` in-session |
| Install GitHub integration | `opencode github install` |
| View sessions | `opencode session list` |
| View token stats | `opencode stats` |
| Debug MCP auth | `opencode mcp debug <server>` |

---

[Main Documentation](../../README.md)
