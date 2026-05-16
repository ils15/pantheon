# Pantheon for OpenCode

Complete setup and usage guide for running Pantheon in [OpenCode](https://opencode.ai) — the open-source AI coding agent for the terminal, desktop, and IDE.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **OpenCode** installed | Install via `curl -fsSL https://opencode.ai/install.sh | sh` or `npm install -g @opencode/opencode` |
| **Node.js 18+** | Only needed for the sync engine (`npm run sync`) and installer script |
| **Git** | Any recent version |

---

## Installation

OpenCode is available in three form factors:

| Form Factor | How to Get It |
|---|---|
| **Terminal TUI** | Install script, npm, Homebrew, pacman, scoop, choco, Docker — see [opencode.ai](https://opencode.ai) |
| **Desktop app** | Download from [opencode.ai/download](https://opencode.ai/download) — macOS, Linux, Windows |
| **IDE extension** | Available for VS Code, JetBrains, and Zed |

The fastest way to set up Pantheon in any project is with the universal install script:

```bash
node scripts/install.mjs --target /path/to/your-project
```

This auto-detects the platform (OpenCode, VS Code, Cursor, etc.), installs agents to the correct directories, and creates platform config files. The generated `opencode.json` includes only `$schema`, `permission`, and `instructions` — model overrides are stripped and resolved at runtime via plan files.

### Desktop App

Pantheon works seamlessly with the OpenCode Desktop app. Agents, skills, and instructions are discovered from the project directory the same way as in the terminal TUI. Use the Desktop app for a richer UI experience with integrated diffs, file tree browsing, and system notifications.

### Manual Setup

```bash
# Clone the repo
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Copy the pre-generated OpenCode agents into your project
mkdir -p /path/to/your-project/.opencode/agents
cp -r platform/opencode/agents/. /path/to/your-project/.opencode/agents/

# Copy the root opencode.json as a starting point
cp opencode.json /path/to/your-project/opencode.json
```

### How It Works

The OpenCode agents live in `platform/opencode/agents/` (generated from canonical `agents/` by `npm run sync`). The adapter (v2.0.0) uses a tool map to convert canonical VS Code tool names to OpenCode-native names, moves permissions from body blocks to frontmatter, and excludes tools not available in OpenCode (`read/problems`, browser tools).

### `/init` Command

OpenCode's built-in `/init` command auto-generates an `AGENTS.md` file by scanning your project. It analyzes build commands, test commands, architecture, and conventions, then produces concise project-specific guidance for future agent sessions.

```
/init
```

If an `AGENTS.md` already exists, `/init` improves it in-place rather than replacing it. This is complementary to Pantheon — `/init` captures project-level context while Pantheon agents provide role-specific behavior.

---

## Configuration

OpenCode uses `opencode.json` (or `opencode.jsonc`) in your project root. Create one with:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "zeus":      { "source": ".opencode/agents/zeus.md" },
    "athena":    { "source": ".opencode/agents/athena.md" },
    "apollo":    { "source": ".opencode/agents/apollo.md" },
    "hermes":    { "source": ".opencode/agents/hermes.md" },
    "aphrodite": { "source": ".opencode/agents/aphrodite.md" },
    "demeter":      { "source": ".opencode/agents/demeter.md" },
    "themis":     { "source": ".opencode/agents/themis.md" },
    "prometheus":        { "source": ".opencode/agents/prometheus.md" },
    "iris":      { "source": ".opencode/agents/iris.md" },
    "mnemosyne": { "source": ".opencode/agents/mnemosyne.md" },
    "talos":     { "source": ".opencode/agents/talos.md" },
    "gaia":      { "source": ".opencode/agents/gaia.md" },
    "hephaestus":   { "source": ".opencode/agents/hephaestus.md" },
    "chiron":    { "source": ".opencode/agents/chiron.md" },
    "echo":       { "source": ".opencode/agents/echo.md" },
    "nyx":       { "source": ".opencode/agents/nyx.md" }
  }
}
```

| Setting | Purpose |
|---|---|
| `agent` | Maps agent names to their `.md` definition files in `.opencode/agents/` |
| `default_agent` | Sets which primary agent is used by default (e.g., `"build"`, `"zeus"`) |

### Default Agent

The `default_agent` option in `opencode.json` controls which primary agent OpenCode uses when starting a session:

```json
{
  "default_agent": "zeus"
}
```

If not set, OpenCode defaults to the built-in `build` agent. This is useful when Pantheon's Zeus orchestrator should be the primary interaction point.

### Agent Permissions (adapter v2)

In OpenCode adapter v2, permissions are declared in **frontmatter** rather than appended as body blocks. The sync engine generates them automatically:

```yaml
---
name: hermes
permission:
  edit: allow
  bash: allow
  read: allow
  search: allow
---
```

Body-level permission blocks are no longer used — removed in v2.0.0.

Override generated permissions per-agent in `opencode.json`:

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

### Task Permissions (Subagent Control)

Control which subagents can be invoked using `permission.task` with glob patterns:

```json
{
  "permission": {
    "task": {
      "*": "allow",
      "apollo": "allow",
      "zeus": "allow",
      "internal-*": "deny"
    }
  }
}
```

This can also be set per-agent to restrict which subagents each Pantheon agent can delegate to:

```json
{
  "agent": {
    "zeus": {
      "source": ".opencode/agents/zeus.md",
      "permission": {
        "task": {
          "hermes": "allow",
          "aphrodite": "allow",
          "themis": "allow",
          "internal-*": "deny"
        }
      }
    }
  }
}
```

---

## Agent Format

OpenCode agents are `.md` files with YAML frontmatter. They live in `.opencode/agents/` (project) or `~/.config/opencode/agents/` (global). The Pantheon sync engine (adapter v2.0.0) generates them from the canonical VS Code `.agent.md` sources into `platform/opencode/agents/`, applying tool name mapping and permissions conversion.

```yaml
---
name: hermes
description: "Backend specialist — FastAPI, Python, async, TDD"
argument-hint: "Backend task: endpoint, service, router, schema, or test"
mode: subagent
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

### Agent Modes

OpenCode supports two agent modes declared in frontmatter:

| Mode | Description |
|---|---|
| `primary` | Main assistant you interact with directly. Can cycle via Tab key. Has full tool access based on permissions. |
| `subagent` | Specialized assistant invoked by primary agents or via `@mention`. Used for delegated tasks. |

Pantheon agents are configured as `mode: subagent` by default, with Zeus as the primary orchestrator. You can also configure mode via `opencode.json`:

```json
{
  "agent": {
    "zeus": {
      "source": ".opencode/agents/zeus.md",
      "mode": "primary"
    }
  }
}
```

### Differences from VS Code Format

The OpenCode adapter v2 (2.0.0) maps canonical VS Code tool names to OpenCode-native names and manages differences:

| Aspect | VS Code (.agent.md) | OpenCode (.md) |
|---|---|---|---|
| **File extension** | `.agent.md` | `.md` |
| **Tools format** | YAML list | YAML list (with name mapping) |
| **Model format** | YAML list | YAML list (identity) |
| **Handoffs** | Full support with UI buttons | **Stripped** — not supported |
| **`agents:` field** | Required for subagent delegation | **Stripped** — OpenCode uses Task tool |
| **`disable-model-invocation`** | Supported | **Stripped** |
| **Permissions** | Set via settings.json / hooks | **Frontmatter** (v2) — body blocks removed |
| **`read/problems`** | Supported | **Excluded** — not available in OpenCode |
| **Browser tools** | `openBrowserPage`, etc. | **Excluded** — no browser in terminal UI |
| **`mode` field** | Not supported | **Added** — `primary` or `subagent` |
| **Skills** | Declared in settings.json | Declared in `opencode.json` skill registry |
| **Instructions** | `.github/copilot-instructions.md` | `instructions` array in `opencode.json` |

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Agent identifier used for `@name` invocation |
| `description` | Yes | Shown in agent picker |
| `argument-hint` | No | Example usage shown when invoking |
| `mode` | No | `primary` or `subagent` |
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
    "themis":   { "model": "opencode/kimi-k2.6" }
  }
}
```

#### Model Value Types

Model fields support **three value types** for flexible configuration:

| Value Type | Example | Behavior |
|------------|---------|----------|
| **Explicit String** | `"opencode/kimi-k2.6"` | Uses exactly this model ID |
| **`"auto"`** | `"auto"` | Inherits from chat's active model (set via `/model` command) |
| **`null`** | `null` | Falls back to top-level `model` in `opencode.json`, then platform default |

**Explicit String (Default):**
```json
{
  "agent": {
    "zeus": { "model": "opencode/kimi-k2.6" }
  }
}
```
Use when you want deterministic, predictable model assignment.

**`"auto"` — Dynamic Inheritance:**
```json
{
  "agent": {
    "apollo": { "model": "auto" },
    "talos": { "model": "auto" }
  }
}
```
The agent follows the user's chat model selection. When you run `/model opencode/deepseek-v4-pro`, these agents automatically switch. Useful for:
- Experimenting with different models without editing configs
- Cost control (switch to cheaper models mid-session)
- Testing agent behavior across multiple providers

**`null` — Fallback Chain:**
```json
{
  "model": "opencode/kimi-k2.5",
  "agent": {
    "hermes": { "model": null },
    "aphrodite": { "model": null }
  }
}
```
Omits the model field, triggering the fallback chain: agent → top-level `model` → platform default. Use when you want most agents to share a common default.

#### Switching from Hardcoded to Auto

To convert an agent from hardcoded to dynamic:

```json
// Before: Hardcoded model
{
  "agent": {
    "apollo": { "model": "opencode/deepseek-v4-flash" }
  }
}

// After: Dynamic inheritance
{
  "agent": {
    "apollo": { "model": "auto" }
  }
}
```

Now Apollo follows your `/model` command changes in real-time.

#### Model Priority Chain

When resolving which model an agent uses:

```
1. Agent-specific model (string/auto/null)
2. If null: top-level model in opencode.json
3. If auto: chat-selected model via /model
4. If missing: platform default
```

This chain ensures predictable behavior while allowing flexibility.

> **Note:** The `/model` command in OpenCode sets the chat's active model. Agents configured with `"auto"` immediately follow this selection. Use `/models` to see available models and `/model <id>` to switch.

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

> Switch plans anytime with `./platform/select-plan.sh <plan-name>`

### ACP (Agent Client Protocol)

OpenCode supports the Agent Client Protocol (ACP), allowing it to be used as an AI coding agent from any ACP-compatible editor or IDE (Zed, JetBrains, Neovim with Avante.nvim or CodeCompanion.nvim, etc.).

Start the ACP server:

```bash
opencode acp
```

This starts OpenCode as an ACP-compatible subprocess communicating via JSON-RPC over stdio. All Pantheon features work through ACP: built-in tools, MCP servers, AGENTS.md rules, custom commands, and the agent/permissions system.

For Zed, configure in `~/.config/zed/settings.json`:

```json
{
  "agent_servers": {
    "OpenCode": {
      "command": "opencode",
      "args": ["acp"]
    }
  }
}
```

### Claude Code Compatibility

OpenCode reads Claude Code's file conventions as fallbacks when Pantheon's AGENTS.md doesn't exist:

| Fallback | Path |
|---|---|
| Project rules | `CLAUDE.md` in project root (used if no `AGENTS.md` exists) |
| Global rules | `~/.claude/CLAUDE.md` (used if no `~/.config/opencode/AGENTS.md` exists) |
| Skills | `.claude/skills/` directory |

To disable Claude Code compatibility:

```bash
export OPENCODE_DISABLE_CLAUDE_CODE=1    # Disable all .claude support
export OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1   # Disable only ~/.claude/CLAUDE.md
export OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1   # Disable only .claude/skills
```

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
├── AGENTS.md                         # Project rules (auto-generated by /init)
├── opencode/agents/                  # Generated agent .md files
│   ├── zeus.md
│   ├── athena.md
│   ├── apollo.md
│   ├── hermes.md
│   ├── aphrodite.md
│   ├── demeter.md
│   ├── themis.md
│   ├── prometheus.md
│   ├── iris.md
│   ├── mnemosyne.md
│   ├── talos.md
│   └── gaia.md
├── agents/                           # Canonical VS Code .agent.md sources
├── skills/                           # Skill definitions
├── instructions/                     # *.instructions.md files
├── prompts/                          # *.prompt.md files
└── .claude/                          # Fallback Claude Code files (optional)
```

### Global Location

```
~/.config/opencode/
├── opencode.json                     # Global user preferences
├── AGENTS.md                         # Global project rules
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

### Default Agent Not Working

- Check the `default_agent` value in `opencode.json` — it must match an agent name exactly
- Verify the referenced agent exists and has `mode: primary`
- Fall back to OpenCode's built-in `build` agent by removing the `default_agent` key

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

### ACP Server Not Starting

- Check that port is available (default uses stdio for JSON-RPC)
- For TCP mode, verify `--port` is not already in use
- Ensure the calling editor/IDE supports ACP protocol

### Skills Not Discovered

- Ensure `"permission": { "skill": { "*": "allow" } }` is set in `opencode.json`
- Skills must be registered via skill-registry or placed in `.opencode/skills/`

### Desktop App Issues

- Fully quit and relaunch the app
- Try disabling plugins via `~/.config/opencode/opencode.json`
- Clear the cache: `rm -rf ~/.cache/opencode`
- On Linux with Wayland, try `OC_ALLOW_WAYLAND=1`; on Windows, ensure WebView2 runtime is installed
- Check system requirements: modern GPU, 4GB+ RAM, latest OS updates

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
| Start OpenCode (TUI) | `opencode` |
| Start OpenCode (Desktop) | Desktop app from [opencode.ai/download](https://opencode.ai/download) |
| Run non-interactive | `opencode run "prompt"` |
| Initialize project rules | `/init` (in-session) |
| Invoke an agent | `@zeus: Implement email verification` |
| List agents | `opencode agent list` |
| Create agent interactively | `opencode agent create` |
| List models | `opencode models` |
| Start ACP server | `opencode acp` |
| Add MCP server | `opencode mcp add` |
| Add provider key | `opencode auth login` |
| Switch theme | `/themes` in-session |
| Install GitHub integration | `opencode github install` |
| View sessions | `opencode session list` |
| View token stats | `opencode stats` |
| Debug MCP auth | `opencode mcp debug <server>` |

## 🚀 Advanced: Background Orchestration with opencode-pty

By default, OpenCode's `task` tool runs synchronously — the parent waits for the child to complete. For long-running operations (builds, tests, data processing), you can use the **opencode-pty** plugin to run agents in background.

### Installation

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "opencode-sm",
    "shekohex/opencode-pty"
  ]
}
```

Then install:
```bash
opencode plugin install shekohex/opencode-pty
```

### Tools Added

| Tool | Purpose |
|------|---------|
| `pty_spawn` | Start a process in background (returns PID) |
| `pty_read` | Read output from a background process |
| `pty_list` | List active background processes |
| `pty_kill` | Terminate a background process |
| `pty_snapshot_wait` | Wait for process to reach a condition |

### Usage in Pantheon

When Zeus delegates a long-running task:

```text
Zeus: "@hermes — run the full test suite in background"
Hermes: Uses pty_spawn to start pytest
Zeus: Continues with other work
Later: Zeus checks pty_read for results
```

### Example Workflow

```json
{
  "tool": "pty_spawn",
  "command": "pytest --tb=short -q",
  "cwd": "/workspace/project"
}
→ Returns: { "pid": "pty-123", "status": "running" }

{
  "tool": "pty_read",
  "pid": "pty-123",
  "offset": 0,
  "limit": 100
}
→ Returns: { "output": "...test results...", "status": "running" }

{
  "tool": "pty_snapshot_wait",
  "pid": "pty-123",
  "pattern": "passed|failed",
  "timeout": 300000
}
→ Returns: { "output": "...", "status": "completed" }
```

### Limitations

- Background tasks run on the **same machine** (not distributed)
- No automatic retry or failure recovery (must be handled manually)
- Process state is lost if OpenCode restarts
- Requires `opencode-pty` plugin (not available in all OpenCode installations)

### Alternative: Manual Background

Without the plugin, use standard Unix backgrounding:

```bash
# Start in background, redirect output to file
nohup pytest --tb=short -q > /tmp/test-results.log 2>&1 &
echo $! > /tmp/test-pid.txt

# Later, check results
cat /tmp/test-results.log
```

This is the approach used by Pantheon's built-in hooks.

---

## 📝 Advanced: Dynamic Prompts with File Templates

OpenCode prompts are static templates (e.g., `{{input}}`). For dynamic prompt generation based on context, use **file-based templates** with the `{file:...}` syntax.

### How It Works

1. Pre-generate prompt templates for common scenarios
2. Store them in `prompts/dynamic/` directory
3. Reference them in `opencode.json` commands

### Example: Dynamic Council Prompt

Create `prompts/dynamic/council-architecture.txt`:
```
You are convening a council on architecture decisions.
Active agents: {{agents}}
Context: {{context}}

Consult these specialists:
- @athena for planning
- @hermes for implementation feasibility  
- @demeter for database impact

Synthesize their perspectives into a single recommendation.
```

Reference in `opencode.json`:
```json
{
  "command": {
    "conclave": {
      "template": "{file:./prompts/dynamic/council-architecture.txt}"
    }
  }
}
```

### Generation Script

Add to `scripts/generate-prompts.sh`:
```bash
#!/bin/bash
# Generate dynamic prompts based on active plan
PLAN=$(cat platform/plans/plan-active.json | jq -r .plan)
AGENTS=$(ls platform/opencode/agents/ | sed 's/.md//' | paste -sd ', ' -)

sed -e "s/{{plan}}/$PLAN/g" \
    -e "s/{{agents}}/$AGENTS/g" \
    prompts/templates/council-template.txt \
    > prompts/dynamic/council-generated.txt
```

Run after `select-plan.sh`:
```bash
./platform/select-plan.sh opencode-go && ./scripts/generate-prompts.sh
```

### Limitations

- Not true runtime generation (generated at plan-switch time)
- Requires manual regeneration when agents change
- Platform-specific (OpenCode supports `{file:...}`, others may not)

---

[Main Documentation](../../README.md)
