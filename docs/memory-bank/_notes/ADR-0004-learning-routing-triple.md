# ADR-0004: Learning Routing Triple

**Status:** Accepted
**Date:** 2026-05-16

## Context
Framework mixed immutable facts (stack, commands), reusable patterns (multi-step procedures), and project conventions (naming, style) in the same bucket, causing duplication and inconsistency.

## Decision
Separate into 3 categories with distinct load policies:

| Category | Storage | Auto-loaded? |
|---|---|---|
| Facts | `/memories/repo/` | Yes (zero token cost) |
| Patterns | `skills/` | No (on-demand) |
| Conventions | `.github/copilot-instructions.md` | Yes |

## Consequences
- Facts never change, auto-loaded
- Patterns loaded on-demand by name
- Conventions shared with team via repo
- Rule: if something belongs in another category, move it — don't duplicate
