---
description: "Install Pantheon agents to global config — sync canonical sources, deploy, and verify"
---

# /pantheon-install — Pantheon Installation

Install the Pantheon agent system into your OpenCode global config.

Runs the 3-phase pipeline: **SYNC → INSTALL → VERIFY**

## Usage

```
/pantheon-install                      # Default (opencode → ~/.config/opencode/)
/pantheon-install --platform all       # All 8 platforms
/pantheon-install --platform opencode,claude
/pantheon-install --check-only         # Verify only (no changes)
/pantheon-install --dry-run            # Preview without writing
/pantheon-install --clean              # Fresh install (wipe + reinstall)
/pantheon-install --verbose            # Detailed output
```

## Phases

1. **SYNC** — Regenerates platform-specific agent files from canonical sources
2. **INSTALL** — Deploys agents, skills, and instructions to the target directory
3. **VERIFY** — Checks agent count, frontmatter integrity, permissions, and docs

## Examples

```
/pantheon-install                       # Standard install
/pantheon-install --platform all        # Full multi-platform setup
/pantheon-install --check-only          "Is my install healthy?"
/pantheon-install --dry-run             "What would change if I ran this?"
```

## Notes

- Uses `scripts/pantheon-install.mjs` under the hood
- Defaults to OpenCode platform at `~/.config/opencode/`
- See `docs/pantheon-install.md` for full documentation

## Flags:

$ARGUMENTS
