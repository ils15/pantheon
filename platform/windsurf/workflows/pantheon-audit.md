---
description: "Audit code quality: heuristic scan (Layer 1, zero LLM) + Themis review (Layer 2-3). Usage: /pantheon-audit [--light|--full|--plan]"
---
# /pantheon-audit — Quality & Security Audit (v2)

**What:** Multi-layer code audit. Layer 1 runs heuristic scan (zero tokens, <2s). If BLOCKING, returns score and issues. If APPROVED, proceeds to Themis deep review.

**Usage:**
- `/pantheon-audit` — Full audit: Layer 1 heuristic → Layer 2 review → Layer 3 verification
- `/pantheon-audit --light` — Layer 1 heuristic only (quick check)
- `/pantheon-audit --full` — Force full review even if Layer 1 passes
- `/pantheon-audit --plan` — Verification planning only (no scan)

**Output:** Score (0-100) + Verdict (APPROVED/BLOCKING/NEEDS_REVISION/FAILED) + Issues list

## Layers

### Layer 1 — Heuristic Scan
```
python3 scripts/themis_heuristic_scan.py [--path=<dir>]
```
Zero tokens, <2s. Checks: ruff, biome, anti-pattern slop, hash-anchored edits.
Returns score 0-100 + APPROVED/BLOCKING.

### Layer 2 — Themis Deep Review
Only if Layer 1 is APPROVED. Uses LLM (~500 tokens) for:
- Confidence scoring por arquivo
- Regression prediction (diff analysis)
- OWASP Top 10 security audit

### Layer 3 — Verification Planning
Only for complex changes (N>5 files). Before changing:
1. Themis sugere plano de verificação
2. Executa verificações automaticamente
3. Só aprova se TODAS passarem
