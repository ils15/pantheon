#!/bin/bash

# Multi-Language Code Formatter Hook
# Auto-detects file type and applies appropriate formatter
# Supports: Python, JavaScript/TypeScript, YAML, JSON, Markdown, SQL

set -e

FILE_PATH="${FILE_PATH:-.}"
HOOK_LOG="${LOG_DIR:-logs/agent-sessions}/format.log"
mkdir -p "${HOOK_LOG%/*}"

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Format Hook Started: $FILE_PATH"
    
    get_extension() {
        echo "${1##*.}" | tr '[:upper:]' '[:lower:]'
    }
    
    format_python() {
        local file="$1"
        if command -v black &> /dev/null; then
            black "$file" 2>/dev/null && echo "✅ Python formatted with Black"
        elif command -v autopep8 &> /dev/null; then
            autopep8 --in-place "$file" && echo "✅ Python formatted with autopep8"
        fi
        
        # Também tentar isort para imports
        if command -v isort &> /dev/null; then
            isort "$file" 2>/dev/null && echo "✅ Python imports sorted with isort"
        fi
    }
    
    format_javascript() {
        local file="$1"
        # Preferir Biome em TypeScript/JavaScript
        if command -v biome &> /dev/null; then
            biome format --write "$file" 2>/dev/null && echo "✅ JS/TS formatted with Biome"
        elif command -v prettier &> /dev/null; then
            prettier --write "$file" 2>/dev/null && echo "✅ JS/TS formatted with Prettier"
        fi
    }
    
    format_yaml() {
        local file="$1"
        if command -v yamlfmt &> /dev/null; then
            yamlfmt -w "$file" 2>/dev/null && echo "✅ YAML formatted with yamlfmt"
        elif command -v prettier &> /dev/null; then
            prettier --write "$file" 2>/dev/null && echo "✅ YAML formatted with Prettier"
        fi
    }
    
    format_json() {
        local file="$1"
        if command -v jq &> /dev/null; then
            jq . "$file" > "${file}.tmp" && mv "${file}.tmp" "$file" && echo "✅ JSON formatted with jq"
        elif command -v prettier &> /dev/null; then
            prettier --write "$file" 2>/dev/null && echo "✅ JSON formatted with Prettier"
        fi
    }
    
    format_markdown() {
        local file="$1"
        if command -v prettier &> /dev/null; then
            prettier --write "$file" 2>/dev/null && echo "✅ Markdown formatted with Prettier"
        fi
    }
    
    format_sql() {
        local file="$1"
        if command -v sqlformat &> /dev/null; then
            sqlformat --reindent --use-space-around-operators -o "$file" "$file" 2>/dev/null && echo "✅ SQL formatted with sqlformat"
        fi
    }
    
    # Detectar tipo de arquivo e aplicar formatter apropriado
    if [ -f "$FILE_PATH" ]; then
        EXT=$(get_extension "$FILE_PATH")
        
        case "$EXT" in
            py)
                format_python "$FILE_PATH"
                ;;
            js|jsx|ts|tsx|mjs|cjs)
                format_javascript "$FILE_PATH"
                ;;
            yml|yaml)
                format_yaml "$FILE_PATH"
                ;;
            json)
                format_json "$FILE_PATH"
                ;;
            md|markdown)
                format_markdown "$FILE_PATH"
                ;;
            sql)
                format_sql "$FILE_PATH"
                ;;
            *)
                echo "⚠️  No formatter available for .${EXT} files"
                ;;
        esac
    elif [ -d "$FILE_PATH" ]; then
        echo "Formatting all files in directory: $FILE_PATH"
        
        # Python files
        find "$FILE_PATH" -name "*.py" -type f | while read -r file; do
            format_python "$file"
        done
        
        # JavaScript/TypeScript files
        find "$FILE_PATH" -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read -r file; do
            format_javascript "$file"
        done
        
        # YAML files
        find "$FILE_PATH" -name "*.yml" -o -name "*.yaml" | while read -r file; do
            format_yaml "$file"
        done
        
        # JSON files
        find "$FILE_PATH" -name "*.json" | while read -r file; do
            format_json "$file"
        done
        
        echo "✅ Directory formatting completed"
    fi
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Format Hook Completed"
} >> "$HOOK_LOG" 2>&1

exit 0
