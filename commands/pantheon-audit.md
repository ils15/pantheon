---
description: "Audit current changes for code quality, coverage, and security. Usage: /pantheon-audit"
agent: "themis"
---
# /pantheon-audit — Quality & Security Audit

**What:** Runs lint (ruff/eslint), format (black/prettier), coverage (>80%), and OWASP Top 10 checks. Returns structured report with verdict.
**Usage:** `/pantheon-audit [--scope=staged|all] [--checks=quality,security,coverage]`
**Output:** Structured report with APPROVED / NEEDS_REVISION / FAILED verdict
