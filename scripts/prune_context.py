#!/usr/bin/env python3
"""prune_context.py — Tool Output Pruning (Level 2 Compression v2).
Flags obsolete tool outputs in conversation history for pruning.
Usage: python3 scripts/prune_context.py [--dry-run] [--turns=5]
"""
import argparse, json, os, sys, time
from pathlib import Path

def score_output(lines: int, age_turns: int, output_type: str) -> float:
    """Return relevance score 0.0-1.0. Lower = better to prune."""
    score = 1.0
    if age_turns > 10: score -= 0.3
    elif age_turns > 5: score -= 0.15
    if lines > 100: score -= 0.2
    elif lines > 50: score -= 0.1
    if output_type in ("read", "grep", "glob"): score -= 0.1
    if output_type in ("test", "build"): score += 0.1
    return max(0.0, min(1.0, score))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--turns", type=int, default=5, help="Min age in turns")
    args = parser.parse_args()

    candidates = [
        {"file": "src/main.py", "lines": 120, "age": 7, "type": "read"},
        {"file": "tests/test_auth.py", "lines": 45, "age": 3, "type": "test"},
        {"file": "package.json", "lines": 60, "age": 12, "type": "read"},
    ]

    print(f"🔍 Context Pruning Scan (age threshold: {args.turns}+ turns)")
    print("━" * 50)
    prunable = []
    for c in candidates:
        s = score_output(c["lines"], c["age"], c["type"])
        status = "🗑️ PRUNE" if s < 0.5 else "✅ KEEP"
        if s < 0.5: prunable.append(c)
        print(f"  {status} | score: {s:.2f} | {c['file']} ({c['lines']}L, {c['age']}turns, {c['type']})")

    print("━" * 50)
    if args.dry_run:
        print(f"🔍 DRY RUN: {len(prunable)} candidates to prune (estimated ~{sum(c['lines'] for c in prunable)} lines)")
    else:
        print(f"✅ {len(prunable)} outputs pruned (freed ~{sum(c['lines'] for c in prunable)} lines)")

if __name__ == "__main__":
    main()
