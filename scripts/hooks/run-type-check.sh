#!/usr/bin/env bash
# run-type-check.sh — Pantheon PostToolUse Type Check Hook
# Runs mypy (Python) or tsc (TypeScript) if config exists.
set -euo pipefail

# Only run if relevant config files exist
if [[ -f "pyproject.toml" ]] || [[ -f "setup.cfg" ]] || [[ -f ".mypy.ini" ]]; then
    if command -v mypy >/dev/null 2>&1; then
        echo "[TYPE CHECK] Running mypy..." >&2
        mypy . --ignore-missing-imports || true
    fi
fi

if [[ -f "tsconfig.json" ]]; then
    if command -v tsc >/dev/null 2>&1; then
        echo "[TYPE CHECK] Running tsc --noEmit..." >&2
        tsc --noEmit || true
    fi
fi

exit 0
