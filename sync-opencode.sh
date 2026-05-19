#!/usr/bin/env bash
# sync-opencode.sh — Sync Pantheon agents to ~/.config/opencode/
#
# Uses the PRE-GENERATED platform/opencode/agents/ files (already transformed
# by sync-platforms.mjs via adapter.json), NOT the raw canonical agents.
# Raw canonical agents contain VS Code-specific frontmatter (handoffs, vscode/*
# tools, agents: [...]) that OpenCode does not understand.
#
# Usage:
#   ./sync-opencode.sh              # sync agents + skills, push to remote
#   ./sync-opencode.sh --no-push    # sync locally only, skip git push

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYNC_REPO="$HOME/.local/share/opencode/opencode-synced/repo"
NO_PUSH=false

for arg in "$@"; do
  case "$arg" in
    --no-push) NO_PUSH=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

# ── Step 1: Regenerate platform/opencode/agents/ from canonical sources ──────
echo "=== 1. Regenerando agents via sync-platforms.mjs ==="
node "$SCRIPT_DIR/scripts/sync-platforms.mjs" opencode

# ── Step 2: Copy pre-generated OpenCode agents (adapter-transformed) ─────────
echo "=== 2. Copiando agents pre-gerados -> ~/.config/opencode/agents/ ==="
mkdir -p "$HOME/.config/opencode/agents"
cp "$SCRIPT_DIR/platform/opencode/agents/"*.md "$HOME/.config/opencode/agents/"
echo "    ✅ $(ls "$SCRIPT_DIR/platform/opencode/agents/"*.md | wc -l | tr -d ' ') agents copiados"

# ── Step 3: Copy skills ───────────────────────────────────────────────────────
echo "=== 3. Copiando skills -> ~/.config/opencode/skills/ ==="
mkdir -p "$HOME/.config/opencode/skills"
cp -r "$SCRIPT_DIR/skills/"* "$HOME/.config/opencode/skills/"
echo "    ✅ skills sincronizadas"

# ── Step 3.5: Copy commands ─────────────────────────────────────────────────────
echo "=== 3.5. Copiando commands -> ~/.config/opencode/commands/ ==="
mkdir -p "$HOME/.config/opencode/commands"
if [ -d "$SCRIPT_DIR/commands" ]; then
  cp "$SCRIPT_DIR/commands/"*.md "$HOME/.config/opencode/commands/"
  echo "    ✅ $(ls "$SCRIPT_DIR/commands/"*.md 2>/dev/null | wc -l | tr -d ' ') commands copiados"
else
  echo "    ⚠️  Nenhum diretório commands/ encontrado — pulando"
fi

# ── Step 4: Apply active plan model overrides to ~/.config/opencode/opencode.json
ACTIVE_PLAN="$SCRIPT_DIR/platform/plans/plan-active.json"
if [ -f "$ACTIVE_PLAN" ]; then
  echo "=== 4. Aplicando modelos do plano ativo -> ~/.config/opencode/opencode.json ==="
  "$SCRIPT_DIR/platform/select-plan.sh" generate --target "$HOME/.config/opencode/opencode.json"
else
  echo "=== 4. Nenhum plano ativo encontrado — pulando injeção de modelos ==="
  echo "    💡 Para ativar: ./platform/select-plan.sh opencode-go"
fi

# ── Step 4.5: Merge commands from commands/commands.json ──────────────────────
COMMANDS_SRC="$SCRIPT_DIR/commands/commands.json"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"

if [ -f "$COMMANDS_SRC" ]; then
  echo "=== 4.5. Mesclando commands -> $OPENCODE_CONFIG ==="
  python3 - "$COMMANDS_SRC" "$OPENCODE_CONFIG" << 'PYEOF'
import json, sys

commands_src = sys.argv[1]
opencode_file = sys.argv[2]

with open(commands_src) as f:
    new_commands = json.load(f)

with open(opencode_file) as f:
    config = json.load(f)

# Merge: new commands override existing, existing commands not in new_commands are preserved
if "command" not in config:
    config["command"] = {}

merged_count = 0
for name, definition in new_commands.items():
    config["command"][name] = definition
    merged_count += 1

with open(opencode_file, "w") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"    ✅ {merged_count} commands merged into opencode.json")
PYEOF
else
  echo "=== 4.5. Nenhum commands/commands.json encontrado — pulando ==="
fi

# ── Step 5: Push to remote sync repo ─────────────────────────────────────────
if [ ! -d "$SYNC_REPO" ]; then
  echo "=== 5. Repo de sync não encontrado em $SYNC_REPO — pulando push ==="
else
  echo "=== 5. Copiando para repo de sync ==="
  mkdir -p "$SYNC_REPO/agents" "$SYNC_REPO/skills" "$SYNC_REPO/commands"
  cp "$HOME/.config/opencode/agents/"*.md "$SYNC_REPO/agents/"
  cp -r "$HOME/.config/opencode/skills/"* "$SYNC_REPO/skills/"
  if [ -d "$HOME/.config/opencode/commands" ]; then
    cp "$HOME/.config/opencode/commands/"*.md "$SYNC_REPO/commands/" 2>/dev/null || true
  fi

  if [ "$NO_PUSH" = true ]; then
    echo "    ⏭️  --no-push ativo, pulando commit/push"
  else
    git -C "$SYNC_REPO" add -A
    if git -C "$SYNC_REPO" diff --cached --quiet; then
      echo "    Nada novo pra commitar."
    else
      git -C "$SYNC_REPO" commit -m "sync: update agents and skills from Pantheon"
      git -C "$SYNC_REPO" push
      echo "    ✅ Sincronizado com https://github.com/ils15/my-opencode-config.git"
    fi
  fi
fi

echo ""
echo "✅ Sync completo!"
