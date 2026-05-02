# Pantheon Platforms

> Which AI coding platform should you use Pantheon with? Here's how they compare.

> 📖 **Setup guides:** [VS Code](platforms/vscode.md) · [OpenCode](platforms/opencode.md) · [Claude Code](platforms/claude.md) · [Cursor](platforms/cursor.md) · [Windsurf](platforms/windsurf.md) · [Cline](platforms/cline.md) · [Continue.dev](platforms/continue.md)

---

## Overview

Pantheon's 16 agents are authored once in `agents/` (VS Code `.agent.md` format) and **automatically transformed** into each platform's native format via the [sync engine](../scripts/sync-platforms.mjs). You get the same agents, skills, and workflow regardless of platform.

---

## Comparison Table

| Feature | VS Code | OpenCode | Claude Code | Cursor | Windsurf | Cline | Continue.dev |
|---|---|---|---|---|---|---|---|---|---|
| **Agent format** | `.agent.md` | `.md` + frontmatter | `.md` + comma-separated tools | `.mdc` rules | `.md` (stub) | `.clinerules` plain md | **`.md` rule files** |
| **Agent loading** | Built-in agent system | `opencode/agents/` | `.claude/agents/` | `.cursor/rules/` | TBD | `.clinerules/` directory | **`.continue/rules/`** |
| **Skill support** | `skill` tool in frontmatter | Skill registry config | Comma-separated skills in frontmatter | Limited (body prepend) | TBD | ❌ Not supported | **❌ Rules only** |
| **Hook/automation** | ✅ Full (.github/hooks/) | ⚠️ Partial (opencode.json) | ❌ Not supported | ❌ Not supported | ❌ Not supported | ❌ Not supported | **❌ Not supported** |
| **Subagent delegation** | `runSubagent` | Task tool | Task tool | Native subagents | Cascade | ❌ Single agent | **❌ Not supported** |
| **Parallel execution** | ✅ Yes | ✅ Yes | ⚠️ Sequential | ✅ Yes | ❌ | ❌ Single agent | **❌ Single-threaded** |
| **Model routing** | Per-agent model field | Per-agent model field + profiles | Per-agent model field | Per-rule model | TBD | ❌ Settings only | **❌ Single model per session** |
| **Status** | ✅ Active | ✅ Active | ✅ Active | ✅ Active | 🧪 Preview | 🧪 Preview | **🧪 Preview** |

---

## Which Platform Should I Pick?

### VS Code Copilot — Best for teams
- Full agent lifecycle hooks (security, formatting, logging)
- Plugin marketplace integration (`ils15/pantheon`)
- Richest feature set: subagents, parallel execution, per-phase model routing
- **Pick this if:** your team uses VS Code and wants the full Pantheon experience

### OpenCode — Best for terminal-first workflows
- Lightweight, runs in terminal, no GUI needed
- Per-phase model profiles (cheap models for exploration, powerful for design)
- Skill discovery via skill registry
- **Pick this if:** you prefer terminal-based coding or need multi-model routing

### Claude Code — Best for Claude power users
- Same agent definitions, simplified frontmatter (comma-separated tools)
- Lightweight installation via installer script
- **Pick this if:** you're already in the Claude ecosystem

### Cursor — Best for Cursor native experience
- Agents become `.mdc` rules — use `@agent-name` in chat
- Cursor's native subagent delegation
- **Pick this if:** you use Cursor as your primary IDE

### Windsurf — Coming soon
- Template adapter exists, full platform support planned
- **Pick this if:** you want to help shape Windsurf support

### Cline — Best for open-source agent users
- Open-source VS Code extension with autonomous agent mode
- Rules are plain markdown — no frontmatter, no tool declarations
- Lightweight: just copy `.clinerules/` and go
- **Pick this if:** you use Cline and want Pantheon's agent knowledge as system prompts

### Continue.dev — Best for flexible model configuration
- Open-source, works with any LLM provider (OpenAI, Anthropic, Google, local)
- Rules are injected into system prompts — no agent system, just knowledge
- Continue Hub for sharing rules, models, and MCP tools across teams
- MCP server support for extended capabilities
- **Pick this if:** you use Continue and want Pantheon's agent knowledge as system-prompt rules

---

## Format Reference

| Format | Example | Used by |
|---|---|---|
| `.agent.md` | `agents/zeus.agent.md` with YAML frontmatter | VS Code (canonical) |
| `.md` (array tools) | `platform/opencode/agents/zeus.md` | OpenCode |
| `.md` (comma tools) | `platform/claude/agents/zeus.md` | Claude Code |
| `.mdc` | `platform/cursor/rules/zeus.mdc` | Cursor |
| `.clinerules` | `platform/cline/.clinerules/zeus` (no extension) | Cline |

---

## Adding a New Platform

1. Copy `platform/_template/` → `platform/<name>/`
2. Edit `adapter.json` with target format rules
3. Run `npm run sync` → generates agents in `platform/<name>/agents/`
4. Create `<name>/README.md` with platform-specific notes
5. Add to matrix in this file
6. Update CI validation in `.github/workflows/`
