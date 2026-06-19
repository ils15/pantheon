# @pantheon/tui-plugin

Pantheon TUI sidebar plugin for OpenCode — shows version badge, Pro/Free tier indicator, and full agent registry with role + model tier in a sidebar panel.

## Installation

```bash
# Via npm (auto-installed by OpenCode on next startup)
npm install @pantheon/tui-plugin

# Or add to opencode.json:
# "plugin": ["@pantheon/tui-plugin"]
```

## Requirements

- OpenCode TUI (terminal UI, not headless/web)
- Dependencies are provided by the OpenCode runtime:
  - `@opentui/solid` (TUI rendering primitives)
  - `solid-js` (reactive signals)

These come bundled with OpenCode. No manual install needed.

## Verify

The plugin renders a sidebar panel at the bottom of the right sidebar:
```
┌─────────────────┐
│ Pantheon  v0.1.0 │
│ Tier: Pro · 14  │
│ Agents          │
│ ★ @zeus         │
│ · @hermes       │
│ ...             │
└─────────────────┘
```

## Local Development

Source lives at `platform/opencode/.opencode/plugins/pantheon-tui.ts`. 
Run `./sync-platform.sh opencode` to copy to `~/.config/opencode/plugins/`.
