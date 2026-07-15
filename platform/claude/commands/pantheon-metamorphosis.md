---
description: "Intelligent refactoring with LSP analysis, gap analysis, TDD, and verification. Usage: /pantheon-metamorphosis"
agent: "zeus"
---
# /pantheon-metamorphosis — Intelligent Refactoring

**What:** LSP analysis → Metis gap analysis → TDD refactoring → Themis verification. Tests must pass before AND after. No behavior changes.
**Usage:** `/pantheon-metamorphosis <target> [--scope=file|module|project] [--strategy=safe|aggressive]`
**Agents:** Apollo (analysis) → Athena+Metis (plan) → Hermes (exec) → Themis (verify)
