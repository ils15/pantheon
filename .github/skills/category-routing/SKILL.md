---
name: category-routing
description: "Route tasks to models by semantic category (deep, quick, visual). Use for optimal model selection without manual names."
context: fork
globs: []
alwaysApply: false
---

# Category-Based Routing — Semantic Delegation

Use this skill to delegate tasks by category instead of model name. The category maps to the right model automatically. No manual model juggling.

---

## The Problem with Model Names

```python
# ❌ Model name creates distributional bias
task({ agent: "gpt-5.5", prompt: "..." })  # Model knows its limitations
task({ agent: "claude-opus-4-7", prompt: "..." })  # Different self-perception
```

## The Solution: Semantic Categories

```python
# ✅ Category describes INTENT, not implementation
task({ category: "ultrabrain", prompt: "..." })  # "Think strategically"
task({ category: "visual-engineering", prompt: "..." })  # "Design beautifully"
task({ category: "quick", prompt: "..." })  # "Just get it done fast"
task({ category: "deep", prompt: "..." })  # "Research deeply before acting"
```

---

## Built-in Categories

| Category | Model | Use Cases |
|----------|-------|-----------|
| `deep` | GPT-5.5 (medium) | Goal-oriented autonomous problem-solving on hairy problems |
| `quick` | GPT-5.4-mini | Single file changes, typo fixes, simple modifications |
| `visual-engineering` | Gemini 3.1 Pro | Frontend, UI/UX, design, styling, animation |
| `ultrabrain` | GPT-5.5 (xhigh) | Deep logical reasoning, complex architecture decisions |
| `artistry` | Gemini 3.1 Pro (high) | Highly creative/artistic tasks, novel ideas |
| `writing` | Gemini 3 Flash | Documentation, prose, technical writing |
| `unspecified-low` | Claude Sonnet 4.6 | Tasks that don't fit other categories, low effort |
| `unspecified-high` | Claude Opus 4.7 (max) | Tasks that don't fit other categories, high effort |

---

## Usage

### Basic Delegation

```python
# Visual task
task(
    category="visual-engineering",
    prompt="Add a responsive chart component to the dashboard page"
)

# Deep reasoning task
task(
    category="deep",
    prompt="Trace this memory leak through 15 files"
)

# Quick fix
task(
    category="quick",
    prompt="Fix the typo in the login button text"
)
```

### Category + Skill Combination

```python
# Designer: visual engineering + UI/UX expertise
task(
    category="visual-engineering",
    load_skills=["frontend-ui-ux"],
    prompt="Redesign the product page with bold typography"
)

# Architect: deep reasoning, pure analysis
task(
    category="ultrabrain",
    load_skills=[],
    prompt="Analyze the current architecture and propose improvements"
)

# Maintainer: quick fixes with git expertise
task(
    category="quick",
    load_skills=["git-master"],
    prompt="Fix the linting errors and commit"
)
```

---

## Custom Categories

Define custom categories in config:

```json
{
  "categories": {
    "korean-writer": {
      "model": "google/gemini-3-flash",
      "temperature": 0.5,
      "prompt_append": "You are a Korean technical writer. Maintain a friendly and clear tone."
    },
    "visual-engineering": {
      "model": "openai/gpt-5.5",
      "temperature": 0.8
    },
    "deep-reasoning": {
      "model": "anthropic/claude-opus-4-7",
      "thinking": {
        "type": "enabled",
        "budgetTokens": 32000
      }
    }
  }
}
```

---

## Category Configuration Schema

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Human-readable description of the category's purpose |
| `model` | string | AI model ID (e.g., `anthropic/claude-opus-4-7`) |
| `variant` | string | Model variant (e.g., `max`, `xhigh`) |
| `temperature` | number | Creativity level (0.0 ~ 2.0) |
| `top_p` | number | Nucleus sampling (0.0 ~ 1.0) |
| `prompt_append` | string | Content to append to system prompt |
| `thinking` | object | Thinking model config (`{ type: "enabled", budgetTokens: 16000 }`) |
| `reasoningEffort` | string | Reasoning effort (`low`, `medium`, `high`) |
| `textVerbosity` | string | Text verbosity (`low`, `medium`, `high`) |
| `tools` | object | Tool usage control (`{ "tool_name": false }`) |
| `maxTokens` | number | Maximum response token count |

---

## Relationship with Tier System

| System | Purpose | Scope |
|--------|---------|-------|
| Platform model settings | Which model per agent (fast/default/premium) | Per-agent |
| **Category routing** | Which model per task type (deep/quick/visual) | Per-task |

They are complementary:
- Tier system sets the default model for each agent
- Category routing overrides the model based on task type

---

## Integration with Zeus

Zeus uses category routing when delegating:

```
Zeus receives task: "Refactor the auth system"
  ↓
Classifies task → category: "deep" (complex architecture)
  ↓
Delegates with category="deep"
  ↓
System routes to optimized model for deep reasoning
```
