# VS Code Copilot Platform

> **Status**: ✅ Active — canonical platform

---

## Format

VS Code uses `.agent.md` files with YAML frontmatter. The canonical agents in `agents/` **are** the VS Code format — this is the identity platform.

| Property | Value |
|---|---|
| File format | `.agent.md` |
| Frontmatter | Full YAML (name, description, model, tools, skills, instructions, handoffs, agents) |
| Tool naming | `vscode/askQuestions`, `search/codebase`, `edit/editFiles`, etc. |
| Agent loading | Built-in Copilot agent system |

---

## Installation

### Option A: Plugin Marketplace (recommended)

Add to your VS Code `settings.json`:

```json
{
  "chat.plugins.enabled": true,
  "chat.plugins.marketplaces": [
    "ils15/pantheon"
  ]
}
```

All 12 agents load automatically in Copilot Chat.

### Option B: Manual copy into your project

```bash
# Clone Pantheon alongside your project
git clone https://github.com/ils15/pantheon.git

# Copy agents and config
cp -r pantheon/agents    /path/to/your-project/agents
cp -r pantheon/skills    /path/to/your-project/skills
cp -r pantheon/instructions /path/to/your-project/instructions
cp -r pantheon/prompts   /path/to/your-project/prompts
cp -r pantheon/.github   /path/to/your-project/.github
```

---

## Hook System

VS Code supports [agent lifecycle hooks](https://code.visualstudio.com/docs/copilot/customization/custom-agents#_agent-hooks):

- **PreToolUse** — Security gate (blocks `rm -rf`, `DROP TABLE`)
- **PostToolUse** — Auto-format via Biome
- **SessionStart** — Session logging
- **SubagentStart/Stop** — Delegation tracking

Configured in `.github/hooks/`. See [AGENTS.md](../../AGENTS.md) for details.
