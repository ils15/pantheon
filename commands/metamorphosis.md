# /metamorphosis — Intelligent Refactoring

**What:** LSP analysis → Metis gap analysis → TDD refactoring → Themis verification.
**Usage:** `/metamorphosis <target> [--scope=file|module|project] [--strategy=safe|aggressive]`
**Safety:** Tests must pass before AND after. No behavior changes.
**Agents:** Apollo (analysis) → Athena+Metis (plan) → Hermes (exec) → Themis (verify).
