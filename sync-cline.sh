#!/usr/bin/env bash
# sync-cline.sh — Sync Pantheon agents to .clinerules/
#
# Regenerates platform/cline/ output from canonical agents/
# then deploys to .clinerules/ in the project root.
#
# Cline reads .clinerules/<agent> files (no extension) as plain markdown
# system prompt context injected for each agent.
# Ref: https://github.com/cline/cline#clinerules
#
# Usage:
#   ./sync-cline.sh                 # sync agent rules
#   ./sync-cline.sh --clean         # also remove stale files

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
node "$SCRIPT_DIR/scripts/sync-platforms.mjs" cline

echo "=== 2. Verificando output dir ==="
# Cline adapter outputs to platform/cline/.clinerules/ (outputDir is relative to platform dir)
CLINE_SRC="$SCRIPT_DIR/platform/cline/.clinerules"

AGENT_FILES=$(find "$CLINE_SRC" -maxdepth 1 -type f 2>/dev/null | wc -l)
echo "    Found $AGENT_FILES generated agent files in $CLINE_SRC"

echo "=== 3. Sincronizando agents -> .clinerules/ ==="
mkdir -p "$SCRIPT_DIR/.clinerules"

UPDATED=0
UNCHANGED=0

for src_file in "$CLINE_SRC/"*; do
  [ -f "$src_file" ] || continue
  base_name=$(basename "$src_file")
  dest_file="$SCRIPT_DIR/.clinerules/$base_name"

  if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
    UNCHANGED=$((UNCHANGED + 1))
  else
    cp "$src_file" "$dest_file"
    UPDATED=$((UPDATED + 1))
    echo "    ✏️  $base_name"
  fi
done

if [ "$CLEAN" = true ]; then
  for dest_file in "$SCRIPT_DIR/.clinerules/"*; do
    [ -f "$dest_file" ] || continue
    base_name=$(basename "$dest_file")
    if [ ! -f "$CLINE_SRC/$base_name" ]; then
      rm "$dest_file"
      echo "    🗑️  Removed stale: $base_name"
    fi
  done
fi

echo "    ✅ $UPDATED updated, $UNCHANGED unchanged"

echo "=== 4. Sincronizando skills -> .clinerules/skills/ ==="
SKILLS_SRC="$SCRIPT_DIR/platform/cline/.clinerules/skills"
if [ -d "$SKILLS_SRC" ]; then
  mkdir -p "$SCRIPT_DIR/.clinerules/skills"
  rsync -a "$SKILLS_SRC/" "$SCRIPT_DIR/.clinerules/skills/" 2>/dev/null && echo "    ✅ skills sincronizadas" || cp -r "$SKILLS_SRC/." "$SCRIPT_DIR/.clinerules/skills/" && echo "    ✅ skills copiadas"
else
  echo "    ℹ️  Sem skills para sincronizar"
fi

echo ""
echo "✅ Sync completo! $(ls "$SCRIPT_DIR/.clinerules/" 2>/dev/null | wc -l) rules em .clinerules/"
