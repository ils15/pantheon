# Pantheon Documentation Index

> **A multi-agent orchestration framework** — 14 specialized agents, 7 platforms, 45 skills.

---

## Quick Navigation

| If you need... | Go here |
|---|---|
| **What is Pantheon?** | [README.md](../README.md) |
| **Quick start / Install** | [INSTALLATION.md](INSTALLATION.md) |
| **Which platform to pick** | [PLATFORMS.md](PLATFORMS.md) |
| **Agent reference** | [AGENTS.md](../AGENTS.md) |
| **MCP tiers & tools** | [mcp-tools.md](mcp-tools.md), [mcp-user-guide.md](mcp-user-guide.md) |
| **Release process** | [RELEASING.md](RELEASING.md) |
| **Contributing** | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| **Changelog** | [CHANGELOG.md](../CHANGELOG.md) |
| **MCP Tool Registry** | [mcp-tools.md](mcp-tools.md) |
| **MCP User Guide** | [mcp-user-guide.md](mcp-user-guide.md) |
| **MCP Tiers** | `.pantheon/tiers.json` |

---

## Architecture at a Glance

**Pantheon** replaces the single-agent coding trap with **specialized agents**:
- **Zeus** orchestrates the workflow (plan → implement → review → deploy)
- **Athena** plans architecture; **Apollo** discovers code; **Hermes/Aphrodite/Demeter/Prometheus** implement
- **Themis** reviews every phase (mandatory quality gate); **Mnemosyne** documents decisions
- **Iris** manages GitHub; **Talos** handles hotfixes; **Gaia** analyzes remote sensing

All agents live as **canonical `.agent.md` files** in `agents/` and are auto-generated into platform-specific formats via the [sync engine](../scripts/sync-platforms.mjs).

---

## Platform Support Matrix

| Platform | Format | Status | Install Method |
|---|---|---|---|
| **VS Code Copilot** | `.agent.md` | ✅ Active | Plugin marketplace, `/pantheon-install`, or `./sync-platform.sh copilot` |
| **OpenCode** | `.md` + `opencode.json` | ✅ Active | `/pantheon-install` or `./sync-platform.sh opencode` |
| **Claude Code** | `.md` (comma-separated tools) | ✅ Active | `node scripts/install.mjs claude` or `./sync-platform.sh claude` |
| **Cursor** | `.mdc` rules | ✅ Active | `node scripts/install.mjs cursor` or `./sync-platform.sh cursor` |
| **Windsurf** | `.md` (stub) | ✅ Active | `node scripts/install.mjs windsurf` or `./sync-platform.sh windsurf` |
| **Cline** | `.md` | ✅ Active | `node scripts/install.mjs cline` or `./sync-platform.sh cline` |
| **Continue.dev** | `.md` rules | ✅ Active | `node scripts/install.mjs continue` or `./sync-platform.sh continue` |

---

## Where to Find What

| Concern | Location |
|---|---|
| Agent definitions (edit here) | `agents/*.agent.md` |
| Platform configs (auto-generated) | `platform/<name>/agents/` |
| Shared skills | `skills/<name>/SKILL.md` |
| Standards & instructions | `instructions/*.instructions.md` |
| Prompt templates | `prompts/*.prompt.md` |
| GitHub Actions workflows | `.github/workflows/` |
| CI/CD hooks | `scripts/hooks/` |
| MCP tool registry (canonical) | [docs/mcp-tools.md](mcp-tools.md) |
| MCP user guide (adding custom MCPs) | [docs/mcp-user-guide.md](mcp-user-guide.md) |
| MCP tiers (none/essential/recommended/full) | `.pantheon/tiers.json` |
| MCP recommendations per project type | [docs/mcp-recommendations.md](mcp-recommendations.md) |
| Project memory (sprints, decisions) | `.pantheon/memory-bank/` |
| Plugin manifests | `plugin.json`, `.github/plugin/plugin.json` |

---

## Platform READMEs

Each platform has its own README with installation notes and format details:

- [OpenCode](../platform/opencode/README.md)
- [Claude Code](../platform/claude/README.md)
- [Cursor](../platform/cursor/README.md)
- [Windsurf](../platform/windsurf/README.md)
- [Cline](../platform/cline/README.md) *(coming soon)*
- [Continue](../platform/continue/README.md)
- [Template (add new platform)](../platform/_template/README.md)
