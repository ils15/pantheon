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
#   ./sync-opencode.sh --skip-plugin-install   # skip local npm plugin install
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
SKIP_PLUGIN_INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --no-push) NO_PUSH=true ;;
    --clean) CLEAN=true ;;
    --skip-plugin-install) SKIP_PLUGIN_INSTALL=true ;;
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

# ── Step 3.6: Ensure required OpenCode plugin is installed locally ───────────
echo "=== 3.6. Verificando plugin opencode-hooks-plugin ==="
mkdir -p "$HOME/.config/opencode"
if [ ! -d "$HOME/.config/opencode/node_modules/opencode-hooks-plugin" ]; then
  if [ "$SKIP_PLUGIN_INSTALL" = true ]; then
    echo "    ⏭️  --skip-plugin-install ativo, pulando instalação do opencode-hooks-plugin"
  elif ! command -v npm >/dev/null 2>&1; then
    echo "    ❌ npm não encontrado. Instale Node.js/npm ou use --skip-plugin-install para pular esta etapa."
    exit 1
  else
    echo "    ⬇️  Instalando opencode-hooks-plugin em ~/.config/opencode"
    (
      cd "$HOME/.config/opencode"
      npm install --no-save opencode-hooks-plugin
    )
    echo "    ✅ opencode-hooks-plugin instalado"
  fi
else
  echo "    ✅ opencode-hooks-plugin já instalado"
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

# ── Step 4.5: Merge opencode.json from repo → user config ─────────────────────
REPO_CONFIG="$SCRIPT_DIR/opencode.json"
USER_CONFIG="$HOME/.config/opencode/opencode.json"

if [ -f "$REPO_CONFIG" ]; then
  echo "=== 4.5. Mesclando opencode.json -> $USER_CONFIG ==="
  python3 - "$REPO_CONFIG" "$USER_CONFIG" "$CLEAN" << 'PYEOF'
import json, sys

repo_file = sys.argv[1]
user_file = sys.argv[2]
clean = sys.argv[3].lower() == 'true'

with open(repo_file) as f:
    repo = json.load(f)
with open(user_file) as f:
    user = json.load(f)

changes = []

# Agent merge: repo agents overwrite user; user extras preserved; --clean removes stale
repo_agents = repo.get("agent", {})
user_agents = user.get("agent", {})
merged_agents = dict(user_agents)

for name, config in repo_agents.items():
    if name in merged_agents:
        changes.append(f"    🔄 agent/{name} — updated")
    merged_agents[name] = config

if clean:
    stale = [name for name in merged_agents if name not in repo_agents]
    for name in stale:
        del merged_agents[name]
        changes.append(f"    🗑️  agent/{name} — removed (stale)")

user["agent"] = merged_agents

# MCP merge: repo MCPs overwrite user by key; user extras preserved
repo_mcp = repo.get("mcp", {})
user_mcp = user.get("mcp", {})
merged_mcp = dict(user_mcp)
for name, config in repo_mcp.items():
    if name not in merged_mcp:
        changes.append(f"    ➕ mcp/{name} — added")
    merged_mcp[name] = config
user["mcp"] = merged_mcp

# Permission: repo wins (security rules must be authoritative)
user["permission"] = repo.get("permission", user.get("permission", {}))
changes.append("    🔒 permission — updated from repo")

# Instructions: repo wins
user["instructions"] = repo.get("instructions", user.get("instructions", []))
changes.append("    📄 instructions — updated from repo")

# Command: repo wins (currently empty, but authoritative)
user["command"] = repo.get("command", user.get("command", {}))

# Other top-level keys from repo not already handled
for key in repo:
    if key not in ("agent", "mcp", "permission", "instructions", "command"):
        if key not in user or user[key] != repo[key]:
            user[key] = repo[key]
            changes.append(f"    🔧 {key} — updated from repo")

with open(user_file, "w") as f:
    json.dump(user, f, indent=2, ensure_ascii=False)
    f.write("\n")

if changes:
    for c in changes:
        print(c)
    print(f"    ✅ {len(changes)} changes applied")
else:
    print("    ✅ Already up-to-date")
PYEOF
else
  echo "=== 4.5. Nenhum opencode.json no repo — pulando ==="
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
