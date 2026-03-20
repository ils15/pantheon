#!/bin/bash

# TypeScript/JavaScript-Specific Formatter Hook
# Uses Biome or Prettier for comprehensive JS/TS formatting

set -e

FILE_PATH="${FILE_PATH:-.}"
HOOK_LOG="${LOG_DIR:-logs/agent-sessions}/format-typescript.log"
mkdir -p "${HOOK_LOG%/*}"

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] TypeScript/JavaScript Format Hook Started"
    
    if [ -f "$FILE_PATH" ] && [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]]; then
        # Prefer Biome for speed
        if command -v biome &> /dev/null; then
            echo "Running: biome format --write $FILE_PATH"
            biome format --write "$FILE_PATH" 2>/dev/null
            echo "✅ Code formatted with Biome"
        elif command -v prettier &> /dev/null; then
            echo "Running: prettier --write $FILE_PATH"
            prettier --write "$FILE_PATH" 2>/dev/null
            echo "✅ Code formatted with Prettier"
        fi
    fi
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] TypeScript/JavaScript Format Hook Completed"
} >> "$HOOK_LOG" 2>&1

exit 0
