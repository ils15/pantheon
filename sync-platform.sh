#!/usr/bin/env bash
# sync-platform.sh — Unified Pantheon agent sync for all platforms
#
# Consolidates 7 individual sync-*.sh scripts into one parameterized script.
# Generates platform-specific agent files via sync-platforms.mjs, then
# deploys them to the correct destination with platform-specific extras.
#
# Usage:
#   ./sync-platform.sh <platform> [action] [flags]
#
# Platforms: opencode, claude, cursor, copilot, windsurf, continue, cline, all
# Actions:   sync (default), clean, help
# Flags:     --clean, --no-push, --dry-run, --no-prompts, --skip-plugin-install
#
# Examples:
#   ./sync-platform.sh opencode                  # sync agents for OpenCode
#   ./sync-platform.sh opencode --no-push        # sync locally only
#   ./sync-platform.sh cursor --clean            # sync + remove stale files
#   ./sync-platform.sh copilot --dry-run         # preview changes only
#   ./sync-platform.sh all                       # sync all platforms
#   ./sync-platform.sh all --clean               # sync all + clean stale files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ═══════════════════════════════════════════════════════════════════════════
# Platform Configuration
# ═══════════════════════════════════════════════════════════════════════════

# Source directory relative to SCRIPT_DIR (where sync-platforms.mjs outputs)
declare -A PLATFORM_SRC
PLATFORM_SRC[opencode]="platform/opencode/agents"
PLATFORM_SRC[claude]="platform/claude/agents"
PLATFORM_SRC[cursor]="platform/cursor/rules"
PLATFORM_SRC[copilot]="instructions"           # copilot reads instructions/ directly
PLATFORM_SRC[windsurf]="platform/windsurf/rules"
PLATFORM_SRC[continue]="platform/continue/rules"
PLATFORM_SRC[cline]="platform/cline/.clinerules"

# Destination directory relative to SCRIPT_DIR (or absolute for opencode)
declare -A PLATFORM_DEST
PLATFORM_DEST[opencode]=""                # special: uses $HOME/.config/opencode/agents/
PLATFORM_DEST[claude]=".claude/agents"
PLATFORM_DEST[cursor]=".cursor/rules"
PLATFORM_DEST[copilot]=".github/instructions"
PLATFORM_DEST[windsurf]=".windsurf/rules"
PLATFORM_DEST[continue]=".continue/rules"
PLATFORM_DEST[cline]=".clinerules"

# File glob pattern for source matching
declare -A PLATFORM_GLOB
PLATFORM_GLOB[opencode]="*.md"
PLATFORM_GLOB[claude]="*.md"
PLATFORM_GLOB[cursor]="*.mdc"
PLATFORM_GLOB[copilot]="*.instructions.md"
PLATFORM_GLOB[windsurf]="*.md"
PLATFORM_GLOB[continue]="*.md"
PLATFORM_GLOB[cline]="*"                 # no extension for cline

# Whether this platform uses sync-platforms.mjs generation
declare -A PLATFORM_GENERATES
PLATFORM_GENERATES[opencode]=true
PLATFORM_GENERATES[claude]=true
PLATFORM_GENERATES[cursor]=true
PLATFORM_GENERATES[copilot]=false        # copilot uses instructions/ directly
PLATFORM_GENERATES[windsurf]=true
PLATFORM_GENERATES[continue]=true
PLATFORM_GENERATES[cline]=true

ALL_PLATFORMS=(opencode claude cursor copilot windsurf continue cline)

# ═══════════════════════════════════════════════════════════════════════════
# Help
# ═══════════════════════════════════════════════════════════════════════════

show_help() {
  cat <<'HELP'
Usage: ./sync-platform.sh <platform> [action] [flags]

Platforms:
  opencode    Sync to ~/.config/opencode/agents/ (JSON merge, remote push)
  claude      Sync to .claude/agents/ (commands, settings.json)
  cursor      Sync to .cursor/rules/ (.mdc files)
  copilot     Sync to .github/agents/ + .github/instructions/ (project-local)
              Use --global to sync to ~/.copilot/agents/ + ~/.copilot/instructions/ instead
  windsurf    Sync to .windsurf/rules/ (workflows)
  continue    Sync to .continue/rules/ (config.yaml)
  cline       Sync to .clinerules/ (no-extension files, skills)
  all         Sync all platforms

Actions:
  sync        Generate and copy agent files (default)
  clean       Same as sync with --clean flag (remove stale files)
  help        Show this help message

Flags:
  --clean                 Remove stale files from destination
  --no-push               (opencode) Skip git push to remote sync repo
  --global                (copilot) Install to ~/.copilot/ instead of .github/
  --no-prompts            (copilot) Skip prompt/command sync
  --dry-run               (copilot) Print what would change without writing
  --skip-plugin-install   (opencode) Skip npm plugin installation

Examples:
  ./sync-platform.sh opencode              # sync agents for OpenCode
  ./sync-platform.sh cursor --clean        # sync + remove stale files
  ./sync-platform.sh copilot               # sync project-local (.github/)
  ./sync-platform.sh copilot --global      # sync global (~/.copilot/)
  ./sync-platform.sh copilot --dry-run     # preview changes only
  ./sync-platform.sh all                   # sync all platforms
HELP
}

# ═══════════════════════════════════════════════════════════════════════════
# Argument Parsing
# ═══════════════════════════════════════════════════════════════════════════

PLATFORM="${1:-}"
ACTION="${2:-sync}"

# Consume positional args; shift them so $@ contains only flags
if [ $# -gt 0 ]; then shift; fi
if [ $# -gt 0 ]; then shift; fi

CLEAN=false
NO_PUSH=false
DRY_RUN=false
NO_PROMPTS=false
SKIP_PLUGIN_INSTALL=false
GLOBAL=false

# If ACTION looks like a flag (starts with --), treat it as a flag instead
if [[ "$ACTION" == --* ]]; then
  # Prepend it back to $@ for flag parsing
  set -- "$ACTION" "$@"
  ACTION=sync
fi

for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    --no-push) NO_PUSH=true ;;
    --dry-run) DRY_RUN=true ;;
    --global) GLOBAL=true ;;
    --no-prompts) NO_PROMPTS=true ;;
    --skip-plugin-install) SKIP_PLUGIN_INSTALL=true ;;
    help|--help|-h) show_help; exit 0 ;;
    *) echo "Error: Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

# Map "clean" action to --clean flag + sync
if [ "$ACTION" = "clean" ]; then
  CLEAN=true
  ACTION=sync
fi

if [ -z "$PLATFORM" ] || [ "$PLATFORM" = "help" ]; then
  show_help
  exit 0
fi

# Validate platform
VALID=false
for p in "${ALL_PLATFORMS[@]}"; do
  if [ "$p" = "$PLATFORM" ]; then VALID=true; break; fi
done
if [ "$VALID" = false ] && [ "$PLATFORM" != "all" ]; then
  echo "Error: Unknown platform '$PLATFORM'. Use: ${ALL_PLATFORMS[*]} or 'all'" >&2
  exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════
# Common Helpers
# ═══════════════════════════════════════════════════════════════════════════

# diff-aware sync of agent files from source to destination
# Usage: sync_agent_files <src_dir> <dest_dir> <glob_pattern> [opts]
# Options:
#   --clean    remove stale files from dest
#   --no-path-prefix  use basename only (no relative subdir)
sync_agent_files() {
  local src_dir="$1"
  local dest_dir="$2"
  local glob="$3"
  shift 3
  local do_clean=false
  local no_path_prefix=false

  for opt in "$@"; do
    case "$opt" in
      --clean) do_clean=true ;;
      --no-path-prefix) no_path_prefix=true ;;
    esac
  done

  if [ ! -d "$src_dir" ]; then
    echo "    ⚠️  Source directory not found: $src_dir"
    return
  fi

  mkdir -p "$dest_dir"

  local updated=0
  local unchanged=0

  # If no_path_prefix, just use plain basenames
  if [ "$no_path_prefix" = true ]; then
    for src_file in "$src_dir"/$glob; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file")
      local dest_file="$dest_dir/$base_name"

      if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
        unchanged=$((unchanged + 1))
      else
        if [ "$DRY_RUN" = true ]; then
          echo "    ~ $base_name (would update)"
        else
          cp "$src_file" "$dest_file"
          echo "    ✏️  $base_name"
        fi
        updated=$((updated + 1))
      fi
    done

    # Clean stale files
    if [ "$do_clean" = true ]; then
      for dest_file in "$dest_dir"/$glob; do
        [ -f "$dest_file" ] || continue
        local base_name
        base_name=$(basename "$dest_file")
        if [ ! -f "$src_dir/$base_name" ]; then
          if [ "$DRY_RUN" = true ]; then
            echo "    ~ $base_name (would remove, stale)"
          else
            rm "$dest_file"
            echo "    🗑️  Removed stale: $base_name"
          fi
        fi
      done
    fi
  else
    # With path prefix: iterate source files and handle subdirs
    # This is the default for flat copies
    for src_file in "$src_dir"/$glob; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file")
      local dest_file="$dest_dir/$base_name"

      if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
        unchanged=$((unchanged + 1))
      else
        if [ "$DRY_RUN" = true ]; then
          echo "    ~ $base_name (would update)"
        else
          cp "$src_file" "$dest_file"
          echo "    ✏️  $base_name"
        fi
        updated=$((updated + 1))
      fi
    done

    # Clean stale files
    if [ "$do_clean" = true ]; then
      for dest_file in "$dest_dir"/$glob; do
        [ -f "$dest_file" ] || continue
        local base_name
        base_name=$(basename "$dest_file")
        if [ ! -f "$src_dir/$base_name" ]; then
          if [ "$DRY_RUN" = true ]; then
            echo "    ~ $base_name (would remove, stale)"
          else
            rm "$dest_file"
            echo "    🗑️  Removed stale: $base_name"
          fi
        fi
      done
    fi
  fi

  echo "    ✅ $updated updated, $unchanged unchanged"
}

# Generate platform files via sync-platforms.mjs
generate_platform() {
  local platform="$1"
  echo "=== 1. Generating agents via sync-platforms.mjs ==="
  node "$SCRIPT_DIR/scripts/sync-platforms.mjs" "$platform"
}

# ═══════════════════════════════════════════════════════════════════════════
# Per-Platform Sync Functions
# ═══════════════════════════════════════════════════════════════════════════

sync_opencode() {
  local dest="$HOME/.config/opencode/agents"
  local src_dir="$SCRIPT_DIR/${PLATFORM_SRC[opencode]}"

  generate_platform opencode

  # Step 2: Sync agents
  echo "=== 2. Syncing agents -> $dest ==="
  sync_agent_files "$src_dir" "$dest" "${PLATFORM_GLOB[opencode]}" $( [ "$CLEAN" = true ] && echo "--clean" )

  # Step 3: Sync skills
  echo "=== 3. Syncing skills -> ~/.config/opencode/skills/ ==="
  mkdir -p "$HOME/.config/opencode/skills"
  if [ "$DRY_RUN" = false ]; then
    cp -r "$SCRIPT_DIR/skills/"* "$HOME/.config/opencode/skills/"
  else
    echo "    ~ skills/ (would sync)"
  fi
  if [ "$CLEAN" = true ] && [ "$DRY_RUN" = false ]; then
    for dest_skill in "$HOME/.config/opencode/skills/"*/; do
      [ -d "$dest_skill" ] || continue
      local skill_name
      skill_name=$(basename "$dest_skill")
      if [ ! -d "$SCRIPT_DIR/skills/$skill_name" ]; then
        rm -rf "$dest_skill"
        echo "    🗑️  Removed stale skill: $skill_name"
      fi
    done
  fi
  echo "    ✅ skills synced"

  # Step 3.5: Sync commands
  echo "=== 3.5. Syncing commands -> ~/.config/opencode/commands/ ==="
  mkdir -p "$HOME/.config/opencode/commands"
  if [ -d "$SCRIPT_DIR/commands" ]; then
    if [ "$DRY_RUN" = false ]; then
      cp "$SCRIPT_DIR/commands/"*.md "$HOME/.config/opencode/commands/"
    fi
    if [ "$CLEAN" = true ] && [ "$DRY_RUN" = false ]; then
      for dest_file in "$HOME/.config/opencode/commands/"*.md; do
        [ -f "$dest_file" ] || continue
        local base_name
        base_name=$(basename "$dest_file")
        if [ ! -f "$SCRIPT_DIR/commands/$base_name" ]; then
          rm "$dest_file"
          echo "    🗑️  Removed stale command: $base_name"
        fi
      done
    fi
    echo "    ✅ $(ls "$SCRIPT_DIR/commands/"*.md 2>/dev/null | wc -l) commands synced"
  else
    echo "    ⚠️  No commands/ directory found — skipping"
  fi

  # Step 3.6: Ensure required OpenCode plugin is installed
  echo "=== 3.6. Checking opencode-hooks-plugin ==="
  mkdir -p "$HOME/.config/opencode"
  if [ -d "$HOME/.config/opencode/node_modules/opencode-hooks-plugin" ]; then
    echo "    ✅ opencode-hooks-plugin already installed"
  elif [ "$SKIP_PLUGIN_INSTALL" = true ]; then
    echo "    ⏭️  --skip-plugin-install active, skipping"
  elif [ "$DRY_RUN" = true ]; then
    echo "    ~ opencode-hooks-plugin (would install)"
  elif ! command -v npm >/dev/null 2>&1; then
    echo "    ❌ npm not found. Install Node.js/npm or use --skip-plugin-install."
    exit 1
  else
    echo "    ⬇️  Installing opencode-hooks-plugin..."
    (cd "$HOME/.config/opencode" && npm install --no-save opencode-hooks-plugin)
    echo "    ✅ opencode-hooks-plugin installed"
  fi

  # Step 4: Apply active plan model overrides
  local active_plan="$SCRIPT_DIR/platform/plans/plan-active.json"
  if [ -f "$active_plan" ]; then
    echo "=== 4. Applying active plan model overrides ==="
    if [ "$DRY_RUN" = false ]; then
      "$SCRIPT_DIR/platform/select-plan.sh" generate --target "$HOME/.config/opencode/opencode.json"
    else
      echo "    ~ would apply plan model overrides"
    fi
  else
    echo "=== 4. No active plan found — skipping model injection ==="
  fi

  # Step 4.5: Merge opencode.json
  local repo_config="$SCRIPT_DIR/opencode.json"
  local user_config="$HOME/.config/opencode/opencode.json"
  if [ -f "$repo_config" ]; then
    echo "=== 4.5. Merging opencode.json -> $user_config ==="
    if [ "$DRY_RUN" = false ]; then
      python3 - "$repo_config" "$user_config" "$CLEAN" << 'PYEOF'
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

# Command: repo wins
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
      echo "    ~ would merge opencode.json"
    fi
  else
    echo "=== 4.5. No opencode.json in repo — skipping ==="
  fi

  # Step 5: Push to remote sync repo
  local xdg_data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
  local sync_repo="$xdg_data_home/opencode/opencode-synced/repo"
  if [ ! -d "$sync_repo" ]; then
    echo "=== 5. Sync repo not found at $sync_repo — skipping push ==="
  else
    echo "=== 5. Copying to sync repo ==="
    mkdir -p "$sync_repo/agents" "$sync_repo/skills" "$sync_repo/commands"
    cp "$HOME/.config/opencode/agents/"*.md "$sync_repo/agents/"
    cp -r "$HOME/.config/opencode/skills/"* "$sync_repo/skills/"
    if [ -d "$HOME/.config/opencode/commands" ]; then
      cp "$HOME/.config/opencode/commands/"*.md "$sync_repo/commands/" 2>/dev/null || true
    fi
    if [ "$CLEAN" = true ]; then
      for dest_file in "$sync_repo/agents/"*.md; do
        [ -f "$dest_file" ] || continue
        base_name=$(basename "$dest_file")
        if [ ! -f "$HOME/.config/opencode/agents/$base_name" ]; then
          rm "$dest_file"
        fi
      done
    fi
    if [ "$NO_PUSH" = true ]; then
      echo "    ⏭️  --no-push active, skipping commit/push"
    elif [ "$DRY_RUN" = true ]; then
      echo "    ~ would commit and push to sync repo"
    else
      git -C "$sync_repo" add -A
      if git -C "$sync_repo" diff --cached --quiet; then
        echo "    Nothing new to commit."
      else
        git -C "$sync_repo" commit -m "sync: update agents and skills from Pantheon"
        git -C "$sync_repo" push
        echo "    ✅ Synced to sync repo"
      fi
    fi
  fi
}

sync_claude() {
  local src_dir="$SCRIPT_DIR/${PLATFORM_SRC[claude]}"
  local dest_dir="$SCRIPT_DIR/${PLATFORM_DEST[claude]}"

  generate_platform claude

  # Step 2: Sync agents
  echo "=== 2. Syncing agents -> ${PLATFORM_DEST[claude]}/ ==="
  sync_agent_files "$src_dir" "$dest_dir" "${PLATFORM_GLOB[claude]}" $( [ "$CLEAN" = true ] && echo "--clean" )

  # Step 2.5: Sync commands
  local cmd_src="$SCRIPT_DIR/platform/claude/commands"
  local cmd_dest="$SCRIPT_DIR/.claude/commands"
  if [ -d "$cmd_src" ]; then
    echo "=== 2.5. Syncing commands -> .claude/commands/ ==="
    sync_agent_files "$cmd_src" "$cmd_dest" "*.md" $( [ "$CLEAN" = true ] && echo "--clean" )
  else
    echo "=== 2.5. No commands to sync ==="
  fi

  # Step 3: Skills
  echo "=== 3. Checking skills -> .claude/skills/ ==="
  if [ -d "$SCRIPT_DIR/.claude/skills" ]; then
    echo "    ✅ skills already present"
  else
    echo "    ℹ️  No skills to sync (handled by sync-platforms.mjs)"
  fi

  # Step 4: Ensure .claude/settings.json exists
  local settings="$SCRIPT_DIR/.claude/settings.json"
  if [ ! -f "$settings" ]; then
    echo "=== 4. Creating .claude/settings.json ==="
    if [ "$DRY_RUN" = false ]; then
      cat > "$settings" << 'JSON'
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
      echo "    ~ .claude/settings.json (would create)"
    fi
  else
    echo "    ℹ️  .claude/settings.json already exists"
  fi
}

sync_cursor() {
  local src_dir="$SCRIPT_DIR/${PLATFORM_SRC[cursor]}"
  local dest_dir="$SCRIPT_DIR/${PLATFORM_DEST[cursor]}"

  generate_platform cursor

  echo "=== 2. Syncing agents -> ${PLATFORM_DEST[cursor]}/ ==="
  sync_agent_files "$src_dir" "$dest_dir" "${PLATFORM_GLOB[cursor]}" $( [ "$CLEAN" = true ] && echo "--clean" )

  echo "=== 3. Syncing commands -> .cursor/commands/ ==="
  local cmds_src="$SCRIPT_DIR/platform/cursor/.cursor/commands"
  local cmds_dest="$SCRIPT_DIR/.cursor/commands"
  if [ -d "$cmds_src" ]; then
    mkdir -p "$cmds_dest"
    for src_file in "$cmds_src"/*.md; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file")
      local dest_file="$cmds_dest/$base_name"
      if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
        echo "    ℹ️  $base_name unchanged"
      else
        if [ "$DRY_RUN" = false ]; then
          cp "$src_file" "$dest_file"
          echo "    ✏️  $base_name"
        else
          echo "    ~ $base_name (would update)"
        fi
      fi
    done
  else
    echo "    ℹ️  No commands to sync"
  fi
}

sync_copilot() {
  # copilot doesn't use sync-platforms.mjs; copies instructions/ directly
  local instr_src="$SCRIPT_DIR/${PLATFORM_SRC[copilot]}"

  local agents_src="$SCRIPT_DIR/agents"
  local agents_dest
  local instr_dest
  local skills_src="$SCRIPT_DIR/skills"
  local skills_dest

  if [ "$GLOBAL" = true ]; then
    agents_dest="$HOME/.copilot/agents"
    instr_dest="$HOME/.copilot/instructions"
    skills_dest="$HOME/.copilot/skills"
    echo "🌍 Global install: ~/.copilot/agents/ + ~/.copilot/instructions/ + ~/.copilot/skills/"
  else
    agents_dest="$SCRIPT_DIR/.github/agents"
    instr_dest="$SCRIPT_DIR/${PLATFORM_DEST[copilot]}"
    skills_dest="$SCRIPT_DIR/.github/skills"
    echo "📁 Project-local install: .github/agents/ + .github/instructions/ + .github/skills/"
  fi

  echo "=== 0. Syncing agents -> $(basename "$agents_dest")/ ==="
  if [ ! -d "$agents_src" ]; then
    echo "    ⚠️  No agents/ directory found — skipping"
  else
    mkdir -p "$agents_dest"
    sync_agent_files "$agents_src" "$agents_dest" "*.agent.md" $( [ "$DRY_RUN" = true ] && echo "--clean" ) $( [ "$CLEAN" = true ] && echo "--clean" )
    if [ -f "$agents_src/README.md" ]; then
      cp "$agents_src/README.md" "$agents_dest/README.md" 2>/dev/null || true
    fi
  fi

  echo "=== 1. Syncing instructions -> $(basename "$instr_dest")/ ==="
  if [ ! -d "$instr_src" ]; then
    echo "    ⚠️  No instructions/ directory found — skipping"
  else
    mkdir -p "$instr_dest"
    sync_agent_files "$instr_src" "$instr_dest" "${PLATFORM_GLOB[copilot]}" $( [ "$DRY_RUN" = true ] && echo "--clean" )
  fi

  echo "=== 1.5 Syncing skills -> $(basename "$skills_dest")/ ==="
  if [ ! -d "$skills_src" ]; then
    echo "    ⚠️  No skills/ directory found — skipping"
  else
    mkdir -p "$skills_dest"
    local skills_updated=0
    local skills_unchanged=0
    for skill_dir in "$skills_src"/*/; do
      [ -d "$skill_dir" ] || continue
      local skill_name
      skill_name=$(basename "$skill_dir")
      local dest_skill_dir="$skills_dest/$skill_name"
      mkdir -p "$dest_skill_dir"
      if [ -f "$skill_dir/SKILL.md" ]; then
        if [ -f "$dest_skill_dir/SKILL.md" ] && cmp -s "$skill_dir/SKILL.md" "$dest_skill_dir/SKILL.md"; then
          skills_unchanged=$((skills_unchanged + 1))
        else
          cp "$skill_dir/SKILL.md" "$dest_skill_dir/SKILL.md"
          echo "    ✏️  $skill_name"
          skills_updated=$((skills_updated + 1))
        fi
      fi
    done
    echo "    ✅ $skills_updated updated, $skills_unchanged unchanged"
  fi

  local prompts_folder="${VSCODE_USER_PROMPTS_FOLDER:-}"

  if [ "$NO_PROMPTS" = true ]; then
    echo ""
    echo "    ℹ️  --no-prompts: skipping steps prompts/commands"
  elif [ -z "$prompts_folder" ]; then
    echo ""
    echo "    ⚠️  VSCODE_USER_PROMPTS_FOLDER not set — skipping prompts/commands"
    echo "    To sync prompts, run VS Code integrated terminal or:"
    echo "    export VSCODE_USER_PROMPTS_FOLDER=/path/to/prompts && ./sync-platform.sh copilot"
  else
    # Step 2: prompts/*.prompt.md → $VSCODE_USER_PROMPTS_FOLDER
    echo "=== 2. Syncing prompts -> \$VSCODE_USER_PROMPTS_FOLDER ==="
    local prompts_src="$SCRIPT_DIR/prompts"
    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$prompts_folder"
    fi

    local prompts_updated=0
    local prompts_unchanged=0
    for src_file in "$prompts_src"/*.prompt.md; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file")
      local dest_file="$prompts_folder/$base_name"
      if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
        prompts_unchanged=$((prompts_unchanged + 1))
      else
        if [ "$DRY_RUN" = true ]; then
          echo "    ~ $base_name (would update)"
        else
          cp "$src_file" "$dest_file"
          echo "    ✏️  $base_name"
        fi
        prompts_updated=$((prompts_updated + 1))
      fi
    done
    echo "    ✅ $prompts_updated updated, $prompts_unchanged unchanged"

    # Step 3: commands/*.md → $VSCODE_USER_PROMPTS_FOLDER (as pantheon-*.prompt.md)
    echo "=== 3. Converting commands -> pantheon-*.prompt.md ==="
    local cmds_src="$SCRIPT_DIR/commands"
    local cmds_updated=0
    local cmds_unchanged=0

    for src_file in "$cmds_src"/*.md; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file" .md)

      # Skip non-command files
      [[ "$base_name" == "commands" ]] && continue

      local dest_name="pantheon-${base_name}.prompt.md"
      local dest_file="$prompts_folder/$dest_name"

      # Read raw source
      local raw
      raw="$(cat "$src_file")"

      # Extract description
      local description=""
      if echo "$raw" | grep -qP '^description:'; then
        description=$(echo "$raw" | grep -P '^description:' | head -1 | sed 's/^description: *//' | sed 's/^"\(.*\)"$/\1/')
      fi

      # Determine mode from agent field
      local agent_val
      agent_val=$(echo "$raw" | grep -P '^agent:' | head -1 | sed 's/^agent: *//' | sed 's/^"\(.*\)"$/\1/' | tr -d ' ')
      local mode="agent"
      if [ -z "$agent_val" ]; then
        mode="ask"
      fi

      # Strip existing frontmatter, keep body
      local body
      body=$(echo "$raw" | awk '/^---$/{if(fm_count++==1){p=1;next}} p{print}')

      # Build new .prompt.md content
      local new_content
      new_content="---
name: pantheon-${base_name}
description: ${description}
mode: ${mode}
---
${body}"

      if [ -f "$dest_file" ] && [ "$(cat "$dest_file")" = "$new_content" ]; then
        cmds_unchanged=$((cmds_unchanged + 1))
      else
        if [ "$DRY_RUN" = true ]; then
          echo "    ~ $dest_name (would update)"
        else
          echo "$new_content" > "$dest_file"
          echo "    ✏️  $dest_name"
        fi
        cmds_updated=$((cmds_updated + 1))
      fi
    done
    echo "    ✅ $cmds_updated updated, $cmds_unchanged unchanged"
  fi
}

sync_windsurf() {
  local src_dir="$SCRIPT_DIR/${PLATFORM_SRC[windsurf]}"
  local dest_dir="$SCRIPT_DIR/${PLATFORM_DEST[windsurf]}"

  generate_platform windsurf

  echo "=== 2. Syncing agents -> ${PLATFORM_DEST[windsurf]}/ ==="
  sync_agent_files "$src_dir" "$dest_dir" "${PLATFORM_GLOB[windsurf]}" $( [ "$CLEAN" = true ] && echo "--clean" )

  # Step 3: Sync workflows
  echo "=== 3. Syncing workflows -> .windsurf/workflows/ ==="
  local wf_src="$SCRIPT_DIR/platform/windsurf/workflows"
  local wf_dest="$SCRIPT_DIR/.windsurf/workflows"
  if [ -d "$wf_src" ]; then
    mkdir -p "$wf_dest"
    for src_file in "$wf_src"/*.md; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file")
      local dest_file="$wf_dest/$base_name"
      if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
        echo "    ℹ️  workflow $base_name unchanged"
      else
        if [ "$DRY_RUN" = false ]; then
          cp "$src_file" "$dest_file"
          echo "    ✏️  workflow $base_name"
        else
          echo "    ~ workflow $base_name (would update)"
        fi
      fi
    done
  else
    echo "    ℹ️  No workflows to sync"
  fi
}

sync_continue() {
  local src_dir="$SCRIPT_DIR/${PLATFORM_SRC[continue]}"
  local dest_dir="$SCRIPT_DIR/${PLATFORM_DEST[continue]}"

  generate_platform continue

  echo "=== 2. Syncing agents -> ${PLATFORM_DEST[continue]}/ ==="
  sync_agent_files "$src_dir" "$dest_dir" "${PLATFORM_GLOB[continue]}" $( [ "$CLEAN" = true ] && echo "--clean" )

  # Step 3: Sync config.yaml (only if not exists)
  echo "=== 3. Checking config.yaml -> .continue/ ==="
  local config_src="$SCRIPT_DIR/platform/continue/config.yaml"
  local config_dest="$SCRIPT_DIR/.continue/config.yaml"
  if [ -f "$config_src" ] && [ ! -f "$config_dest" ]; then
    if [ "$DRY_RUN" = false ]; then
      cp "$config_src" "$config_dest"
      echo "    ✅ config.yaml created"
    else
      echo "    ~ config.yaml (would create)"
    fi
  elif [ -f "$config_src" ] && [ -f "$config_dest" ]; then
    echo "    ℹ️  .continue/config.yaml already exists (won't overwrite)"
  else
    echo "    ℹ️  No config.yaml to sync"
  fi

  # Step 4: Sync commands
  echo "=== 4. Syncing commands -> .continue/commands/ ==="
  local cmds_src="$SCRIPT_DIR/platform/continue/.continue/commands"
  local cmds_dest="$SCRIPT_DIR/.continue/commands"
  if [ -d "$cmds_src" ]; then
    mkdir -p "$cmds_dest"
    for src_file in "$cmds_src"/*.md; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file")
      local dest_file="$cmds_dest/$base_name"
      if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
        echo "    ℹ️  $base_name unchanged"
      else
        if [ "$DRY_RUN" = false ]; then
          cp "$src_file" "$dest_file"
          echo "    ✏️  $base_name"
        else
          echo "    ~ $base_name (would update)"
        fi
      fi
    done
  else
    echo "    ℹ️  No commands to sync"
  fi
}

sync_cline() {
  local src_dir="$SCRIPT_DIR/${PLATFORM_SRC[cline]}"
  local dest_dir="$SCRIPT_DIR/${PLATFORM_DEST[cline]}"

  generate_platform cline

  # Step 2: Check output dir
  echo "=== 2. Checking generated files ==="
  local agent_files=0
  if [ -d "$src_dir" ]; then
    agent_files=$(find "$src_dir" -maxdepth 1 -type f 2>/dev/null | wc -l)
  fi
  echo "    Found $agent_files generated agent files in $src_dir"

  # Step 3: Sync agents (no extension, glob using *)
  echo "=== 3. Syncing agents -> ${PLATFORM_DEST[cline]}/ ==="
  sync_agent_files "$src_dir" "$dest_dir" "${PLATFORM_GLOB[cline]}" $( [ "$CLEAN" = true ] && echo "--clean" )

  # Step 4: Sync skills
  echo "=== 4. Syncing skills -> ${PLATFORM_DEST[cline]}/skills/ ==="
  local skills_src="$SCRIPT_DIR/platform/cline/.clinerules/skills"
  local skills_dest="$SCRIPT_DIR/.clinerules/skills"
  if [ -d "$skills_src" ]; then
    mkdir -p "$skills_dest"
    if command -v rsync >/dev/null 2>&1; then
      if [ "$DRY_RUN" = false ]; then
        rsync -a "$skills_src/" "$skills_dest/" && echo "    ✅ skills synced"
      else
        echo "    ~ skills/ (would sync via rsync)"
      fi
    else
      if [ "$DRY_RUN" = false ]; then
        cp -r "$skills_src/." "$skills_dest/" && echo "    ✅ skills copied"
      else
        echo "    ~ skills/ (would sync via cp)"
      fi
    fi
  else
    echo "    ℹ️  No skills to sync"
  fi

  # Step 5: Sync commands
  echo "=== 5. Syncing commands -> ${PLATFORM_DEST[cline]}/commands/ ==="
  local cmds_src="$SCRIPT_DIR/platform/cline/.clinerules/commands"
  local cmds_dest="$SCRIPT_DIR/.clinerules/commands"
  if [ -d "$cmds_src" ]; then
    mkdir -p "$cmds_dest"
    for src_file in "$cmds_src"/*.md; do
      [ -f "$src_file" ] || continue
      local base_name
      base_name=$(basename "$src_file")
      local dest_file="$cmds_dest/$base_name"
      if [ -f "$dest_file" ] && cmp -s "$src_file" "$dest_file"; then
        echo "    ℹ️  $base_name unchanged"
      else
        if [ "$DRY_RUN" = false ]; then
          cp "$src_file" "$dest_file"
          echo "    ✏️  $base_name"
        else
          echo "    ~ $base_name (would update)"
        fi
      fi
    done
  else
    echo "    ℹ️  No commands to sync"
  fi
}

sync_all() {
  for p in "${ALL_PLATFORMS[@]}"; do
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Platform: $p"
    echo "═══════════════════════════════════════════════════════════════"
    "sync_$p"
  done
}

# ═══════════════════════════════════════════════════════════════════════════
# Main Dispatch
# ═══════════════════════════════════════════════════════════════════════════

echo "▸ Platform: $PLATFORM"
echo "▸ Action:   $ACTION"
[ "$CLEAN" = true ] && echo "▸ Clean:    yes"
[ "$NO_PUSH" = true ] && echo "▸ No-push:  yes"
[ "$DRY_RUN" = true ] && echo "▸ Dry-run:  yes"
[ "$NO_PROMPTS" = true ] && echo "▸ No-prompts: yes"
[ "$SKIP_PLUGIN_INSTALL" = true ] && echo "▸ Skip-plugin-install: yes"
echo ""

case "$PLATFORM" in
  all)      sync_all ;;
  opencode) sync_opencode ;;
  claude)   sync_claude ;;
  cursor)   sync_cursor ;;
  copilot)  sync_copilot ;;
  windsurf) sync_windsurf ;;
  continue) sync_continue ;;
  cline)    sync_cline ;;
esac

echo ""
echo "✅ Sync complete for $PLATFORM!"
