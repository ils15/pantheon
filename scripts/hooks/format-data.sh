#!/bin/bash

# Data Format Checker Hook (JSON, YAML)
# Validates and optionally formats JSON/YAML files

set -e

FILE_PATH="${FILE_PATH:-.}"
HOOK_LOG="${LOG_DIR:-logs/agent-sessions}/format-data.log"
mkdir -p "${HOOK_LOG%/*}"

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Data Format Hook Started"
    
    format_json() {
        local file="$1"
        if command -v jq &> /dev/null; then
            echo "Validating JSON: $file"
            jq empty "$file" 2>/dev/null || {
                echo "❌ Invalid JSON syntax in $file"
                return 1
            }
            # Format with jq
            jq . "$file" > "${file}.tmp"
            mv "${file}.tmp" "$file"
            echo "✅ JSON validated and formatted with jq"
        fi
    }
    
    format_yaml() {
        local file="$1"
        if command -v yamlfmt &> /dev/null; then
            echo "Formatting YAML: $file"
            yamlfmt -w "$file" 2>/dev/null
            echo "✅ YAML formatted with yamlfmt"
        elif python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            echo "✅ YAML valid"
        else
            echo "❌ Invalid YAML syntax in $file"
            return 1
        fi
    }
    
    if [ -f "$FILE_PATH" ]; then
        case "$FILE_PATH" in
            *.json)
                format_json "$FILE_PATH"
                ;;
            *.yml|*.yaml)
                format_yaml "$FILE_PATH"
                ;;
        esac
    fi
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Data Format Hook Completed"
} >> "$HOOK_LOG" 2>&1

exit 0
