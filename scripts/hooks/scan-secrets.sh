#!/bin/bash

# Secret Scan Hook - Bloqueia commit com secrets hardcoded
# Detecta: API keys, tokens, passwords, AWS keys, etc.

set -e

HOOK_LOG="${LOG_DIR:-logs/agent-sessions}/secret-scan.log"
mkdir -p "${HOOK_LOG%/*}"

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Secret Scan Hook Started"
    
    SECRETS_FOUND=0
    
    # Padrões perigosos
    PATTERNS=(
        "api[_-]?key"
        "secret[_-]?key"
        "password[s]?"
        "token[s]?"
        "bearer\s"
        "aws[_-]?access"
        "aws[_-]?secret"
        "private[_-]?key"
        "oauth[_-]?token"
        "auth[_-]?token"
    )
    
    for PATTERN in "${PATTERNS[@]}"; do
        if grep -rEi "^\s*(export\s+)?${PATTERN}\s*=\s*['\"]?[a-zA-Z0-9_\-\.]{20,}" \
            --include="*.py" --include="*.js" --include="*.ts" --include="*.env*" \
            --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null; then
            
            echo "🔴 SECURITY VIOLATION: Found potential secret matching pattern: $PATTERN"
            SECRETS_FOUND=$((SECRETS_FOUND + 1))
        fi
    done
    
    if [ $SECRETS_FOUND -gt 0 ]; then
        echo "❌ Secret Scan BLOCKED: $SECRETS_FOUND potential secrets found"
        echo "⚠️  Do NOT commit hardcoded secrets. Use environment variables instead."
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Secret Scan Hook FAILED"
        exit 1
    fi
    
    echo "✅ No hardcoded secrets detected"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Secret Scan Hook Completed"
} >> "$HOOK_LOG" 2>&1

exit 0
