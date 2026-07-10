#!/bin/bash
# Pantheon MCP Init — configura os 3 MCP servers em qualquer plataforma
# Uso: ./scripts/init-pantheon-mcp.sh /caminho/do/projeto [plataforma]
#   plataforma: opencode (padrão), claude, cursor, windsurf, cline, continue, copilot

set -e

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${1:-.}"
PLATFORM="${2:-opencode}"

echo "🚀 Pantheon MCP Init — $PLATFORM"
echo "   Origem:  $SOURCE_DIR"
echo "   Destino: $TARGET_DIR"
echo ""

# 1. Copiar scripts
echo "📁 Copiando scripts MCP..."
mkdir -p "$TARGET_DIR/scripts" "$TARGET_DIR/.pantheon/code-mode"
cp "$SOURCE_DIR/scripts/mcp_resources_server.py" "$TARGET_DIR/scripts/"
cp "$SOURCE_DIR/scripts/code_mode_server.py" "$TARGET_DIR/scripts/"
cp "$SOURCE_DIR/scripts/memory_mcp_server.py" "$TARGET_DIR/scripts/"
cp "$SOURCE_DIR/.pantheon/code-mode/example-sync.sh" "$TARGET_DIR/.pantheon/code-mode/"
chmod +x "$TARGET_DIR/.pantheon/code-mode/example-sync.sh"
echo "   ✅ Scripts copiados"

# 2. Virtualenv + dependências
echo "🐍 Configurando virtualenv..."
cd "$TARGET_DIR"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q chromadb>=0.6.0 sentence-transformers fastmcp>=3.4.0 pyyaml 2>/dev/null || \
  pip install chromadb sentence-transformers fastmcp pyyaml 2>/dev/null
echo "   ✅ Dependências instaladas"

# 3. Config da plataforma
echo "📝 Configurando $PLATFORM..."

case "$PLATFORM" in
  opencode)
    mkdir -p "$(dirname "$TARGET_DIR/opencode.json")"
    if [ ! -f "$TARGET_DIR/opencode.json" ]; then
      cp "$SOURCE_DIR/platform/opencode/opencode.json" "$TARGET_DIR/"
      echo "   ✅ opencode.json criado"
    else
      echo "   ⚠️  opencode.json já existe — adicione os MCPs manualmente"
    fi
    ;;
  claude)
    if [ ! -f "$TARGET_DIR/.mcp.json" ]; then
      cp "$SOURCE_DIR/platform/claude/mcp-template.json" "$TARGET_DIR/.mcp.json"
      echo "   ✅ .mcp.json criado"
    else
      echo "   ⚠️  .mcp.json já existe — faça merge manual dos mcpServers"
    fi
    ;;
  cursor)
    mkdir -p "$TARGET_DIR/.cursor"
    if [ ! -f "$TARGET_DIR/.cursor/mcp.json" ]; then
      cp "$SOURCE_DIR/platform/cursor/mcp-template.json" "$TARGET_DIR/.cursor/mcp.json"
      echo "   ✅ .cursor/mcp.json criado"
    else
      echo "   ⚠️  .cursor/mcp.json já existe — faça merge manual"
    fi
    ;;
  windsurf)
    mkdir -p "$HOME/.codeium/windsurf"
    if [ ! -f "$HOME/.codeium/windsurf/mcp_config.json" ]; then
      cp "$SOURCE_DIR/platform/windsurf/mcp-template.json" "$HOME/.codeium/windsurf/mcp_config.json"
      echo "   ✅ mcp_config.json criado (global)"
    else
      echo "   ⚠️  mcp_config.json já existe — faça merge manual"
    fi
    ;;
  cline)
    echo "   ⚠️  Cline usa settings do VS Code. Copie manualmente:"
    echo "      $SOURCE_DIR/platform/cline/mcp-template.json"
    echo "      Para: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
    ;;
  continue)
    echo "   ⚠️  Continue.dev usa ~/.continue/config.json. Copie manualmente:"
    echo "      $SOURCE_DIR/platform/continue/mcp-template.json"
    echo "      (mcpServers é ARRAY — faça merge no seu config.json)"
    ;;
  copilot)
    mkdir -p "$TARGET_DIR/.vscode"
    if [ ! -f "$TARGET_DIR/.vscode/mcp.json" ]; then
      cp "$SOURCE_DIR/platform/copilot/mcp-template.json" "$TARGET_DIR/.vscode/mcp.json"
      echo "   ✅ .vscode/mcp.json criado"
    else
      echo "   ⚠️  .vscode/mcp.json já existe — faça merge manual"
    fi
    ;;
  *)
    echo "   ❌ Plataforma desconhecida: $PLATFORM"
    echo "   Use: opencode, claude, cursor, windsurf, cline, continue, copilot"
    exit 1
    ;;
esac

# 4. Verificação
echo ""
echo "🔍 Verificando instalação..."
python3 -c "from scripts.mcp_resources_server import mcp; print('   ✅ resources OK')" 2>/dev/null || echo "   ⚠️  Verifique o Python path"
python3 -c "from scripts.code_mode_server import mcp; print('   ✅ code-mode OK')" 2>/dev/null || echo "   ⚠️  Verifique o Python path"
.venv/bin/python3 -c "from scripts.memory_mcp_server import mcp; print('   ✅ memory OK')" 2>/dev/null || echo "   ⚠️  Verifique o .venv"

echo ""
echo "🎉 Pantheon MCP Init concluído para $PLATFORM!"
echo ""
echo "Comandos uteis:"
echo "  Testar:  cd $TARGET_DIR && .venv/bin/python3 -m pytest tests/ -v"
echo "  Usar:    abra o projeto no $PLATFORM e os MCPs estarão disponíveis"
echo ""
echo "Nota: o modelo all-MiniLM-L6-v2 (~80MB) baixa automaticamente"
echo "no primeiro uso do pantheon-memory."
