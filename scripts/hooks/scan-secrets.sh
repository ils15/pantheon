#!/usr/bin/env bash
# scan-secrets.sh — Pantheon PreToolUse Secret Scanning Hook
# Detects hardcoded secrets in tool input.
set -euo pipefail

SECRET_PATTERNS=(
    "AKIA[0-9A-Z]{16}"
    "gh[pousr]_[A-Za-z0-9_]{36,}"
    "glpat-[A-Za-z0-9_\\-]{20}"
    "sk-[a-zA-Z0-9]{20,}"
    "sk_live_[a-zA-Z0-9]{20,}"
    "sk_test_[a-zA-Z0-9]{20,}"
    "xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}"
    "[a-zA-Z0-9_-]*api[_-]?key[a-zA-Z0-9_-]*\s*[:=]\s*[\"']?[a-zA-Z0-9_\\-]{16,}[\"']?"
    "[a-zA-Z0-9_-]*password[a-zA-Z0-9_-]*\s*[:=]\s*[\"'][^\"']{8,}[\"']"
    "[a-zA-Z0-9_-]*secret[a-zA-Z0-9_-]*\s*[:=]\s*[\"'][^\"']{8,}[\"']"
    "bearer\s+[a-zA-Z0-9_\\-\\.]{20,}"
    "eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*"
)

INPUT="${1:-${TOOL_INPUT:-}}"
if [[ -z "$INPUT" ]] && [[ ! -t 0 ]]; then
    INPUT=$(cat)
fi

if [[ -z "$INPUT" ]]; then
    exit 0
fi

FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if echo "$INPUT" | grep -iqE "$pattern"; then
        MATCH=$(echo "$INPUT" | grep -ioE "$pattern" | head -1)
        # Mask the match for safe logging
        MASKED="${MATCH:0:4}****${MATCH: -4}"
        echo "[SECRET SCAN] Potential secret detected: $MASKED (pattern: $pattern)" >&2
        FOUND=1
    fi
done

if [[ $FOUND -eq 1 ]]; then
    echo "[SECRET SCAN] Hardcoded secret detected. Remove it and use environment variables or a vault." >&2
    exit 1
fi

exit 0
