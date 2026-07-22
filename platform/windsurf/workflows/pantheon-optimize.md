---
description: "Scan, clean, cache, and archive Pantheon project files. Scans for bloat, archives completed deepwork, migrates flat files to MCP memory, and reports optimization opportunities. Usage: /pantheon-optimize"
---
# /pantheon-optimize — Pantheon Project Optimizer

**What:** Multi-mode optimization: scans for documentation bloat, archives completed deepwork, migrates memory-bank flat files to MCP memory (ChromaDB), and reports token savings.

## Usage

```
/pantheon-optimize                          → Full scan + compress (default)
/pantheon-optimize --dry-run                → Preview only, no changes
/pantheon-optimize --archive                → Archive completed deepwork sessions
/pantheon-optimize --cache                  → Migrate memory-bank to MCP memory
/pantheon-optimize --path=<dir>             → Limit scan to directory
/pantheon-optimize --all                    → Run all modes (default)
```

## Modes

### `--archive` — Deepwork Archiving
Archives completed deepwork sessions from `.pantheon/deepwork/<slug>/` to `.pantheon/deepwork/archive/<slug>/`.

**Criteria:** A session is "completed" if it has a `REVIEW.md` containing "APPROVED".

```
/pantheon-optimize archive                          → Interactive (ask per slug)
/pantheon-optimize archive --dry-run                → Preview only
/pantheon-optimize archive --auto                   → Archive all completed
/pantheon-optimize archive --auto --keep=2           → Keep only PLAN.md + REVIEW.md
/pantheon-optimize archive --auto --compress         → Single .md per slug
```

### `--cache` — Memory Bank Migration
Scans `.pantheon/memory-bank/` for flat `.md` files and migrates them to the MCP memory server (ChromaDB).

**What it does:**
1. Reads all `.md` files in `.pantheon/memory-bank/`
2. Chunks by heading (## sections)
3. Calls `memory_store()` for each chunk with appropriate namespace
4. Optionally archives the original files after successful migration

```
/pantheon-optimize cache                     → Preview candidates, ask confirm
/pantheon-optimize cache --dry-run           → Show what would migrate
/pantheon-optimize cache --auto              → Migrate + archive originals
```

### `--dry-run` (global flag)
Prevents any destructive action. Shows what WOULD be done.

### Default mode (no flags)
Runs bloat scan on all `.md` and `.json` files + compression report.

## Output

```
🧹 Pantheon Optimize Report

📦 Bloat Scan: 47 .md + 12 .json files
   → 3 oversized files found
   → ~2.4K tokens recoverable

📁 Deepwork Archive: 15 candidates
   → 12 completed (REVIEW.md APPROVED)
   → 3 in progress (skipped)
   → Run with --archive --auto to archive 12 sessions

🗄️  Memory Cache: 24 files in memory-bank/
   → 18 already in MCP memory (dedup)
   → 6 candidates for migration (~3.2K tokens)
   → Run with --cache to migrate

📊 Summary:
   ⚡ 15 files optimizable → ~5.6K tokens
   🗑️  12 deepworks archivable → ~320 files cleanup
   🗄️  6 memory files → MCP migration ready
```
