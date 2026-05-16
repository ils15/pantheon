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
    echo "  $(basename "$0") <plan-name>                 Activate plan + inject models into opencode.json"
    echo "  $(basename "$0") status                      Show active plan + current model config"
    echo "  $(basename "$0") models                      Show model-to-agent mapping"
    echo "  $(basename "$0") generate                    Re-inject models from active plan"
    echo "  $(basename "$0") generate --target <path>    Write to a custom file path"
    echo "  $(basename "$0") reset                       Remove per-agent model overrides (back to global)"
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
    local config_file="$ROOT_DIR/opencode.json"

    if [[ -L "$ACTIVE_LINK" ]] || [[ -f "$ACTIVE_LINK" ]]; then
        local resolved
        if [[ -L "$ACTIVE_LINK" ]]; then
            resolved=$(readlink -f "$ACTIVE_LINK" 2>/dev/null || readlink "$ACTIVE_LINK")
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
            echo -e "${BLUE}Plan tiers:${NC}"
            echo -e "  ${YELLOW}fast:${NC}    $(_json_get "$resolved" "models.fast")"
            echo -e "  ${YELLOW}default:${NC} $(_json_get "$resolved" "models.default")"
            echo -e "  ${YELLOW}premium:${NC} $(_json_get "$resolved" "models.premium")"
        fi
    else
        echo -e "${YELLOW}⚠️  No active plan — no model configured (OpenCode account default).${NC}"
    fi

    echo ""
    if [[ -f "$config_file" ]]; then
        local global_model global_small
        global_model=$(_json_get "$config_file" "model")
        global_small=$(_json_get "$config_file" "small_model")
        echo -e "${BLUE}opencode.json:${NC}"
        echo -e "  ${YELLOW}model:${NC}       ${global_model:-"(not set — account default)"}"
        echo -e "  ${YELLOW}small_model:${NC} ${global_small:-"(not set — account default)"}"

        # Check if any agent has an explicit model override
        local overrides
        overrides=$(python3 -c "
import json
try:
    d = json.load(open('$config_file'))
    agents = d.get('agent', {})
    count = sum(1 for v in agents.values() if isinstance(v, dict) and 'model' in v)
    print(count)
except Exception:
    print(0)
" 2>/dev/null || echo "0")
        if [[ "$overrides" -gt 0 ]]; then
            echo -e "  ${YELLOW}per-agent models:${NC} $overrides agents with model override"
        else
            echo -e "  ${YELLOW}per-agent models:${NC} none"
        fi
    fi
}

# ── Reset all model config (global + per-agent) ───────────────────────────────
cmd_reset() {
    local config_file="$ROOT_DIR/opencode.json"
    if [[ ! -f "$config_file" ]]; then
        echo -e "${RED}❌ opencode.json not found at $config_file${NC}"
        exit 1
    fi

    local result
    result=$(python3 - "$config_file" << 'PYEOF'
import json, sys
config_file = sys.argv[1]
with open(config_file) as f:
    config = json.load(f)
removed = 0
# Remove global model keys
for key in ("model", "small_model"):
    if key in config:
        del config[key]
        removed += 1
# Remove per-agent model overrides
for agent, val in config.get("agent", {}).items():
    if isinstance(val, dict) and "model" in val:
        del val["model"]
        removed += 1
with open(config_file, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")
print(f"removed={removed}")
PYEOF
)

    local removed
    removed=$(echo "$result" | grep "^removed=" | cut -d= -f2)

    echo -e "${GREEN}✅ Reset complete — ${removed} model key(s) removed (global + per-agent).${NC}"
    echo -e "   OpenCode will use the account default model."

    # Clear active plan symlink
    if [[ -L "$ACTIVE_LINK" ]]; then
        rm -f "$ACTIVE_LINK"
        echo -e "   Active plan symlink cleared."
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
# Surgically updates only the "model" key inside each existing agent entry.
# All other per-agent config (description, color, temperature, steps, permission)
# is left untouched. Global model/small_model are also updated.
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
    "zeus":       "premium",
    "athena":     "premium",
    "themis":     "premium",
    "hermes":     "default",
    "aphrodite":  "default",
    "demeter":    "default",
    "prometheus": "default",
    "hephaestus": "default",
    "chiron":     "default",
    "echo":       "default",
    "gaia":       "default",
    "iris":       "default",
    "apollo":     "fast",
    "nyx":        "fast",
    "mnemosyne":  "fast",
    "talos":      "fast",
}

tier_to_model = {
    "fast":    fast_model,
    "default": default_model,
    "premium": premium_model,
}

def resolve_model(agent):
    """Return the model for this agent: override > tier default."""
    if agent in overrides:
        return overrides[agent]
    tier = TIER_MAP.get(agent)
    return tier_to_model.get(tier, "") if tier else ""

# Load existing config — we do a SURGICAL update, not a full rewrite
existing = {}
if os.path.exists(output_file):
    try:
        with open(output_file) as f:
            existing = json.load(f)
    except Exception:
        existing = {}

# Update global model keys
existing["$schema"] = "https://opencode.ai/config.json"
if premium_model or default_model:
    existing["model"] = premium_model or default_model
if fast_model:
    existing["small_model"] = fast_model

# Surgically inject/update only the "model" key in each agent entry.
# Agents not present in the config are skipped (plan drives model, not structure).
agent_section = existing.get("agent", {})
updated = 0
for agent in TIER_MAP:
    model = resolve_model(agent)
    if not model:
        continue
    if agent in agent_section:
        # Preserve all existing keys, only set/update "model"
        agent_section[agent]["model"] = model
        updated += 1
    # If agent doesn't exist in config yet, skip — plan doesn't create agents

existing["agent"] = agent_section

os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)

with open(output_file, "w") as f:
    json.dump(existing, f, indent=2)
    f.write("\n")

plan_name = plan.get("plan", os.path.basename(plan_file).replace(".json",""))
print(f"plan={plan_name}")
print(f"model={premium_model or default_model}")
print(f"small_model={fast_model}")
print(f"agents={updated}")
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
    reset|clean)
        cmd_reset
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        cmd_select_plan "$CMD"
        ;;
esac
