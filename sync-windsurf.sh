#!/usr/bin/env bash
# sync-windsurf.sh — Sync Pantheon agents to .windsurf/rules/
#
# Regenerates platform/windsurf/rules/*.md from canonical agents/
# then deploys to .windsurf/rules/ in the project root.
#
# Windsurf Cascade reads .windsurf/rules/*.md (Cascade rules).
# Ref: https://docs.windsurf.com/windsurf/cascade/memories-and-rules
#
# Usage:
#   ./sync-windsurf.sh              # sync agent rules
#   ./sync-windsurf.sh --clean      # also remove stale files

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
node "$SCRIPT_DIR/scripts/sync-platforms.mjs" windsurf

echo "=== 2. Sincronizando agents -> .windsurf/rules/ ==="
mkdir -p "$SCRIPT_DIR/.windsurf/rules"

UPDATED=0
UNCHANGED=0

for src_file in "$SCRIPT_DIR/platform/windsurf/rules/"*.md; do
  [ -f "$src_file" ] || continue
  base_name=$(basename "$src_file")
  dest_file="$SCRIPT_DIR/.windsurf/rules/$base_name"

  if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
    UNCHANGED=$((UNCHANGED + 1))
  else
    cp "$src_file" "$dest_file"
    UPDATED=$((UPDATED + 1))
    echo "    ✏️  $base_name"
  fi
done

if [ "$CLEAN" = true ]; then
  for dest_file in "$SCRIPT_DIR/.windsurf/rules/"*.md; do
    [ -f "$dest_file" ] || continue
    base_name=$(basename "$dest_file")
    if [ ! -f "$SCRIPT_DIR/platform/windsurf/rules/$base_name" ]; then
      rm "$dest_file"
      echo "    🗑️  Removed stale: $base_name"
    fi
  done
fi

echo "    ✅ $UPDATED updated, $UNCHANGED unchanged"

echo "=== 3. Sincronizando workflows -> .windsurf/workflows/ (se existir) ==="
if [ -d "$SCRIPT_DIR/platform/windsurf/workflows" ]; then
  mkdir -p "$SCRIPT_DIR/.windsurf/workflows"
  for src_file in "$SCRIPT_DIR/platform/windsurf/workflows/"*.md; do
    [ -f "$src_file" ] || continue
    base_name=$(basename "$src_file")
    dest_file="$SCRIPT_DIR/.windsurf/workflows/$base_name"
    if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
      echo "    ℹ️  workflow $base_name unchanged"
    else
      cp "$src_file" "$dest_file"
      echo "    ✏️  workflow $base_name"
    fi
  done
else
  echo "    ℹ️  Sem workflows para sincronizar"
fi

echo ""
echo "✅ Sync completo! $(ls "$SCRIPT_DIR/.windsurf/rules/" | wc -l) rules em .windsurf/rules/"
