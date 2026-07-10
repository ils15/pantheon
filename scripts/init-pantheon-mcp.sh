#!/bin/bash
# Pantheon MCP Init — configura os 3 MCP servers em um novo projeto
# Uso: ./scripts/init-mcp.sh /caminho/do/novo/projeto

set -e

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${1:-.}"

echo "🚀 Pantheon MCP Init"
echo "   Origem:  $SOURCE_DIR"
echo "   Destino: $TARGET_DIR"
echo ""

# 1. Copiar scripts
echo "📁 Copiando scripts MCP..."
mkdir -p "$TARGET_DIR/scripts" "$TARGET_DIR/.pantheon/code-mode" "$TARGET_DIR/tests"
cp "$SOURCE_DIR/scripts/mcp_resources_server.py" "$TARGET_DIR/scripts/"
cp "$SOURCE_DIR/scripts/code_mode_server.py" "$TARGET_DIR/scripts/"
cp "$SOURCE_DIR/scripts/memory_mcp_server.py" "$TARGET_DIR/scripts/"
cp "$SOURCE_DIR/.pantheon/code-mode/example-sync.sh" "$TARGET_DIR/.pantheon/code-mode/"
chmod +x "$TARGET_DIR/.pantheon/code-mode/example-sync.sh"
cp "$SOURCE_DIR/tests/test_mcp_resources_server.py" "$TARGET_DIR/tests/" 2>/dev/null || true
cp "$SOURCE_DIR/tests/test_code_mode_server.py" "$TARGET_DIR/tests/" 2>/dev/null || true
cp "$SOURCE_DIR/tests/test_memory_mcp_server.py" "$TARGET_DIR/tests/" 2>/dev/null || true
cp "$SOURCE_DIR/tests/conftest.py" "$TARGET_DIR/tests/" 2>/dev/null || true
echo "   ✅ Scripts copiados"

# 2. Virtualenv + dependências
echo "🐍 Configurando virtualenv..."
cd "$TARGET_DIR"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q chromadb>=0.6.0 sentence-transformers fastmcp>=3.4.0 pyyaml 2>/dev/null
echo "   ✅ Dependências instaladas"

# 3. opencode.json
if [ ! -f "opencode.json" ]; then
    echo "📝 Criando opencode.json..."
    cp "$SOURCE_DIR/platform/opencode/opencode.json" opencode.json
    echo "   ✅ opencode.json copiado do template"
  else
    echo "   ⚠️  opencode.json já existe"
fi

# Se não existir template, cria manual
if [ ! -f "opencode.json" ]; then
    cat > opencode.json << .JSONEOF'
{
  "mcp": {
    "pantheon-resources": {
      "type": "local", "cwd": ".",
      "command": ["python3", "scripts/mcp_resources_server.py"],
      "enabled": true
    },
    "pantheon-code-mode": {
      "type": "local", "cwd": ".",
      "command": ["python3", "scripts/code_mode_server.py"],
      "enabled": true
    },
    "pantheon-memory": {
      "type": "local", "cwd": ".",
      "command": [".venv/bin/python3", "scripts/memory_mcp_server.py"],
      "enabled": true
    }
  },
  "permission": {
    "mcp": {
      "pantheon-resources": "allow",
      "pantheon-code-mode": "ask",
      "pantheon-memory": "allow"
    }
  }
}
JSONEOF
    echo "   ✅ opencode.json criado"
else
    echo "   ⚠️  opencode.json já existe — adicione manualmente as entries MCP"
fi

# 4. Verificação
echo ""
echo "🔍 Verificando instalação..."
python3 -c "from scripts.mcp_resources_server import mcp; print('   ✅ resources OK')"
python3 -c "from scripts.code_mode_server import mcp; print('   ✅ code-mode OK')"
.venv/bin/python3 -c "from scripts.memory_mcp_server import mcp; print('   ✅ memory OK')"

echo ""
echo "🎉 Pantheon MCP Init concluído!"
echo ""
echo "Para testar:"
echo "  cd $TARGET_DIR"
echo "  .venv/bin/python3 -m pytest tests/test_mcp_resources_server.py -v"
echo ""
echo "Depois reinicie o OpenCode para ativar os MCPs."
