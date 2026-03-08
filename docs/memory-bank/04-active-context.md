# 🔄 Active Context

> **Priority file** — agents read this first when starting any task.  
> Keep it current. A stale active context is worse than none.

---

## Current Focus

Harden and automate GitHub workflow operations for tag-based releases and push-time verification.

**Status:** Complete

---

## Most Recent Decision

Keep the existing release workflow and improve it incrementally: fix tag trigger pattern and add a dedicated verify workflow for `main` push/PR checks.

**Date:** 2026-03-08

---

## Active Blockers

<!-- Anything preventing progress. If none, write "None." -->
- None

---

## Next Steps

1. Validate the new workflows in GitHub Actions after the next push.
2. Use @iris to draft the next release tag and push tags to trigger automated release publication.

---

## References

<!-- Links to related files or decision notes. -->
- [00-overview.md](00-overview.md) — Project scope
- [01-architecture.md](01-architecture.md) — System design
- [_notes/](_notes/_index.md) — Architectural decision records
- [_tasks/](_tasks/_index.md) — Task history

---

> **For agents:** This file reflects the current sprint/feature state.  
> `@mnemosyne` is responsible for keeping it updated after each delivery.  
> When closing a feature, move context to `_notes/` and reset this file.
