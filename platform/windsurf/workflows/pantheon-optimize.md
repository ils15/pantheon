---
description: "Scan for documentation bloat and optimize. Use --dry-run for audit-only report. Covers all .md and .json files with compression applied to .pantheon/memory-bank/. Usage: /pantheon-optimize"
---
# /pantheon-optimize — Documentation Optimization

**What:** Scans all `.md` and `.json` files for context bloat, redundant documentation, and oversized files. By default, compresses and consolidates findings. Use `--dry-run` for audit-only report.

**Usage:**
- `/pantheon-optimize` — Full scan + compress/consolidate (default)
- `/pantheon-optimize --dry-run` — Scan and report only, no changes
- `/pantheon-optimize --path=<dir>` — Limit scan to a specific directory

**Scope:**
- All `.md` and `.json` files scanned for bloat, redundancy, and size
- Compression and consolidation applied to `.pantheon/memory-bank/`
- Reports token savings and optimization opportunities

**Replaces:** `/token-audit` (use `/pantheon-optimize --dry-run` for audit-only reports). The previous `/pantheon-optimize` behavior (memory-bank compression) is now the default mode.

**Note:** Non-destructive — archives obsolete content, never deletes meaningful data.
