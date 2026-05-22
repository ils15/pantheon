#!/usr/bin/env bash
# sync-claude.sh — Sync Pantheon agents to .claude/agents/
#
# Uses the PRE-GENERATED platform/claude/agents/ files (already transformed
# by sync-platforms.mjs via adapter.json), NOT the raw canonical agents.
# Raw canonical agents contain VS Code-specific frontmatter (handoffs, mode,
# agents: [...]) that Claude Code does not understand.
#
# Claude Code reads .claude/agents/ in the project root.
# Ref: https://docs.anthropic.com/en/docs/claude-code/sub-agents
#
# Usage:
#   ./sync-claude.sh                   # sync agents + skills, no push
#   ./sync-claude.sh --clean           # also remove stale files from .claude/agents/
#
# OUTPUT:
#   .claude/agents/*.md                — 18 canonical agents for Claude Code
#   .claude/skills/                    — shared skills (if adapter deploys any)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

# ── Step 1: Regenerate platform/claude/agents/ from canonical sources ────────
echo "=== 1. Regenerando agents via sync-platforms.mjs ==="
node "$SCRIPT_DIR/scripts/sync-platforms.mjs" claude

# ── Step 2: Sync pre-generated Claude agents to .claude/agents/ ─────────────
echo "=== 2. Sincronizando agents -> .claude/agents/ ==="
mkdir -p "$SCRIPT_DIR/.claude/agents"

UPDATED=0
UNCHANGED=0

for src_file in "$SCRIPT_DIR/platform/claude/agents/"*.md; do
  [ -f "$src_file" ] || continue
  base_name=$(basename "$src_file")
  dest_file="$SCRIPT_DIR/.claude/agents/$base_name"

  if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
    UNCHANGED=$((UNCHANGED + 1))
  else
    cp "$src_file" "$dest_file"
    UPDATED=$((UPDATED + 1))
    echo "    ✏️  $base_name"
  fi
done

if [ "$CLEAN" = true ]; then
  for dest_file in "$SCRIPT_DIR/.claude/agents/"*.md; do
    [ -f "$dest_file" ] || continue
    base_name=$(basename "$dest_file")
    if [ ! -f "$SCRIPT_DIR/platform/claude/agents/$base_name" ]; then
      rm "$dest_file"
      echo "    🗑️  Removed stale agent: $base_name"
    fi
  done
fi

echo "    ✅ $UPDATED updated, $UNCHANGED unchanged"

# ── Step 3: Sync skills ───────────────────────────────────────────────────────
echo "=== 3. Sincronizando skills -> .claude/skills/ ==="
if [ -d "$SCRIPT_DIR/.claude/skills" ]; then
  echo "    ✅ skills already present"
else
  echo "    ℹ️  No skills to sync (handled by sync-platforms.mjs)"
fi

# ── Step 4: Ensure .claude/settings.json exists ──────────────────────────────
SETTINGS="$SCRIPT_DIR/.claude/settings.json"
if [ ! -f "$SETTINGS" ]; then
  echo "=== 4. Creating .claude/settings.json ==="
  cat > "$SETTINGS" << 'JSON'
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit|Write",
        "hooks": [{ "type": "command", "command": "bash scripts/hooks/validate-talos-scope.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [{ "type": "command", "command": "bash scripts/hooks/format-multi-language.sh" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "bash scripts/hooks/validate-post-conditions.sh" }]
      }
    ]
  }
}
JSON
  echo "    ✅ .claude/settings.json created"
else
  echo "    ℹ️  .claude/settings.json already exists"
fi

echo ""
echo "✅ Sync completo! $(ls "$SCRIPT_DIR/.claude/agents/" | wc -l) agents em .claude/agents/"
