# ⚡ Pantheon TUI Plugin

[![npm version](https://img.shields.io/npm/v/pantheon-tui-plugin)](https://www.npmjs.com/package/pantheon-tui-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenCode](https://img.shields.io/badge/OpenCode-TUI%20Plugin-blue)](https://opencode.ai)

A **sidebar panel** for the OpenCode TUI that brings the full Pantheon multi-agent system to your terminal. See agent status, session context usage, and available commands at a glance.

---

## ✨ Features

- **⚡ Pantheon Header** — Version badge + Python version, pulled from your project's `pyproject.toml`
- **⎇ Git Branch** — Shows current branch when inside a git repo
- **📊 Context Bar** — Real-time session context usage (tokens used / context window / cost) with color-coded progress bar
- **🔄 Compress Button** — One-click session compaction
- **📋 Commands Panel** — Collapsible list of all 16 Pantheon slash commands
- **🤖 Agents Registry** — Collapsible list of all 14 Pantheon agents with tier indicators (✦ premium, · default/fast)

## 📦 Installation

### Prerequisites

- [OpenCode](https://opencode.ai) installed
- Node.js 18+ or Bun

### Via npm (recommended)

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["pantheon-tui-plugin"]
}
```

OpenCode automatically installs npm plugins via Bun on startup.

### Via local development

Clone the Pantheon repo and copy to your OpenCode plugins:

```bash
git clone https://github.com/ils15/pantheon.git
cp -r pantheon/.opencode/plugins/pantheon-tui-plugin ~/.config/opencode/plugins/
```

---

## 🚀 Usage

Once installed, restart OpenCode TUI:

```bash
opencode
```

The Pantheon sidebar panel appears on the right side showing:

```
╔══ ⚡ Pantheon ═══ v1.0.0 · Python 3.12.3 ═══╗
║                                              ║
║  ⎇ main                                      ║
║                                              ║
║  Context                                     ║
║  ████████████░░░░░░░░ 62%                    ║
║  12,450 / 20,000 / $0.02                     ║
║                                              ║
║  [Compress]                                  ║
║                                              ║
║  ▼ Commands (16)                             ║
║    /pantheon — Council synthesis             ║
║    /audit — Full audit                       ║
║    /ping — Health check                      ║
║    ...                                       ║
║                                              ║
║  ▼ Agents (14)                               ║
║    ✦ @athena — Strategic planner              ║
║    · @apollo — Codebase discovery             ║
║    · @hermes — Backend                       ║
║    ...                                       ║
╚══════════════════════════════════════════════╝
```

### Interactive Elements

- **Click [Compress]** — Triggers session compaction
- **Click ▼ Commands** — Expand/collapse command list
- **Click ▼ Agents** — Expand/collapse agent registry

---

## 🧠 How It Works

The plugin uses the [OpenCode TUI Plugin API](https://opencode.ai/docs/plugins/) (`@opencode-ai/plugin/tui`) to register a `sidebar_content` slot with high priority (order: 900). It renders using `@opentui/solid` JSX components with reactive state via SolidJS signals.

### Data Sources

| Data | Source |
|------|--------|
| Pantheon version | `pyproject.toml` in project root |
| Git branch | `api.state.vcs.branch` |
| Session tokens | `api.state.session.messages()` last assistant message |
| Context window | Provider model's `limit.context` |
| Session cost | Accumulated from assistant message costs |

---

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/ils15/pantheon.git
cd pantheon/.opencode/plugins/pantheon-tui-plugin

# Install dependencies
npm install

# Build (copies index.tsx → dist/tui.tsx)
npm run build

# Publish to npm
npm publish
```

### Project Structure

```
pantheon-tui-plugin/
├── index.tsx          # Plugin source (SolidJS + @opentui/solid)
├── dist/
│   └── tui.tsx        # Built output (copied from index.tsx)
├── package.json
└── README.md
```

---

## 📄 License

MIT © [Igor Leite](https://github.com/ils15)
