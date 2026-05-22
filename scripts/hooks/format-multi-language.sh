#!/usr/bin/env bash
# format-multi-language.sh — Pantheon PostToolUse Formatting Hook
# Runs appropriate formatter on the modified file.
# Supports both Claude Code stdin protocol and legacy env-var input.
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

# ── Claude Code stdin protocol ──────────────────────────────────────────
# Parse JSON from stdin when piped (PostToolUse hook format).
# Extracts file_path from Edit/Write or file paths from Bash commands.
if [ -p /dev/stdin ]; then
  STDIN_JSON=$(cat)
  TOOL_NAME=$(echo "$STDIN_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_name', ''))
" 2>/dev/null || echo "")

  case "$TOOL_NAME" in
    Edit|Write)
      JSON_PATH=$(echo "$STDIN_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")
      if [ -n "$JSON_PATH" ]; then
        FILE_PATH="$JSON_PATH"
      fi
      ;;
    Bash)
      COMMAND=$(echo "$STDIN_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")
      if [ -n "$COMMAND" ]; then
        # Extract first file-like path from bash command (supports relative and quoted paths)
        CANDIDATE=$(python3 -c "
import re, shlex, sys
command = sys.argv[1]
try:
    tokens = shlex.split(command)
except ValueError:
    tokens = command.split()
path_re = re.compile(r'^([^\\n]+\\.[A-Za-z0-9]+)$')
for token in tokens:
    if token.startswith('-'):
        continue
    if path_re.match(token):
        print(token)
        break
" "$COMMAND" 2>/dev/null || echo "")
        if [ -n "$CANDIDATE" ]; then
          FILE_PATH="$CANDIDATE"
        fi
      fi
      ;;
  esac
fi

FILE_PATH="${FILE_PATH:-${1:-}}"
if [[ -n "$FILE_PATH" ]] && [[ "$FILE_PATH" != /* ]]; then
    if [[ -f "$REPO_ROOT/$FILE_PATH" ]]; then
        FILE_PATH="$REPO_ROOT/$FILE_PATH"
    fi
fi

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
