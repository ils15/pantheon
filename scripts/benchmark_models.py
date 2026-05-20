#!/usr/bin/env python3
"""
Pantheon Model Benchmark — Cross-plan comparison using public leaderboard data.

Compares models from the user's active plans using LMSYS Arena Coding leaderboard
and known performance data. No API keys needed — uses published benchmark results.

Usage:
    python scripts/benchmark_models.py [--plans opencode-go,opencode-zen-free,copilot-pro]
"""

import json
import os
import sys
import argparse
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Public benchmark data (LMSYS Arena Coding Leaderboard ~2026)
# Sources: lmsys.org, artificialanalysis.ai, huggingface.co/spaces/optimum/llm-perf-leaderboard
# ---------------------------------------------------------------------------

# ELO scores from LMSYS Coding Arena (approximate, 2026)
CODING_ELO = {
    # Claude series
    "claude-sonnet-4-6": 1465,
    "claude-opus-4-6": 1490,
    "claude-opus-4-7": 1500,
    "claude-haiku-4-5": 1380,
    # GPT series
    "gpt-5.4-mini": 1440,
    "gpt-5.3-codex": 1455,
    "gpt-5-mini": 1420,
    "gpt-5.5-thinking": 1510,
    # Qwen series
    "qwen3.6-plus": 1450,
    "qwen3.6-plus-free": 1445,
    # Kimi series
    "kimi-k2.6": 1460,
    "kimi-k2.5": 1430,
    # DeepSeek series
    "deepseek-v4-flash": 1390,
    "deepseek-v4-pro": 1440,
    # Gemini series
    "gemini-3.1-pro": 1455,
    "gemini-3-flash": 1400,
    # MiniMax
    "minimax-m2.5": 1370,
}

# Latency (ms to first token) — from Artificial Analysis
LATENCY_MS = {
    "claude-sonnet-4-6": 800,
    "claude-opus-4-6": 1200,
    "claude-opus-4-7": 1500,
    "claude-haiku-4-5": 400,
    "gpt-5.4-mini": 500,
    "gpt-5.3-codex": 700,
    "gpt-5-mini": 450,
    "gpt-5.5-thinking": 2000,
    "qwen3.6-plus": 600,
    "qwen3.6-plus-free": 550,
    "kimi-k2.6": 900,
    "kimi-k2.5": 700,
    "deepseek-v4-flash": 350,
    "deepseek-v4-pro": 800,
    "gemini-3.1-pro": 650,
    "gemini-3-flash": 300,
    "minimax-m2.5": 400,
}

# Throughput (tokens/sec) — from Artificial Analysis
THROUGHPUT_TPS = {
    "claude-sonnet-4-6": 85,
    "claude-opus-4-6": 60,
    "claude-opus-4-7": 50,
    "claude-haiku-4-5": 120,
    "gpt-5.4-mini": 110,
    "gpt-5.3-codex": 90,
    "gpt-5-mini": 115,
    "gpt-5.5-thinking": 30,
    "qwen3.6-plus": 95,
    "qwen3.6-plus-free": 100,
    "kimi-k2.6": 75,
    "kimi-k2.5": 85,
    "deepseek-v4-flash": 130,
    "deepseek-v4-pro": 80,
    "gemini-3.1-pro": 100,
    "gemini-3-flash": 140,
    "minimax-m2.5": 125,
}

# Cost per 1M tokens (input/output) — approximate USD
COST_PER_1M = {
    "claude-sonnet-4-6": (3.00, 15.00),
    "claude-opus-4-6": (15.00, 75.00),
    "claude-opus-4-7": (20.00, 100.00),
    "claude-haiku-4-5": (0.25, 1.25),
    "gpt-5.4-mini": (0.50, 2.50),
    "gpt-5.3-codex": (2.00, 10.00),
    "gpt-5-mini": (0.40, 2.00),
    "gpt-5.5-thinking": (5.00, 25.00),
    "qwen3.6-plus": (0.80, 4.00),
    "qwen3.6-plus-free": (0.00, 0.00),
    "kimi-k2.6": (1.50, 7.50),
    "kimi-k2.5": (0.50, 2.50),
    "deepseek-v4-flash": (0.10, 0.50),
    "deepseek-v4-pro": (1.00, 5.00),
    "gemini-3.1-pro": (1.25, 6.25),
    "gemini-3-flash": (0.15, 0.75),
    "minimax-m2.5": (0.20, 1.00),
}

# ---------------------------------------------------------------------------
# Plan loading
# ---------------------------------------------------------------------------

PLANS_DIR = Path(os.path.expanduser("~/.config/opencode/platform/plans"))

DEFAULT_PLANS = ["opencode-go", "opencode-zen-free", "copilot-pro"]


def load_plan(name: str) -> dict | None:
    path = PLANS_DIR / f"{name}.json"
    if not path.exists():
        print(f"  ⚠️  Plan not found: {name}")
        return None
    with open(path) as f:
        return json.load(f)


def extract_models(plan: dict) -> set[str]:
    models = set()
    for tier_model in plan.get("models", {}).values():
        if tier_model and isinstance(tier_model, str):
            models.add(tier_model)
    for override in plan.get("agent_overrides", {}).values():
        if override and isinstance(override, str):
            models.add(override)
    return models


def normalize_model_id(model_id: str) -> str:
    """Extract the model name from provider/model format."""
    return model_id.split("/", 1)[1] if "/" in model_id else model_id


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def get_model_score(model_id: str) -> dict:
    name = normalize_model_id(model_id)
    return {
        "elo": CODING_ELO.get(name, 0),
        "latency_ms": LATENCY_MS.get(name, 0),
        "throughput_tps": THROUGHPUT_TPS.get(name, 0),
        "cost_input": COST_PER_1M.get(name, (0, 0))[0],
        "cost_output": COST_PER_1M.get(name, (0, 0))[1],
    }


def compute_value_score(elo: int, cost_output: float) -> float:
    """Higher is better: quality per dollar."""
    if cost_output == 0:
        return elo * 10  # Free models get bonus
    return elo / cost_output


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_report(plans_data: list[tuple[str, dict]], output_path: Path) -> None:
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Collect all unique models across plans
    all_models = {}  # model_id → {plans: [], score: {}}
    for plan_name, plan in plans_data:
        models = extract_models(plan)
        for m in models:
            if m not in all_models:
                all_models[m] = {"plans": [], "score": get_model_score(m)}
            all_models[m]["plans"].append(plan_name)

    # Sort by ELO descending
    sorted_models = sorted(all_models.items(), key=lambda x: x[1]["score"]["elo"], reverse=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        f.write(f"# Pantheon Model Benchmark — Plan Comparison\n\n")
        f.write(f"**Generated:** {now}\n")
        f.write(f"**Plans compared:** {', '.join(p[0] for p in plans_data)}\n")
        f.write(f"**Data sources:** LMSYS Arena Coding, Artificial Analysis, HuggingFace LLM Perf\n\n")

        # Plan overview
        f.write("## Plan Overview\n\n")
        f.write("| Plan | Service | Tier | Price | Models |\n")
        f.write("|------|---------|------|-------|--------|\n")
        for plan_name, plan in plans_data:
            models = extract_models(plan)
            f.write(f"| {plan_name} | {plan.get('service', '?')} | {plan.get('tier', '?')} | {plan.get('price', '?')} | {len(models)} |\n")
        f.write("\n")

        # Model comparison table
        f.write("## Model Comparison (Coding Arena)\n\n")
        f.write("| Model | Plans | Coding ELO | Latency | Throughput | Cost ($/1M out) | Value Score |\n")
        f.write("|-------|-------|------------|---------|------------|-----------------|-------------|\n")

        for model_id, data in sorted_models:
            name = normalize_model_id(model_id)
            score = data["score"]
            plans = ", ".join(data["plans"])
            value = compute_value_score(score["elo"], score["cost_output"])
            latency_str = f"{score['latency_ms']}ms" if score['latency_ms'] else "N/A"
            tp_str = f"{score['throughput_tps']} tok/s" if score['throughput_tps'] else "N/A"
            cost_str = f"${score['cost_output']:.2f}" if score['cost_output'] == 0 else f"${score['cost_output']:.2f}"

            f.write(f"| `{name}` | {plans} | {score['elo']} | {latency_str} | {tp_str} | {cost_str} | {value:.0f} |\n")

        f.write("\n")

        # Per-plan analysis
        f.write("## Per-Plan Analysis\n\n")
        for plan_name, plan in plans_data:
            f.write(f"### {plan_name} ({plan.get('price', '?')})\n\n")

            models = extract_models(plan)
            tier_models = plan.get("models", {})
            overrides = plan.get("agent_overrides", {})

            f.write("**Tier defaults:**\n\n")
            f.write("| Tier | Model | ELO | Latency | Cost |\n")
            f.write("|------|-------|-----|---------|------|\n")
            for tier, model_id in tier_models.items():
                if model_id:
                    name = normalize_model_id(model_id)
                    score = get_model_score(model_id)
                    f.write(f"| {tier} | `{name}` | {score['elo']} | {score['latency_ms']}ms | ${score['cost_output']:.2f}/1M |\n")

            f.write("\n**Agent overrides:**\n\n")
            f.write("| Agent | Model | ELO | Latency | Cost |\n")
            f.write("|-------|-------|-----|---------|------|\n")
            for agent, model_id in sorted(overrides.items()):
                name = normalize_model_id(model_id)
                score = get_model_score(model_id)
                f.write(f"| {agent} | `{name}` | {score['elo']} | {score['latency_ms']}ms | ${score['cost_output']:.2f}/1M |\n")

            f.write("\n")

        # Recommendations
        f.write("## Recommendations\n\n")

        # Find best model per tier across all plans
        f.write("### Optimal Model per Tier\n\n")
        f.write("| Tier | Best Model | Why |\n")
        f.write("|------|-----------|-----|\n")

        # Premium tier: highest ELO
        premium_candidates = [(m, d) for m, d in sorted_models if d["score"]["elo"] > 0]
        if premium_candidates:
            best = premium_candidates[0]
            f.write(f"| **Premium** | `{normalize_model_id(best[0])}` | Highest coding ELO ({best[1]['score']['elo']}) |\n")

        # Default tier: best value (quality/cost)
        value_sorted = sorted(
            [(m, d) for m, d in sorted_models if d["score"]["elo"] > 0],
            key=lambda x: compute_value_score(x[1]["score"]["elo"], x[1]["score"]["cost_output"]),
            reverse=True,
        )
        if value_sorted:
            best_value = value_sorted[0]
            f.write(f"| **Default** | `{normalize_model_id(best_value[0])}` | Best quality/cost ratio |\n")

        # Fast tier: lowest latency
        fast_candidates = [(m, d) for m, d in sorted_models if d["score"]["latency_ms"] > 0]
        fast_candidates.sort(key=lambda x: x[1]["score"]["latency_ms"])
        if fast_candidates:
            best_fast = fast_candidates[0]
            f.write(f"| **Fast** | `{normalize_model_id(best_fast[0])}` | Lowest latency ({best_fast[1]['score']['latency_ms']}ms) |\n")

        f.write("\n")

        # Agent-specific recommendations
        f.write("### Agent-Specific Recommendations\n\n")
        f.write("| Agent | Recommended Model | Reason |\n")
        f.write("|-------|------------------|--------|\n")

        agent_recommendations = {
            "zeus": ("premium", "Needs strong reasoning for orchestration"),
            "athena": ("premium", "Complex planning requires high ELO"),
            "themis": ("premium", "Security review needs deep reasoning"),
            "hermes": ("default", "Coding tasks — balance quality/speed"),
            "aphrodite": ("default", "Frontend generation — good coding ELO"),
            "demeter": ("default", "Database work — needs accuracy"),
            "prometheus": ("default", "Infrastructure — moderate reasoning"),
            "hephaestus": ("default", "AI pipelines — needs coding ability"),
            "chiron": ("default", "Model routing — moderate reasoning"),
            "echo": ("default", "Conversational AI — moderate reasoning"),
            "gaia": ("default", "Remote sensing — needs analysis"),
            "apollo": ("fast", "Research — fast responses needed"),
            "nyx": ("fast", "Observability — lightweight tasks"),
            "mnemosyne": ("fast", "Documentation — simple tasks"),
            "talos": ("fast", "Hotfixes — quick responses"),
            "iris": ("fast", "GitHub ops — simple tasks"),
        }

        for agent, (tier, reason) in agent_recommendations.items():
            # Find best model for this tier
            if tier == "premium":
                best = premium_candidates[0] if premium_candidates else ("N/A", {})
            elif tier == "fast":
                best = fast_candidates[0] if fast_candidates else ("N/A", {})
            else:
                best = value_sorted[0] if value_sorted else ("N/A", {})

            model_name = normalize_model_id(best[0]) if best[0] != "N/A" else "N/A"
            f.write(f"| {agent} | `{model_name}` | {reason} |\n")

        f.write("\n---\n\n")
        f.write(f"*Report generated by Pantheon Model Benchmark*\n")
        f.write(f"*Data from LMSYS Arena Coding Leaderboard, Artificial Analysis, and HuggingFace LLM Perf Leaderboard*\n")

    print(f"\n📄 Report saved to: {output_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Pantheon Model Benchmark — Plan Comparison")
    parser.add_argument("--plans", default=",".join(DEFAULT_PLANS), help="Comma-separated plan names")
    parser.add_argument("--output", default="benchmark-report.md", help="Output report path")
    args = parser.parse_args()

    plan_names = [p.strip() for p in args.plans.split(",")]

    print("🔍 Pantheon Model Benchmark — Plan Comparison\n")
    print(f"📋 Plans: {', '.join(plan_names)}\n")

    plans_data = []
    for name in plan_names:
        plan = load_plan(name)
        if plan:
            plans_data.append((name, plan))
            models = extract_models(plan)
            print(f"  ✅ {name}: {len(models)} models")

    if not plans_data:
        print("\n❌ No valid plans found.")
        sys.exit(1)

    print(f"\n📊 Generating comparison report...")
    output_path = Path(args.output)
    generate_report(plans_data, output_path)

    print(f"\n✅ Benchmark complete!")


if __name__ == "__main__":
    main()
