"""Tests for the priority scoring engine."""

from __future__ import annotations

import pytest

from scoring import classify_priority, score_content


class TestScoreContent:
    """Tests for the score_content function."""

    def test_score_auth_text(self, sample_text: str) -> None:
        """Auth text should score >= 0.75 (CRITICAL)."""
        result = score_content(sample_text)
        assert result["total"] >= 0.75, (
            f"Auth text expected >= 0.75, got {result['total']}"
        )
        assert classify_priority(result["total"]) == "CRITICAL"

    def test_score_css_text(self, low_text: str) -> None:
        """CSS/style text should score < 0.25 (LOW)."""
        result = score_content(low_text)
        assert result["total"] < 0.25, (
            f"CSS text expected < 0.25, got {result['total']}"
        )
        assert classify_priority(result["total"]) == "LOW"

    def test_score_empty_text(self) -> None:
        """Empty text should score 0.0."""
        result = score_content("")
        assert result["total"] == 0.0
        assert result["impact"] == 0.0
        assert result["risk"] == 0.0
        assert result["novelty"] == 0.0

    def test_score_whitespace_text(self) -> None:
        """Whitespace-only text should score 0.0."""
        result = score_content("   \n\n  \t  ")
        assert result["total"] == 0.0

    def test_keyword_max_not_average(self) -> None:
        """Scoring should use MAX keyword match per dimension, not average.

        Text with 'auth' (risk=1.0) and 'typo' (risk=0.0) should
        have risk=1.0 (max), NOT 0.5 (average).
        """
        text = "Added auth endpoint and fixed a typo in CSS."
        result = score_content(text)
        # auth: impact=1.0, risk=1.0, novelty=0.5
        # endpoint: impact=0.9, risk=0.6, novelty=0.5
        # typo: impact=0.0, risk=0.0, novelty=0.0
        # css: impact=0.2, risk=0.1, novelty=0.2
        # Max: impact=1.0, risk=1.0, novelty=0.5
        assert result["impact"] == 1.0, (
            "Impact should be 1.0 (max of auth/endpoint)"
        )
        assert result["risk"] == 1.0, "Risk should be 1.0 (max of auth)"
        assert result["novelty"] == 0.5, (
            "Novelty should be 0.5 (max of auth/endpoint)"
        )

    def test_score_mixed_content(self) -> None:
        """Mixed content should score in MEDIUM/HIGH range."""
        text = "Refactored the user service to use dependency injection pattern."
        result = score_content(text)
        # refactor: impact=0.5, risk=0.7, novelty=0.6
        # service: impact=0.7, risk=0.4, novelty=0.4
        # Max: impact=0.7, risk=0.7, novelty=0.6
        assert 0.25 <= result["total"] <= 0.75, (
            f"Mixed content expected 0.25-0.75, got {result['total']}"
        )

    def test_score_text_with_multiple_same_category(self) -> None:
        """Multiple keywords in same category should max, not stack."""
        text = "JWT auth and login endpoint all in one schema."
        result = score_content(text)
        # Multiple auth/security keywords. Max should still apply.
        assert result["impact"] == 1.0
        assert result["risk"] == 1.0

    def test_score_no_keywords(self) -> None:
        """Text with no matching keywords should score 0.0."""
        text = "The quick brown fox jumps over the lazy dog."
        result = score_content(text)
        assert result["total"] == 0.0

    def test_score_case_insensitive(self) -> None:
        """Keyword matching should be case-insensitive."""
        text_upper = "JWT AUTH ENDPOINT"
        text_lower = "jwt auth endpoint"
        text_mixed = "Jwt Auth Endpoint"
        r1 = score_content(text_upper)
        r2 = score_content(text_lower)
        r3 = score_content(text_mixed)
        assert r1["total"] == r2["total"] == r3["total"]


class TestClassifyPriority:
    """Tests for the classify_priority function."""

    def test_critical(self) -> None:
        assert classify_priority(0.90) == "CRITICAL"
        assert classify_priority(0.75) == "CRITICAL"

    def test_high(self) -> None:
        assert classify_priority(0.60) == "HIGH"
        assert classify_priority(0.50) == "HIGH"

    def test_medium(self) -> None:
        assert classify_priority(0.35) == "MEDIUM"
        assert classify_priority(0.25) == "MEDIUM"

    def test_low(self) -> None:
        assert classify_priority(0.10) == "LOW"
        assert classify_priority(0.0) == "LOW"

    def test_boundary_values(self) -> None:
        """Test values at exact boundaries."""
        # 0.7499 is >= 0.50 (HIGH) and < 0.75 (CRITICAL), so HIGH
        assert classify_priority(0.7499) == "HIGH"
        assert classify_priority(0.75) == "CRITICAL"
        # 0.4999 is >= 0.25 (MEDIUM) and < 0.50 (HIGH), so MEDIUM
        assert classify_priority(0.4999) == "MEDIUM"
        assert classify_priority(0.50) == "HIGH"
        # 0.2499 is >= 0.0 but < 0.25, so LOW
        assert classify_priority(0.2499) == "LOW"
        assert classify_priority(0.25) == "MEDIUM"
