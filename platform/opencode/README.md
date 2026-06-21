# OpenCode Platform

> **Status**: ✅ Active

---

## Format

OpenCode uses `.md` files with YAML frontmatter and a `opencode.json` config file.

| Property | Value |
|---|---|
| File format | `.md` with YAML frontmatter |
| Frontmatter | Subset of canonical (name, description, model, tools, skills) |
| Permission blocks | Appended to body (`edit: deny`, `execute: deny`) |
| Config file | `opencode.json` |

---

## Installation

### Quick install

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git

# Link the opencode config
ln -s pantheon/platform/opencode/opencode.json opencode.json
```

### Manual setup

1. Copy or link `platform/opencode/agents/` → `.opencode/agents/` in your project
2. Create `opencode.json` pointing to agents and instructions:

```json
{
  "instructions": [
    "./AGENTS.md",
    "./instructions/backend-standards.instructions.md",
    "./instructions/frontend-standards.instructions.md"
  ],
  "permission": {
    "skill": { "*": "allow" }
  }
}
```

### Via installer CLI

```bash
node scripts/install.mjs opencode
```

---

## Skill Discovery

OpenCode discovers skills from the skill registry. Pantheon's 18 skills are under `skills/`. To register:

```
skill-registry
```

---

## Model Assignment

OpenCode supports per-agent model routing via the `model` frontmatter field and [per-phase profiles](https://opencode.ai/docs/profiles) for assigning different models to different SDD phases.

---

## Plugin Installation

OpenCode supports plugins. To install Pantheon as a plugin:

```bash
# Method 1: Clone + Link
git clone https://github.com/ils15/pantheon.git ~/.opencode/plugins/pantheon
opencode plugin link ~/.opencode/plugins/pantheon

# Method 2: Manual copy  
cp -r agents ~/.config/opencode/agents/
cp opencode.json ~/.config/opencode/
```

### Plugin Structure
```
pantheon/
├── platform/
│   └── opencode/
│       ├── adapter.json     # Tool mappings and format config
│       ├── agents/          # OpenCode-adapted agent definitions
│       └── .opencode/
│           ├── plugins/
│           │   └── pantheon-tui/
│           │       ├── index.tsx    # TUI sidebar plugin (JSX + createMemo, reactive)
│           │       ├── package.json # Plugin manifest
│           │       └── dist/
│           │           └── tui.tsx  # Built entrypoint (loaded by OpenCode)
│           ├── package.json           # Plugin dependencies
│           └── tsconfig.json          # TypeScript config for plugins
├── agents/                   # Canonical VS Code agent definitions  
├── skills/                   # Agent Skills (27 skills)
├── instructions/             # Standards and instructions
├── prompts/                  # Prompt files
└── opencode.json             # Configuration
```

### TUI Sidebar Plugin

Pantheon includes a TUI sidebar plugin for OpenCode that renders a status panel showing:

| Field | Source | Reactive |
|-------|--------|----------|
| **Pantheon version** | `meta.version` (from `tui.json`) | Static (loaded once) |
| **Git branch** | `api.state.vcs?.branch` | ✅ Reactive |
| **MCP server status** | `api.state.mcp()` | ✅ Reactive (`createMemo`) |
| **Session count** | `api.state.session.count()` | ✅ Reactive |
| **Agent summary** | Static list (14 agents × 3 tiers) | Static |
| **OpenCode version** | `api.app.version` | Static |

**Stack:** JSX with `@opentui/solid` (`createMemo` for reactive reads), `@opencode-ai/plugin/tui` (`sidebar_content` slot, `order: 900`), `Show` for conditional rendering.

**Registration:** Explicit via `tui.json` — TUI plugins require `{"plugin": ["plugins/pantheon-tui/dist/tui.tsx"]}` in `.opencode/tui.json`. Unlike server/hooks plugins, TUI plugins do NOT auto-discover from the plugins directory.

**Auto-install:** The `scripts/install/opencode.mjs` script copies plugin files (step 2.8) and creates/merges `tui.json` (step 2.9) during `npm run setup` or `node scripts/install/opencode.mjs`.

### Compatibility
| Platform | Status |
|---|---|
| VS Code (Copilot) | ✅ Full support |
| OpenCode | ✅ Full support (via platform/opencode) |
| Claude Code | 🟡 Manual setup required |
| Cursor | 🟡 Rule conversion needed |
