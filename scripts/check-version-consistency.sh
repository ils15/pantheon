#!/usr/bin/env bash
# check-version-consistency.sh — Verifies all 3 manifests have the same version
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

pkg_ver=$(node -p "require('$ROOT/package.json').version")
plugin_ver=$(node -p "require('$ROOT/plugin.json').version")
gh_plugin_ver=$(node -p "require('$ROOT/.github/plugin/plugin.json').version")

echo "package.json: $pkg_ver"
echo "plugin.json: $plugin_ver"
echo ".github/plugin/plugin.json: $gh_plugin_ver"

if [ "$pkg_ver" != "$plugin_ver" ] || [ "$pkg_ver" != "$gh_plugin_ver" ]; then
  echo "❌ Version mismatch across manifests!"
  echo ""
  echo "Fix: run 'node scripts/versioning.mjs apply' to sync all manifests"
  exit 1
fi

echo "✅ All versions match: $pkg_ver"
