---
description: "Automated code quality checks for all implementation agents"
name: "Code Quality Checks"
applyTo: "**/*.{py,ts,tsx,js,jsx}"
---

# Code Quality Checks (Mandatory for All Implementations)

## Overview

Before Themis performs manual code review, **ALL code must pass automated quality checks**:

1. **Python**: ruff (unified lint + format, 900+ rules)
2. **TypeScript/JavaScript**: Biome (unified lint + format, 502 rules)

These checks are MANDATORY and run first in Themis review.

---

## Python Quality Checks

### 1. Ruff (Lint + Format — Unified)
Detects code issues: unused imports/variables, unreachable code, complexity violations, deprecated APIs, security issues, formatting.

**Commands:**
```bash
ruff check --select F,E,W,I,N,UP,B,SIM,PL,RUF --output-format concise <files>
ruff format --check <files>              # formatting compliance only
ruff check --fix --select F,E,W,UP,B,SIM <files>   # auto-fix
```

**Key ruff rules for dead/legacy code:**
- `F401` — unused import (BLOCKER)
- `F841` — unused variable (BLOCKER)
- `PLW0101` — unreachable code (BLOCKER)
- `UP` — pyupgrade (detects obsolete Python patterns)
- `W291` — trailing whitespace (BLOCKER)
- `W191` — hard tabs in Python (BLOCKER)
- `F403` — wildcard import (MEDIUM)

**Integration:**
- Runs on ALL changed Python files
- Auto-fixes with `ruff check --fix`
- Must pass before review

### 2. Formatting (Ruff built-in)
Ruff subsumes Black — no separate formatter needed.

```bash
ruff format --check <files>              # check formatting
ruff format <files>                      # auto-format
```

**Line length:** 88 characters (matching ruff default)

---

## TypeScript/JavaScript Quality Checks

### 1. Biome (Lint + Format — Unified)
Biome replaces ESLint + Prettier with a single tool (502 rules, 2-10x faster).

**Commands:**
```bash
biome check --write --unsafe <files>     # lint + auto-fix + format
biome ci <files>                         # CI mode (exit code on violations)
```

**Key Biome rules:**
- `noUnusedVariables` — unused variable detection
- `useConst` — prefer const over let
- `noExtraBooleanCast` — redundant boolean casts
- `noDoubleEquals` — strict equality
- `useArrowFunction` — prefer arrow functions

**Integration:**
- Runs on ALL changed TypeScript/JavaScript files
- Auto-fixes with `biome check --write --unsafe`
- Must pass before review

### 2. Formatting (Biome built-in)
Biome subsumes Prettier — no separate formatter needed.

```bash
biome format --write <files>             # auto-format
biome ci <files>                         # check in CI
```

---

## Full Quality Check Workflow (Themis Implementation)

When Themis receives code for review:

```bash
# 1. Python files detected
ruff check --select F,E,W,I,N,UP,B,SIM,PL,RUF --output-format concise <files>
status=$?
if [ $status -ne 0 ]; then
  echo "❌ Ruff violations found (exit code $status)"
  ruff check --fix --select F,E,W,UP,B,SIM <files>
  echo "✅ Auto-fix applied, please review changes"
  exit 1
fi

# 2. Check Python formatting
ruff format --check <files>
if [ $? -ne 0 ]; then
  echo "❌ Ruff format violations found"
  ruff format <files>
  echo "✅ Auto-formatted, please review changes"
  exit 1
fi

# 3. TypeScript/JavaScript files detected
biome check --write --unsafe <files>
if [ $? -ne 0 ]; then
  echo "❌ Biome violations found"
  exit 1
fi

echo "✅ All quality checks passed!"
```

---

## Integration with Agents

### Hermes (Backend)
- Runs ruff on all `.py` files
- Reports violations to Themis
- Commits auto-fixed files before resubmit

### Aphrodite (Frontend)
- Runs Biome on all `.ts/.tsx/.js/.jsx` files
- Reports violations to Themis
- Commits auto-fixed files before resubmit

### Demeter (Database)
- Runs ruff on all migration `.py` files
- Reports violations to Themis
- Commits auto-fixed files before resubmit

### Themis (QA Gate)
- MUST run all quality checks FIRST
- Block review if checks fail
- Return NEEDS_REVISION with specific violations
- Can auto-fix and request resubmit

---

## Performance (FastPath)

**Typical durations:**
- ruff check: 200-500ms for small projects
- ruff format: 100-300ms
- biome check --write: 300-800ms (faster than ESLint + Prettier)

**Total time for typical phase:** 0.5-2 seconds (faster than legacy eslint+prettier pipeline)

---

## Troubleshooting

### "Ruff violations found but auto-fix didn't work"
Some violations can't be auto-fixed (e.g., unused imports). Fix manually:
```bash
ruff check --show-source <files>    # Show line with issue
# Then edit file and remove the issue
```

### "Biome conflicts with TypeScript strict mode"
Ensure Biome config is aligned with `tsconfig.json`. Some Biome rules may need explicit disabling:
```json
{
  "rules": {
    "correctness": {
      "noUnusedVariables": "error",
      "useConst": "error"
    }
  }
}
```

### "Line too long" but I can't break it
If a line MUST be long (e.g., URL, regex), use ignore comment:
```python
# ruff: noqa: E501
url = "https://very-long-url-that-cannot-be-broken-across-lines.example.com/api/endpoint"
```

---

## Configuration Files Checklist

- [ ] `pyproject.toml` or `ruff.toml` — ruff config
- [ ] `biome.json` — Biome config
- [ ] `.gitignore` — ensure build/ output excluded
