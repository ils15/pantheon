#!/usr/bin/env bash
# generate-prompts.sh — Generate dynamic prompt templates for Pantheon
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANTHEON_DIR="$(dirname "$SCRIPT_DIR")"

# ── Read active plan ─────────────────────────────────────────────────────────
PLAN_FILE="$PANTHEON_DIR/platform/plans/plan-active.json"
if [[ -f "$PLAN_FILE" ]]; then
    PLAN=$(jq -r '.plan // "unknown"' "$PLAN_FILE")
    SERVICE=$(jq -r '.service // "unknown"' "$PLAN_FILE")
    TIER=$(jq -r '.tier // "unknown"' "$PLAN_FILE")
    PRICE=$(jq -r '.price // "unknown"' "$PLAN_FILE")
    MONTHLY_REQUESTS=$(jq -r '.limits.monthlyRequests // "unlimited"' "$PLAN_FILE")

    # Build tier-to-model map
    TIER_MAP=$(jq -r '
        to_entries[]
        | select(.key | IN("free","fast","default","premium"))
        | "  \(.key): \(.value)"
    ' "$PLAN_FILE" 2>/dev/null || echo "  (unable to parse tiers)")

    # Build agent overrides map
    AGENT_OVERRIDES=$(jq -r '
        .agent_overrides // {}
        | to_entries[]
        | "  \(.key): \(.value)"
    ' "$PLAN_FILE" 2>/dev/null || true)
else
    PLAN="default"
    SERVICE="opencode"
    TIER="default"
    PRICE="unknown"
    MONTHLY_REQUESTS="unlimited"
    TIER_MAP="  default: unknown"
    AGENT_OVERRIDES=""
fi

# ── List agents ──────────────────────────────────────────────────────────────
AGENTS_DIR="$PANTHEON_DIR/platform/opencode/agents"
AGENTS_LIST=""
if [[ -d "$AGENTS_DIR" ]]; then
    AGENTS_LIST=$(ls "$AGENTS_DIR"/*.md 2>/dev/null | xargs -n1 basename | sed 's/\.md$//' | sort | paste -sd ', ' -)
fi

# ── Create dynamic prompts directory ─────────────────────────────────────────
DYNAMIC_DIR="$PANTHEON_DIR/prompts/dynamic"
mkdir -p "$DYNAMIC_DIR"

# ── Helper: extract description from agent frontmatter ───────────────────────
extract_description() {
    local file="$1"
    # Grab the first 'description:' line inside the first YAML frontmatter block
    sed -n '/^---$/,/^---$/p' "$file" 2>/dev/null \
        | grep -m1 '^description:' \
        | sed 's/^description:[[:space:]]*//; s/^"//; s/"$//; s/^'"'"'//; s/'"'"'$//' \
        || echo "No description available"
}

# ── Generate Council Prompt ───────────────────────────────────────────────────
COUNCIL_FILE="$DYNAMIC_DIR/council-generated.txt"
cat > "$COUNCIL_FILE" << EOF
# =============================================================================
# Dynamic Council Prompt
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Plan: $PLAN
# Service: $SERVICE
# Tier: $TIER
# Price: $PRICE
# Monthly Requests: $MONTHLY_REQUESTS
# =============================================================================

You are convening a council with access to these specialists: $AGENTS_LIST

## Platform Capabilities
EOF

if [[ -n "$TIER_MAP" ]]; then
    echo "Model Tiers:" >> "$COUNCIL_FILE"
    echo "$TIER_MAP" >> "$COUNCIL_FILE"
    echo "" >> "$COUNCIL_FILE"
fi

if [[ -n "$AGENT_OVERRIDES" ]]; then
    echo "Agent Overrides:" >> "$COUNCIL_FILE"
    echo "$AGENT_OVERRIDES" >> "$COUNCIL_FILE"
    echo "" >> "$COUNCIL_FILE"
fi

cat >> "$COUNCIL_FILE" << EOF
## Instructions
1. Select 2-3 relevant agents based on the question domain
2. Dispatch them in parallel with the same question
3. Synthesize their perspectives into a single recommendation
4. Include confidence level and next steps

## Available Specialists
EOF

for agent_file in "$AGENTS_DIR"/*.md; do
    [[ -f "$agent_file" ]] || continue
    agent_name=$(basename "$agent_file" .md)
    description=$(extract_description "$agent_file")
    printf -- "- @%s: %s\n" "$agent_name" "$description" >> "$COUNCIL_FILE"
done

# ── Generate Orchestration Prompt ────────────────────────────────────────────
ORCH_FILE="$DYNAMIC_DIR/orchestrate-generated.txt"
cat > "$ORCH_FILE" << EOF
# =============================================================================
# Dynamic Orchestration Prompt
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Plan: $PLAN
# Service: $SERVICE
# Tier: $TIER
# Price: $PRICE
# Monthly Requests: $MONTHLY_REQUESTS
# =============================================================================

You are Zeus, the central orchestrator for the Pantheon multi-agent system.

## Active Configuration
- Plan: $PLAN
- Service: $SERVICE
- Tier: $TIER
- Price: $PRICE
- Monthly Request Limit: $MONTHLY_REQUESTS

## Model Tiers
EOF

if [[ -n "$TIER_MAP" ]]; then
    echo "$TIER_MAP" >> "$ORCH_FILE"
fi

cat >> "$ORCH_FILE" << EOF

## Available Agents
EOF

for agent_file in "$AGENTS_DIR"/*.md; do
    [[ -f "$agent_file" ]] || continue
    agent_name=$(basename "$agent_file" .md)
    description=$(extract_description "$agent_file")
    printf -- "- @%s: %s\n" "$agent_name" "$description" >> "$ORCH_FILE"
done

cat >> "$ORCH_FILE" << EOF

## Orchestration Rules
1. **Planning**: Delegate to @athena for architecture decisions
2. **Discovery**: Delegate to @apollo for codebase investigation
3. **Implementation**: Dispatch @hermes (backend), @aphrodite (frontend), @demeter (database) in parallel when scopes are independent
4. **Review**: Always route completed work to @themis before merge
5. **Deploy**: Route infrastructure changes to @prometheus
6. **Document**: Route memory tasks to @mnemosyne
7. **Hotfix**: Route small fixes to @talos (bypass orchestration)

## Cost-Conscious Routing
- Use \`fast\` tier agents for discovery, documentation, and simple queries
- Use \`default\` tier agents for standard implementation work
- Use \`premium\` tier agents for planning, review, and complex orchestration
- Respect monthly request limits: $MONTHLY_REQUESTS
EOF

# ── Generate Agent Handoff Prompt ────────────────────────────────────────────
HANDOFF_FILE="$DYNAMIC_DIR/handoff-generated.txt"
cat > "$HANDOFF_FILE" << EOF
# =============================================================================
# Dynamic Agent Handoff Prompt
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Plan: $PLAN
# Service: $SERVICE
# Tier: $TIER
# =============================================================================

## Handoff Tier Assignments
EOF

if [[ -n "$TIER_MAP" ]]; then
    echo "$TIER_MAP" >> "$HANDOFF_FILE"
    echo "" >> "$HANDOFF_FILE"
fi

cat >> "$HANDOFF_FILE" << EOF
## Agent Directory
EOF

for agent_file in "$AGENTS_DIR"/*.md; do
    [[ -f "$agent_file" ]] || continue
    agent_name=$(basename "$agent_file" .md)
    description=$(extract_description "$agent_file")
    printf -- "- @%s: %s\n" "$agent_name" "$description" >> "$HANDOFF_FILE"
done

cat >> "$HANDOFF_FILE" << EOF

## Handoff Rules
| Direction | Tier | Reason |
|---|---|---|
| Any → Themis | premium | Critical quality + security gate |
| Any → Zeus | premium | Complex orchestration decisions |
| Athena → Zeus | premium | Plan handoff needs careful execution |
| Any → Mnemosyne | fast | Simple documentation writes |
| Hephaestus/Chiron → Prometheus | default | Infrastructure config generation |
| Echo → Talos | fast | Quick hotfix dispatch |

## Cost Cap Rule
The requested model tier cannot exceed the cost tier of the main conversation model.
EOF

# ── Summary ────────────────────────────────────────────────────────────────────
echo "✅ Generated dynamic prompts for plan '$PLAN'"
echo "   Service: $SERVICE"
echo "   Tier: $TIER"
echo "   Agents: $AGENTS_LIST"
echo ""
echo "   Output files:"
echo "     - $COUNCIL_FILE"
echo "     - $ORCH_FILE"
echo "     - $HANDOFF_FILE"
