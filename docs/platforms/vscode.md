# Pantheon for VS Code (GitHub Copilot)

Complete setup and usage guide for running Pantheon in VS Code with GitHub Copilot. Pantheon is available as a plugin via the VS Code marketplace.

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
4. All 14 agents load automatically. Try `@zeus: Implement a feature` in Copilot Chat.

### Method 2: Clone + copy (for customization)

```bash
# Clone the repo
git clone https://github.com/ils15/pantheon.git
cd Pantheon
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

# Or use the auto-installer (copies everything and creates config files)
node scripts/install.mjs --target /path/to/your-project
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

  "chat.agentFilesLocations": [".github/agents"],

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
| `chat.plugins.marketplaces` | Enables the Pantheon plugin from the marketplace |
| `chat.subagents.allowInvocationsFromSubagents` | **Required** for nested subagent delegation (e.g., Hermes calling Apollo) |
| `chat.agentFilesLocations` | Custom paths to load `.agent.md` files from (array of glob patterns) |
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

The Pantheon template provides a starting point at `.github/copilot-instructions.md`.

---

## Agent Format

Agents are `.agent.md` files with YAML frontmatter. VS Code uses a specific format with `tools` as a YAML list:

```yaml
---
name: hermes
description: "Backend specialist — FastAPI, Python, async, TDD"
argument-hint: "Backend task: endpoint, service, router, schema, or test"
model: ['GPT-5.4 (copilot)', 'Claude Sonnet 4.6 (copilot)']
target: vscode
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
  - { label: "Send to Themis", agent: themis, prompt: "Please perform a code review and security audit on these changes.", send: true, model: 'Claude Opus 4.6 (copilot)' }
agents: ['apollo']
user-invocable: true
hooks:
  PostToolUse:
    - type: command
      command: "./scripts/format-changed-files.sh"
---
```

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Agent identifier used for `@name` invocation |
| `description` | Yes | Shown in agent picker and handoff UI |
| `argument-hint` | No | Example usage shown when invoking |
| `model` | No | Preferred model(s). Can be a string (single model) or array (prioritized list). First available is used. Supports: `GPT-5.4 (copilot)`, `GPT-5.3-Codex (copilot)`, `Claude Sonnet 4.6 (copilot)`, `Claude Opus 4.6 (copilot)`, `Claude Haiku 4.5 (copilot)`, `Gemini 3 Flash (Preview) (copilot)`, `Gemini 3.1 Pro (Preview) (copilot)` |
| `target` | No | Target environment: `vscode` or `github-copilot`. Omit for cross-environment agents. |
| `tools` | No | Tools the agent may use (list format). Supports individual tools and tool aliases (see Tool Aliases section). |
| `handoffs` | No | Handoff buttons shown in chat UI. Each: `label`, `agent`, `prompt`, `send` (bool). Optional `model` field for per-handoff model routing. |
| `hooks` | No | (Preview) Agent-scoped hooks definition. Requires `chat.useCustomAgentHooks` setting. Hooks only fire when this agent is active. |
| `agents` | No | Sub-agents this agent may invoke via `runSubagent`. Use `*` to allow all, or `[]` to prevent any. |
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

## Tool Aliases

VS Code supports short-form aliases that expand to full tool groups. Use these in the `tools:` field for cleaner agent definitions:

| Alias | Expands To | Purpose |
|---|---|---|
| `agent` | `agent` | Invoke custom subagents |
| `execute` | `execute/*` | Run shell commands and inspect results |
| `read` | `read/*` | Read file contents and diagnostics |
| `edit` | `edit/*` | Edit and create files |
| `search` | `search/*` | Search codebase, symbols, and git changes |
| `web` | `web/*` | Fetch URLs and perform web searches |
| `todo` | `todo/*` | Manage task lists |

Example:
```yaml
tools:
  - execute
  - read
  - edit
  - search
  - agent
  - web
```

This is equivalent to listing all individual `execute/*`, `read/*`, etc. tools. Mix and match aliases with individual tools as needed.

---

## File Locations

VS Code loads `.agent.md` files from the following locations:

| Location | Scope | Description |
|---|---|---|
| `.github/agents/` | Workspace | Default path for team-shared agents |
| `.claude/agents/` | Workspace | Claude Code format compatibility path |
| `chat.agentFilesLocations` | Workspace | Custom paths via `settings.json` (array of glob patterns) |
| `~/.copilot/agents/` | User | Personal agents available across all repositories |
| Plugin marketplace | Workspace | Agents bundled in installed plugins (e.g., `ils15/pantheon`) |

### Per-Project (recommended for teams)

```
your-project/
├── .github/
│   ├── agents/                       # *.agent.md files — all 14 agents (default path)
│   │   ├── zeus.agent.md
│   │   ├── athena.agent.md
│   │   ├── apollo.agent.md
│   │   ├── hermes.agent.md
│   │   ├── aphrodite.agent.md
│   │   ├── demeter.agent.md
│   │   ├── themis.agent.md
│   │   ├── prometheus.agent.md
│   │   ├── iris.agent.md
│   │   ├── mnemosyne.agent.md
│   │   ├── talos.agent.md
│   │   ├── hephaestus.agent.md
│   │   ├── nyx.agent.md
│   │   └── gaia.agent.md
│   └── copilot-instructions.md       # Auto-loaded on every interaction
├── skills/                           # *.md files loaded per agent
│   ├── tdd-with-agents/SKILL.md
│   ├── api-design-patterns/SKILL.md
│   ├── fastapi-async-patterns/SKILL.md
│   └── ...
├── instructions/                     # *.instructions.md files
│   ├── backend-standards.instructions.md
│   ├── frontend-standards.instructions.md
│   ├── database-standards.instructions.md
│   └── ...
├── prompts/                          # *.prompt.md files
│   └── ...
├── .vscode/
│   └── settings.json                 # Agent config + nested subagents
└── AGENTS.md                         # Central orchestrator instructions
```

To use an alternative agent location, add to `.vscode/settings.json`:
```json
{
  "chat.agentFilesLocations": ["agents"]
}
```

### Global (personal preferences)

```
~/.copilot/
├── agents/                           # Personal agents (*.agent.md)
├── instructions/                     # Cross-repo personal preferences
│   ├── my-preferences.md
│   └── ...
└── ...
```

**Loading hierarchy (VS Code 1.110+, #297179):**
1. `~/.copilot/instructions/` — personal, cross-repo (you only)
2. `.github/copilot-instructions.md` — team-shared, repo-level
3. `.vscode/settings.json` → `codeGeneration.instructions` — per-file-pattern
4. Plugin-supplied agents — agents bundled in marketplace plugins
5. `.github/agents/` — team-shared agents (default workspace path)
6. `.claude/agents/` — workspace agents (Claude format compatibility)
7. `chat.agentFilesLocations` — custom agent paths in `settings.json`
8. `~/.copilot/agents/` — personal agents across all repos
9. Agent `.agent.md` frontmatter — per-agent tools + model + skills

---

## /create-agent

VS Code's `/create-agent` command interactively generates `.agent.md` files from a natural language description:

```
/create-agent A backend API specialist that writes FastAPI endpoints with TDD
```

The command prompts for:
- Agent name and description
- Tools to grant
- Subagents and handoffs
- Model preferences

It creates the file in `.github/agents/<name>.agent.md` (or the first path in `chat.agentFilesLocations`). Edit the generated file to fine-tune behavior.

You can also extract a custom agent from an ongoing conversation. For example, after a multi-turn debugging session, ask "make an agent for this kind of task" to capture the workflow as a reusable custom agent.

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

VS Code supports lifecycle hooks via `scripts/hooks/` shell scripts, bridged by the `.opencode/plugins/pantheon-hooks.ts` plugin for OpenCode. For VS Code Copilot, hooks are configured in `.claude/settings.json` (Claude Code-compatible hooks).

| Hook | Script | Fires | Use Case |
|---|---|---|---|
| PreToolUse | `validate-tool-safety.sh` | Before every tool call | Security gates, destructive operation blocking |
| PreToolUse | `on-subagent-delegation-start.sh` | On subagent delegation | Audit logging, approval prompts |
| PostToolUse | `on-subagent-delegation-stop.sh` | On subagent completion | Result capture, failure escalation |

Hooks can also be **agent-scoped** via the `hooks` frontmatter field (Preview). When `chat.useCustomAgentHooks` is enabled, hooks defined in an agent's frontmatter only fire when that agent is active:

```yaml
hooks:
  PostToolUse:
    - type: command
      command: "./scripts/format-changed-files.sh"
```

See `scripts/hooks/` in the Pantheon repo for complete examples.

### Claude Agent Compatibility

VS Code detects `.md` files in the `.claude/agents/` folder, following the Claude sub-agents format. This enables you to use the same agent definitions across VS Code and Claude Code. Claude-specific frontmatter properties (`name`, `description`, `tools` as comma-separated string, `disallowedTools`) are automatically mapped to VS Code equivalents.

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
- Can be a single string or prioritized array; first available is used
- Use `/switch-model` during a session to change temporarily
- Handoffs use **tier references** (`premium`/`default`/`fast`) — configure concrete models via your platform's model settings

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

## GitHub Pull Requests Extension Integration

Pantheon integrates with the **GitHub Pull Requests extension** (`github.vscode-pull-request-github`) for native PR, issue, and review workflows inside VS Code.

### Installation

1. Install the extension from the VS Code marketplace: [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github)
2. Or add to `.vscode/extensions.json`:
   ```json
   {
     "recommendations": ["github.vscode-pull-request-github"]
   }
   ```

### Configuration

Add to `.vscode/settings.json`:

```json
{
  "githubPullRequests.notifications": "pullRequests",
  "githubPullRequests.fileListLayout": "tree",
  "githubPullRequests.createDefaultBaseBranch": "repositoryDefault",
  "githubPullRequests.remotes": ["origin"]
}
```

### Workflows

#### Opening a PR with Pantheon + GitHub Extension

1. **Create branch & push** — Use `@iris` or `gh CLI`
2. **Open PR** — Iris creates a draft PR via `gh pr create`
3. **Review in Extension** — Open the PR in the GitHub Extension panel:
   - `Ctrl+Shift+P` → `PR: Open Pull Request`
   - View diffs, add comments, request reviewers
4. **Merge** — Use the Extension's merge button or ask Iris
5. **Post-merge** — Iris deletes the branch and documents the release

#### Reviewing PRs

The Themis agent can use the GitHub Extension's LM skills:
- **Summarize PR** — Uses `summarize-github-issue-pr-notification` skill
- **Suggest fix** — Uses `suggest-fix-issue` skill
- **Address comments** — Uses `address-pr-comments` skill

#### Available VS Code Commands

| Command | Description |
|---|---|
| `pr.openPullRequest` | Open active PR in the GitHub Extension panel |
| `pr.createPullRequest` | Open the Create PR form |
| `pr.mergePullRequest` | Open merge dialog |
| `pr.checkoutPullRequest` | Check out a PR locally |
| `github.issues.createIssue` | Open the Create Issue form |
| `github.issues.requireReview` | Request a review from a specific user |

### MCP GitHub Server

For direct API access (beyond CLI), configure `.vscode/mcp.json`:

```json
{
  "servers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${input:github.token}" }
    }
  }
}
```

> **Note:** MCP server is optional. The `gh` CLI + GitHub Extension cover 95% of use cases without it.

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
| Generate a custom agent | `/create-agent A backend API specialist` |
| Search code semantically | Use `#codebase` in any prompt |
| Enable nested subagents | `"chat.subagents.allowInvocationsFromSubagents": true` |
| Enable plugin marketplace | `"chat.plugins.marketplaces": ["ils15/pantheon"]` |
| View all agents | `@zeus: List all available agents` |
| Create a new agent | Create `agents/<name>.agent.md` with YAML frontmatter |
| Open PR in GitHub Extension | `Ctrl+Shift+P` → `PR: Open Pull Request` |
| Create GitHub issue | `Ctrl+Shift+P` → `GitHub: Create Issue` |
| View GitHub issues | Click GitHub icon in Activity Bar |
| Review PR diffs | Open PR in GitHub Extension panel |
| Merge a PR | Use Extension merge button or `@iris` |

---

## Pantheon Commands Reference

All Pantheon commands are available as `/pantheon-*` in VS Code Copilot Chat. They are synced from `commands/` to your VS Code prompts folder via `npm run sync copilot`.

### All 14 Commands (v4.0)

| Command | What it does | Target Agent |
|---|---|---|
| `/pantheon` | Dispatch a question to 2–4 specialist agents in parallel, synthesizes response (Council) | Zeus |
| `/pantheon-status` | Show system health and agent registry status | Zeus |
| `/pantheon-audit` | Code review + security audit (--light/--full/--plan) | Themis |
| `/pantheon-cancel` | Stop auto-continuation | Zeus |
| `/pantheon-deepwork` | Heavy multi-phase task with persisted checkpoints and Themis review gates | Zeus |
| `/pantheon-focus` | Pin a session goal to prevent scope creep | Zeus |
| `/pantheon-optimize` | Compress, deduplicate, and consolidate the memory bank | Zeus |
| `/pantheon-sketch` | Turn a rough idea into a structured spec via Q&A | Athena |
| `/pantheon-install` | Sync + install + verify pipeline (--tier, --backup, --detect) | Zeus |
| `/pantheon-update` | Version bump + changelog + git tag + GitHub Release | Iris |
| `/pantheon-remember` | Store a fact or decision in memory | Mnemosyne |
| `/pantheon-search` | Search memory using semantic or FTS queries | Mnemosyne |
| `/pantheon-consolidate` | Consolidate and deduplicate memory entries | Mnemosyne |
| `/pantheon-forget` | Remove a memory entry by ID or key | Mnemosyne |

### Removed Commands (v4.0)

The following commands were removed in v4.0. Use their replacements:

| Removed | Replacement |
|---|---|
| `/pantheon-praxis` | `/pantheon-deepwork` (merged) |
| `/pantheon-subtask` | Normal agent delegation (`@hermes`, etc.) |
| `/pantheon-metamorphosis` | Use `@zeus: Refactor X with TDD` |
| `/pantheon-forge` | Use `opencode.json` model configuration |
| `/pantheon-mirrordeps` | Use `@apollo: Mirror dependency X` |
| `/ping` / `/pantheon-ping` | `/pantheon-status` |
| `/stop-continuation` / `/pantheon-stop-continuation` | `/pantheon-cancel` |
| `/subtask` | Normal agent delegation |

### Regular Workflow Prompts

These are simpler prompts (no `pantheon-` prefix) available as `/name`:

| Prompt | What it does |
|---|---|
| `/implement-feature` | End-to-end feature with TDD, parallel execution, quality gates |
| `/plan-architecture` | Strategic architecture planning with research |
| `/debug-issue` | Rapid debugging with parallel file discovery |
| `/orchestrate-with-zeus` | Full multi-agent orchestration |
| `/focus` | Pin a session goal (simpler version) |
| `/sketch` | Turn idea into structured spec |
| `/quick-discovery-large-codebase` | Rapid codebase discovery (8 min max) |
| `/quick-plan-large-feature` | Rapid planning for large features (5 min max) |
| `/optimize-database` | Analyze and optimize database schema/queries |

### Usage in VS Code

```
# In Copilot Chat, just type:
/pantheon-deepwork Implement user authentication
/pantheon-audit Changes in src/auth/
/pantheon Should we use Redis or PostgreSQL?
/pantheon-status
```

> **Sync tip:** Run `npm run sync copilot` after adding/editing commands to redeploy them to VS Code.

---

[Main Documentation](../../README.md)
