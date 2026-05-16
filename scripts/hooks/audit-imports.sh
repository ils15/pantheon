#!/usr/bin/env bash
# audit-imports.sh — Pantheon PostToolUse Import Audit Hook
# Blocks wildcard imports and flags suspicious patterns.
set -euo pipefail

FILE_PATH="${FILE_PATH:-${1:-}}"

if [[ -z "$FILE_PATH" ]] || [[ ! -f "$FILE_PATH" ]]; then
    # Scan all Python/JS files in recent changes if no file specified
    FILES=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(py|js|ts|jsx|tsx)$' || true)
    if [[ -z "$FILES" ]]; then
        exit 0
    fi
else
    FILES="$FILE_PATH"
fi

FOUND=0
for f in $FILES; do
    [[ -f "$f" ]] || continue
    EXT="${f##*.}"
    case "$EXT" in
        py)
            if grep -qE '^from\s+\S+\s+import\s+\*' "$f"; then
                echo "[IMPORT AUDIT] Wildcard import found in $f" >&2
                FOUND=1
            fi
            ;;
        js|jsx|ts|tsx)
            # Flag require() without destructuring as suspicious
            if grep -qE 'require\([^)]+\)' "$f"; then
                echo "[IMPORT AUDIT] CommonJS require() found in $f — consider ES modules" >&2
            fi
            ;;
    esac
done

if [[ $FOUND -eq 1 ]]; then
    echo "[IMPORT AUDIT] Fix wildcard imports before committing." >&2
    exit 1
fi

exit 0
