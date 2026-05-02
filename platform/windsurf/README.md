# Windsurf Platform

## Status
✅ **Production Ready** — Modern rule format (Wave 8+).

The Windsurf adapter (v3.0.0) generates `.windsurf/rules/` markdown files with YAML frontmatter, supporting all 4 activation modes.

## How It Works

The sync engine converts canonical Pantheon agents into Windsurf `.windsurf/rules/` files. Each rule has:

- `trigger: model_decision` — Cascade decides when to use based on description
- `trigger: always_on` — Applied to every conversation
- `trigger: glob` — Auto-activates when file matches pattern
- `trigger: manual (@rule-name)` — Only when mentioned

## Installation

```bash
node scripts/install.mjs --target /path/to/your-project
```

This creates `.windsurf/rules/` with all 16 agent rules.

## Adapter Configuration

Located at `platform/windsurf/adapter.json` (v3.0.0):
- Maps Windsurf-specific tool names
- Sets proper trigger mode
- Generates YAML frontmatter with `trigger`, `description`, `globs`

## Key Differences from VS Code

| Feature | VS Code | Windsurf |
|---------|---------|----------|
| Format | `.agent.md` | `.md` in `.windsurf/rules/` |
| Activation | Agent selector | `@name` mention or auto-trigger |
| Frontmatter | 10+ fields | Minimal: trigger, description, globs |
| Skills | Full support | Via AGENTS.md or rules |
| Handoffs | Native UI buttons | Not supported |

## Generated Files

Rules are generated at `platform/windsurf/rules/*.md` via `npm run sync`.
