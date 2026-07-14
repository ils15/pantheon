#!/usr/bin/env python3
"""
scrub-secrets.py — Credential scrubber for Memory Bank promotions.

Scrubs credentials, tokens, and secrets from text before promoting it
to permanent memory bank files. Uses Python 3.9+ stdlib only.

Usage:
    python3 scripts/scrub-secrets.py --file path/to/file
        # scrub in-place (with .bak backup)
    python3 scripts/scrub-secrets.py --stdin
        # read stdin, write scrubbed to stdout
    python3 scripts/scrub-secrets.py --audit path/to/file
        # only report, don't modify
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from re import Match

# ---------------------------------------------------------------------------
# Pattern definitions — order matters (private keys first to catch multi-line)
# ---------------------------------------------------------------------------


def _make_redactor(pattern: str, replacement: str) -> tuple[re.Pattern, str]:
    """Compile a pattern with DOTALL for multi-line."""
    return (re.compile(pattern, re.DOTALL), replacement)


REDACTORS: list[tuple[re.Pattern, str]] = [
    # SSH private keys (multi-line, before generic private key)
    _make_redactor(
        r"-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----"
        r".*?-----END\s+OPENSSH\s+PRIVATE\s+KEY-----",
        "[SSH PRIVATE KEY REDACTED]",
    ),
    # Private keys (multi-line, must run before Bearer/JWT)
    _make_redactor(
        r"-----BEGIN\s+.*?PRIVATE\s+KEY-----"
        r".*?-----END\s+.*?PRIVATE\s+KEY-----",
        "[PRIVATE KEY REDACTED]",
    ),
    # Certificates (multi-line)
    _make_redactor(
        r"-----BEGIN\s+CERTIFICATE-----"
        r".*?-----END\s+CERTIFICATE-----",
        "[CERTIFICATE REDACTED]",
    ),
    # Bearer tokens
    _make_redactor(
        r"Bearer\s+[A-Za-z0-9\-._~+/]+=*",
        "Bearer [REDACTED]",
    ),
    # JWTs
    _make_redactor(
        r"eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+",
        "[JWT REDACTED]",
    ),
    # GitHub PATs
    _make_redactor(
        r"ghp_[A-Za-z0-9]{36}",
        "[GITHUB TOKEN REDACTED]",
    ),
    # OpenAI keys
    _make_redactor(
        r"sk-[A-Za-z0-9\-_]{10,}",
        "[OPENAI KEY REDACTED]",
    ),
    # API keys (api_key, api-key, apikey)
    _make_redactor(
        r"(api[_-]?key|apikey)\s*[=:]\s*['\"]?[A-Za-z0-9\-_]{8,}",
        r"\1=[REDACTED]",
    ),
    # Passwords / tokens / secrets
    _make_redactor(
        r"(token|secret|password)\s*[=:]\s*['\"]?[A-Za-z0-9\-_]{8,}",
        r"\1=[REDACTED]",
    ),
    # AWS Access Keys
    _make_redactor(
        r"AKIA[0-9A-Z]{16}",
        "[AWS KEY REDACTED]",
    ),
    # Google API Keys
    _make_redactor(
        r"AIza[0-9A-Za-z\-_]{35}",
        "[GOOGLE API KEY REDACTED]",
    ),
    # Slack tokens
    _make_redactor(
        r"xox[baprs]-[0-9a-zA-Z-]{20,}",
        "[SLACK TOKEN REDACTED]",
    ),
    # Heroku API Keys (UUID format)
    _make_redactor(
        r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        "[HEROKU API KEY REDACTED]",
    ),
    # Database connection strings (non-greedy to prevent over-matching)
    _make_redactor(
        r"postgresql\+?:\/\/.*?:.*?@",
        "[POSTGRESQL CONNECTION REDACTED]",
    ),
    _make_redactor(
        r"mysql\+?:\/\/.*?:.*?@",
        "[MYSQL CONNECTION REDACTED]",
    ),
    _make_redactor(
        r"redis\+?:\/\/.*?:.*?@",
        "[REDIS CONNECTION REDACTED]",
    ),
    # .env export statements
    _make_redactor(
        r"export\s+\w+=['\"]?\S+",
        "[ENV EXPORT REDACTED]",
    ),
]

# Classification dispatch: prefix → label
_CLASSIFIERS: list[tuple[str, str]] = [
    ("-----BEGIN OPENSSH", "ssh_private_key"),
    ("-----BEGIN CERTIFICATE", "certificate"),
    ("-----BEGIN", "private_key"),
    ("Bearer ", "bearer_token"),
    ("eyJ", "jwt"),
    ("ghp_", "github_pat"),
    ("sk-", "openai_key"),
    ("xox", "slack_token"),
    ("AKIA", "aws_key"),
    ("AIza", "google_api_key"),
    ("postgresql://", "postgresql_conn"),
    ("mysql://", "mysql_conn"),
    ("redis://", "redis_conn"),
    ("export ", "env_export"),
]


def _classify_match(matched: str) -> str:
    """Return a human-readable label for a matched secret."""
    for prefix, label in _CLASSIFIERS:
        if matched.startswith(prefix):
            return label
    if re.match(r"api[_-]?key|apikey", matched, re.IGNORECASE):
        return "api_key"
    if re.match(r"(token|secret|password)\s*=", matched, re.IGNORECASE):
        return "credential"
    if re.match(
        r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        matched,
    ):
        return "heroku_uuid"
    return "unknown_secret"


def scrub(content: str) -> tuple[str, list[dict]]:
    """Scrub secrets from *content*.

    Returns (scrubbed_content, redactions) where each redaction dict has:
        type        — human-readable label for the matched secret
        position    — (start, end) tuple of character offsets in original
        replacement — what the secret was replaced with

    Each redactor runs independently so every match in the input is
    captured exactly once.  Overlapping matches across *different* patterns
    are possible but extremely unlikely given the pattern design.
    """
    redactions: list[dict] = []
    scrubbed = content

    for pattern, replacement in REDACTORS:
        # Walk matches in reverse offset order so replacements don't shift
        # positions of yet-unreplaced matches.
        matches: list[Match] = list(pattern.finditer(scrubbed))
        for m in reversed(matches):
            start, end = m.start(), m.end()
            matched_text = m.group(0)
            resolved = m.expand(replacement) if "\\" in replacement else replacement

            redactions.append(
                {
                    "type": _classify_match(matched_text),
                    "position": (start, end),
                    "replacement": resolved,
                }
            )
            scrubbed = scrubbed[:start] + resolved + scrubbed[end:]

    # Restore original order (positional, ascending)
    redactions.reverse()
    return scrubbed, redactions


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _audit(path: str) -> None:
    """Print what would be redacted without modifying the file."""
    with open(path, encoding="utf-8") as fh:
        content = fh.read()
    _, redactions = scrub(content)
    if not redactions:
        print(f"[OK] {path}: no secrets found")
        return
    print(f"[SCAN] {path}: {len(redactions)} potential secret(s) found:")
    for r in redactions:
        print(f"   [{r['type']}] at {r['position']} -> {r['replacement']}")


def _scrub_file(path: str) -> None:
    """Scrub file in-place, creating a .bak backup."""
    with open(path, encoding="utf-8") as fh:
        content = fh.read()
    scrubbed, redactions = scrub(content)
    if not redactions:
        print(f"[OK] {path}: no secrets found, file unchanged")
        return
    # Write backup
    bak = path + ".bak"
    if not os.path.exists(bak):
        os.rename(path, bak)
    else:
        print(f"[WARN] {bak} already exists, skipping backup")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(scrubbed)
    print(
        f"[SECURE] {path}: {len(redactions)} secret(s) redacted "
        f"({' + '.join(r['type'] for r in redactions)})"
    )
    print(f"   Backup: {bak}")


def _scrub_stdin() -> None:
    """Read stdin, write scrubbed output to stdout."""
    content = sys.stdin.read()
    scrubbed, redactions = scrub(content)
    for r in redactions:
        print(f"  [REDACTED {r['type']}]", file=sys.stderr)
    sys.stdout.write(scrubbed)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scrub secrets from text before promoting to "
        "permanent memory bank files.",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--file",
        type=str,
        help="Scrub file in-place (with .bak backup)",
    )
    group.add_argument(
        "--stdin",
        action="store_true",
        help="Read stdin, write scrubbed to stdout",
    )
    group.add_argument(
        "--audit",
        type=str,
        help="Only report what would be redacted",
    )

    args = parser.parse_args()

    if args.file:
        _scrub_file(args.file)
    elif args.stdin:
        _scrub_stdin()
    elif args.audit:
        _audit(args.audit)


if __name__ == "__main__":
    main()
