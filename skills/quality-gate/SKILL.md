---
description: "Self-verification: run linter, type-check, tests, and build before reporting completion"
name: "Quality Gate"
applyTo: "**/*.{py,ts,tsx,js,jsx}"
---

# Quality Gate — Self-Verification for Implementation Agents

Run this skill AFTER any implementation phase and BEFORE reporting completion to Zeus.

## Overview

Zeus no longer manually verifies each phase. YOU (the implementation agent) must self-verify before reporting done. If quality checks fail, fix them yourself before handing off to Themis.

## When to Run

ALWAYS after:
- Writing/modifying code (any file)
- Running migration
- Creating new component
- Before calling `@themis` for review
- Before reporting `status: complete` to Zeus

## What to Run

### 1. Python Projects (ruff)

```bash
# Lint check (all Python files changed)
ruff check --select F,E,W,I,N,UP,B,SIM,PL,RUF --output-format concise <files>

# Auto-fix when possible
ruff check --fix --select F,E,W,UP,B,SIM <files>

# Format check
ruff format --check <files>

# Auto-format
ruff format <files>
```

### 2. TypeScript/JavaScript Projects (Biome)

```bash
# Lint + auto-fix + format
biome check --write --unsafe <files>

# CI mode (exit code on violations)
biome ci <files>
```

### 3. Type Check

```bash
# Python (if mypy/pyright configured)
mypy <files> || pyright <files>

# TypeScript
tsc --noEmit
```

### 4. Tests

```bash
# Python
pytest -v

# TypeScript/React
npm test || npx vitest run
```

### 5. Build (if applicable)

```bash
npm run build   # frontend
# or no build step needed for Python/FastAPI
```

## Success Criteria

All of these MUST pass before reporting completion:
- ✅ Linter passes (ruff or Biome) — zero violations
- ✅ Formatter passes — no formatting drift
- ✅ Type check passes — zero type errors
- ✅ All tests pass — zero failures
- ✅ Build succeeds (if applicable)

## If Checks Fail

1. **Auto-fix first:** Run `--fix` variants before manual edits
2. **Isolate the issue:** Is it a lint error, type error, or test failure?
3. **Fix incrementally:** Fix one category at a time (lint → type → test)
4. **Re-run after fix:** Always re-run the full suite after changes
5. **Escalate if stuck:** If 3+ attempts fail to resolve, report to Zeus with:
   ```
   Quality Gate blocked: [check type] failing after [N] attempts.
   Error: [specific error]
   Files involved: [list]
   ```

## Integration with Themis

When you hand off to @themis after passing quality gate, include in your message:
```
Quality Gate: ✅ All checks passed (lint, type-check, tests, build)
```
This tells Themis to proceed directly to code review without re-running basic checks.

## Notes

- Themis still runs quality checks during review as a safety net
- Passing quality gate does NOT replace Themis review — it's a pre-filter
- For hotfixes (@talos), quality gate is RECOMMENDED but not mandatory
