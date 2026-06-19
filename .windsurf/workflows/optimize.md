---
description: "Scan for documentation bloat and optimize. Use --dry-run for audit-only report. Covers all .md and .json files with compression applied to docs/memory-bank/."
---
# /optimize — Documentation Optimization

**What:** Scans all `.md` and `.json` files for context bloat, redundant documentation, and oversized files. By default, compresses and consolidates findings. Use `--dry-run` for audit-only report.

**Usage:**
- `/optimize` — Full scan + compress/consolidate (default)
- `/optimize --dry-run` — Scan and report only, no changes
- `/optimize --path=<dir>` — Limit scan to a specific directory

**Scope:**
- All `.md` and `.json` files scanned for bloat, redundancy, and size
- Compression and consolidation applied to `docs/memory-bank/`
- Reports token savings and optimization opportunities

**Replaces:** `/token-audit` (use `/optimize --dry-run` for audit-only reports). The previous `/optimize` behavior (memory-bank compression) is now the default mode.

**Note:** Non-destructive — archives obsolete content, never deletes meaningful data.
