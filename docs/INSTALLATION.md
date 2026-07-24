# Pantheon Installation Guide — v5.0 (OpenCode)

Pantheon v5.0 is **OpenCode-only**. It installs globally via `npx pantheon init` and works across all your projects.

## Prerequisites

- **OpenCode v1.18.4+** — [Install OpenCode](https://opencode.ai/docs/install)
- **Node.js 18+** — for `npx pantheon init`
- **Python 3.11+** — for MCP servers (optional, `npm run install`)
- **Git** — for version detection in TUI sidebar

## Quick Install

```bash
# 1. Install Pantheon agents globally
npx pantheon init

# 2. (Optional) Install MCP servers + skills + TUI plugin
npm run install

# 3. Enable background subagents
# Add to ~/.zshrc or ~/.bashrc:
export OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true

# 4. Launch OpenCode with background subagents
opencode
```

## Install Modes

| Mode | Command | Installs | Time | Dependencies |
|------|---------|----------|------|-------------|
| **Agents only** 🟢 | `npx pantheon init` | agents + commands | ~2s | None |
| **Full** 🔵 | `npx pantheon init && npm run install` | agents + MCPs + skills + TUI | ~60s | Python 3.11+ |
| **Runtime** 🟡 | `npm run install` | MCP servers + venv | ~30s | Python 3.11+ |

```bash
# Agents only — just the agent rules, no Python dependencies
npx pantheon init

# Full setup — agents + MCP servers (memory, persistence, resources)
npx pantheon init
npm run install

# Add MCP servers to an existing agents-only install
npm run install
```

## Global vs Project-Local

By default, `npx pantheon init` installs agents **globally** to `~/.config/opencode/agents/`. This makes Pantheon available in all your projects.

For project-local installation (e.g., team-shared config):

```bash
npx pantheon init --project
```

This installs to `.opencode/agents/` in the current project directory.

## Background Subagents

Pantheon v5.0 supports **native OpenCode background delegation**. This allows dispatching up to 5 agents in parallel.

**Requirement:** Set the environment variable before launching OpenCode:

```bash
export OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true
opencode
```

Or use the provided npm script:

```bash
npm run start
```

**How it works:**

```javascript
// Dispatch a background task — returns immediately
task(background=true, subagent_type="apollo", prompt="...")
// → { task_id: "ses_xxx", state: "running" }

// Collect results later
task_status(task_id="ses_xxx", wait=true)
// → { state: "completed", task_result: "..." }
```

**Which agents run in background:**

| Agent | Background? | Why |
|-------|------------|-----|
| Apollo, Hermes, Aphrodite, Demeter, Hephaestus, Prometheus | ✅ Yes | Independent, long-running work |
| Athena, Themis | ❌ No | Need full session context |
| Talos, Iris, Nyx, Mnemosyne, Gaia | ❌ No | Quick operations |

## TUI Sidebar Plugin

Pantheon includes a TUI sidebar plugin showing:

```
Pantheon v5.0.0
⎇ main
▶ Sessions (N total)
▶ Commands (11)
▶ Agents (14)
▶ Config — MCPs, Compaction
▶ Memory — Entry count
```

The plugin is installed automatically during `npm run install`. It appears in the right sidebar of OpenCode TUI.

## Commands

Type these in the OpenCode chat:

| Command | Description |
|---------|-------------|
| `/pantheon` | Council synthesis |
| `/pantheon-status` | System status |
| `/pantheon-audit` | Full audit |
| `/pantheon-bg` | List background tasks |
| `/pantheon-deepwork` | Deep work mode |
| `/pantheon-focus` | Focus on scope |
| `/pantheon-optimize` | Optimize memory bank |
| `/pantheon-doc` | Generate docs |
| `/pantheon-remember` | Memory store/recall |
| `/pantheon-search` | Memory search |
| `/pantheon-forget` | Compress memories |

## Verification

After installation, verify everything works:

```bash
# 1. Check agents are installed
ls ~/.config/opencode/agents/
# Should show 14 .md files

# 2. Check MCP servers
ls ~/.config/opencode/scripts/

# 3. Launch OpenCode with background subagents
export OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true
opencode

# 4. Test background delegation
# Type: @zeus, task(background=true, subagent_type="apollo", prompt="test")
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Agents not found | Run `npx pantheon init` again |
| MCP servers not starting | Check Python 3.11+, run `npm run install` |
| Background delegation not available | Set `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true` before launching OpenCode |
| TUI sidebar not showing | Check `~/.config/opencode/tui.json` has `"plugins/pantheon-tui"` |
| Plugin not loading | Ensure `~/.config/opencode/plugins/pantheon-tui/dist/tui.tsx` exists |

## Installation Flow

```mermaid
flowchart LR
    A["npx pantheon init"] --> B{"--project?"}
    B -->|No| C["~/.config/opencode/agents/ (global)"]
    B -->|Yes| D[".opencode/agents/ (project-local)"]
    C --> E["npm run install"]
    D --> E
    E --> F["MCP servers + skills + TUI"]
    F --> G["export OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true"]
    G --> H["opencode"]
    H --> I["🚀 Pantheon v5.0 ready"]
```

## Background Delegation Flow

```mermaid
sequenceDiagram
    participant Z as Zeus
    participant A as Apollo (bg)
    participant D as Demeter (bg)
    participant T as Themis (sync)

    Z->>+A: task(background=true, "discover")
    Z->>+D: task(background=true, "schema")
    Note over Z: Max 5 concurrent
    
    A-->>Z: task_status(wait=true) → result
    D-->>Z: task_status(wait=true) → result
    
    Z->>+T: task("review")
    Note over T: Athena/Themis NEVER background
    T-->>-Z: review complete
```

## TUI Sidebar Layout

```mermaid
block-beta
    columns 1
    block["Pantheon v5.0.0"]
        block("⎇ main")
        end
        block Sessions["▶ Sessions (N total)"]
        end
        block Commands["▶ Commands (11)"]
        end
        block Agents["▶ Agents (14)"]
        end
        block Config["▶ Config"]
        end
        block Memory["▶ Memory"]
        end
    end
```
