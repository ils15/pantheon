
Pantheon v3.6.0 is a **token optimization release** — reduces auto-loaded context by **97%** (27K → 748 tokens) while keeping all 18 agents, 42 skills, and full functionality intact. Inspired by RTK (Rust Token Killer) patterns for smart filtering and progressive disclosure.

### Why v3.6.0 exists

Users reported that even a simple "oi" consumed 17-20K tokens per session. Investigation revealed massive redundancy across AGENTS.md (1455 lines), memory bank (6 files with overlapping content), 48 skills with verbose descriptions, and verbose command templates. This release systematically eliminates every source of token waste.

### Added

- **`/token-audit` command** — Audits any repository for token waste, finds redundant context files, measures baseline, and recommends optimizations
- **`optimize-context.sh` script** — CLI tool that scans for AI context files, measures baseline tokens, detects red flags (historical content, duplication, oversized files), and projects savings
- **`skills/token-audit/SKILL.md`** — 6-step audit methodology: discover, map redundancy, measure baseline, identify red flags, generate report, apply optimizations
- **`skills/memory-bank-rules/SKILL.md`** — Complete guide to ADR, PLAN, NOTE, and TASK file types — what each is, when to create it, max line limits, and anti-patterns
- **`skills/memory-bank-optimization/SKILL.md`** — Audit and compress memory bank files, enforce lazy-load patterns, reduce auto-loaded context by 80-90%

### Changed

- **AGENTS.md: 1455 → 59 lines (-96%)** — Removed verbose agent descriptions, long examples, detailed dispatch patterns, lifecycle hooks documentation. Kept compact registry, golden rules, commands, model tiers, memory structure.
- **Memory bank: 6 → 3 core files** — Consolidated `00-overview.md` + `01-architecture.md` + `02-components.md` + `03-tech-context.md` → `00-project.md` (56 lines, zero duplication)
- **ADRs consolidated** — `decisions/` directory merged into `_notes/` as numbered ADRs (ADR-0001 through ADR-0004)
- **Skills: 48 → 42** — 5 merges (orchestration→coordination, perf→database, vector→rag, web-ui→frontend, slop→simplify), 4 deletes (security-audit, hashline-edits, session-recovery, changelog)
- **All skill descriptions <100 chars** — Average 60% reduction. Removed version numbers, agent name references, redundant words.
- **Agent descriptions: ~47 chars each** — Shortened from ~80 chars. Removed version numbers, verbosity.
- **Command templates: -77%** — `/forge` 500→361 chars, `/focus` 200→124 chars, `/audit` 300→251 chars, `/ping` 200→82 chars, `/sketch` 250→211 chars
- **`/pantheon`: max 3 agents** — Was 3-5. Reduces per-call token cost by ~40%.
- **copilot-instructions.md: 189 → 128 lines** — Removed "Hook Benefits" section, condensed lifecycle hooks to table, removed language-specific formatters, shortened timeout table.
- **211 cross-platform references updated** — All platform adapters (Claude, Cursor, Windsurf, Continue, Cline) updated to reference new memory bank file names.
- **False positive detection improved** — Token audit script now uses specific regex patterns instead of generic keyword matching. Skips expected files (progress-log, active-context).

### Removed

- **`_tasks/pantheon-v4-expansion/`** — 1919 lines of obsolete, unapproved plan files deleted
- **`.tmp/` artifacts** — 8 old review/implementation files cleaned up
- **`decisions/` directory** — Merged into `_notes/` as proper ADRs
- **`skills/security-audit/`** — Superseded by `security-audit-pro`
- **`skills/hashline-edits/`** — Platform internal, not a domain skill
- **`skills/session-recovery/`** — Platform internal, should be runtime behavior
- **`skills/changelog/`** — Too narrow scope for a skill
- **`skills/orchestration-workflow/`** — Merged into `agent-coordination`
- **`skills/performance-optimization/`** — Merged into `database-optimization`
- **`skills/vector-search/`** — Merged into `rag-pipelines`
- **`skills/web-ui-analysis/`** — Merged into `frontend-analyzer`
- **`skills/ai-slop-remover/`** — Merged into `simplify`

### Fixed

- **Token audit false positives** — "wave" no longer matches "DAG Waves" architectural pattern. "progress" no longer matches progress-log.md. "delivered" no longer matches instruction templates.
- **Memory bank file naming** — Renamed to simple numeric scheme: `00-project.md`, `01-active-context.md`, `02-progress-log.md`
- **ADR numbering** — All ADRs now use consistent `ADR-NNNN` format with proper index

### Token Budget

| Component | Before | After | Reduction |
|---|---|---|---|
| Auto-loaded | ~27K tokens | **~748 tokens** | **-97%** |
| On-demand | ~4K tokens | ~896 tokens | -78% |
| Skills (lazy) | ~3K per load | ~83K total (only when invoked) | Lazy-load |
| `/pantheon` call | ~50K+ (4-5 agents) | ~25K (max 3 agents) | -50% |
