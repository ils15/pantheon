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
ln -s pantheon/platforms/opencode/opencode.json opencode.json
```

### Manual setup

1. Copy or link `platforms/opencode/agents/` → `.opencode/agents/` in your project
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
