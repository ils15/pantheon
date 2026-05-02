#!/usr/bin/env bash
# ============================================================
# select-plan.sh — Pantheon Model Plan Selector
# ============================================================
# Usage:
#   ./platform/select-plan.sh list                    # List all available plans
#   ./platform/select-plan.sh opencode-go             # Activate a plan
#   ./platform/select-plan.sh status                  # Show current active plan
#   ./platform/select-plan.sh models                  # Show model mapping
#   ./platform/select-plan.sh generate                # Write opencode.json from active plan
#   ./platform/select-plan.sh generate --target PATH  # Write to a specific file
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLANS_DIR="$SCRIPT_DIR/plans"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ACTIVE_LINK="$PLANS_DIR/plan-active.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Require python3 or node for JSON parsing ─────────────────────────────────
_json_get() {
    # Usage: _json_get <file> <jq-like-key>
    # Uses python3 as a lightweight JSON reader (always available)
    local file="$1" key="$2"
    python3 -c "
import json, sys
try:
    d = json.load(open('$file'))
    parts = '$key'.split('.')
    v = d
    for p in parts:
        v = v[p]
    print(v if isinstance(v, str) else json.dumps(v))
except Exception:
    print('')
" 2>/dev/null || echo ""
}

_json_keys() {
    # Return keys of a nested object as "key\tvalue" lines
    local file="$1" key="$2"
    python3 -c "
import json
try:
    d = json.load(open('$file'))
    parts = '$key'.split('.')
    v = d
    for p in parts:
        v = v[p]
    for k, val in v.items():
        print(k + '\t' + str(val))
except Exception:
    pass
" 2>/dev/null || true
}

# ── Help ─────────────────────────────────────────────────────────────────────
usage() {
    echo "Usage:"
    echo "  $(basename "$0") list                        List all available plans"
    echo "  $(basename "$0") <plan-name>                 Activate plan + write opencode.json"
    echo "  $(basename "$0") status                      Show current active plan"
    echo "  $(basename "$0") models                      Show model-to-agent mapping"
    echo "  $(basename "$0") generate                    Write opencode.json from active plan"
    echo "  $(basename "$0") generate --target <path>    Write to a custom file path"
    echo ""
    echo "Available plans:"
    list_plans
    exit 1
}

# ── List Plans ────────────────────────────────────────────────────────────────
list_plans() {
    local files=("$PLANS_DIR"/*.json)
    local count=0
    for f in "${files[@]}"; do
        local name
        name=$(basename "$f" .json)
        if [[ "$name" != "schema" && "$name" != "plan-active" ]]; then
            local service tier price
            service=$(_json_get "$f" "service")
            tier=$(_json_get "$f" "tier")
            price=$(_json_get "$f" "price")
            printf "  ${CYAN}%-28s${NC} %-14s %-12s %s\n" "$name" "[$service]" "[$tier]" "$price"
            ((count++))
        fi
    done
    if [[ $count -eq 0 ]]; then
        echo "  (no plan files found in $PLANS_DIR)"
    fi
}

# ── Show Active Plan ──────────────────────────────────────────────────────────
show_status() {
    if [[ -L "$ACTIVE_LINK" ]] || [[ -f "$ACTIVE_LINK" ]]; then
        local resolved
        if [[ -L "$ACTIVE_LINK" ]]; then
            resolved=$(readlink -f "$ACTIVE_LINK" 2>/dev/null || readlink "$ACTIVE_LINK")
            # If relative, resolve from PLANS_DIR
            if [[ ! "$resolved" = /* ]]; then
                resolved="$PLANS_DIR/$resolved"
            fi
        else
            resolved="$ACTIVE_LINK"
        fi
        local plan_name
        plan_name=$(basename "$resolved" .json)
        echo -e "${GREEN}✅ Active plan: ${CYAN}$plan_name${NC}"
        echo ""
        if [[ -f "$resolved" ]]; then
            echo -e "${BLUE}Tier models:${NC}"
            echo -e "  ${YELLOW}fast:${NC}    $(_json_get "$resolved" "models.fast")"
            echo -e "  ${YELLOW}default:${NC} $(_json_get "$resolved" "models.default")"
            echo -e "  ${YELLOW}premium:${NC} $(_json_get "$resolved" "models.premium")"
        fi
    else
        echo -e "${RED}❌ No active plan selected.${NC}"
        echo "Run: ./platform/select-plan.sh <plan-name>"
    fi
}

# ── Show Model Mapping ────────────────────────────────────────────────────────
show_models() {
    if [[ ! -f "$ACTIVE_LINK" ]]; then
        echo -e "${RED}❌ No active plan. Select one first.${NC}"
        exit 1
    fi

    local resolved="$ACTIVE_LINK"
    if [[ -L "$ACTIVE_LINK" ]]; then
        resolved=$(readlink -f "$ACTIVE_LINK" 2>/dev/null || readlink "$ACTIVE_LINK")
        if [[ ! "$resolved" = /* ]]; then
            resolved="$PLANS_DIR/$resolved"
        fi
    fi

    local plan_name
    plan_name=$(basename "$resolved" .json)

    echo -e "${BLUE}📊 Model mapping — plan: ${CYAN}$plan_name${NC}"
    echo ""
    echo -e "${YELLOW}Tier defaults:${NC}"
    echo -e "  fast:    $(_json_get "$resolved" "models.fast")"
    echo -e "  default: $(_json_get "$resolved" "models.default")"
    echo -e "  premium: $(_json_get "$resolved" "models.premium")"
    echo ""

    echo -e "${YELLOW}Per-agent overrides:${NC}"
    while IFS=$'\t' read -r agent model; do
        printf "  ${CYAN}%-12s${NC} %s\n" "$agent" "$model"
    done < <(_json_keys "$resolved" "agent_overrides")

    echo ""
    echo -e "${YELLOW}Tier assignments (built-in):${NC}"
    echo -e "  ${CYAN}premium:${NC}  zeus, athena, themis"
    echo -e "  ${CYAN}default:${NC}  hermes, aphrodite, demeter, prometheus, hephaestus, chiron, echo, gaia, iris"
    echo -e "  ${CYAN}fast:${NC}     apollo, nyx, mnemosyne, talos"
}

# ── Generate opencode.json ────────────────────────────────────────────────────
# Reads the active plan (or the plan passed explicitly) and writes a full
# opencode.json with per-agent model overrides derived from:
#   1. agent_overrides in the plan file (explicit per-agent model)
#   2. Tier defaults (fast/default/premium) for all other agents
#
# Agent tier assignments (canonical):
#   premium → zeus, athena, themis
#   default → hermes, aphrodite, demeter, prometheus, hephaestus, chiron, echo, gaia, iris
#   fast    → apollo, nyx, mnemosyne, talos
#
# Usage:
#   generate_opencode_json <plan_file> <output_file>
generate_opencode_json() {
    local plan_file="$1"
    local output_file="$2"

    if [[ ! -f "$plan_file" ]]; then
        echo -e "${RED}❌ Plan file not found: $plan_file${NC}"
        exit 1
    fi

    python3 - "$plan_file" "$output_file" << 'PYEOF'
import json, sys, os

plan_file = sys.argv[1]
output_file = sys.argv[2]

with open(plan_file) as f:
    plan = json.load(f)

models = plan.get("models", {})
fast_model    = models.get("fast", "")
default_model = models.get("default", "")
premium_model = models.get("premium", "")
overrides     = plan.get("agent_overrides", {})

# Canonical tier assignments
TIER_MAP = {
    "zeus":      "premium",
    "athena":    "premium",
    "themis":     "premium",
    "hermes":    "default",
    "aphrodite": "default",
     "demeter":  "default",
     "prometheus": "default",
    "hephaestus":   "default",
    "chiron":    "default",
    "echo":       "default",
    "gaia":      "default",
    "iris":      "default",
    "apollo":    "fast",
    "nyx":       "fast",
    "mnemosyne": "fast",
    "talos":     "fast",
}

tier_to_model = {
    "fast":    fast_model,
    "default": default_model,
    "premium": premium_model,
}

# Build agent model map: overrides take priority over tier defaults
agent_section = {}
for agent, tier in TIER_MAP.items():
    if agent in overrides:
        agent_section[agent] = {"model": overrides[agent]}
    elif tier_to_model.get(tier):
        agent_section[agent] = {"model": tier_to_model[tier]}

# Preserve existing non-agent keys in the output file (e.g. mcp, permission, plugin)
existing = {}
if os.path.exists(output_file):
    try:
        with open(output_file) as f:
            existing = json.load(f)
    except Exception:
        existing = {}

# Keys we manage — always overwrite these
managed_keys = {"$schema", "model", "small_model", "agent"}
preserved = {k: v for k, v in existing.items() if k not in managed_keys}

config = {
    "$schema": "https://opencode.ai/config.json",
    "model": premium_model or default_model,
    "small_model": fast_model,
    **preserved,
    "agent": agent_section,
}

os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)

with open(output_file, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")

plan_name = plan.get("plan", os.path.basename(plan_file).replace(".json",""))
print(f"plan={plan_name}")
print(f"model={premium_model or default_model}")
print(f"small_model={fast_model}")
print(f"agents={len(agent_section)}")
PYEOF
}

# ── Sub-command: generate ─────────────────────────────────────────────────────
cmd_generate() {
    # Parse optional --target flag
    local target_file="$ROOT_DIR/opencode.json"
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --target) target_file="$2"; shift 2 ;;
            *) shift ;;
        esac
    done

    if [[ ! -f "$ACTIVE_LINK" ]]; then
        echo -e "${RED}❌ No active plan. Run: ./platform/select-plan.sh <plan-name>${NC}"
        exit 1
    fi

    local resolved="$ACTIVE_LINK"
    if [[ -L "$ACTIVE_LINK" ]]; then
        resolved=$(readlink -f "$ACTIVE_LINK" 2>/dev/null || readlink "$ACTIVE_LINK")
        if [[ ! "$resolved" = /* ]]; then
            resolved="$PLANS_DIR/$resolved"
        fi
    fi

    echo -e "${BLUE}Generating opencode.json from active plan...${NC}"
    local result
    result=$(generate_opencode_json "$resolved" "$target_file")

    local plan_name model small_model agents
    plan_name=$(echo "$result" | grep "^plan=" | cut -d= -f2)
    model=$(echo "$result" | grep "^model=" | cut -d= -f2)
    small_model=$(echo "$result" | grep "^small_model=" | cut -d= -f2)
    agents=$(echo "$result" | grep "^agents=" | cut -d= -f2)

    echo -e "${GREEN}✅ Written: $target_file${NC}"
    echo -e "   ${YELLOW}plan:${NC}        $plan_name"
    echo -e "   ${YELLOW}model:${NC}       $model"
    echo -e "   ${YELLOW}small_model:${NC} $small_model"
    echo -e "   ${YELLOW}agents:${NC}      $agents agent overrides"
}

# ── Sub-command: select plan ──────────────────────────────────────────────────
cmd_select_plan() {
    local plan_name="$1"
    local plan_file="$PLANS_DIR/${plan_name}.json"

    if [[ ! -f "$plan_file" ]]; then
        echo -e "${RED}❌ Plan '$plan_name' not found.${NC}"
        echo "Available plans:"
        list_plans
        exit 1
    fi

    # Create/update symlink
    rm -f "$ACTIVE_LINK"
    ln -s "${plan_name}.json" "$ACTIVE_LINK"

    echo -e "${GREEN}✅ Active plan set to: ${CYAN}$plan_name${NC}"
    echo ""

    # Generate opencode.json in repo root
    local output_file="$ROOT_DIR/opencode.json"
    echo -e "${BLUE}Generating opencode.json...${NC}"
    local result
    result=$(generate_opencode_json "$plan_file" "$output_file")

    local model small_model agents
    model=$(echo "$result" | grep "^model=" | cut -d= -f2)
    small_model=$(echo "$result" | grep "^small_model=" | cut -d= -f2)
    agents=$(echo "$result" | grep "^agents=" | cut -d= -f2)

    echo -e "${GREEN}✅ Written: $output_file${NC}"
    echo -e "   ${YELLOW}model:${NC}       $model"
    echo -e "   ${YELLOW}small_model:${NC} $small_model"
    echo -e "   ${YELLOW}agents:${NC}      $agents agent overrides"
    echo ""
    show_status
}

# ── Main ──────────────────────────────────────────────────────────────────────
mkdir -p "$PLANS_DIR"

CMD="${1:-help}"
shift || true

case "$CMD" in
    list|ls)
        echo -e "${BLUE}Available plans:${NC}"
        list_plans
        ;;
    status|current)
        show_status
        ;;
    models|agents)
        show_models
        ;;
    generate)
        cmd_generate "$@"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        cmd_select_plan "$CMD"
        ;;
esac
