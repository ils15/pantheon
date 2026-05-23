#!/usr/bin/env python3
"""
Pantheon Model Routing Matrix — Cost-Optimized for Token-Based Pricing.

Uses real benchmark data from LMSYS Arena Coding (May 2026),
Artificial Analysis, and independent reviews.

Key insight: We are token-based. For coding tasks, deepseek-v4-flash
(SWE-bench 79%, $0.28/1M out) is sufficient and 50-100x cheaper than
premium models. Fix cheap models for coding, save premium for reasoning.

Usage:
    python scripts/model_routing_matrix.py [--output PATH]
"""

import argparse
import json
from datetime import datetime
from pathlib import Path

from paths import opencode_plans_dir

# ---------------------------------------------------------------------------
# Real benchmark data (LMSYS Coding Arena + Artificial Analysis, May 2026)
# ---------------------------------------------------------------------------

# LMSYS Coding Arena ELO (code-specific, not general)
CODING_ELO = {
    # Anthropic
    "claude-opus-4-6": 1549,
    "claude-opus-4-6-thinking": 1546,
    "claude-opus-4-7": 1498,
    "claude-opus-4-7-thinking": 1505,
    "claude-sonnet-4-6": 1521,
    "claude-opus-4-5-thinking": 1489,
    "claude-opus-4-5": 1465,
    "claude-sonnet-4-5-thinking": 1389,
    "claude-sonnet-4-5": 1386,
    "claude-haiku-4-5": 1478,
    # OpenAI
    "gpt-5.4-high": 1484,
    "gpt-5.4-standard": 1455,
    "gpt-5.4-mini": 1440,
    "gpt-5.4-nano": 1350,
    "gpt-5-mini": 1420,
    "gpt-5-nano": 1300,
    # Google
    "gemini-3.1-pro": 1454,
    "gemini-3-pro": 1437,
    "gemini-3-flash": 1436,
    "gemini-3-flash-thinking": 1395,
    # DeepSeek
    "deepseek-v4-pro": 1502,
    "deepseek-v4-flash": 1432,
    # Kimi/Moonshot
    "kimi-k2.5-thinking": 1431,
    "kimi-k2.5-instant": 1409,
    "kimi-k2.6": 1460,
    "kimi-k2.5": 1430,
    # Qwen
    "qwen3.6-plus": 1447,
    "qwen3.6-plus-free": 1445,
    # MiniMax
    "minimax-m2.7": 1445,
    "minimax-m2.5": 1410,
    "minimax-m2.5-free": 1350,
    "minimax-m2.1-preview": 1399,
    # GLM/Zhipu
    "glm-5": 1445,
    "glm-4.7": 1439,
    # Meta
    "muse-spark": 1441,
    # Grok
    "grok-4.20": 1471,
}

# SWE-bench Verified scores (independent coding benchmark)
SWE_BENCH = {
    "claude-opus-4-6": 80.8,
    "claude-sonnet-4-6": 78.5,
    "claude-haiku-4-5": 73.3,
    "deepseek-v4-pro": 80.6,
    "deepseek-v4-flash": 79.0,
    "gpt-5.4-high-codex": 80.0,
    "gemini-3.1-pro-preview": 80.6,
    "kimi-k2.5": 76.0,
    "kimi-k2.6": 77.5,
    "qwen3.6-plus": 75.0,
    "minimax-m2.5": 72.0,
    "gemini-3-flash": 74.0,
    "gpt-5-mini": 73.0,
    "gpt-5.4-mini": 74.5,
}

# Pricing: $ per 1M tokens (input / output) — from Artificial Analysis
PRICING = {
    "claude-opus-4-6": (5.00, 25.00),
    "claude-opus-4-7": (15.00, 75.00),
    "claude-sonnet-4-6": (3.00, 15.00),
    "claude-haiku-4-5": (0.80, 5.00),
    "gpt-5.4-high": (12.50, 50.00),
    "gpt-5.4-mini": (0.50, 2.50),
    "gpt-5.4-nano": (0.05, 0.40),
    "gpt-5-mini": (0.40, 2.00),
    "gpt-5-nano": (0.05, 0.40),
    "gemini-3.1-pro": (4.00, 20.00),
    "gemini-3-pro": (2.00, 12.00),
    "gemini-3-flash": (0.50, 3.00),
    "deepseek-v4-pro": (1.74, 3.48),
    "deepseek-v4-flash": (0.14, 0.28),
    "kimi-k2.6": (1.50, 7.50),
    "kimi-k2.5": (0.50, 2.50),
    "kimi-k2.5-thinking": (0.60, 3.00),
    "kimi-k2.5-instant": (0.45, 2.20),
    "qwen3.6-plus": (0.80, 4.00),
    "qwen3.6-plus-free": (0.00, 0.00),
    "minimax-m2.7": (0.30, 1.20),
    "minimax-m2.5": (0.20, 1.17),
    "minimax-m2.5-free": (0.00, 0.00),
    "minimax-m2.1-preview": (0.27, 0.95),
    "glm-5": (1.00, 3.20),
    "glm-4.7": (0.39, 1.75),
    "grok-4.20": (5.00, 15.00),
    "muse-spark": (0.95, 3.80),
}

# Latency: ms to first token — from Artificial Analysis
LATENCY_MS = {
    "claude-opus-4-6": 1200,
    "claude-opus-4-7": 1500,
    "claude-sonnet-4-6": 800,
    "claude-haiku-4-5": 400,
    "gpt-5.4-high": 700,
    "gpt-5.4-mini": 500,
    "gpt-5.4-nano": 200,
    "gpt-5-mini": 450,
    "gpt-5-nano": 150,
    "gemini-3.1-pro": 650,
    "gemini-3-pro": 600,
    "gemini-3-flash": 300,
    "deepseek-v4-pro": 800,
    "deepseek-v4-flash": 350,
    "kimi-k2.6": 900,
    "kimi-k2.5": 700,
    "kimi-k2.5-thinking": 1000,
    "kimi-k2.5-instant": 400,
    "qwen3.6-plus": 600,
    "minimax-m2.5": 400,
    "minimax-m2.1-preview": 350,
    "glm-5": 500,
    "grok-4.20": 600,
}

THROUGHPUT_TPS = {
    "claude-opus-4-6": 60,
    "claude-opus-4-7": 50,
    "claude-sonnet-4-6": 85,
    "claude-haiku-4-5": 120,
    "gpt-5.4-high": 90,
    "gpt-5.4-mini": 110,
    "gpt-5.4-nano": 150,
    "gpt-5-mini": 115,
    "gpt-5-nano": 160,
    "gemini-3.1-pro": 100,
    "gemini-3-pro": 105,
    "gemini-3-flash": 140,
    "deepseek-v4-pro": 80,
    "deepseek-v4-flash": 100,
    "kimi-k2.6": 75,
    "kimi-k2.5": 85,
    "kimi-k2.5-thinking": 60,
    "kimi-k2.5-instant": 120,
    "qwen3.6-plus": 95,
    "minimax-m2.5": 125,
    "minimax-m2.1-preview": 130,
    "glm-5": 100,
    "grok-4.20": 90,
}

# ---------------------------------------------------------------------------
# Agent classification — optimized for token-based pricing
# ---------------------------------------------------------------------------

AGENT_TIERS = {
    # TIER 1: PREMIUM — reasoning, planning, delegation
    # Deep logic, complex orchestration, security review
    # → Use BEST model available, quality > cost
    "zeus": {
        "tier": "premium",
        "type": "reasoning",
        "desc": "Orchestration, delegation, multi-agent coordination",
        "token_profile": "high-input",
        "why": "Long context, complex delegation logic",
    },
    "athena": {
        "tier": "premium",
        "type": "reasoning",
        "desc": "Strategic planning, architecture decisions, gap analysis",
        "token_profile": "high-input",
        "why": "Deep analysis of codebase, long planning outputs",
    },
    "themis": {
        "tier": "premium",
        "type": "reasoning",
        "desc": "Code review, security audit, OWASP Top 10, coverage validation",
        "token_profile": "high-input",
        "why": "Reviews entire files, needs deep reasoning for security",
    },
    # TIER 2: DEFAULT — less complex tasks, non-coding or advanced coding
    # Complex analysis, AI pipelines, infrastructure, model routing
    # → Good balance of quality and cost
    "gaia": {
        "tier": "default",
        "type": "analysis",
        "desc": "Remote sensing (satellite imagery, LULC analysis)",
        "token_profile": "high-input",
        "why": "Analyzes large datasets, needs reasoning depth",
    },
    "hephaestus": {
        "tier": "default",
        "type": "advanced",
        "desc": "AI pipelines (RAG, LangChain, vector stores)",
        "token_profile": "high-output",
        "why": "Complex pipeline code, advanced architecture",
    },
    "prometheus": {
        "tier": "default",
        "type": "advanced",
        "desc": "Infrastructure (Docker, CI/CD, deployment)",
        "token_profile": "medium-output",
        "why": "Complex configs, multi-stage builds, orchestration",
    },
    "chiron": {
        "tier": "default",
        "type": "advanced",
        "desc": "Model routing, provider configuration, cost optimization",
        "token_profile": "medium-output",
        "why": "Needs reasoning for routing decisions, provider analysis",
    },
    # TIER 3: CODING — day-to-day coding tasks
    # Backend, frontend, database — routine code generation
    # → Cost-efficient models, SWE-bench >= 73% is sufficient
    # deepseek-v4-flash (79%, $0.28/1M) or claude-haiku-4-5 (73%, $5/1M)
    "hermes": {
        "tier": "coding",
        "type": "coding",
        "desc": "Backend (FastAPI, Python, async, TDD)",
        "token_profile": "high-output",
        "why": "Generates lots of code, cost scales with output",
    },
    "aphrodite": {
        "tier": "coding",
        "type": "coding",
        "desc": "Frontend (React, TypeScript, components)",
        "token_profile": "high-output",
        "why": "Generates JSX/TSX, CSS — lots of output tokens",
    },
    "demeter": {
        "tier": "coding",
        "type": "coding",
        "desc": "Database (SQLAlchemy, Alembic, migrations)",
        "token_profile": "medium-output",
        "why": "Moderate code generation, some analysis",
    },
    "echo": {
        "tier": "coding",
        "type": "coding",
        "desc": "Conversational AI (Rasa NLU, dialogue management)",
        "token_profile": "medium-output",
        "why": "Config + some code generation",
    },
    # TIER 4: FAST — research, discovery, ops, docs, hotfixes
    # Quick responses, simple tasks, many calls
    # → Cheapest model, lowest latency
    "apollo": {
        "tier": "fast",
        "type": "research",
        "desc": "Codebase discovery, parallel research, file search",
        "token_profile": "many-calls",
        "why": "Many parallel searches, each short — cost adds up",
    },
    "nyx": {
        "tier": "fast",
        "type": "ops",
        "desc": "Observability, tracing, cost tracking, monitoring",
        "token_profile": "many-calls",
        "why": "Frequent monitoring calls, simple summaries",
    },
    "iris": {
        "tier": "fast",
        "type": "ops",
        "desc": "GitHub operations (branches, PRs, issues, releases)",
        "token_profile": "many-calls",
        "why": "Many git/gh commands, simple formatting",
    },
    "mnemosyne": {
        "tier": "fast",
        "type": "docs",
        "desc": "Memory bank, documentation, ADRs, progress logging",
        "token_profile": "medium-output",
        "why": "Writes docs — moderate output, simple structure",
    },
    "talos": {
        "tier": "fast",
        "type": "hotfix",
        "desc": "Hotfixes — small bugs, CSS, typos, direct fixes",
        "token_profile": "low-output",
        "why": "Small fixes, minimal output tokens",
    },
}

# ---------------------------------------------------------------------------
# Cost-optimized model recommendations per tier
# ---------------------------------------------------------------------------

# For CODING tier: these models are "good enough" and much cheaper
# SWE-bench >= 73% is sufficient for most coding tasks
CODING_TIER_CANDIDATES = [
    ("deepseek-v4-flash", 79.0, 0.28),  # Best value: 79% SWE-bench, $0.28/1M
    ("claude-haiku-4-5", 73.3, 5.00),  # Good: 73% SWE-bench, $5.00/1M
    ("gpt-5-mini", 73.0, 2.00),  # Decent: 73% SWE-bench, $2.00/1M
    ("gemini-3-flash", 74.0, 3.00),  # Good: 74% SWE-bench, $3.00/1M
]

# ---------------------------------------------------------------------------
# Plan loading
# ---------------------------------------------------------------------------

PLANS_DIR = opencode_plans_dir()


def load_plans() -> list[dict]:
    plans = []
    for f in sorted(PLANS_DIR.glob("*.json")):
        if f.name in ("schema.json", "plan-active.json"):
            continue
        try:
            with open(f) as fh:
                plans.append(json.load(fh))
        except Exception:
            pass
    return plans


def normalize_model_id(model_id: str) -> str:
    return model_id.split("/", 1)[1] if "/" in model_id else model_id


def get_model_score(model_id: str) -> dict:
    name = normalize_model_id(model_id)

    # Strip date/version suffixes for matching (e.g., "claude-opus-4-7-20250514" → "claude-opus-4-7")
    def strip_suffix(n):
        import re

        # Remove trailing date patterns like -20250514, -20251001
        n = re.sub(r"-\d{8}$", "", n)
        # Remove version suffixes like -thinking, -instant, -high, -codex
        for suffix in [
            "-thinking",
            "-instant",
            "-high",
            "-codex",
            "-standard",
            "-medium",
            "-nano",
            "-mini",
            "-pro",
            "-flash",
            "-base",
        ]:
            if n.endswith(suffix) and n != suffix[1:]:
                # Only strip if there's a base model without suffix
                base = n[: -len(suffix)]
                if base in CODING_ELO or base in SWE_BENCH:
                    return base
        return n

    lookup_name = strip_suffix(name)

    def find_in_dict(d, key):
        if key in d:
            return d[key]
        # Try partial match
        for k, v in d.items():
            if k.startswith(key) or key.startswith(k):
                return v
        return 0

    elo = find_in_dict(CODING_ELO, lookup_name)
    swe = find_in_dict(SWE_BENCH, lookup_name)
    price = find_in_dict(PRICING, lookup_name)
    if price == 0:
        price = (0, 0)
    latency = find_in_dict(LATENCY_MS, lookup_name)
    throughput = find_in_dict(THROUGHPUT_TPS, lookup_name)

    return {
        "elo": elo,
        "swe_bench": swe,
        "cost_input": price[0],
        "cost_output": price[1],
        "latency_ms": latency,
        "throughput_tps": throughput,
    }


def resolve_model(plan: dict, tier: str, agent: str) -> str:
    """Resolve the model for an agent given a plan."""
    overrides = plan.get("agent_overrides", {})
    if agent in overrides:
        return overrides[agent]

    models = plan.get("models", {})
    # Map our 4 tiers to plan tiers
    tier_map = {
        "premium": "premium",
        "default": "default",
        "coding": "default",  # coding agents use default tier unless overridden
        "fast": "fast",
    }
    plan_tier = tier_map.get(tier, "default")
    return models.get(plan_tier, models.get("default", "unknown"))


def compute_cost_per_1000_calls(model_id: str, agent_type: str) -> float:
    """Estimate cost per 1000 API calls based on agent token profile."""
    score = get_model_score(model_id)
    cost_out = score["cost_output"]

    # Token profiles (approximate output tokens per call)
    profiles = {
        "high-input": 2000,  # reasoning agents: long outputs
        "high-output": 3000,  # coding agents: lots of code
        "medium-output": 1500,  # moderate code/config
        "many-calls": 500,  # fast agents: short responses
        "low-output": 300,  # hotfixes: minimal output
    }
    output_tokens = profiles.get(agent_type, 1000)
    return (cost_out * output_tokens / 1_000_000) * 1000


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------


def _write_strategy_section(f) -> None:
    f.write("## Token-Based Pricing Strategy\n\n")
    f.write("### Core Insight\n\n")
    f.write(
        "> We are **token-based**. Every API call costs per input + output token.\n"
    )
    f.write(
        "> For coding tasks, **deepseek-v4-flash** (SWE-bench 79%, $0.28/1M output) is sufficient.\n"
    )
    f.write(
        "> For reasoning tasks, quality matters more than cost — use the best available.\n\n"
    )

    f.write("### Agent Token Profiles\n\n")
    f.write("| Profile | Agents | Why | Cost Driver |\n")
    f.write("|---------|--------|-----|-------------|\n")
    f.write(
        "| **High Input** | zeus, athena, themis, gaia | Long context, complex prompts | Input tokens |\n"
    )
    f.write(
        "| **High Output** | hermes, aphrodite, hephaestus | Generates lots of code | Output tokens |\n"
    )
    f.write(
        "| **Medium Output** | demeter, prometheus, chiron, echo, mnemosyne | Config + some code | Balanced |\n"
    )
    f.write(
        "| **Many Calls** | apollo, nyx, iris | Many short calls | Volume × cost |\n"
    )
    f.write("| **Low Output** | talos | Small fixes | Minimal |\n\n")

    f.write("### Coding Tier Strategy\n\n")
    f.write(
        "For agents that generate code (hermes, aphrodite, etc.), we prioritize **cost efficiency**:\n\n"
    )
    f.write(
        "| Model | SWE-bench | Cost ($/1M out) | Cost per 1000 calls (3K tokens) | Verdict |\n"
    )
    f.write(
        "|-------|-----------|-----------------|--------------------------------|--------|\n"
    )
    for model, swe, cost in CODING_TIER_CANDIDATES:
        cost_1k = cost * 3000 / 1_000_000 * 1000
        f.write(
            f"| `{model}` | {swe}% | ${cost:.2f} | ${cost_1k:.4f} | {'✅ Recommended' if model == 'deepseek-v4-flash' else '⚠️ Alternative'} |\n"
        )

    f.write(
        "\n**Recommendation:** Use `deepseek-v4-flash` for all coding agents. It scores 79% on SWE-bench (vs 80.8% for Claude Opus) but costs **89x less** per output token.\n\n"
    )


def _write_routing_principles(f) -> None:
    f.write("## Routing Principles\n\n")
    f.write("### Tier Assignment Logic\n\n")
    f.write("| Tier | Agents | Strategy | Model Requirements |\n")
    f.write("|------|--------|----------|--------------------|\n")
    f.write(
        "| **1. Premium** (reasoning) | zeus, athena, themis | Best ELO available | High coding ELO (>1450), strong logic |\n"
    )
    f.write(
        "| **2. Default** (analysis/advanced) | gaia, hephaestus, prometheus, chiron | Balance quality + cost | Good reasoning, moderate cost |\n"
    )
    f.write(
        "| **3. Coding** (day-to-day) | hermes, aphrodite, demeter, echo | Cost-efficient, SWE-bench ≥73% | Good coding, low cost/output |\n"
    )
    f.write(
        "| **4. Fast** (research/ops) | apollo, nyx, iris, mnemosyne, talos | Lowest latency, cheapest | Fast response, minimal cost |\n\n"
    )

    f.write("### Decision Rules\n\n")
    f.write(
        "1. **Tier 1 (Premium) → best model** — reasoning, planning, security review need deep logic\n"
    )
    f.write(
        "2. **Tier 2 (Default) → balanced model** — analysis and advanced tasks need quality but not premium\n"
    )
    f.write(
        "3. **Tier 3 (Coding) → cost-efficient model** — deepseek-v4-flash or claude-haiku-4-5 for day-to-day coding\n"
    )
    f.write(
        "4. **Tier 4 (Fast) → cheapest model** — research, ops, docs need speed, not depth\n"
    )
    f.write(
        "5. **Agent overrides** — specific agents may need different models (e.g., gaia → analysis-capable)\n"
    )
    f.write(
        "6. **Free plans** — use best available for Tier 1, accept trade-offs for Tiers 3-4\n\n"
    )


def _write_full_assignment_matrix(f, plans: list[dict]) -> None:
    f.write("## Model Assignment Matrix\n\n")

    f.write("| Agent | Tier | Type |")
    for plan in plans:
        plan_name = plan.get("plan", "?")
        f.write(f" {plan_name} |")
    f.write("\n")

    f.write("|-------|------|------|")
    for _ in plans:
        f.write("--------|")
    f.write("\n")

    for agent, info in sorted(AGENT_TIERS.items()):
        f.write(f"| **{agent}** | {info['tier']} | {info['type']} |")
        for plan in plans:
            model = resolve_model(plan, info["tier"], agent)
            model_name = normalize_model_id(model)
            f.write(f" `{model_name}` |")
        f.write("\n")

    f.write("\n")


def _write_plan_assessment(f, models: dict, plan) -> None:
    premium_model = models.get("premium", "")
    default_model = models.get("default", "")
    fast_model = models.get("fast", "")

    f.write("**Assessment:**\n\n")
    f.write(
        f"- **Tier 1 (Premium):** {normalize_model_id(premium_model) if premium_model else 'N/A'} — "
    )
    _write_premium_assessment(f, premium_model)

    score = get_model_score(default_model) if default_model else {}
    f.write(
        f"- **Tier 2 (Default):** {normalize_model_id(default_model) if default_model else 'N/A'} — "
    )
    _write_default_assessment(f, score)

    f.write("- **Tier 3 (Coding):** uses default tier model — ")
    _write_coding_assessment(f, score)

    f.write(
        f"- **Tier 4 (Fast):** {normalize_model_id(fast_model) if fast_model else 'N/A'} — "
    )
    _write_fast_assessment(f, fast_model)

    f.write("\n---\n\n")


def _write_premium_assessment(f, model: str) -> None:
    if "opus" in model.lower():
        f.write("Excellent for complex reasoning. Best for zeus/athena/themis.\n")
    elif "kimi" in model.lower() or "sonnet" in model.lower():
        f.write(
            "Strong reasoning at good price. Good balance for planning and review.\n"
        )
    elif "mini" in model.lower():
        f.write("Moderate reasoning. May struggle with complex orchestration.\n")
    else:
        f.write("Verify coding ELO before use.\n")


def _write_default_assessment(f, score: dict) -> None:
    if score.get("swe_bench", 0) >= 75:
        f.write(
            f"Excellent for analysis/advanced tasks (SWE-bench {score['swe_bench']}%). Strong across default agents.\n"
        )
    elif score.get("swe_bench", 0) >= 70:
        f.write(
            f"Good for analysis tasks (SWE-bench {score['swe_bench']}%). Suitable for most advanced work.\n"
        )
    else:
        f.write("Moderate capability. May need more guidance for complex analysis.\n")


def _write_coding_assessment(f, score: dict) -> None:
    if score.get("swe_bench", 0) >= 75:
        f.write(
            f"Excellent for day-to-day coding (SWE-bench {score['swe_bench']}%). Cost-efficient for high-output agents.\n"
        )
    elif score.get("swe_bench", 0) >= 70:
        f.write(
            f"Good for coding (SWE-bench {score['swe_bench']}%). Consider override to deepseek-v4-flash for better cost.\n"
        )
    else:
        f.write(
            "Moderate coding. Consider override to deepseek-v4-flash or claude-haiku-4-5.\n"
        )


def _write_fast_assessment(f, model: str) -> None:
    if "flash" in model.lower() or "haiku" in model.lower() or "nano" in model.lower():
        f.write(
            "Excellent for quick tasks. Low latency, good for research/ops agents.\n"
        )
    elif "mini" in model.lower():
        f.write("Good balance of speed and quality. Suitable for fast agents.\n")
    else:
        f.write("Verify latency before assigning to fast agents.\n")


def _write_plan_tier_defaults(f, models: dict) -> None:
    f.write("**Tier defaults:**\n\n")
    f.write("| Tier | Model | Coding ELO | SWE-bench | Cost ($/1M out) | Agents |\n")
    f.write("|------|-------|------------|-----------|-----------------|--------|\n")
    for tier_key in ["premium", "default", "fast", "free"]:
        if tier_key not in models:
            continue
        model = models[tier_key]
        name = normalize_model_id(model)
        score = get_model_score(model)
        if tier_key == "premium":
            agents = [a for a, i in AGENT_TIERS.items() if i["tier"] == "premium"]
        elif tier_key == "default":
            agents = [
                a for a, i in AGENT_TIERS.items() if i["tier"] in ("default", "coding")
            ]
        elif tier_key == "fast":
            agents = [a for a, i in AGENT_TIERS.items() if i["tier"] == "fast"]
        else:
            agents = []
        f.write(
            f"| {tier_key} | `{name}` | {score['elo']} | {score['swe_bench']}% | ${score['cost_output']:.2f} | {', '.join(agents)} |\n"
        )
    f.write("\n")


def _write_plan_overrides(f, models: dict, overrides: dict) -> None:
    if not overrides:
        return
    f.write("**Agent overrides:**\n\n")
    f.write(
        "| Agent | Override Model | Default Model | Coding ELO | Cost ($/1M out) | Reason |\n"
    )
    f.write(
        "|-------|---------------|---------------|------------|-----------------|--------|\n"
    )
    for agent, model in sorted(overrides.items()):
        name = normalize_model_id(model)
        score = get_model_score(model)
        tier = AGENT_TIERS.get(agent, {}).get("tier", "?")
        default_model = models.get("default" if tier == "coding" else tier, "?")
        default_name = (
            normalize_model_id(default_model) if default_model != "?" else "?"
        )
        reason = AGENT_TIERS.get(agent, {}).get("desc", "")
        f.write(
            f"| {agent} | `{name}` | `{default_name}` | {score['elo']} | ${score['cost_output']:.2f} | {reason} |\n"
        )
    f.write("\n")


def _write_plan_cost_analysis(f, plan: dict) -> None:
    f.write("**Estimated cost per 1000 calls:**\n\n")
    f.write("| Agent | Model | Profile | Est. Cost |\n")
    f.write("|-------|-------|---------|----------|\n")
    for agent in sorted(AGENT_TIERS.keys()):
        model = resolve_model(plan, AGENT_TIERS[agent]["tier"], agent)
        name = normalize_model_id(model)
        profile = AGENT_TIERS[agent]["token_profile"]
        cost = compute_cost_per_1000_calls(model, profile)
        f.write(f"| {agent} | `{name}` | {profile} | ${cost:.4f} |\n")
    f.write("\n")


def _write_one_plan_detail(f, plan: dict) -> None:
    plan_name = plan.get("plan", "?")
    price = plan.get("price", "?")
    f.write(f"### {plan_name} ({price})\n\n")

    models = plan.get("models", {})
    _write_plan_tier_defaults(f, models)

    overrides = plan.get("agent_overrides", {})
    _write_plan_overrides(f, models, overrides)

    _write_plan_cost_analysis(f, plan)

    _write_plan_assessment(f, models, plan)


def _write_per_plan_breakdown(f, plans: list[dict]) -> None:
    f.write("## Per-Plan Breakdown\n\n")
    for plan in plans:
        _write_one_plan_detail(f, plan)


def _write_cost_comparison(f, plans: list[dict]) -> None:
    f.write("## Cost Comparison: 1000 Feature Development Cycles\n\n")
    f.write(
        "*(Each cycle = 1 planning call + 3 coding calls + 2 review calls + 5 fast calls)*\n\n"
    )

    f.write(
        "| Plan | Reasoning Cost | Coding Cost | Review Cost | Fast Cost | **Total** |\n"
    )
    f.write(
        "|------|---------------|-------------|-------------|-----------|----------|\n"
    )

    for plan in plans:
        plan_name = plan.get("plan", "?")
        models = plan.get("models", {})
        overrides = plan.get("agent_overrides", {})

        premium = overrides.get("zeus", models.get("premium", ""))
        coding = models.get("default", "")
        fast = models.get("fast", "")

        reasoning_cost = compute_cost_per_1000_calls(premium, "high-input") * 1
        coding_cost = compute_cost_per_1000_calls(coding, "high-output") * 3
        review_cost = compute_cost_per_1000_calls(premium, "high-input") * 2
        fast_cost = compute_cost_per_1000_calls(fast, "many-calls") * 5

        total = reasoning_cost + coding_cost + review_cost + fast_cost

        f.write(
            f"| {plan_name} | ${reasoning_cost:.2f} | ${coding_cost:.2f} | ${review_cost:.2f} | ${fast_cost:.2f} | **${total:.2f}** |\n"
        )

    f.write("\n")


def _write_recommendations(f) -> None:
    f.write("## Recommendations\n\n")

    f.write("### General Rules\n\n")
    f.write(
        "1. **Tier 1 (Premium) → best model** — zeus/athena/themis need deep logic, quality > cost\n"
    )
    f.write(
        "2. **Tier 2 (Default) → balanced model** — gaia/hephaestus/prometheus/chiron need quality but not premium\n"
    )
    f.write(
        "3. **Tier 3 (Coding) → cost-efficient model** — hermes/aphrodite/demeter/echo: deepseek-v4-flash or claude-haiku-4-5\n"
    )
    f.write(
        "4. **Tier 4 (Fast) → cheapest model** — apollo/nyx/iris/mnemosyne/talos: many calls, cost adds up\n"
    )
    f.write(
        "5. **Free plans should prioritize** — best model for Tier 1, accept trade-offs for Tiers 3-4\n"
    )
    f.write(
        "6. **Monitor actual token usage** — adjust model assignments based on real cost data\n\n"
    )

    f.write("### When to Use Agent Overrides\n\n")
    f.write("| Scenario | Override Example | Why |\n")
    f.write("|----------|-----------------|-----|\n")
    f.write(
        "| Frontend needs vision | aphrodite → gemini-pro | Better at understanding UI layouts |\n"
    )
    f.write(
        "| Research needs speed | apollo → flash | Faster responses, lower cost |\n"
    )
    f.write(
        "| Complex analysis | gaia → pro model | Needs deep reasoning for satellite data |\n"
    )
    f.write(
        "| Hotfix needs speed | talos → mini/flash | Quick fixes don't need premium |\n"
    )
    f.write(
        "| Documentation is simple | mnemosyne → flash | Writing docs is straightforward |\n\n"
    )

    f.write("### Cost Optimization Checklist\n\n")
    f.write(
        "- [ ] All coding agents use cost-efficient models (deepseek-v4-flash or equivalent)\n"
    )
    f.write("- [ ] All fast agents use cheapest available model\n")
    f.write("- [ ] Reasoning agents use best available model in plan\n")
    f.write("- [ ] Agent overrides are justified (not just default tier model)\n")
    f.write("- [ ] Estimated cost per 1000 calls is within budget\n")
    f.write("- [ ] SWE-bench score ≥73% for all coding agents\n\n")

    f.write("---\n\n")
    f.write("*Generated by Pantheon Model Routing Matrix*\n")
    f.write(
        "*Data from LMSYS Arena Coding Leaderboard, Artificial Analysis, and SWE-bench Verified*\n"
    )


def generate_matrix(plans: list[dict], output_path: Path) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    with open(output_path, "w") as f:
        f.write("# Pantheon Model Routing Matrix — Cost-Optimized\n\n")
        f.write(f"**Generated:** {now}\n")
        f.write(f"**Plans analyzed:** {len(plans)}\n")
        f.write(f"**Agents:** {len(AGENT_TIERS)}\n")
        f.write(
            "**Data sources:** LMSYS Arena Coding (May 2026), Artificial Analysis, SWE-bench Verified\n\n"
        )

        _write_strategy_section(f)
        _write_routing_principles(f)
        _write_full_assignment_matrix(f, plans)
        _write_per_plan_breakdown(f, plans)
        _write_cost_comparison(f, plans)
        _write_recommendations(f)

    print(f"📄 Matrix saved to: {output_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Pantheon Model Routing Matrix — Cost-Optimized"
    )
    parser.add_argument(
        "--output", default="model-routing-matrix.md", help="Output path"
    )
    args = parser.parse_args()

    print("🔍 Pantheon Model Routing Matrix — Cost-Optimized\n")

    plans = load_plans()
    print(f"📋 Loaded {len(plans)} plans\n")

    output_path = Path(args.output)
    generate_matrix(plans, output_path)

    print("\n✅ Matrix generated!")


if __name__ == "__main__":
    main()
