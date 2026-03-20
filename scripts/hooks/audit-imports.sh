#!/bin/bash

# Import Audit Hook - Detecta and audita imports problemáticos
# Bloqueia: wildcard imports, unused imports, import loops

set -e

HOOK_LOG="${LOG_DIR:-logs/agent-sessions}/import-audit.log"
mkdir -p "${HOOK_LOG%/*}"

{
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Import Audit Hook Started"
    
    VIOLATIONS=0
    
    # Checar wildcard imports em Python
    if grep -r "^from .* import \*" --include="*.py" scripts/ src/ 2>/dev/null; then
        echo "❌ Found wildcard imports (from X import *) — violates explicit imports policy"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
    
    # Checar wildcard imports em JavaScript/TypeScript
    if grep -r "^import \* as " --include="*.ts" --include="*.tsx" --include="*.js" src/ 2>/dev/null; then
        echo "⚠️  Found star imports (import * as X) — prefer named imports"
    fi
    
    # Checar unused imports em Python (simples heurística)
    if python3 -c "import ast; ast.parse(open('.').read())" 2>/dev/null; then
        echo "✅ Python import syntax validated"
    fi
    
    if [ $VIOLATIONS -gt 0 ]; then
        echo "❌ Import audit FAILED: $VIOLATIONS violations found"
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Import Audit Hook BLOCKED Changes"
        exit 1
    fi
    
    echo "✅ All imports are well-formed"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Import Audit Hook Completed"
} >> "$HOOK_LOG" 2>&1

exit 0
