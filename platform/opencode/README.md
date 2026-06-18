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
│           │   └── pantheon-tui.ts   # TUI sidebar plugin (version + agents)
│           ├── package.json           # Plugin dependencies
│           └── tsconfig.json          # TypeScript config for plugins
├── agents/                   # Canonical VS Code agent definitions  
├── skills/                   # Agent Skills (27 skills)
├── instructions/             # Standards and instructions
├── prompts/                  # Prompt files
└── opencode.json             # Configuration
```

### TUI Sidebar Plugin

Pantheon includes a TUI plugin that renders a **sidebar panel** in the OpenCode terminal UI, showing:

- **Version badge** — `Pantheon v3.11.0` (reads `plugin.json` / `package.json`)
- **Model tier** — `Pro` (premium agents: athena, themis) or `Free`
- **Agent registry** — all 17 agents with role and tier

This mirrors the sidebar display from oh-my-opencode-slim.

**Setup:**

```bash
# 1. Copy the plugin to your project or global config
cp -r platform/opencode/.opencode/plugins ~/.config/opencode/

# 2. Install dependencies (in your config dir)
cd ~/.config/opencode && npm install

# 3. Restart OpenCode — the sidebar panel appears automatically
```

The plugin is auto-loaded from `.opencode/plugins/*.ts` (project-level) or `~/.config/opencode/plugins/*.ts` (global). No `opencode.json` registration needed — OpenCode discovers plugins in these directories at startup.

**Dependencies:**
- `@opencode-ai/plugin` (TUI plugin API)
- `@opentui/solid` (JSX rendering — optional, bundled with OpenCode)

### Compatibility
| Platform | Status |
|---|---|
| VS Code (Copilot) | ✅ Full support |
| OpenCode | ✅ Full support (via platform/opencode) |
| Claude Code | 🟡 Manual setup required |
| Cursor | 🟡 Rule conversion needed |
