---
description: "Automated code quality checks for all implementation agents"
name: "Code Quality Checks"
applyTo: "**/*.{py,ts,tsx,js,jsx}"
---

# Code Quality Checks (Mandatory for All Implementations)

## Overview

Before @temis performs manual code review, **ALL code must pass automated quality checks**:

1. **Python**: ruff (lint) → black (format) → isort (imports)
2. **TypeScript/JavaScript**: eslint (lint) → prettier (format)

These checks are MANDATORY and run first in @temis review.

---

## Python Quality Checks

### 1. Ruff (Lint)
Detects code issues: unused variables, unreachable code, complexity violations, security issues.

**Command:**
```bash
ruff check src/                          # Check all Python files
ruff check src/ --fix                    # Auto-fix issues
ruff check src/ --select E501            # Check specific rule (line too long)
```

**Common Issues:**
- `E501`: Line too long (>88 chars)
- `F841`: Local variable assigned but not used
- `F401`: Module imported but not used
- `E302`: Expected 2 blank lines, found N
- `C901`: Function is too complex

**Integration:**
- Runs on ALL changed Python files
- Blocks review if violations found
- Must fix before resubmitting

### 2. Black (Code Formatter)
Enforces consistent code formatting (line length, spacing, quotes).

**Command:**
```bash
black --check src/                       # Check formatting
black src/                               # Format files
black --line-length 100 src/             # Custom line length
```

**Configuration** (in `pyproject.toml`):
```toml
[tool.black]
line-length = 88
target-version = ['py312']
extend-exclude = '''
/(
  \.git
  | \.venv
  | build
  | dist
)/
'''
```

**Integration:**
- Runs on ALL changed Python files
- Auto-fixes formatting issues
- Must pass before review

### 3. Isort (Import Ordering)
Organizes imports into standard groups: stdlib, third-party, local.

**Command:**
```bash
isort --check-only src/                  # Check order
isort src/                               # Fix order
isort --profile black src/               # Use Black-compatible profile
```

**Configuration** (in `pyproject.toml`):
```toml
[tool.isort]
profile = "black"
line_length = 88
multi_line_mode = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true
```

**Import Order:**
```python
# 1. Future imports
from __future__ import annotations

# 2. Standard library
import os
import sys
from pathlib import Path
from typing import Optional

# 3. Third-party
import sqlalchemy
from fastapi import FastAPI
from pydantic import BaseModel

# 4. Local
from myapp.models import User
from myapp.schemas import UserSchema
```

**Integration:**
- Runs on ALL changed Python files
- Auto-fixes import order
- Must pass before review

---

## TypeScript/JavaScript Quality Checks

### 1. ESLint (Lint)
Detects code issues: undefined variables, unused imports, style violations.

**Command:**
```bash
eslint src/                              # Check all files
eslint src/ --fix                        # Auto-fix issues
eslint src/ --ext .ts,.tsx               # Check specific extensions
```

**Configuration** (in `.eslintrc.json`):
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**Common Issues:**
- `no-unused-vars`: Variable declared but not used
- `no-undef`: Variable used but not defined
- `@typescript-eslint/no-any`: Use of `any` type
- `react-hooks/rules-of-hooks`: Hook used incorrectly

**Integration:**
- Runs on ALL changed TypeScript/JavaScript files
- Can auto-fix many issues
- Must pass before review

### 2. Prettier (Code Formatter)
Enforces consistent code formatting (indentation, quotes, semicolons, line length).

**Command:**
```bash
prettier --check src/                    # Check formatting
prettier --write src/                    # Format files
prettier --check src/ --tab-width 2      # Custom tab width
```

**Configuration** (in `.prettierrc.json`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 88,
  "tabWidth": 2,
  "useTabs": false
}
```

**Formatting Examples:**
```typescript
// Before
const items = [{id:1,name:"test"},{id:2,name:"demo"}]
function process(x){return x*2}

// After (Prettier)
const items = [
  { id: 1, name: 'test' },
  { id: 2, name: 'demo' },
];
function process(x) {
  return x * 2;
}
```

**Integration:**
- Runs on ALL changed TypeScript/JavaScript files
- Auto-fixes formatting issues
- Must pass before review

---

## Full Quality Check Workflow (Temis Implementation)

When @temis receives code for review:

```bash
# 1. Python files detected
ruff check src/ --fix          # Auto-fix lint issues
status=$?
if [ $status -ne 0 ]; then
  echo "❌ Ruff violations found (exit code $status)"
  exit 1
fi

# 2. Check Python formatting
black --check src/
if [ $? -ne 0 ]; then
  echo "❌ Black format violations found"
  black src/                   # Auto-fix
  echo "✅ Fixed with Black, please re-submit"
  exit 1
fi

# 3. Check import order
isort --check-only src/
if [ $? -ne 0 ]; then
  echo "❌ Isort violations found"
  isort src/                   # Auto-fix
  echo "✅ Fixed with Isort, please re-submit"
  exit 1
fi

# 4. TypeScript/JavaScript files detected
eslint src/ --ext .ts,.tsx,.js,.jsx --fix
if [ $? -ne 0 ]; then
  echo "❌ ESLint violations found"
  exit 1
fi

# 5. Check JavaScript formatting
prettier --check src/
if [ $? -ne 0 ]; then
  echo "❌ Prettier format violations found"
  prettier --write src/        # Auto-fix
  echo "✅ Fixed with Prettier, please re-submit"
  exit 1
fi

echo "✅ All quality checks passed!"
```

---

## Integration with Agents

### Hermes (Backend)
- Runs ruff, black, isort on all `.py` files
- Reports violations to @temis
- Commits auto-fixed files before resubmit

### Aphrodite (Frontend)
- Runs eslint, prettier on all `.ts/.tsx/.js/.jsx` files
- Reports violations to @temis
- Commits auto-fixed files before resubmit

### Maat (Database)
- Runs ruff, black, isort on all migration `.py` files
- Reports violations to @temis
- Commits auto-fixed files before resubmit

### Temis (QA Gate)
- MUST run all quality checks FIRST
- Block review if checks fail
- Return NEEDS_REVISION with specific violations
- Can auto-fix and request resubmit

---

## Performance (FastPath)

**Typical durations:**
- ruff: 200-500ms for small projects
- black: 100-300ms
- isort: 100-300ms
- eslint: 300-1000ms (depends on plugin count)
- prettier: 200-500ms

**Total time for typical phase:** 1-3 seconds

This is FAST compared to manual code review, so @temis runs this FIRST before any manual review.

---

## Troubleshooting

### "Ruff violations found but auto-fix didn't work"
Some violations can't be auto-fixed (e.g., imports of unused modules). Fix manually:
```bash
ruff check src/ --show-source    # Show line with issue
# Then edit file and remove unused import
```

### "Prettier conflicts with ESLint"
Ensure `.eslintrc.json` includes Prettier plugin:
```json
{
  "extends": ["prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

### "isort conflicts with Black"
Use Black-compatible isort profile:
```bash
isort --profile black src/
```

### "Line too long" but I can't break it
If a line MUST be long (e.g., URL, regex), use ignore comment:
```python
# ruff: noqa: E501
url = "https://very-long-url-that-cannot-be-broken-across-lines.example.com/api/endpoint"
```

---

## Configuration Files Checklist

- [ ] `pyproject.toml` — ruff, black, isort config
- [ ] `setup.cfg` or `ruff.toml` — ruff config (if needed)
- [ ] `.eslintrc.json` — eslint config
- [ ] `.prettierrc.json` — prettier config
- [ ] `.prettierignore` — files to skip (e.g., `dist/`, `build/`)
- [ ] `setup.cfg` — isort config (if not in pyproject.toml)

