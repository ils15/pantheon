"""Priority scoring engine for context compression.

Deterministic keyword-driven scoring (no LLM) across 3 dimensions:
Impact, Risk, and Novelty. Used by the Pantheon Context MCP server
for mid-session context compression.
"""

from __future__ import annotations

import re
from typing import Final

# ---------------------------------------------------------------------------
# Keyword scoring map
# Each entry: (keyword_pattern, impact, risk, novelty)
# Score = Impact * 0.40 + Risk * 0.35 + Novelty * 0.25
# ---------------------------------------------------------------------------

KeywordEntry = tuple[str, float, float, float]

KEYWORD_MAP: Final[list[KeywordEntry]] = [
    # schema/migration — CRITICAL
    ("schema", 1.0, 1.0, 0.6),
    ("migration", 1.0, 1.0, 0.4),
    # auth/security — CRITICAL
    ("auth", 1.0, 1.0, 0.5),
    ("login", 1.0, 1.0, 0.4),
    ("security", 0.8, 1.0, 0.4),
    ("jwt", 0.8, 1.0, 0.4),
    # auth/security — HIGH
    ("token", 0.7, 0.8, 0.3),
    # API — HIGH
    ("endpoint", 0.9, 0.6, 0.5),
    ("api", 0.8, 0.5, 0.4),
    # architecture — MEDIUM
    ("service", 0.7, 0.4, 0.4),
    # structure — MEDIUM
    ("new file", 0.6, 0.3, 0.8),
    # code-quality — MEDIUM
    ("refactor", 0.5, 0.7, 0.6),
    # style — LOW
    ("css", 0.2, 0.1, 0.2),
    ("style", 0.2, 0.1, 0.2),
    # trivial — LOW
    ("typo", 0.0, 0.0, 0.0),
]

# Priority bands
CRITICAL_THRESHOLD: Final[float] = 0.75
HIGH_THRESHOLD: Final[float] = 0.50
MEDIUM_THRESHOLD: Final[float] = 0.25

# Dimension weights (simplified for mid-session use)
IMPACT_WEIGHT: Final[float] = 0.40
RISK_WEIGHT: Final[float] = 0.35
NOVELTY_WEIGHT: Final[float] = 0.25


def score_content(text: str) -> dict[str, float]:
    """Score text across 3 dimensions using keyword matching.

    For each dimension (Impact, Risk, Novelty), finds the maximum
    score among all matching keywords in the text. Total score is
    a weighted sum: Impact*0.40 + Risk*0.35 + Novelty*0.25.

    Args:
        text: The text to score.

    Returns:
        Dict with keys 'total', 'impact', 'risk', 'novelty',
        each a float in 0.0-1.0 range.
    """
    if not text or not text.strip():
        return {"total": 0.0, "impact": 0.0, "risk": 0.0, "novelty": 0.0}

    lower_text = text.lower()

    impact_scores: list[float] = [0.0]
    risk_scores: list[float] = [0.0]
    novelty_scores: list[float] = [0.0]

    for keyword, impact, risk, novelty in KEYWORD_MAP:
        # Use word-boundary matching to avoid partial matches
        pattern = re.compile(r"\b" + re.escape(keyword) + r"\b", re.IGNORECASE)
        if pattern.search(lower_text):
            impact_scores.append(impact)
            risk_scores.append(risk)
            novelty_scores.append(novelty)

    impact = max(impact_scores)
    risk = max(risk_scores)
    novelty = max(novelty_scores)

    total = impact * IMPACT_WEIGHT + risk * RISK_WEIGHT + novelty * NOVELTY_WEIGHT
    # Clamp to 0.0-1.0
    total = max(0.0, min(1.0, total))

    return {"total": total, "impact": impact, "risk": risk, "novelty": novelty}


def classify_priority(score: float) -> str:
    """Classify a score into a priority band.

    Args:
        score: Total score in 0.0-1.0 range.

    Returns:
        'CRITICAL', 'HIGH', 'MEDIUM', or 'LOW'.
    """
    if score >= CRITICAL_THRESHOLD:
        return "CRITICAL"
    if score >= HIGH_THRESHOLD:
        return "HIGH"
    if score >= MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"
