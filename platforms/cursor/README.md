# Cursor Platform

## Installation

```bash
node scripts/install.mjs cursor
```

This copies the generated `.mdc` rules to `.cursor/rules/` in the user's project.

## Format Notes

Cursor uses `.mdc` (Markdown with frontmatter) files in `.cursor/rules/`:
- Each agent is a "rule" that Cursor can load
- Use `@<agent-name>` in chat to invoke the agent
- Rules can have `globs` and `description` in frontmatter

## Quick Start

1. Install: `node scripts/install.mjs cursor`
2. Open Cursor in your project
3. Type `@zeus Implement JWT auth` to start orchestrating
