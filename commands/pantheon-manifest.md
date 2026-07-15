---
description: "Sync canonical agents, install to global OpenCode config, and verify the result"
agent: zeus
---

# /pantheon-manifest — Full Manifest Pipeline

**What:** One-command pipeline: sync canonical agents → install to target OpenCode directory → verify agent files, MCP servers, and config integrity

**Usage:** `/pantheon-manifest [--check-only] [--target path] [--platforms opencode] [--skip-sync] [--skip-install] [--verbose]`

**When:** After editing agents, skills, or platform adapter config. Also useful for diagnosing installation issues.

**Invokes:** `node scripts/manifest.mjs` with forwarded arguments

## Pipeline

| Step | Action | What It Checks |
|------|--------|---------------|
| 1. SYNC | `node scripts/sync-platforms.mjs <platform>` | Generates platform-specific agent files from canonical `agents/*.agent.md` |
| 2. INSTALL | `node scripts/install.mjs --target <path> --platforms <list>` | Copies agents, config, skills, commands to target directory |
| 3. VERIFY | Agent count, MCP connectivity, opencode.json integrity | All 14 agents present, valid frontmatter, MCP servers connected |
| 4. REPORT | Structured summary | Green checkmarks or red failures with actionable messages |

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--target` | `~/.config/opencode` | Target OpenCode configuration directory |
| `--platforms` | `opencode` | Comma-separated platform list (opencode, claude, cursor, ...) |
| `--check-only` | off | Verify only — skip sync and install steps |
| `--skip-sync` | off | Skip sync step (already synced) |
| `--skip-install` | off | Skip install step (already installed) |
| `--verbose` | off | Show all output including pass messages |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks pass |
| 1 | Warnings only (non-blocking) |
| 2 | Errors detected (blocking) |

## When to Run

- After editing any `agents/*.agent.md` file
- After adding/removing MCP servers
- After changing platform adapter config (`platform/*/adapter.json`)
- First thing in a new Pantheon session to verify everything is healthy
- When MCP servers appear disconnected

## What Success Looks Like

```
>>> SYNC
  ... OpenCode sync completed ... all N files up-to-date

>>> INSTALL
  ... N agents installed, N skills, N commands ...

>>> VERIFY
  ✓ 14 of 14 agent files installed
  ✓ All installed agents have valid frontmatter
  ✓ 5 MCP server(s) connected
  ✓ default_agent: zeus
  ✓ 5 MCP server(s) configured, 3 pantheon-*

>>> REPORT
  ✓ 12 passed, 0 warnings, 0 errors
  ✨ Pantheon manifest is UP TO DATE
```

## What Failure Looks Like

```
>>> SYNC
  ✗ OpenCode sync failed (exit 1)

>>> INSTALL
  ✗ Install failed (exit 1)

>>> VERIFY
  ✗ 3 agent(s) missing from install: nyx, gaia, iris
  ✗ opencode.json not found

>>> REPORT
  ✓ 4 passed, 1 warnings, 3 errors
  ✘ Pantheon manifest has errors — run with --verbose for details
```

## $ARGUMENTS
