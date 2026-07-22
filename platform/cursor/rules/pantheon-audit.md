---
description: "Audit: heuristic scan (zero LLM) + Themis review. Usage: /pantheon-audit [--light|--full|--plan]"
agent: "themis"
---
# /pantheon-audit — Quality & Security Audit

**What:** Layer 1 heuristic scan (zero tokens, <2s). If BLOCKING, returns score. If APPROVED, Themis deep review.

**Usage:**
- `/pantheon-audit` — Full audit (Layer 1 → 2 → 3)
- `/pantheon-audit --light` — Layer 1 only (quick scan)
- `/pantheon-audit --full` — Force full review
- `/pantheon-audit --plan` — Verification planning only

## Layers

### Layer 1 — Heuristic Scan
`python3 scripts/themis_heuristic_scan.py [--path=<dir>]`
Zero tokens, <2s. Checks: ruff, biome, anti-pattern slop, anti-overengineering (YAGNI), hash-anchored edits. Returns score 0-100 + APPROVED/BLOCKING.

### Layer 2 — Themis Deep Review
~500 tokens. Confidence scoring, regression prediction, OWASP Top 10.

### Layer 3 — Verification Planning
For N>5 file changes. Sugere plano de verificação antes de implementar.
