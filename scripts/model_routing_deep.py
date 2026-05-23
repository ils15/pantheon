#!/usr/bin/env python3
"""
Pantheon Model Routing — Deep Analysis with Per-Plan Fallback Chains.

For ALL 17 plans, analyzes every model with:
- Real benchmark data (LMSYS Coding Arena, SWE-bench, Artificial Analysis)
- Cost-per-token analysis
- Fallback chains using ONLY models available in the same plan
- Optimized select-plan.sh configurations

Usage:
    python scripts/model_routing_deep.py [--output PATH]
"""

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import TextIO

from paths import opencode_plans_dir

# ---------------------------------------------------------------------------
# Real benchmark data (LMSYS Coding Arena + Artificial Analysis, May 2026)
# ---------------------------------------------------------------------------

CODING_ELO = {
    "claude-opus-4-6": 1549,
    "claude-opus-4-7": 1498,
    "claude-sonnet-4-6": 1521,
    "claude-haiku-4-5": 1478,
    "gpt-5.4-high": 1484,
    "gpt-5.4-mini": 1440,
    "gpt-5.4-nano": 1350,
    "gpt-5-mini": 1420,
    "gpt-5-nano": 1300,
    "gemini-3.1-pro": 1454,
    "gemini-3-pro": 1437,
    "gemini-3-flash": 1436,
    "deepseek-v4-pro": 1502,
    "deepseek-v4-flash": 1432,
    "kimi-k2.6": 1460,
    "kimi-k2.5": 1430,
    "qwen3.6-plus": 1447,
    "minimax-m2.7": 1445,
    "minimax-m2.5": 1410,
    "minimax-m2.1-preview": 1399,
    "minimax-m2.5-free": 1350,
    "gpt-5-nano-free": 1300,
    "glm-5": 1445,
    "glm-4.7": 1439,
    "grok-4.20": 1471,
    "muse-spark": 1441,
}

SWE_BENCH = {
    "claude-opus-4-6": 80.8,
    "claude-opus-4-7": 79.5,
    "claude-sonnet-4-6": 78.5,
    "claude-haiku-4-5": 73.3,
    "gpt-5.4-high": 80.0,
    "gpt-5.4-mini": 74.5,
    "gpt-5.4-nano": 65.0,
    "gpt-5-mini": 73.0,
    "gpt-5-nano": 60.0,
    "gemini-3.1-pro": 80.6,
    "gemini-3-pro": 77.0,
    "gemini-3-flash": 74.0,
    "deepseek-v4-pro": 80.6,
    "deepseek-v4-flash": 79.0,
    "kimi-k2.6": 77.5,
    "kimi-k2.5": 76.0,
    "qwen3.6-plus": 75.0,
    "minimax-m2.7": 74.0,
    "minimax-m2.5": 72.0,
    "minimax-m2.5-free": 68.0,
    "minimax-m2.1-preview": 70.0,
    "glm-5": 75.5,
    "glm-4.7": 73.0,
    "grok-4.20": 76.0,
    "muse-spark": 74.5,
}

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
    "qwen3.6-plus": 600,
    "minimax-m2.7": 380,
    "minimax-m2.5": 400,
    "minimax-m2.5-free": 400,
    "glm-5": 500,
    "glm-4.7": 450,
    "grok-4.20": 600,
    "muse-spark": 550,
}

# ---------------------------------------------------------------------------
# Agent classification — 4 tiers
# ---------------------------------------------------------------------------

AGENT_TIERS = {
    "zeus": {
        "tier": "premium",
        "type": "reasoning",
        "desc": "Orchestration, delegation",
        "token_profile": "high-input",
        "why": "Long context, complex delegation",
    },
    "athena": {
        "tier": "premium",
        "type": "reasoning",
        "desc": "Strategic planning, architecture",
        "token_profile": "high-input",
        "why": "Deep analysis, long planning outputs",
    },
    "themis": {
        "tier": "premium",
        "type": "reasoning",
        "desc": "Code review, security audit",
        "token_profile": "high-input",
        "why": "Reviews entire files, deep reasoning",
    },
    "gaia": {
        "tier": "default",
        "type": "analysis",
        "desc": "Remote sensing, LULC analysis",
        "token_profile": "high-input",
        "why": "Analyzes large datasets",
    },
    "hephaestus": {
        "tier": "default",
        "type": "advanced",
        "desc": "AI pipelines, RAG, LangChain",
        "token_profile": "high-output",
        "why": "Complex pipeline code",
    },
    "prometheus": {
        "tier": "default",
        "type": "advanced",
        "desc": "Infrastructure, Docker, CI/CD",
        "token_profile": "medium-output",
        "why": "Complex configs, multi-stage builds",
    },
    "chiron": {
        "tier": "default",
        "type": "advanced",
        "desc": "Model routing, provider config",
        "token_profile": "medium-output",
        "why": "Routing decisions, provider analysis",
    },
    "hermes": {
        "tier": "coding",
        "type": "coding",
        "desc": "Backend (FastAPI, Python, TDD)",
        "token_profile": "high-output",
        "why": "Generates lots of code",
    },
    "aphrodite": {
        "tier": "coding",
        "type": "coding",
        "desc": "Frontend (React, TypeScript)",
        "token_profile": "high-output",
        "why": "JSX/TSX, CSS — lots of output",
    },
    "demeter": {
        "tier": "coding",
        "type": "coding",
        "desc": "Database (SQLAlchemy, Alembic)",
        "token_profile": "medium-output",
        "why": "Moderate code generation",
    },
    "echo": {
        "tier": "coding",
        "type": "coding",
        "desc": "Conversational AI (Rasa NLU)",
        "token_profile": "medium-output",
        "why": "Config + code generation",
    },
    "apollo": {
        "tier": "fast",
        "type": "research",
        "desc": "Codebase discovery, research",
        "token_profile": "many-calls",
        "why": "Many parallel searches",
    },
    "nyx": {
        "tier": "fast",
        "type": "ops",
        "desc": "Observability, tracing, monitoring",
        "token_profile": "many-calls",
        "why": "Frequent monitoring calls",
    },
    "iris": {
        "tier": "fast",
        "type": "ops",
        "desc": "GitHub operations (PRs, issues)",
        "token_profile": "many-calls",
        "why": "Many git/gh commands",
    },
    "mnemosyne": {
        "tier": "fast",
        "type": "docs",
        "desc": "Memory bank, documentation",
        "token_profile": "medium-output",
        "why": "Writes docs, moderate output",
    },
    "talos": {
        "tier": "fast",
        "type": "hotfix",
        "desc": "Hotfixes, small bugs, CSS",
        "token_profile": "low-output",
        "why": "Small fixes, minimal output",
    },
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PLANS_DIR = opencode_plans_dir()


def normalize_model_id(model_id: str) -> str:
    return model_id.split("/", 1)[1] if "/" in model_id else model_id


def strip_suffix(name: str) -> str:
    """Strip date/version suffixes for matching."""
    name = re.sub(r"-\d{8}$", "", name)
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
        if name.endswith(suffix):
            base = name[: -len(suffix)]
            if base in CODING_ELO or base in SWE_BENCH:
                return base
    return name


def get_model_score(model_id: str) -> dict:
    name = normalize_model_id(model_id)
    lookup = strip_suffix(name)

    def find(d, key):
        if key in d:
            return d[key]
        for k, v in d.items():
            if k.startswith(key) or key.startswith(k):
                return v
        return 0

    elo = find(CODING_ELO, lookup)
    swe = find(SWE_BENCH, lookup)
    price = find(PRICING, lookup) or (0, 0)
    latency = find(LATENCY_MS, lookup)

    return {
        "elo": elo,
        "swe_bench": swe,
        "cost_input": price[0],
        "cost_output": price[1],
        "latency_ms": latency,
    }


def get_fallbacks_for_plan(model_id: str, plan_models: list[str]) -> list[str]:
    """Get fallback chain using ONLY models available in this plan."""
    name = normalize_model_id(model_id)

    # Get all other models in this plan, sorted by quality (ELO desc)
    available = []
    for m in plan_models:
        if normalize_model_id(m) != name:
            score = get_model_score(m)
            available.append((m, score))

    # Sort by ELO descending
    available.sort(key=lambda x: x[1]["elo"], reverse=True)

    # Return top 3 as fallbacks
    return [normalize_model_id(m[0]) for m in available[:3]]


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


def compute_cost(model_id: str, profile: str, calls: int = 1000) -> float:
    score = get_model_score(model_id)
    profiles = {
        "high-input": 2000,
        "high-output": 3000,
        "medium-output": 1500,
        "many-calls": 500,
        "low-output": 300,
    }
    tokens = profiles.get(profile, 1000)
    return (score["cost_output"] * tokens / 1_000_000) * calls


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


def _write_strategy_section(f: TextIO) -> None:
    f.write("## Token-Based Pricing Strategy\n\n")
    f.write(
        "> We are **token-based**. Every API call costs per input + output token.\n"
    )
    f.write(
        "> For coding: **deepseek-v4-flash** (SWE-bench 79%, $0.28/1M) is sufficient — 89x cheaper than Opus.\n"
    )
    f.write("> For reasoning: quality matters — use best available.\n")
    f.write(
        "> **Fallback chains use ONLY models available in the same plan** — no cross-plan mixing.\n\n"
    )


def _write_global_model_universe(f: TextIO, plans: list[dict]) -> None:
    all_models_global = set()
    model_to_plans: dict[str, list[str]] = {}
    for plan in plans:
        plan_name = plan.get("plan", "?")
        models = plan.get("models", {})
        overrides = plan.get("agent_overrides", {})
        for m in list(models.values()) + list(overrides.values()):
            if m and isinstance(m, str):
                all_models_global.add(m)
                name = normalize_model_id(m)
                if name not in model_to_plans:
                    model_to_plans[name] = []
                model_to_plans[name].append(plan_name)

    f.write("## Global Model Universe\n\n")
    f.write(
        f"All unique models across {len(plans)} plans ({len(all_models_global)} total):\n\n"
    )
    f.write(
        "| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Available in Plans |\n"
    )
    f.write(
        "|-------|------------|-----------|-----------------|---------|-------------------|\n"
    )

    for m in sorted(
        all_models_global, key=lambda x: get_model_score(x)["elo"], reverse=True
    ):
        name = normalize_model_id(m)
        score = get_model_score(m)
        latency_str = f"{score['latency_ms']}ms" if score["latency_ms"] else "N/A"
        plan_list = ", ".join(model_to_plans.get(name, []))
        f.write(
            f"| `{name}` | {score['elo']} | {score['swe_bench']}% | ${score['cost_output']:.2f} | {latency_str} | {plan_list} |\n"
        )

    f.write("\n")


def _write_tier_definitions(f: TextIO) -> None:
    f.write("## 4-Tier Agent Classification\n\n")
    f.write("| Tier | Purpose | Agents | Model Strategy |\n")
    f.write("|------|---------|--------|----------------|\n")
    f.write(
        "| **1. Premium** | Reasoning, planning, delegation | zeus, athena, themis | Best ELO available in plan |\n"
    )
    f.write(
        "| **2. Default** | Analysis, advanced tasks | gaia, hephaestus, prometheus, chiron | Balance quality + cost |\n"
    )
    f.write(
        "| **3. Coding** | Day-to-day code generation | hermes, aphrodite, demeter, echo | Cost-efficient, SWE ≥ 73% |\n"
    )
    f.write(
        "| **4. Fast** | Research, ops, docs, hotfixes | apollo, nyx, iris, mnemosyne, talos | Cheapest, fastest |\n\n"
    )


def _collect_plan_models(models: dict, overrides: dict) -> set[str]:
    plan_models: set[str] = set()
    for m in models.values():
        if m and isinstance(m, str):
            plan_models.add(m)
    for m in overrides.values():
        if m and isinstance(m, str):
            plan_models.add(m)
    return plan_models


def _write_plan_available_models(
    f: TextIO,
    plan_name: str,
    price: str,
    plan_models: set[str],
    models: dict,
    overrides: dict,
) -> None:
    f.write(f"---\n\n### {plan_name} ({price})\n\n")
    f.write(f"**Available models ({len(plan_models)}):**\n\n")
    f.write("| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |\n")
    f.write("|-------|------------|-----------|-----------------|---------|------|\n")

    for m in sorted(plan_models, key=lambda x: get_model_score(x)["elo"], reverse=True):
        name = normalize_model_id(m)
        score = get_model_score(m)
        role = "tier default"
        for tier_key, tier_model in models.items():
            if tier_model == m:
                role = f"{tier_key} tier"
                break
        for agent, agent_model in overrides.items():
            if agent_model == m:
                role = f"{agent} override"
                break
        latency_str = f"{score['latency_ms']}ms" if score["latency_ms"] else "N/A"
        f.write(
            f"| `{name}` | {score['elo']} | {score['swe_bench']}% | ${score['cost_output']:.2f} | {latency_str} | {role} |\n"
        )

    f.write("\n")


def _write_plan_fallback_chains(
    f: TextIO, plan_models: set[str], overrides: dict, models: dict
) -> None:
    f.write("**Agent assignments with fallback chains (per-plan only):**\n\n")
    f.write(
        "| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |\n"
    )
    f.write(
        "|-------|------|---------|------------|------------|------------|--------------|\n"
    )

    for agent in sorted(AGENT_TIERS.keys()):
        info = AGENT_TIERS[agent]
        model = overrides.get(
            agent,
            models.get("default" if info["tier"] == "coding" else info["tier"], ""),
        )
        name = normalize_model_id(model) if model else "N/A"
        fallbacks = (
            get_fallbacks_for_plan(model, list(plan_models))
            if model
            else ["N/A", "N/A", "N/A"]
        )
        cost = compute_cost(model, info["token_profile"]) if model else 0
        fb = (
            fallbacks
            if len(fallbacks) >= 3
            else fallbacks + ["N/A"] * (3 - len(fallbacks))
        )
        f.write(
            f"| {agent} | {info['tier']} | `{name}` | `{fb[0]}` | `{fb[1]}` | `{fb[2]}` | ${cost:.4f} |\n"
        )

    f.write("\n")


def _write_plan_cost_summary(f: TextIO, overrides: dict, models: dict) -> None:
    f.write("**Cost per 1000 feature development cycles:**\n\n")
    f.write("| Component | Calls | Model | Cost |\n")
    f.write("|-----------|-------|-------|------|\n")

    z_model = overrides.get("zeus", models.get("premium", ""))
    z_cost = compute_cost(z_model, "high-input", 1)
    f.write(
        f"| Planning (zeus) | 1 | `{normalize_model_id(z_model)}` | ${z_cost:.2f} |\n"
    )

    coding_models = [
        ("hermes", overrides.get("hermes", models.get("default", "")), "medium-output"),
        (
            "aphrodite",
            overrides.get("aphrodite", models.get("default", "")),
            "high-output",
        ),
        (
            "demeter",
            overrides.get("demeter", models.get("default", "")),
            "medium-output",
        ),
    ]
    for label, cm, profile in coding_models:
        c_cost = compute_cost(cm, profile, 1)
        f.write(
            f"| Coding ({label}) | 1 | `{normalize_model_id(cm)}` | ${c_cost:.2f} |\n"
        )

    t_model = overrides.get("themis", models.get("premium", ""))
    t_cost = compute_cost(t_model, "high-input", 2)
    f.write(
        f"| Review (themis) | 2 | `{normalize_model_id(t_model)}` | ${t_cost:.2f} |\n"
    )

    fast_model = models.get("fast", "")
    f_cost = compute_cost(fast_model, "many-calls", 5)
    f.write(
        f"| Fast (apollo×5) | 5 | `{normalize_model_id(fast_model)}` | ${f_cost:.2f} |\n"
    )

    total = (
        z_cost
        + sum(compute_cost(cm, p, 1) for _, cm, p in coding_models)
        + t_cost
        + f_cost
    )
    f.write(f"| **TOTAL** | | | **${total:.2f}** |\n")
    f.write("\n")


def _write_plan_assessment(f: TextIO, models: dict, plan_models: set[str]) -> None:
    premium = models.get("premium", "")
    default = models.get("default", "")
    fast = models.get("fast", "")

    p_score = get_model_score(premium) if premium else {}
    d_score = get_model_score(default) if default else {}
    f_score = get_model_score(fast) if fast else {}

    f.write("**Assessment:**\n\n")

    f.write(f"- **Tier 1 (Premium):** `{normalize_model_id(premium)}` — ")
    if p_score.get("elo", 0) >= 1500:
        f.write(f"Excellent (ELO {p_score['elo']}). Top-tier reasoning.\n")
    elif p_score.get("elo", 0) >= 1430:
        f.write(f"Strong (ELO {p_score['elo']}). Good for planning and review.\n")
    else:
        f.write(
            f"Moderate (ELO {p_score['elo']}). May struggle with complex orchestration.\n"
        )

    f.write(f"- **Tier 2 (Default):** `{normalize_model_id(default)}` — ")
    if d_score.get("swe_bench", 0) >= 78:
        f.write(
            f"Excellent (SWE-bench {d_score['swe_bench']}%). Strong for analysis.\n"
        )
    elif d_score.get("swe_bench", 0) >= 73:
        f.write(f"Good (SWE-bench {d_score['swe_bench']}%). Suitable for most work.\n")
    else:
        f.write(f"Moderate (SWE-bench {d_score['swe_bench']}%). Consider override.\n")

    _write_tier3_assessment(f, d_score, plan_models)
    _write_tier4_assessment(f, fast, f_score)

    f.write("\n")


def _write_tier3_assessment(f: TextIO, d_score: dict, plan_models: set[str]) -> None:
    f.write("- **Tier 3 (Coding):** uses default — ")
    if d_score.get("swe_bench", 0) >= 78:
        f.write(
            f"Excellent (SWE-bench {d_score['swe_bench']}%). But expensive at ${d_score['cost_output']:.2f}/1M.\n"
        )
        cheapest = min(plan_models, key=lambda m: get_model_score(m)["cost_output"])
        c_score = get_model_score(cheapest)
        f.write(
            f"  💡 **Recommendation:** Override coding agents to `{normalize_model_id(cheapest)}` (SWE {c_score['swe_bench']}%, ${c_score['cost_output']:.2f}/1M).\n"
        )
    elif d_score.get("swe_bench", 0) >= 73:
        f.write(
            f"Good (SWE-bench {d_score['swe_bench']}%). Cost: ${d_score['cost_output']:.2f}/1M.\n"
        )
        cheapest = min(plan_models, key=lambda m: get_model_score(m)["cost_output"])
        c_score = get_model_score(cheapest)
        if c_score["cost_output"] < d_score["cost_output"] * 0.5:
            f.write(
                f"  💡 **Recommendation:** Override coding agents to `{normalize_model_id(cheapest)}` for better cost (${c_score['cost_output']:.2f}/1M).\n"
            )
    else:
        f.write(f"Below optimal (SWE-bench {d_score['swe_bench']}).\n")


def _write_tier4_assessment(f: TextIO, fast: str, f_score: dict) -> None:
    f.write(f"- **Tier 4 (Fast):** `{normalize_model_id(fast)}` — ")
    if f_score.get("latency_ms", 9999) <= 400:
        f.write(f"Fast ({f_score['latency_ms']}ms). Good for research/ops.\n")
    elif f_score.get("latency_ms", 9999) <= 700:
        f.write(f"Moderate ({f_score['latency_ms']}ms). Acceptable.\n")
    else:
        f.write(f"Slow ({f_score['latency_ms']}ms). Consider faster.\n")


def _write_per_plan_detail(f: TextIO, plans: list[dict]) -> None:
    f.write("## Per-Plan Deep Analysis\n\n")

    for plan in plans:
        models = plan.get("models", {})
        overrides = plan.get("agent_overrides", {})
        plan_models = _collect_plan_models(models, overrides)

        _write_plan_available_models(
            f,
            plan.get("plan", "?"),
            plan.get("price", "?"),
            plan_models,
            models,
            overrides,
        )
        _write_plan_fallback_chains(f, plan_models, overrides, models)
        _write_plan_cost_summary(f, overrides, models)
        _write_plan_assessment(f, models, plan_models)


def _write_plan_comparison_summary(f: TextIO, plans: list[dict]) -> None:
    f.write("## Plan Comparison Summary\n\n")
    f.write(
        "| Plan | Price | Premium (ELO) | Default (SWE) | Fast (latency) | Total/1K cycles |\n"
    )
    f.write(
        "|------|-------|---------------|---------------|----------------|----------------|\n"
    )

    for plan in plans:
        plan_name = plan.get("plan", "?")
        price = plan.get("price", "?")
        models = plan.get("models", {})
        overrides = plan.get("agent_overrides", {})

        p = models.get("premium", "")
        d = models.get("default", "")
        fa = models.get("fast", "")
        p_score = get_model_score(p) if p else {}
        d_score = get_model_score(d) if d else {}
        f_score = get_model_score(fa) if fa else {}

        z_model = overrides.get("zeus", models.get("premium", ""))
        z_cost = compute_cost(z_model, "high-input", 1)
        coding_models = [
            overrides.get("hermes", models.get("default", "")),
            overrides.get("aphrodite", models.get("default", "")),
            overrides.get("demeter", models.get("default", "")),
        ]
        c_cost = sum(
            compute_cost(
                cm, "high-output" if cm == coding_models[1] else "medium-output", 1
            )
            for cm in coding_models
        )
        t_model = overrides.get("themis", models.get("premium", ""))
        t_cost = compute_cost(t_model, "high-input", 2)
        f_cost = compute_cost(fa, "many-calls", 5)
        total = z_cost + c_cost + t_cost + f_cost

        f.write(
            f"| {plan_name} | {price} | {normalize_model_id(p)} ({p_score.get('elo', '?')}) | {normalize_model_id(d)} ({d_score.get('swe_bench', '?')}%) | {normalize_model_id(fa)} ({f_score.get('latency_ms', '?')}ms) | **${total:.2f}** |\n"
        )

    f.write("\n")


def generate_report(plans: list[dict], output_path: Path) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    with open(output_path, "w") as f:
        f.write(
            "# Pantheon Model Routing — Deep Analysis with Per-Plan Fallback Chains\n\n"
        )
        f.write(f"**Generated:** {now}\n")
        f.write(f"**Plans analyzed:** {len(plans)}\n")
        f.write(f"**Agents:** {len(AGENT_TIERS)} (4 tiers)\n")
        f.write(
            "**Data:** LMSYS Arena Coding, SWE-bench Verified, Artificial Analysis (May 2026)\n\n"
        )

        _write_strategy_section(f)
        _write_global_model_universe(f, plans)
        _write_tier_definitions(f)
        _write_per_plan_detail(f, plans)
        _write_plan_comparison_summary(f)

        f.write("*Generated by Pantheon Model Routing Deep Analysis*\n")
        f.write(
            "*Fallback chains use ONLY models available in each plan — no cross-plan mixing*\n"
        )

    print(f"📄 Report saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Pantheon Model Routing — Deep Analysis"
    )
    parser.add_argument("--output", default="model-routing-deep.md", help="Output path")
    args = parser.parse_args()

    print("🔍 Pantheon Model Routing — Deep Analysis\n")
    plans = load_plans()
    print(f"📋 Loaded {len(plans)} plans\n")

    output_path = Path(args.output)
    generate_report(plans, output_path)
    print("\n✅ Analysis complete!")


if __name__ == "__main__":
    main()
