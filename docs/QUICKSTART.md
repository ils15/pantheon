# Pantheon Quick Start

## What is Pantheon

A multi-agent framework for , OpenCode, , , , , and . 14 specialized agents with TDD enforcement, quality gates (Themis), and memory MCP. **v4.0** — 100/100 audit score.

## Installation

### Option 1: CLI (recommended, coming soon)
```bash
npx @pantheon/cli init
```

### Option 2: Git clone
```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm run sync
```

Then copy to your platform's config dir:
```bash
# OpenCode
cp -r .opencode/* ~/.config/opencode/
# Or use platform-specific scripts
```

## v4.0 What's New

- **14 commands** — all `/pantheon-*` (remember, search, consolidate, forget, audit v2, cancel...)
- **Themis 2.0** — 3-layer review (heuristic scanner + deep review + verification planning)
- **Memory MCP** — agents read-only, Zeus auto-stores every result
- **TUI Plugin** — live deepwork status + activity feed + toast notifications
- **YAGNI + Anti-overengineering** — built into every agent's workflow
- **Background Agents** — parallel execution with `subagent_depth: 2`

## Usage

| Command | What it does |
|---------|-------------|
| `/pantheon` | Council multi-agent synthesis |
| `/pantheon-status` | System status & agent registry |
| `/pantheon-audit --light` | Code quality scan (zero LLM) |
| `/pantheon-deepwork` | Multi-phase task execution |
| `/pantheon-remember` | Store in memory |
| `/pantheon-search` | Search memory |
| `/pantheon-cancel` | Stop auto-continuation |

Full list: 14 commands — all start with `/pantheon-`.
