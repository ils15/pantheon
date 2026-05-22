#!/usr/bin/env bash
# sync-cursor.sh — Sync Pantheon agents to .cursor/rules/
#
# Regenerates platform/cursor/rules/*.mdc from canonical agents/
# then deploys to .cursor/rules/ in the project root.
#
# Cursor reads .cursor/rules/*.mdc (Agent mode rules).
# Ref: https://docs.cursor.com/context/rules-for-ai
#
# Usage:
#   ./sync-cursor.sh                # sync agent rules
#   ./sync-cursor.sh --clean        # also remove stale .mdc files

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
node "$SCRIPT_DIR/scripts/sync-platforms.mjs" cursor

echo "=== 2. Sincronizando agents -> .cursor/rules/ ==="
mkdir -p "$SCRIPT_DIR/.cursor/rules"

UPDATED=0
UNCHANGED=0

for src_file in "$SCRIPT_DIR/platform/cursor/rules/"*.mdc; do
  [ -f "$src_file" ] || continue
  base_name=$(basename "$src_file")
  dest_file="$SCRIPT_DIR/.cursor/rules/$base_name"

  if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
    UNCHANGED=$((UNCHANGED + 1))
  else
    cp "$src_file" "$dest_file"
    UPDATED=$((UPDATED + 1))
    echo "    ✏️  $base_name"
  fi
done

if [ "$CLEAN" = true ]; then
  for dest_file in "$SCRIPT_DIR/.cursor/rules/"*.mdc; do
    [ -f "$dest_file" ] || continue
    base_name=$(basename "$dest_file")
    if [ ! -f "$SCRIPT_DIR/platform/cursor/rules/$base_name" ]; then
      rm "$dest_file"
      echo "    🗑️  Removed stale: $base_name"
    fi
  done
fi

echo "    ✅ $UPDATED updated, $UNCHANGED unchanged"
echo ""
echo "✅ Sync completo! $(ls "$SCRIPT_DIR/.cursor/rules/" | wc -l) rules em .cursor/rules/"
