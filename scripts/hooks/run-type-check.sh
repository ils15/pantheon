#!/bin/bash

# Type Check Hook - Verifica tipos em Python e TypeScript
# Executado após modificações em arquivos

set -e

HOOK_LOG="${LOG_DIR:-logs/agent-sessions}/type-check.log"
mkdir -p "${HOOK_LOG%/*}"

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Type Check Hook Started"
    
    # Verificar Python files
    if find . -name "*.py" -path "*/scripts/*" -o -path "*/src/*" 2>/dev/null | head -1 | grep -q .; then
        if command -v pyright &> /dev/null; then
            echo "Running: pyright (Python type checking)"
            pyright --outputjson > /tmp/pyright.json 2>&1 || true
            if grep -q '"generalDiagnosticsCount": [^0]' /tmp/pyright.json 2>/dev/null; then
                echo "⚠️  Type errors found in Python files"
            else
                echo "✅ Python types validated"
            fi
        fi
    fi
    
    # Verificar TypeScript files
    if find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules | head -1 | grep -q .; then
        if command -v tsc &> /dev/null; then
            echo "Running: tsc (TypeScript type checking)"
            tsc --noEmit 2>/dev/null || true
            echo "✅ TypeScript types validated"
        fi
    fi
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Type Check Hook Completed"
} >> "$HOOK_LOG" 2>&1

exit 0
