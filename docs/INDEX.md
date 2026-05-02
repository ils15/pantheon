# Pantheon Documentation Index

> **A multi-agent orchestration framework** — 12 specialized agents, 5 platforms, 18 skills.

---

## Quick Navigation

| If you need... | Go here |
|---|---|
| **What is Pantheon?** | [README.md](../README.md) |
| **Quick start / Install** | [INSTALLATION.md](INSTALLATION.md) |
| **Which platform to pick** | [PLATFORMS.md](PLATFORMS.md) |
| **Agent reference** | [AGENTS.md](../AGENTS.md) |
| **Release process** | [RELEASING.md](RELEASING.md) |
| **Contributing** | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| **Changelog** | [CHANGELOG.md](../CHANGELOG.md) |

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
| **VS Code Copilot** | `.agent.md` | ✅ Active | Plugin marketplace or manual copy |
| **OpenCode** | `.md` + `opencode.json` | ✅ Active | `opencode/` config |
| **Claude Code** | `.md` (comma-separated tools) | ✅ Active | `node scripts/install.mjs claude` |
| **Cursor** | `.mdc` rules | ✅ Active | `node scripts/install.mjs cursor` |
| **Windsurf** | `.md` (stub) | 🧪 Preview | Coming soon |

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
| CI/CD hooks | `.github/hooks/` |
| Project memory (sprints, decisions) | `docs/memory-bank/` |
| Plugin manifests | `plugin.json`, `.github/plugin/plugin.json` |

---

## Platform READMEs

Each platform has its own README with installation notes and format details:

- [VS Code](../platform/vscode/README.md)
- [OpenCode](../platform/opencode/README.md)
- [Claude Code](../platform/claude/README.md)
- [Cursor](../platform/cursor/README.md)
- [Windsurf](../platform/windsurf/README.md)
- [Template (add new platform)](../platform/_template/README.md)
