# Pantheon Platforms

Installation guide for all supported platforms.

---

## Quick Install (all platforms)

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Auto-detect and install for your current platform
node scripts/install.mjs

# Or target a specific project
node scripts/install.mjs --target /path/to/your-project
```

---

## Platform Guides

| Platform | Link | Install Method | Config File(s) |
|---|---|---|---|
| **OpenCode** | [`opencode.md`](opencode.md) | `cp -r platform/opencode/agents/ .opencode/` | `opencode.json` |
| **VS Code Copilot** | [`vscode.md`](vscode.md) | Marketplace plugin `ils15/pantheon` | `.vscode/settings.json` |
| **Claude Code** | [`claude.md`](claude.md) | `cp -r platform/claude/agents/ .claude/` | `.claude/settings.json` |
| **Cursor** | [`cursor.md`](cursor.md) | `cp -r platform/cursor/rules/ .cursor/` | `.cursor/rules/` |
| **Windsurf** | [`windsurf.md`](windsurf.md) | `cp -r platform/windsurf/rules/ .windsurf/rules/` | `.windsurf/rules/` |
| **Continue.dev** | [`continue.md`](continue.md) | `cp -r platform/continue/rules/ .continue/` | `config.yaml` |
| **Cline** | [`cline.md`](cline.md) | Via `scripts/install.mjs cline` | `.clinerules/` |

---

## Step Limits (opencode.json)

Configuration `steps` per agent — controls how many tool calls the agent can make before being forced to respond:

| Agent | Steps | Justification |
|---|---|---|
| Zeus | 30 | Orchestrator — delegates to 5+ sub-agents |
| Hermes, Aphrodite | 30 | TDD: test → code → test → refactor → lint |
| Demeter | 20 | Migrations + queries + indexes |
| Hephaestus | 25 | RAG pipelines + embeddings + chains |
| Themis | 20 | Multi-file review: lint + coverage + OWASP |
| Athena | 20 | Planning + research + Zeus council synthesis |
| Gaia | 20 | Multi-provider configuration |
| **Mnemosyne** | **20** | ADR: read code → write → verify → commit |
| Apollo | 15 | Parallel search (3-10 searches) |
| Nyx | 15 | Observability |
| Iris | 12 | GitHub: branch → commit → push → PR |
| Prometheus | 15 | Docker + CI/CD |
| **Talos** | **5** | Fast hotfix (1 file, no TDD) |

> Adjust `steps` in `opencode.json` as needed. Each tool call counts as 1 step.

---

## File Structure (after install)

```
your-project/
├── agents/              # (copied from pantheon/agents/)
│   ├── zeus.agent.md
│   ├── athena.agent.md
│   └── ...
├── skills/              # (copied from pantheon/skills/)
├── instructions/        # (copied from pantheon/instructions/)
├── prompts/             # (copied from pantheon/prompts/)
└── opencode.json        # Main config (OpenCode) or platform config
```
