# TASK-013: Wave 7 — Configurar Hooks Restantes

**Date:** 2026-05-25
**Status:** Planned

## Objective
Wire up unused security/observability hooks.

## Files to modify
- `.claude/settings.json` — add hook registrations

## Steps
1. Add `PreToolUse` for `scan-secrets.sh` (Edit, Bash events)
2. Add `PreToolUse` for `validate-tool-safety.sh` (Bash event)
3. Add `PostToolUse` failure handler (log-failure.sh or inline)
4. Add subagent delegation tracking hooks
5. Test all 3 existing hooks still work

## Dependencies
- None

## Completion criteria
- `scan-secrets.sh` runs as PreToolUse hook on Edit and Bash events
- `validate-tool-safety.sh` runs as PreToolUse hook on Bash events
- Failure handler registered as PostToolUse hook
- Subagent delegation tracking hooks registered
- All 3 existing hooks continue to work correctly
