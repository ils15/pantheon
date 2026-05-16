#!/usr/bin/env bash
# format-multi-language.sh — Pantheon PostToolUse Formatting Hook
# Runs appropriate formatter on the modified file.
set -euo pipefail

FILE_PATH="${FILE_PATH:-${1:-}}"

if [[ -z "$FILE_PATH" ]] || [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

EXT="${FILE_PATH##*.}"
EXIT_CODE=0

case "$EXT" in
    py)
        if command -v ruff >/dev/null 2>&1; then
            ruff format "$FILE_PATH" || true
        elif command -v black >/dev/null 2>&1; then
            black -q "$FILE_PATH" || true
        fi
        ;;
    js|jsx|ts|tsx|json|jsonc|md|yaml|yml|css|html)
        if command -v prettier >/dev/null 2>&1; then
            prettier --write "$FILE_PATH" || true
        fi
        ;;
    sh|bash)
        if command -v shfmt >/dev/null 2>&1; then
            shfmt -w "$FILE_PATH" || true
        fi
        ;;
esac

exit 0
