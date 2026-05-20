# ADR-0001: Rename Agents to English Names

**Status:** Accepted
**Date:** 2026-05-02

## Context
Agent names were in Portuguese (planejador, revisor, etc.), causing inconsistency with English-based tooling and documentation.

## Decision
All agent names use English mythology names (Zeus, Athena, Hermes, etc.) for consistency with VS Code Copilot conventions.

## Consequences
- All `.agent.md` files renamed
- All platform adapters updated (Claude, Cursor, Windsurf, etc.)
- Better alignment with AI tooling ecosystem
