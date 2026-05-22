#!/usr/bin/env bash
# sync-continue.sh — Sync Pantheon agents to .continue/rules/
#
# Regenerates platform/continue/rules/*.md from canonical agents/
# then deploys to .continue/rules/ in the project root.
#
# Continue.dev reads .continue/rules/*.md for context injection.
# Ref: https://docs.continue.dev/customize/context-providers
#
# Usage:
#   ./sync-continue.sh              # sync agent rules
#   ./sync-continue.sh --clean      # also remove stale files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

echo "=== 1. Regenerando agents via sync-platforms.mjs ==="
node "$SCRIPT_DIR/scripts/sync-platforms.mjs" continue

echo "=== 2. Sincronizando agents -> .continue/rules/ ==="
mkdir -p "$SCRIPT_DIR/.continue/rules"

UPDATED=0
UNCHANGED=0

for src_file in "$SCRIPT_DIR/platform/continue/rules/"*.md; do
  [ -f "$src_file" ] || continue
  base_name=$(basename "$src_file")
  dest_file="$SCRIPT_DIR/.continue/rules/$base_name"

  if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
    UNCHANGED=$((UNCHANGED + 1))
  else
    cp "$src_file" "$dest_file"
    UPDATED=$((UPDATED + 1))
    echo "    ✏️  $base_name"
  fi
done

if [ "$CLEAN" = true ]; then
  for dest_file in "$SCRIPT_DIR/.continue/rules/"*.md; do
    [ -f "$dest_file" ] || continue
    base_name=$(basename "$dest_file")
    if [ ! -f "$SCRIPT_DIR/platform/continue/rules/$base_name" ]; then
      rm "$dest_file"
      echo "    🗑️  Removed stale: $base_name"
    fi
  done
fi

echo "    ✅ $UPDATED updated, $UNCHANGED unchanged"

echo "=== 3. Sincronizando config.yaml -> .continue/ (se não existir) ==="
CONFIG_SRC="$SCRIPT_DIR/platform/continue/config.yaml"
CONFIG_DEST="$SCRIPT_DIR/.continue/config.yaml"
if [ -f "$CONFIG_SRC" ] && [ ! -f "$CONFIG_DEST" ]; then
  cp "$CONFIG_SRC" "$CONFIG_DEST"
  echo "    ✅ config.yaml criado"
elif [ -f "$CONFIG_SRC" ] && [ -f "$CONFIG_DEST" ]; then
  echo "    ℹ️  .continue/config.yaml já existe (não sobrescrever)"
else
  echo "    ℹ️  Sem config.yaml para sincronizar"
fi

echo ""
echo "✅ Sync completo! $(ls "$SCRIPT_DIR/.continue/rules/" | wc -l) rules em .continue/rules/"
