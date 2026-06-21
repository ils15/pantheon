"""Tests for the summarizer/compression logic."""

from __future__ import annotations

import pytest

from summarizer import (
    compress_text,
    context_stats,
    estimate_tokens,
    prune_stale_outputs,
    scrub,
)


class TestCompressText:
    """Tests for the compress_text function."""

    def test_compress_keeps_critical(self, critical_text: str) -> None:
        """CRITICAL content should be preserved verbatim."""
        result = compress_text(critical_text)
        assert "JWT auth" in result
        assert "refresh token" in result
        assert "schema migration" in result

    def test_compress_drops_low(self, low_text: str) -> None:
        """LOW priority content should be dropped entirely."""
        result = compress_text(low_text)
        assert result == "", (
            f"Expected empty string for LOW-only text, got: {result!r}"
        )

    def test_compress_respects_max_chars(self) -> None:
        """Output should never exceed max_chars."""
        long_text = "auth, " * 1000  # 6000 chars of auth text
        result = compress_text(long_text, max_chars=100)
        assert len(result) <= 100, (
            f"Expected <= 100 chars, got {len(result)}"
        )

    def test_compress_scrubs_secrets(self) -> None:
        """Secrets should be redacted in output."""
        text = (
            "JWT auth token=my_secret_key_here endpoint "
            "API key=1234567890abcdef"
        )
        result = compress_text(text)
        assert "my_secret_key_here" not in result
        assert "1234567890abcdef" not in result

    def test_compress_empty_text(self) -> None:
        """Empty text should return empty string."""
        assert compress_text("") == ""
        assert compress_text("   ") == ""

    def test_compress_mixed_text(self, mixed_text: str) -> None:
        """Mixed priority text: CRITICAL kept, MEDIUM compressed, LOW dropped.

        The 5 paragraphs are:
        1. "Created new auth service with JWT token rotation..." — CRITICAL (JWT, auth, token)
        2. "Migration adds refresh_tokens table..." — CRITICAL (migration, token)
        3. "Fixed CSS button styling issue..." — LOW (CSS, style)
        4. "Refactored the user service..." — MEDIUM (refactor, service)
        5. "Typo fix in the login page label." — HIGH (login scores risk=1.0)

        P3 (CSS) is dropped. P5 (typo+login) stays because login pushes it to HIGH.
        """
        result = compress_text(mixed_text)
        # CRITICAL parts should be present
        assert "auth service" in result.lower() or "jwt" in result.lower()
        assert "migration" in result.lower()
        # LOW pure-CSS paragraph should be dropped
        assert "css button styling" not in result.lower()

    def test_compress_deterministic(self) -> None:
        """Same input should produce same output."""
        text = "Added JWT auth endpoint with login and refresh token rotation."
        r1 = compress_text(text)
        r2 = compress_text(text)
        assert r1 == r2


class TestPruneStaleOutputs:
    """Tests for the prune_stale_outputs function."""

    def test_prune_stale_keeps_last_3(self, sample_outputs: list[str]) -> None:
        """Should reduce list to approximately 3 unique items."""
        result = prune_stale_outputs(sample_outputs, keep_last=3)
        assert len(result) <= 3, (
            f"Expected <= 3 items, got {len(result)}"
        )

    def test_prune_stale_dedup_consecutive(self) -> None:
        """Consecutive duplicates should be removed."""
        outputs = ["a", "a", "b", "b", "c"]
        result = prune_stale_outputs(outputs, keep_last=3)
        assert result == ["a", "b", "c"], (
            f"Expected ['a', 'b', 'c'], got {result}"
        )

    def test_prune_stale_empty_list(self) -> None:
        """Empty list should return empty list."""
        assert prune_stale_outputs([]) == []

    def test_prune_stale_single_item(self) -> None:
        """Single item list should remain unchanged."""
        assert prune_stale_outputs(["hello"]) == ["hello"]

    def test_prune_stale_all_identical(self) -> None:
        """All identical items should collapse to one."""
        outputs = ["same"] * 10
        result = prune_stale_outputs(outputs, keep_last=3)
        assert len(result) == 1

    def test_prune_stale_removes_high_frequency(self) -> None:
        """Items appearing >3 times should keep only last occurrence."""
        outputs = [
            "a", "b", "a", "b", "a", "b", "a", "b",  # 'a' appears 4 times
            "c",
        ]
        result = prune_stale_outputs(outputs, keep_last=3)
        assert len(result) <= 3


class TestScrub:
    """Tests for the security scrubbing function."""

    def test_scrub_removes_api_key(self) -> None:
        """api_key=... should be redacted."""
        result = scrub("api_key=mysecretkey123")
        assert "mysecretkey123" not in result
        assert "REDACTED" in result

    def test_scrub_removes_github_token(self) -> None:
        """GitHub PAT tokens should be redacted."""
        ghp_token = "ghp_" + "a" * 36
        result = scrub(f"token={ghp_token}")
        assert ghp_token not in result

    def test_scrub_removes_openai_key(self) -> None:
        """OpenAI keys (sk-...) should be redacted."""
        key = "sk-" + "a" * 48
        result = scrub(f"key={key}")
        assert key not in result

    def test_scrub_removes_bearer_token(self) -> None:
        """Bearer tokens should be redacted."""
        result = scrub(
            "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        )
        assert "Bearer [REDACTED]" in result

    def test_scrub_removes_jwt(self) -> None:
        """JWT tokens should be redacted."""
        jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN4g_9kNN3kzYJPu5g"
        result = scrub(f"token={jwt}")
        assert "[JWT REDACTED]" in result or "REDACTED" in result

    def test_scrub_removes_private_key(self) -> None:
        """Private keys should be redacted."""
        pk = (
            "-----BEGIN RSA PRIVATE KEY-----\n"
            "MIIEpAIBAAKCAQEA\n"
            "-----END RSA PRIVATE KEY-----"
        )
        result = scrub(pk)
        assert "[PRIVATE KEY REDACTED]" in result

    def test_scrub_no_secrets_preserves_text(self) -> None:
        """Text without secrets should remain unchanged."""
        text = "This is a normal conversation about JWT auth endpoints."
        result = scrub(text)
        assert result == text

    def test_scrub_multiple_secrets(self) -> None:
        """Multiple secrets in same text should all be redacted."""
        text = (
            "api_key=abcdef1234567890 and password=mysecretkey123 and "
            "Bearer eyJhbGciOiJIUzI1NiJ9.token"
        )
        result = scrub(text)
        assert "abcdef1234567890" not in result
        assert "mysecretkey123" not in result
        assert "eyJhbGciOiJIUzI1NiJ9.token" not in result
        assert "REDACTED" in result


class TestEstimateTokens:
    """Tests for the estimate_tokens function."""

    def test_estimate_empty(self) -> None:
        assert estimate_tokens("") == 0

    def test_estimate_short_text(self) -> None:
        """~40 chars should estimate ~10 tokens."""
        result = estimate_tokens(
            "Hello world, this is a test of the system."
        )
        assert result == 10  # 40 // 4

    def test_estimate_longer_text(self) -> None:
        result = estimate_tokens("a" * 100)
        assert result == 25  # 100 // 4


class TestContextStats:
    """Tests for the context_stats function."""

    def test_stats_format(self, sample_text: str) -> None:
        """Stats should be properly formatted."""
        result = context_stats(sample_text)
        assert "Tokens:" in result
        assert "Lines:" in result
        assert "Chars:" in result
        # Should be a single line with | separators
        assert result.count("|") == 2

    def test_stats_empty(self) -> None:
        """Empty text should show zeros."""
        result = context_stats("")
        assert "Tokens: ~0" in result
        assert "Lines: 0" in result
        assert "Chars: 0" in result

    def test_stats_counts(self) -> None:
        """Stats should accurately reflect content."""
        text = "Line 1\nLine 2\nLine 3"
        result = context_stats(text)
        # 20 chars ("Line 1\nLine 2\nLine 3"), 3 lines, ~5 tokens
        assert "Lines: 3" in result
        assert "Chars: 20" in result
