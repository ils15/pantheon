#!/usr/bin/env bash
# sync-opencode.sh — Sync Pantheon agents to ~/.config/opencode/
#
# Uses the PRE-GENERATED platform/opencode/agents/ files (already transformed
# by sync-platforms.mjs via adapter.json), NOT the raw canonical agents.
# Raw canonical agents contain VS Code-specific frontmatter (handoffs, vscode/*
# tools, agents: [...]) that OpenCode does not understand.
#
# Usage:
#   ./sync-opencode.sh                         # sync agents + skills, push to remote
#   ./sync-opencode.sh --no-push               # sync locally only, skip git push
#   ./sync-opencode.sh --clean                 # ALSO remove stale files from dest
#   ./sync-opencode.sh --clean --no-push       # both flags
#
# CLEAN MODE (--clean):
#   Removes agent .md files and skill directories from dest that no longer
#   exist in source. OFF by default — prevents accidental deletion of user
#   custom agents/skills in ~/.config/opencode/agents/ and ~/.config/opencode/skills/.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
SYNC_REPO="$XDG_DATA_HOME/opencode/opencode-synced/repo"
NO_PUSH=false
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --no-push) NO_PUSH=true ;;
    --clean) CLEAN=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

# ── Step 1: Regenerate platform/opencode/agents/ from canonical sources ──────
echo "=== 1. Regenerando agents via sync-platforms.mjs ==="
node "$SCRIPT_DIR/scripts/sync-platforms.mjs" opencode

# ── Step 2: Sync pre-generated OpenCode agents ──────────────────────────────
echo "=== 2. Sincronizando agents -> ~/.config/opencode/agents/ ==="
mkdir -p "$HOME/.config/opencode/agents"
cp "$SCRIPT_DIR/platform/opencode/agents/"*.md "$HOME/.config/opencode/agents/"
if [ "$CLEAN" = true ]; then
  for dest_file in "$HOME/.config/opencode/agents/"*.md; do
    [ -f "$dest_file" ] || continue
    base_name=$(basename "$dest_file")
    if [ ! -f "$SCRIPT_DIR/platform/opencode/agents/$base_name" ]; then
      rm "$dest_file"
      echo "    🗑️  Removed stale agent: $base_name"
    fi
  done
else
  echo "    ℹ️  Use --clean to remove stale agents (off by default)"
fi
echo "    ✅ $(ls "$SCRIPT_DIR/platform/opencode/agents/"*.md 2>/dev/null | wc -l) agents sincronizados"

# ── Step 3: Sync skills (no cleanup unless --clean) ──────────────────────────
echo "=== 3. Sincronizando skills -> ~/.config/opencode/skills/ ==="
mkdir -p "$HOME/.config/opencode/skills"
cp -r "$SCRIPT_DIR/skills/"* "$HOME/.config/opencode/skills/"
if [ "$CLEAN" = true ]; then
  for dest_skill in "$HOME/.config/opencode/skills/"*/; do
    [ -d "$dest_skill" ] || continue
    skill_name=$(basename "$dest_skill")
    if [ ! -d "$SCRIPT_DIR/skills/$skill_name" ]; then
      rm -rf "$dest_skill"
      echo "    🗑️  Removed stale skill: $skill_name"
    fi
  done
else
  echo "    ℹ️  Use --clean to remove stale skills (off by default)"
fi
echo "    ✅ skills sincronizadas"

# ── Step 3.5: Sync commands (.md files, with cleanup if --clean) ──────────────
echo "=== 3.5. Sincronizando commands -> ~/.config/opencode/commands/ ==="
mkdir -p "$HOME/.config/opencode/commands"
if [ -d "$SCRIPT_DIR/commands" ]; then
  cp "$SCRIPT_DIR/commands/"*.md "$HOME/.config/opencode/commands/"
  if [ "$CLEAN" = true ]; then
    for dest_file in "$HOME/.config/opencode/commands/"*.md; do
      [ -f "$dest_file" ] || continue
      base_name=$(basename "$dest_file")
      if [ ! -f "$SCRIPT_DIR/commands/$base_name" ]; then
        rm "$dest_file"
        echo "    🗑️  Removed stale command: $base_name"
      fi
    done
  fi
  echo "    ✅ $(ls "$SCRIPT_DIR/commands/"*.md 2>/dev/null | wc -l) commands sincronizados"
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
  python3 - "$COMMANDS_SRC" "$OPENCODE_CONFIG" "$CLEAN" << 'PYEOF'
import json, sys

commands_src = sys.argv[1]
opencode_file = sys.argv[2]
clean = sys.argv[3].lower() == 'true'

with open(commands_src) as f:
    new_commands = json.load(f)

with open(opencode_file) as f:
    config = json.load(f)

if "command" not in config:
    config["command"] = {}

new_names = set(new_commands.keys())
merged_count = 0
removed_count = 0

for name, definition in new_commands.items():
    config["command"][name] = definition
    merged_count += 1

# If --clean: remove commands from config that are no longer in commands.json
if clean:
    stale = [name for name in config["command"] if name not in new_names]
    for name in stale:
        del config["command"][name]
        removed_count += 1
    if not config["command"]:
        del config["command"]

with open(opencode_file, "w") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
    f.write("\n")

msg = f"    ✅ {merged_count} commands merged"
if removed_count > 0:
    msg += f", {removed_count} stale removed"
print(msg)
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
  if [ "$CLEAN" = true ]; then
    for dest_file in "$SYNC_REPO/agents/"*.md; do
      [ -f "$dest_file" ] || continue
      base_name=$(basename "$dest_file")
      if [ ! -f "$HOME/.config/opencode/agents/$base_name" ]; then
        rm "$dest_file"
      fi
    done
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
