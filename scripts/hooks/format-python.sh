#!/bin/bash

# Python-Specific Formatter Hook
# Uses Black + isort for comprehensive Python formatting

set -e

FILE_PATH="${FILE_PATH:-.}"
HOOK_LOG="${LOG_DIR:-logs/agent-sessions}/format-python.log"
mkdir -p "${HOOK_LOG%/*}"

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Python Format Hook Started"
    
    if [ -f "$FILE_PATH" ] && [[ "$FILE_PATH" == *.py ]]; then
        # Black: Code formatter
        if command -v black &> /dev/null; then
            echo "Running: black $FILE_PATH"
            black "$FILE_PATH" 2>/dev/null
            echo "✅ Code formatted with Black"
        fi
        
        # isort: Import sorter
        if command -v isort &> /dev/null; then
            echo "Running: isort $FILE_PATH"
            isort "$FILE_PATH" 2>/dev/null
            echo "✅ Imports sorted with isort"
        fi
    fi
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Python Format Hook Completed"
} >> "$HOOK_LOG" 2>&1

exit 0
