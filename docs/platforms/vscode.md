# mythic-agents for VS Code (GitHub Copilot)

Complete setup and usage guide for running mythic-agents in VS Code with GitHub Copilot.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **VS Code** 1.110+ | Earlier versions may not support all agent features |
| **GitHub Copilot** subscription | Copilot Chat requires Pro, Pro+, Business, or Enterprise |
| **Node.js 18+** | Only needed for the sync engine (`npm run sync`) and installer script |
| **Git** | Any recent version |

---

## Installation Methods

### Method 1: Plugin Marketplace (easiest — 30 seconds)

1. Open VS Code settings JSON: `Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)`
2. Add:
   ```json
   {
     "chat.plugins.enabled": true,
     "chat.plugins.marketplaces": ["ils15/pantheon"]
   }
   ```
3. Reload VS Code: `Ctrl+Shift+P` → `Developer: Reload Window`
4. All 16 agents load automatically. Try `@zeus: Implement a feature` in Copilot Chat.

### Method 2: Manual clone + copy (for customization)

```bash
# Clone the repo
git clone https://github.com/ils15/mythic-agents.git
cd mythic-agents
npm install

# Regenerate platform configs (ensures latest format)
npm run sync

# Copy into your project
cp -r agents       /path/to/your-project/agents
cp -r skills       /path/to/your-project/skills
cp -r instructions /path/to/your-project/instructions
cp -r prompts      /path/to/your-project/prompts
cp -r .github      /path/to/your-project/.github    # hooks + copilot-instructions.md
cp AGENTS.md       /path/to/your-project/AGENTS.md
```

---

## Configuration

### `.vscode/settings.json`

Create or edit `.vscode/settings.json` in your project root:

```json
{
  "chat.plugins.enabled": true,
  "chat.plugins.marketplaces": ["ils15/pantheon"],

  "chat.subagents.allowInvocationsFromSubagents": true,

  "codeGeneration.instructions": [
    { "file": "instructions/backend-standards.instructions.md" },
    { "file": "instructions/frontend-standards.instructions.md" },
    { "file": "instructions/database-standards.instructions.md" }
  ],

  "github.copilot.chat.codeGeneration.instructions": [
    { "file": ".github/copilot-instructions.md" }
  ],

  "github.copilot.chat.agent.skills": [
    "skills/tdd-with-agents/SKILL.md",
    "skills/api-design-patterns/SKILL.md",
    "skills/security-audit/SKILL.md"
  ]
}
```

| Setting | Purpose |
|---|---|
| `chat.plugins.marketplaces` | Enables the mythic-agents plugin from the marketplace |
| `chat.subagents.allowInvocationsFromSubagents` | **Required** for nested subagent delegation (e.g., Hermes calling Apollo) |
| `codeGeneration.instructions` | Per-file-pattern rules wired to instruction files in the repo |
| `github.copilot.chat.codeGeneration.instructions` | Repo-level team instructions loaded on every interaction |
| `github.copilot.chat.agent.skills` | Skills available to agents during implementation |

### MCP Server Configuration (optional)

For extended internet search capabilities, configure MCP servers in VS Code. Create `.vscode/mcp.json` or use Settings → MCP:

```json
{
  "servers": {
    "internet-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["@opencontext/mcp-server-search"]
    }
  }
}
```

This gives agents the ability to search the web, look up docs, and fetch live data during implementation.

### `.github/copilot-instructions.md`

This file is automatically loaded on every Copilot interaction in VS Code. It should contain:

- Project overview and stack
- Coding standards and conventions
- Memory bank reading instructions

The mythic-agents template provides a starting point at `.github/copilot-instructions.md`.

---

## Agent Format

Agents are `.agent.md` files with YAML frontmatter. VS Code uses a specific format with `tools` as a YAML list:

```yaml
---
name: hermes
description: "Backend specialist — FastAPI, Python, async, TDD"
argument-hint: "Backend task: endpoint, service, router, schema, or test"
model: ['GPT-5.4 (copilot)', 'Claude Sonnet 4.6 (copilot)']
tools:
  - agent
  - search/codebase
  - search/usages
  - read/readFile
  - read/problems
  - edit/editFiles
  - execute/runInTerminal
  - execute/testFailure
  - execute/getTerminalOutput
  - search/changes
handoffs:
  - { label: "Send to Temis", agent: temis, prompt: "Please perform a code review and security audit on these changes.", send: true, model: 'Claude Opus 4.6 (copilot)' }
agents: ['apollo']
user-invocable: true
---
```

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Agent identifier used for `@name` invocation |
| `description` | Yes | Shown in agent picker and handoff UI |
| `argument-hint` | No | Example usage shown when invoking |
| `model` | No | Ordered list of preferred models. First available is used. Supports: `GPT-5.4 (copilot)`, `GPT-5.3-Codex (copilot)`, `Claude Sonnet 4.6 (copilot)`, `Claude Opus 4.6 (copilot)`, `Claude Haiku 4.5 (copilot)`, `Gemini 3 Flash (Preview) (copilot)`, `Gemini 3.1 Pro (Preview) (copilot)` |
| `tools` | No | Tools the agent may use (list format). See tool reference below. |
| `handoffs` | No | Handoff buttons shown in chat UI. Each: `label`, `agent`, `prompt`, `send` (bool), `model` (optional). |
| `agents` | No | Sub-agents this agent may invoke via `runSubagent` |
| `user-invocable` | No | If `false`, agent is hidden from the picker and only invoked by other agents |

### Available Tools

| Tool | Purpose |
|---|---|
| `agent` | Invoke subagents |
| `vscode/askQuestions` | Show interactive question prompts to the user |
| `vscode/runCommand` | Execute VS Code commands |
| `search/codebase` | Semantic codebase search |
| `search/usages` | Find symbol references |
| `search/changes` | Search git changes |
| `read/readFile` | Read file contents |
| `read/problems` | Read diagnostics/problems panel |
| `edit/editFiles` | Edit and create files |
| `execute/runInTerminal` | Run terminal commands |
| `execute/testFailure` | Investigate test failures |
| `execute/getTerminalOutput` | Get terminal output |
| `web/fetch` | Fetch web content |

---

## File Locations

### Per-Project (recommended for teams)

```
your-project/
├── agents/                          # *.agent.md files — all 16 agents
│   ├── zeus.agent.md
│   ├── athena.agent.md
│   ├── apollo.agent.md
│   ├── hermes.agent.md
│   ├── aphrodite.agent.md
│   ├── maat.agent.md
│   ├── temis.agent.md
│   ├── ra.agent.md
│   ├── iris.agent.md
│   ├── mnemosyne.agent.md
│   ├── talos.agent.md
│   ├── hefesto.agent.md
│   ├── quiron.agent.md
│   ├── eco.agent.md
│   ├── nix.agent.md
│   └── gaia.agent.md
├── skills/                          # *.md files loaded per agent
│   ├── tdd-with-agents/SKILL.md
│   ├── api-design-patterns/SKILL.md
│   ├── fastapi-async-patterns/SKILL.md
│   └── ...
├── instructions/                    # *.instructions.md files
│   ├── backend-standards.instructions.md
│   ├── frontend-standards.instructions.md
│   ├── database-standards.instructions.md
│   └── ...
├── prompts/                         # *.prompt.md files
│   └── ...
├── .github/
│   └── copilot-instructions.md      # Auto-loaded on every interaction
├── .vscode/
│   └── settings.json                # Agent config + nested subagents
└── AGENTS.md                        # Central orchestrator instructions
```

### Global (personal preferences)

```
~/.copilot/instructions/             # Cross-repo personal preferences
├── my-preferences.md
└── ...
```

**Loading hierarchy (VS Code 1.110+, #297179):**
1. `~/.copilot/instructions/` — personal, cross-repo (you only)
2. `.github/copilot-instructions.md` — team-shared, repo-level
3. `.vscode/settings.json` → `codeGeneration.instructions` — per-file-pattern
4. Agent `.agent.md` frontmatter — per-agent tools + model + skills

---

## VS Code-Specific Features

### Agent Handoff UI

When an agent has `handoffs` declared in its frontmatter, VS Code renders native **handoff buttons** in the chat response. Clicking one delegates the conversation to the target agent with the configured prompt.

Example from Zeus:

```
[📋 Plan Feature] [🔍 Validate Plan] [📝 Document Progress]
```

Handoffs support an optional `model` field to route to a different model for the follow-up task.

### Model Switching

During a chat session, use `/switch-model` or click the model indicator at the top of the chat panel to change models without restarting.

### Chat Sessions Panel

VS Code tracks agent conversations in the Chat Sessions panel (accessible from the activity bar). Each agent invocation creates a session entry with:
- Conversation history
- File edits made during the session
- Terminal commands executed

### `#codebase` Semantic Search

Use `#codebase` in any prompt to perform semantic codebase search. The agent can find relevant code by meaning, not just keyword matching. This is the primary search mechanism for the `search/codebase` tool.

### Agent Hooks (Pre/Post Tool Use)

VS Code supports lifecycle hooks via `.github/hooks/`:

| Hook | File | Fires | Use Case |
|---|---|---|---|
| PreToolUse | `.github/hooks/pre-tool-use.json` | Before every tool call | Security gates, destructive operation blocking |
| SubagentStart | `.github/hooks/subagent-start.json` | On subagent delegation | Audit logging, approval prompts |
| SubagentStop | `.github/hooks/subagent-stop.json` | On subagent completion | Result capture, failure escalation |

Example security gate (`pre-tool-use.json`):
```json
{
  "blockedCommands": ["rm -rf", "DROP TABLE", "TRUNCATE"],
  "logPath": "logs/agent-sessions/delegations.log"
}
```

See `.github/hooks/` in the mythic-agents repo for complete examples.

### Custom Instructions Loading

VS Code loads instructions in this order:
1. `.github/copilot-instructions.md` — always loaded
2. `codeGeneration.instructions` in `settings.json` — per-file-pattern rules
3. Inline `@instructions` references — load on demand during conversation
4. Agent `.agent.md` body text — acts as the agent's system prompt

---

## Troubleshooting

### Agents Not Showing Up

- Ensure `"chat.plugins.enabled": true` and `"chat.plugins.marketplaces": ["ils15/pantheon"]` are set in `settings.json`
- Reload the window: `Ctrl+Shift+P` → `Developer: Reload Window`
- Check VS Code version is 1.110+
- Verify Copilot subscription is active (look for Copilot icon in status bar)

### Handoff Buttons Not Appearing

- Confirm the `handoffs` field is correctly formatted as a YAML list in the `.agent.md` file
- Each handoff needs `label`, `agent`, `prompt`, and `send` fields
- VS Code 1.96+ required for handoff UI

### Nested Subagents Not Working

- Verify `"chat.subagents.allowInvocationsFromSubagents": true` is set in `settings.json`
- The invoking agent must declare the target agent in its `agents:` list
- Max nesting depth: 5 levels

### Model Routing Issues

- Models must include the `(copilot)` suffix in the `model` field
- First available model in the list is used; others are fallbacks
- Use `/switch-model` during a session to change temporarily

### Skills Not Loading

- Skills are declared in `settings.json` under `github.copilot.chat.agent.skills`
- Paths can be relative to the workspace root
- The skill file must exist at the specified path

### Slow Agent Responses

- Large instruction files increase context size — keep them focused
- Reduce the number of `skills` loaded per agent
- Use faster models (Gemini Flash, Haiku) for exploration agents (Apollo, Talos)
- Reserve powerful models (GPT-5.4, Opus) for planning, implementation, and review

---

## Quick Reference

| Action | Command / Config |
|---|---|
| Open Copilot Chat | `Ctrl+Shift+I` or `Cmd+Shift+I` |
| Invoke an agent | `@zeus: Implement email verification` |
| Open settings JSON | `Ctrl+Shift+P` → `Preferences: Open User Settings (JSON)` |
| Reload VS Code | `Ctrl+Shift+P` → `Developer: Reload Window` |
| Switch model in session | `/switch-model` |
| Fork conversation | `/fork` |
| Debug agent session | `/troubleshoot #session` |
| Search code semantically | Use `#codebase` in any prompt |
| Enable nested subagents | `"chat.subagents.allowInvocationsFromSubagents": true` |
| Enable plugin marketplace | `"chat.plugins.marketplaces": ["ils15/pantheon"]` |
| View all agents | `@zeus: List all available agents` |
| Create a new agent | Create `agents/<name>.agent.md` with YAML frontmatter |

---

[Main Documentation](../../README.md)
