#!/usr/bin/env bash
# ============================================================
# select-plan.sh — Pantheon Model Plan Selector
# ============================================================
# Usage:
#   ./platform/select-plan.sh list                    # List all available plans
#   ./platform/select-plan.sh opencode-go             # Select OpenCode Go plan
#   ./platform/select-plan.sh copilot-pro             # Select Copilot Pro plan
#   ./platform/select-plan.sh status                  # Show current active plan
#   ./platform/select-plan.sh models                  # Show model mapping for active plan
# ============================================================

set -euo pipefail

PLANS_DIR="$(cd "$(dirname "$0")" && pwd)/plans"
ACTIVE_LINK="$PLANS_DIR/plan-active.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Help ─────────────────────────────────────────────────
usage() {
    echo "Usage:"
    echo "  $(basename "$0") list                          List all available plans"
    echo "  $(basename "$0") <plan-name>                   Activate a plan (e.g., opencode-go, copilot-pro)"
    echo "  $(basename "$0") status                        Show current active plan"
    echo "  $(basename "$0") models                        Show model-to-agent mapping for active plan"
    echo ""
    echo "Available plans:"
    list_plans
    exit 1
}

# ── List Plans ──────────────────────────────────────────
list_plans() {
    local files=("$PLANS_DIR"/*.json)
    local count=0
    for f in "${files[@]}"; do
        local name
        name=$(basename "$f" .json)
        if [[ "$name" != "schema" && "$name" != "plan-active" ]]; then
            local service tier price
            service=$(grep -o '"service": *"[^"]*"' "$f" 2>/dev/null | cut -d'"' -f4 || echo "?")
            tier=$(grep -o '"tier": *"[^"]*"' "$f" 2>/dev/null | cut -d'"' -f4 || echo "?")
            price=$(grep -o '"price": *"[^"]*"' "$f" 2>/dev/null | cut -d'"' -f4 || echo "?")
            printf "  ${CYAN}%-25s${NC} %-12s %-12s %s\n" "$name" "[$service]" "[$tier]" "$price"
            ((count++))
        fi
    done
    if [[ $count -eq 0 ]]; then
        echo "  (no plan files found in $PLANS_DIR)"
    fi
}

# ── Show Active Plan ─────────────────────────────────────
show_status() {
    if [[ -L "$ACTIVE_LINK" ]] || [[ -f "$ACTIVE_LINK" ]]; then
        local target
        if [[ -L "$ACTIVE_LINK" ]]; then
            target=$(readlink "$ACTIVE_LINK")
        else
            target="$ACTIVE_LINK"
        fi
        local plan_name
        plan_name=$(basename "$target" .json)
        echo -e "${GREEN}✅ Active plan: ${CYAN}$plan_name${NC}"
        echo ""
        if [[ -f "$target" ]]; then
            echo -e "${BLUE}Models:${NC}"
            local fast default premium
            fast=$(grep -o '"fast": *"[^"]*"' "$target" 2>/dev/null | cut -d'"' -f4 || echo "?")
            default=$(grep -o '"default": *"[^"]*"' "$target" 2>/dev/null | cut -d'"' -f4 || echo "?")
            premium=$(grep -o '"premium": *"[^"]*"' "$target" 2>/dev/null | cut -d'"' -f4 || echo "?")
            echo -e "  ${YELLOW}fast:${NC}    $fast"
            echo -e "  ${YELLOW}default:${NC} $default"
            echo -e "  ${YELLOW}premium:${NC} $premium"
        fi
    else
        echo -e "${RED}❌ No active plan selected.${NC}"
        echo "Run './platform/select-plan.sh <plan-name>' to select one."
    fi
}

# ── Show Model Mapping ─────────────────────────────────
show_models() {
    if [[ ! -f "$ACTIVE_LINK" ]]; then
        echo -e "${RED}❌ No active plan. Select one first.${NC}"
        exit 1
    fi

    echo -e "${BLUE}📊 Agent Model Mapping for Active Plan${NC}"
    echo ""

    # Read model tiers
    local fast default premium
    fast=$(grep -o '"fast": *"[^"]*"' "$ACTIVE_LINK" 2>/dev/null | cut -d'"' -f4 || echo "?")
    default=$(grep -o '"default": *"[^"]*"' "$ACTIVE_LINK" 2>/dev/null | cut -d'"' -f4 || echo "?")
    premium=$(grep -o '"premium": *"[^"]*"' "$ACTIVE_LINK" 2>/dev/null | cut -d'"' -f4 || echo "?")

    # Agent-to-tier mapping (defined here based on AGENTS.md model-role alignment)
    echo -e "${YELLOW}Tier → Model mapping:${NC}"
    echo -e "  fast:    $fast"
    echo -e "  default: $default"
    echo -e "  premium: $premium"
    echo ""

    # Check for agent_overrides
    local has_overrides
    has_overrides=$(grep -c '"agent_overrides"' "$ACTIVE_LINK" 2>/dev/null || echo "0")
    if [[ "$has_overrides" -gt 0 ]]; then
        echo -e "${YELLOW}Agent overrides:${NC}"
        # Parse agent_overrides section
        in_section=false
        while IFS= read -r line; do
            if echo "$line" | grep -q '"agent_overrides"'; then
                in_section=true
                continue
            fi
            if $in_section; then
                if echo "$line" | grep -q '}'; then
                    break
                fi
                local agent model
                agent=$(echo "$line" | grep -o '"[^"]*":' | head -1 | tr -d '":')
                model=$(echo "$line" | grep -o '"[^"]*"' | tail -1)
                if [[ -n "$agent" && -n "$model" ]]; then
                    echo -e "  ${CYAN}$agent:${NC} $model"
                fi
            fi
        done < "$ACTIVE_LINK"
    fi

    echo ""
    echo -e "${YELLOW}Agent tier assignments (built-in):${NC}"
    echo -e "  ${CYAN}premium:${NC}  Zeus, Athena, Temis"
    echo -e "  ${CYAN}default:${NC}  Hermes, Aphrodite, Maat, Ra, Hefesto, Quíron, Eco, Gaia"
    echo -e "  ${CYAN}fast:${NC}     Apollo, Iris, Mnemosyne, Talos, Nix"
}

# ── Generate opencode.json from OpenCode Go plan ─────
# opencode.json is for OpenCode only — always use Go plan models
generate_opencode_json() {
    local opencode_plan="$PLANS_DIR/opencode-go.json"
    local ROOT_DIR
    ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
    local OUTPUT="$ROOT_DIR/opencode.json"

    if [[ ! -f "$opencode_plan" ]]; then
        echo -e "${YELLOW}⚠️  opencode-go.json not found. Skipping opencode.json generation.${NC}"
        return
    fi

    local fast default premium
    fast=$(grep -o '"fast": *"[^"]*"' "$opencode_plan" 2>/dev/null | cut -d'"' -f4 || echo "")
    premium=$(grep -o '"premium": *"[^"]*"' "$opencode_plan" 2>/dev/null | cut -d'"' -f4 || echo "")

    if [[ -z "$premium" || -z "$fast" ]]; then
        echo -e "${YELLOW}⚠️  Could not parse models from opencode-go.json. Skipping.${NC}"
        return
    fi

    cat > "$OUTPUT" << EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "model": "$premium",
  "small_model": "$fast"
}
EOF

    echo -e "${GREEN}✅ Generated opencode.json (Go plan):${NC}"
    echo -e "   ${YELLOW}model:${NC}       $premium"
    echo -e "   ${YELLOW}small_model:${NC}  $fast"
    echo ""
}

# ── Select Plan ─────────────────────────────────────────
select_plan() {
    local plan_name="$1"
    local plan_file="$PLANS_DIR/${plan_name}.json"

    if [[ ! -f "$plan_file" ]]; then
        echo -e "${RED}❌ Plan '$plan_name' not found.${NC}"
        echo "Available plans:"
        list_plans
        exit 1
    fi

    # Remove existing link/file
    rm -f "$ACTIVE_LINK"

    # Create relative symlink
    ln -s "${plan_name}.json" "$ACTIVE_LINK"

    echo -e "${GREEN}✅ Active plan set to: ${CYAN}$plan_name${NC}"
    echo ""

    # Generate root opencode.json from plan
    generate_opencode_json "$plan_file" "$plan_name"

    show_status
}

# ── Main ────────────────────────────────────────────────
mkdir -p "$PLANS_DIR"

case "${1:-help}" in
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
    help|--help|-h)
        usage
        ;;
    *)
        select_plan "$1"
        ;;
esac
