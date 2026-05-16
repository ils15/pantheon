# Pantheon Plan Configuration System

The plan system maps abstract **model tiers** (`free`, `fast`, `default`, `premium`) to concrete model IDs for different AI services (OpenCode, GitHub Copilot, Cursor, Claude Code, BYOK).

---

## Quick Start

### Select a Plan

```bash
# List all available plans
./platform/select-plan.sh list

# Select a specific plan
./platform/select-plan.sh opencode-go

# See which models each agent uses
./platform/select-plan.sh models

# Check current active plan
./platform/select-plan.sh status
```

### How It Works

1. **Plans** define which models map to each tier (`free`/`fast`/`default`/`premium`)
2. **Agents** declare their required tier in their `.agent.md` frontmatter
3. **At runtime**, the active plan resolves tiers to concrete model IDs
4. **Handoffs** can override models for specific agent-to-agent delegations

---

## Tier Fallback Chain

When a tier is not explicitly defined in a plan, or when resolving agent tiers, the system uses a fallback chain to ensure every agent gets a valid model:

```
resolve_tier("free"):    models.free → models.fast → models.default → models.premium
resolve_tier("fast"):    models.fast → models.default → models.premium
resolve_tier("default"): models.default → models.premium
resolve_tier("premium"): models.premium
```

### The `free` Tier (Optional)

The `free` tier is an **optional** addition for cost-conscious plans. It allows you to specify an even cheaper model than `fast` for agents that perform simple tasks.

**When to use:**
- Free/hobby plans with strict cost constraints
- Agents performing simple, low-complexity tasks (Iris, Mnemosyne, Talos)
- Fallback tier when `fast` models consume paid credits

**Example configuration:**
```json
{
  "models": {
    "free": "openai/gpt-5-nano",
    "fast": "openai/gpt-5-mini",
    "default": "openai/gpt-5-mini",
    "premium": "anthropic/claude-sonnet-4-6"
  }
}
```

**Agent tier assignments:**
- `free` → iris, mnemosyne, talos (simple tasks, exploration, documentation)
- `fast` → apollo, nyx (discovery, monitoring)
- `default` → hermes, aphrodite, demeter, prometheus, hephaestus, chiron, echo, gaia (implementation)
- `premium` → zeus, athena, themis (orchestration, planning, review)

---

## Model Value Types

Model fields in plan files support **three value types**:

### 1. Explicit String

Use a specific model ID exactly as provided by the platform:

```json
{
  "models": {
    "fast": "opencode/deepseek-v4-flash",
    "default": "opencode/kimi-k2.5",
    "premium": "opencode/kimi-k2.6"
  }
}
```

**Use when:** You want deterministic, predictable model assignment.

### 2. `"auto"` — Inherit from Chat Selection

The agent uses whatever model the user has selected via the `/model` command:

```json
{
  "models": {
    "fast": "auto",
    "default": "auto",
    "premium": "opencode/kimi-k2.6"
  },
  "agent_overrides": {
    "apollo": "auto",
    "iris": "auto"
  }
}
```

**Use when:**
- You want to experiment with different models without editing configs
- You want cost control (switch to cheaper models mid-session)
- You're testing agent behavior across multiple models
- You prefer dynamic model selection over static assignment

**Behavior:** When the user runs `/model opencode/kimi-k2.5`, all agents set to `"auto"` immediately switch to that model.

### 3. `null` — Fallback Chain

Omits the model field, triggering the fallback chain:

```json
{
  "models": {
    "fast": null,
    "default": null,
    "premium": "opencode/kimi-k2.6"
  },
  "agent_overrides": {
    "hermes": null
  }
}
```

**Fallback Priority:**
```
Agent-specific model (string/auto/null)
  → if null: top-level model in opencode.json
  → if auto: chat-selected model
  → if missing: platform default
```

**Use when:**
- You want most agents to use a common default
- You want to minimize per-agent configuration
- You're defining a base plan that users can extend

---

## Plan File Structure

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "plan": "opencode-go",
  "service": "opencode",
  "tier": "go",
  "price": "$10/mo",
  "models": {
    "free": "opencode/gpt-5-nano",
    "fast": "opencode/deepseek-v4-flash",
    "default": "opencode/kimi-k2.5",
    "premium": "opencode/kimi-k2.6"
  },
  "agent_overrides": {
    "apollo": "opencode/deepseek-v4-flash",
    "zeus": "opencode/kimi-k2.6"
  },
  "handoff_models": {
    "zeus__themis": "opencode/kimi-k2.6",
    "hermes__apollo": "auto"
  },
  "limits": {
    "monthlyRequests": null,
    "premiumMultiplier": 3.5,
    "notes": "OpenCode Go plan with unlimited requests"
  }
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `plan` | Yes | Unique identifier (e.g., `opencode-go`, `copilot-pro`) |
| `service` | Yes | Platform name: `opencode`, `vscode`, `cursor`, `claude`, `byok` |
| `tier` | Yes | Plan tier: `free`, `go`, `pro`, `enterprise`, etc. |
| `price` | No | Human-readable price (e.g., `$10/mo`) |
| `models` | Yes | Tier-to-model mapping with `free` (optional), `fast`, `default`, `premium` |
| `agent_overrides` | No | Per-agent model overrides |
| `handoff_models` | No | Model overrides for specific handoff patterns |
| `limits` | No | Usage limits and billing multipliers |

### Model Field Values

All model fields accept:
- **String**: Explicit model ID
- **`"auto"`**: Inherit from chat's active model
- **`null`**: Trigger fallback chain

---

## Agent Overrides

Override the tier-based model assignment for specific agents:

```json
{
  "agent_overrides": {
    "zeus": "opencode/kimi-k2.6",
    "athena": "opencode/kimi-k2.6",
    "apollo": "opencode/deepseek-v4-flash",
    "hermes": "auto",
    "talos": null
  }
}
```

**Resolution:** Agent overrides take precedence over tier mapping but can still use `"auto"` or `null`.

---

## Handoff Models

Override models for specific agent-to-agent handoffs:

```json
{
  "handoff_models": {
    "zeus__themis": "opencode/kimi-k2.6",
    "hermes__demeter": "auto",
    "apollo__hermes": null
  }
}
```

**Key format:** `source_agent__target_agent` (double underscore)

**Use case:** Quality gates (Themis review) always use premium models regardless of source agent's tier.

---

## Creating a Custom Plan

### 1. Create a New Plan File

Copy an existing plan as a template:

```bash
cp platform/plans/opencode-go.json platform/plans/my-custom-plan.json
```

### 2. Edit the Configuration

```json
{
  "plan": "my-custom-plan",
  "service": "opencode",
  "tier": "custom",
  "price": "$0",
  "models": {
    "fast": "auto",
    "default": "auto",
    "premium": "opencode/kimi-k2.6"
  },
  "agent_overrides": {
    "zeus": "opencode/kimi-k2.6",
    "themis": "opencode/kimi-k2.6",
    "apollo": "opencode/deepseek-v4-flash"
  },
  "handoff_models": {
    "zeus__themis": "opencode/kimi-k2.6"
  }
}
```

### 3. Validate Against Schema

```bash
# Validate with jsonschema (if installed)
jsonschema -i platform/plans/my-custom-plan.json platform/plans/schema.json

# Or use the select-plan script which validates on selection
./platform/select-plan.sh my-custom-plan
```

### 4. Activate the Plan

```bash
./platform/select-plan.sh my-custom-plan
```

---

## Model Resolution Examples

### Example 1: All Explicit

```json
{
  "models": {
    "fast": "opencode/deepseek-v4-flash",
    "default": "opencode/kimi-k2.5",
    "premium": "opencode/kimi-k2.6"
  }
}
```

- **Apollo** (fast tier) → `opencode/deepseek-v4-flash`
- **Hermes** (default tier) → `opencode/kimi-k2.5`
- **Zeus** (premium tier) → `opencode/kimi-k2.6`

### Example 2: Mixed Auto and Explicit

```json
{
  "models": {
    "fast": "auto",
    "default": "auto",
    "premium": "opencode/kimi-k2.6"
  }
}
```

User runs `/model opencode/kimi-k2.5`:
- **Apollo** (fast tier) → `opencode/kimi-k2.5` (follows chat)
- **Hermes** (default tier) → `opencode/kimi-k2.5` (follows chat)
- **Zeus** (premium tier) → `opencode/kimi-k2.6` (explicit)

### Example 3: Fallback Chain with Null

```json
{
  "model": "opencode/kimi-k2.5",
  "models": {
    "fast": null,
    "default": null,
    "premium": "opencode/kimi-k2.6"
  }
}
```

- **Apollo** (fast tier) → `opencode/kimi-k2.5` (fallback to top-level)
- **Hermes** (default tier) → `opencode/kimi-k2.5` (fallback to top-level)
- **Zeus** (premium tier) → `opencode/kimi-k2.6` (explicit)

### Example 4: Agent Override with Auto

```json
{
  "models": {
    "fast": "opencode/deepseek-v4-flash",
    "default": "opencode/kimi-k2.5",
    "premium": "opencode/kimi-k2.6"
  },
  "agent_overrides": {
    "hermes": "auto"
  }
}
```

User runs `/model opencode/deepseek-v4-pro`:
- **Hermes** → `opencode/deepseek-v4-pro` (override with auto)
- **Aphrodite** (default tier) → `opencode/kimi-k2.5` (tier mapping)

---

## Best Practices

### 1. Use `"auto"` for Flexibility

Set exploration agents (Apollo, Talos, Iris) to `"auto"` so users can quickly test different models:

```json
{
  "agent_overrides": {
    "apollo": "auto",
    "talos": "auto",
    "iris": "auto"
  }
}
```

### 2. Reserve Explicit Models for Critical Agents

Keep implementation and review agents (Hermes, Aphrodite, Themis, Zeus) on explicit, tested models:

```json
{
  "agent_overrides": {
    "zeus": "opencode/kimi-k2.6",
    "themis": "opencode/kimi-k2.6",
    "hermes": "opencode/kimi-k2.5"
  }
}
```

### 3. Use `null` for Simplified Plans

When creating a minimal plan, use `null` to inherit from top-level config:

```json
{
  "model": "opencode/kimi-k2.5",
  "models": {
    "fast": null,
    "default": null,
    "premium": "opencode/kimi-k2.6"
  }
}
```

### 4. Handoff Overrides for Quality Gates

Always use premium models for review handoffs:

```json
{
  "handoff_models": {
    "zeus__themis": "opencode/kimi-k2.6",
    "hermes__themis": "opencode/kimi-k2.6",
    "aphrodite__themis": "opencode/kimi-k2.6"
  }
}
```

---

## Schema Validation

The `schema.json` file defines the plan structure:

```bash
# Validate all plan files
for f in platform/plans/*.json; do
  echo "Validating $f..."
  jsonschema -i "$f" platform/plans/schema.json
done
```

### Schema Extensions

The schema supports:
- **String model IDs**: Explicit assignment
- **`"auto"`**: Dynamic inheritance from chat selection
- **`null`**: Fallback chain trigger
- **Agent overrides**: Per-agent model mapping
- **Handoff models**: Source→target specific overrides

---

## Available Plans

| Plan | Service | Price | Best For |
|------|---------|-------|----------|
| `opencode-go` | OpenCode | $10/mo | Balanced quality/speed |
| `opencode-zen-free` | OpenCode | Free | Cost-conscious users |
| `copilot-free` | VS Code | Free | GitHub Copilot Free tier |
| `copilot-pro` | VS Code | $10/mo | Professional developers |
| `copilot-pro-plus` | VS Code | $39/mo | Power users |
| `cursor-hobby` | Cursor | Free | Cursor free tier |
| `cursor-pro` | Cursor | $20/mo | Cursor professional |
| `cursor-ultra` | Cursor | $200/mo | Heavy usage |
| `claude-pro` | Claude | $20/mo | Claude Code users |
| `byok-cheap` | BYOK | Variable | Bring your own key |

See all plans with `./platform/select-plan.sh list`

---

## Troubleshooting

### Plan Not Found

```bash
# Ensure the plan file exists
ls platform/plans/*.json | grep my-plan

# Check for typos in the plan name
./platform/select-plan.sh list | grep my-plan
```

### Invalid Model Value

```bash
# Validate the plan against schema
jsonschema -i platform/plans/my-plan.json platform/plans/schema.json
```

### Auto Not Working

- Verify the platform supports dynamic model switching
- Check that `/model` command is available
- Ensure the model ID format matches platform expectations (e.g., `opencode/kimi-k2.6`)

### Null Fallback Chain Broken

- Verify top-level `model` is set in `opencode.json`
- Check that platform default exists
- Review agent-specific overrides that might take precedence

---

## Reference

- **Schema**: `platform/plans/schema.json`
- **Select Script**: `platform/select-plan.sh`
- **Active Plan**: `platform/plans/plan-active.json` (symlink)
- **OpenCode Config**: `opencode.json`
- **Agent Definitions**: `agents/*.agent.md`
