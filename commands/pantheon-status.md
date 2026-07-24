---
description: "Show Pantheon version, model tier, and all available agents with status"
agent: "zeus"
---
# /pantheon-status — System Status & Agent Registry

**What:** Displays the current Pantheon version, model tier (Pro/Free), and a full status table of all agents.
**Usage:** `/pantheon-status`
**Returns:** Version badge · model tier · agent table with availability
**Use when:** You want to see what version of Pantheon is running and which agents are loaded

## Output Format

Produce EXACTLY this structure:

```
## 🏛️ Pantheon System Status

**Version:** vX.Y.Z
**Model Tier:** Pro (premium models) | Free (default models)
**Platform:** <detect: opencode | claude | cursor | windsurf | vscode>
**Agents loaded:** N of 14

### Agent Registry

| Agent | Role | Tier | Status |
|-------|------|------|--------|
| @zeus | Central orchestrator | default | ✅ |
| @athena | Strategic planner | premium | ✅ |
| @hermes | Backend (FastAPI) | default | ✅ |
| @aphrodite | Frontend (React) | default | ✅ |
| @demeter | Database | default | ✅ |
| @themis | Quality & security | premium | ✅ |
| @prometheus | Infrastructure | default | ✅ |
| @apollo | Codebase discovery | fast | ✅ |
| @iris | GitHub operations | fast | ✅ |
| @mnemosyne | Memory bank | fast | ✅ |
| @talos | Hotfixes | fast | ✅ |
| @hephaestus | AI pipelines | default | ✅ |
| @nyx | Observability | fast | ✅ |
| @gaia | Remote sensing | fast | ✅ |

### Commands Available

`/pantheon` `/pantheon-status` `/audit` `/focus` `/deepwork` `/optimize` `/sketch` `/pantheon-cancel` `/pantheon-install` `/pantheon-update` `/pantheon-remember` `/pantheon-search` `/pantheon-consolidate` `/pantheon-forget`

### Health

- ✅ All agents responding
- ⚠️ N agents degraded (if any)
- ❌ N agents unavailable (if any)
```

## How to Detect Version

Read `package.json` → `"version"` field. If unavailable, read `plugin.json` → `"version"`.

## How to Detect Model Tier

- **Pro:** Any agent with `model_tier: premium` in `routing.yml` is using a premium model (athena, themis)
- **Free:** All agents using `default` or `fast` tier models
- Report based on what `routing.yml` declares for the active platform

## How to Detect Platform

Check for platform-specific markers:
- `opencode.json` present → **OpenCode**
- `.claude/` directory → **Claude Code**
- `.cursor/` directory → **Cursor**
- `.windsurf/` directory → **Windsurf**
- `.vscode/` directory → **VS Code Copilot**
