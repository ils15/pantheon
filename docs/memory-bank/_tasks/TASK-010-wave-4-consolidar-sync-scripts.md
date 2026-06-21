# TASK-010: Wave 4 — Consolidar Sync Scripts (7 → 1)

**Date:** 2026-05-25
**Status:** Planned

## Objective
One parameterized sync script instead of 7 near-identical shell scripts.

## Files to modify
- `sync-opencode.sh` — delete
- `sync-claude.sh` — delete
- `sync-cursor.sh` — delete
- `sync-copilot.sh` — delete
- `sync-windsurf.sh` — delete
- `sync-continue.sh` — delete
- `sync-cline.sh` — delete
- `sync-platform.sh` — CREATE

## Steps
1. Analyze all 7 sync scripts to identify the common pattern
2. Create `sync-platform.sh` with parameterized platform config
3. Map per-platform config:

   | Platform | Dest dir | File ext | Extra |
   |---|---|---|---|
   | opencode | .opencode/agents/ | .md | opencode.json merge |
   | claude | .claude/agents/ | .md | settings.json |
   | cursor | .cursor/rules/ | .mdc | — |
   | copilot | .github/agents/ | .agent.md | .vscode/settings.json |
   | windsurf | .windsurf/rules/ | .md | workflows |
   | continue | .continue/rules/ | .md | config.yaml |
   | cline | .clinerules/ | (no ext) | — |

4. Test with all 7 platforms
5. Delete old individual scripts

## Dependencies
- None

## Completion criteria
- Single `sync-platform.sh` replaces all 7 individual scripts
- All 7 platforms can be synced via `./sync-platform.sh <platform>`
- Old individual scripts deleted
- Script tested with all 7 platforms
