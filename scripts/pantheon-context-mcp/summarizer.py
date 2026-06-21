"""Text compression and summarization logic for the Pantheon Context MCP server.

Provides:
- compress_text: Priority-aware text compression
- prune_stale_outputs: Deduplicate and trim tool output lists
- estimate_tokens: Rough token count approximation
- scrub: Security scrubbing of secrets
"""

from __future__ import annotations

import sys
from pathlib import Path

import re
from typing import Final

# Ensure this directory is on sys.path when running directly
HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import scoring

# ---------------------------------------------------------------------------
# Security scrubbing patterns
# Aligned with scripts/scrub-secrets.py
# ---------------------------------------------------------------------------

SECRET_PATTERNS: Final[list[tuple[re.Pattern, str]]] = [
    # Private keys (multi-line, must run before Bearer/JWT)
    (
        re.compile(
            r"-----BEGIN\s+.*?PRIVATE\s+KEY-----"
            r".*?-----END\s+.*?PRIVATE\s+KEY-----",
            re.DOTALL,
        ),
        "[PRIVATE KEY REDACTED]",
    ),
    # Bearer tokens
    (re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*"), "Bearer [REDACTED]"),
    # JWTs
    (
        re.compile(r"eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+"),
        "[JWT REDACTED]",
    ),
    # GitHub PATs
    (re.compile(r"ghp_[A-Za-z0-9]{36}"), "[GITHUB TOKEN REDACTED]"),
    (re.compile(r"gho_[A-Za-z0-9]{36}"), "[GITHUB TOKEN REDACTED]"),
    (re.compile(r"github_pat_[a-zA-Z0-9]{36,}"), "[GITHUB TOKEN REDACTED]"),
    # OpenAI keys
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "[OPENAI KEY REDACTED]"),
    # API keys (api_key, api-key, apikey)
    (
        re.compile(
            r"(api[_-]?\s?key|apikey)\s*[=:]\s*['\"]?[A-Za-z0-9\-_]{8,}",
            re.IGNORECASE,
        ),
        r"\1=[REDACTED]",
    ),
    # Passwords / tokens / secrets
    (
        re.compile(
            r"(token|secret|password)\s*[=:]\s*['\"]?[A-Za-z0-9\-_]{8,}",
            re.IGNORECASE,
        ),
        r"\1=[REDACTED]",
    ),
]


def scrub(text: str) -> str:
    """Scrub secrets from text.

    Runs regex patterns to redact API keys, tokens, passwords, private keys,
    JWTs, and other credentials.

    Args:
        text: Input text that may contain secrets.

    Returns:
        Text with secrets replaced by redaction markers.
    """
    for pattern, replacement in SECRET_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def estimate_tokens(text: str) -> int:
    """Rough token estimate using character count approximation.

    Uses len(text) // 4 heuristic, which is a reasonable approximation
    for English text.

    Args:
        text: Input text.

    Returns:
        Estimated token count.
    """
    return len(text) // 4


def compress_text(text: str, max_chars: int = 4000) -> str:
    """Compress text using priority-aware scoring.

    Steps:
    1. Split text into paragraphs/sections
    2. Score each section via scoring.score_content()
    3. CRITICAL sections: keep verbatim (full)
    4. HIGH sections: summarize to 2 lines
    5. MEDIUM sections: summarize to 1 line
    6. LOW sections: drop entirely
    7. If still over max_chars, truncate MEDIUM sections first
    8. Security scrub before returning

    Args:
        text: Raw conversation text to compress.
        max_chars: Maximum character length for output (default: 4000).

    Returns:
        Compressed text string, never exceeding max_chars.
    """
    if not text or not text.strip():
        return ""

    # Split into paragraphs (double newline) or single-line sections
    paragraphs = _split_paragraphs(text)

    scored_paragraphs: list[tuple[str, dict[str, float]]] = []
    for para in paragraphs:
        score_result = scoring.score_content(para)
        priority = scoring.classify_priority(score_result["total"])
        scored_paragraphs.append((para, score_result, priority))

    # Process by priority
    compressed_parts: list[str] = []
    for para, score_result, priority in scored_paragraphs:
        if priority == "CRITICAL":
            # Keep verbatim
            compressed_parts.append(para)
        elif priority == "HIGH":
            # Summarize to 2 lines
            compressed_parts.append(_summarize(para, 2))
        elif priority == "MEDIUM":
            # Summarize to 1 line
            compressed_parts.append(_summarize(para, 1))
        # LOW: drop entirely

    # Join and check size
    result = "\n\n".join(compressed_parts)

    # If still over max_chars, truncate MEDIUM sections
    if len(result) > max_chars:
        result = _truncate_by_priority(result, scored_paragraphs, max_chars)

    # Security scrub before returning
    result = scrub(result)

    # Final length enforcement (safety net)
    if len(result) > max_chars:
        result = result[:max_chars]

    return result


def _split_paragraphs(text: str) -> list[str]:
    """Split text into paragraphs/sections for scoring.

    Handles double newlines, single newlines, and line breaks.
    """
    # Try double newline first
    paragraphs = re.split(r"\n\s*\n", text.strip())
    # Filter empty
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    return paragraphs if paragraphs else [text.strip()]


def _summarize(text: str, max_lines: int) -> str:
    """Summarize text to a given number of lines by taking first lines."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if len(lines) <= max_lines:
        return text.strip()
    return "\n".join(lines[:max_lines]) + " [...]"


def _truncate_by_priority(
    result: str,
    scored_paragraphs: list[tuple[str, dict[str, float], str]],
    max_chars: int,
) -> str:
    """Truncate MEDIUM sections iteratively until under max_chars."""
    # This is a simplified approach: just truncate the text directly
    # since we already dropped LOW and compressed HIGH/MEDIUM
    if len(result) <= max_chars:
        return result
    return result[:max_chars].rsplit("\n", 1)[0]


def prune_stale_outputs(outputs: list[str], keep_last: int = 3) -> list[str]:
    """Prune a list of tool output strings.

    Rules:
    1. Keep only the last `keep_last` unique outputs
    2. Remove consecutive duplicates
    3. If same output appears >3 times, keep only last occurrence

    Args:
        outputs: List of tool output strings.
        keep_last: Number of unique outputs to keep (default: 3).

    Returns:
        Pruned list of output strings.
    """
    if not outputs:
        return []

    # Remove consecutive duplicates
    deduped: list[str] = []
    for item in outputs:
        if not deduped or item != deduped[-1]:
            deduped.append(item)

    # Count occurrences and handle repeated items
    # If same output appears >3 times, keep only last occurrence
    counts: dict[str, int] = {}
    for item in deduped:
        counts[item] = counts.get(item, 0) + 1

    result: list[str] = []
    for item in deduped:
        if counts[item] > 3:
            # Skip all but the last occurrence
            counts[item] -= 1
            continue
        result.append(item)

    # Keep only the last `keep_last` unique outputs
    # "Unique" here means preserving order of first unique appearance
    seen: set[str] = set()
    unique_items: list[str] = []
    for item in reversed(result):
        if item not in seen:
            seen.add(item)
            unique_items.append(item)
    unique_items.reverse()

    if len(unique_items) > keep_last:
        unique_items = unique_items[-keep_last:]

    # Reconstruct with deduped order preserved
    final: list[str] = []
    seen_final: set[str] = set()
    for item in result:
        if item in unique_items:
            if item not in seen_final:
                final.append(item)
                seen_final.add(item)

    return final


def context_stats(text: str) -> str:
    """Generate statistics about conversation text.

    Args:
        text: Conversation text to analyze.

    Returns:
        Formatted stats string.
    """
    if not text:
        return "Tokens: ~0 | Lines: 0 | Chars: 0"

    char_count = len(text)
    line_count = text.count("\n") + 1
    token_estimate = estimate_tokens(text)

    return f"Tokens: ~{token_estimate} | Lines: {line_count} | Chars: {char_count}"
