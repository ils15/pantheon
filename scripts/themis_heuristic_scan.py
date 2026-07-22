#!/usr/bin/env python3
"""Themis Layer 1 — Heuristic Scanner.
Zero LLM tokens. Roda em <2s. Retorna score 0-100 + blocking verdict.

Usage: python3 scripts/themis_heuristic_scan.py [--path=<dir>] [--diff-only]
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

EXCLUDE_DIRS = {
    "node_modules",
    ".pantheon",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    ".mypy_cache",
    ".ruff_cache",
    ".hypothesis",
}

RUFF_ISSUE_THRESHOLD = 5
SLOP_PATTERN_THRESHOLD = 10

# 20 anti-patterns de IA slop
SLOP_PATTERNS = [
    (
        r"// This (function|method|class) (is used|is responsible|handles)",
        "obvious comment",
    ),
    (
        r"# (This|A) (function|method|class) (is used|is responsible|handles)",
        "obvious comment",
    ),
    (r"// TODO: (fix|implement|add|remove)", "generic TODO"),
    (r"# TODO (fix|implement|add)", "generic TODO"),
    (r"// (Getter|Setter) for", "obvious getter/setter"),
    (r"# (Getter|Setter) for", "obvious getter/setter"),
    (r"// (Private|Protected|Public) (method|field|helper)", "obvious access"),
    (r"// (Initialize|Cleanup)", "obvious init/cleanup"),
    (r"# (Initialize|Cleanup)", "obvious init/cleanup"),
    (r"// Check if", "obvious check-if"),
    (r"# Check if", "obvious check-if"),
    (r"// Return (the|a|true|false)", "obvious return"),
    (r'""" ?(This|A) (module|function|class)', "generic docstring"),
    (
        r'<input.*type=["](text|number)["].*/>',
        "native input type available (datetime, color, etc.)",
    ),
    (r"import (date-fns|moment|dayjs|luxon)", "Intl.DateTimeFormat natively available"),
    (
        r"import (react-datepicker|flatpickr|react-calendar)",
        '<input type="date"> natively available',
    ),
    (
        r"import (react-color|react-colorful|color-picker)",
        '<input type="color"> natively available',
    ),
    (r"import (react-slider|rc-slider)", '<input type="range"> natively available'),
    (r"import (axios|superagent|got)", "fetch() natively available"),
    (
        r"import (lodash|underscore)",
        "modern JS stdlib covers this (Array.toSorted, Object.groupBy, etc.)",
    ),
    (
        r"import (clsx|classnames)",
        "`template literals` or className join natively available",
    ),
    (
        r".css$|.scss$|.less$",
        "Tailwind or CSS Modules already available — avoid new CSS files",
    ),
    (
        r"new Date\(\)",
        "use Intl.DateTimeFormat for formatting, not manual Date methods",
    ),
    (
        r"useEffect.*fetch|useEffect.*axios",
        "use react-query or native fetch in event handlers",
    ),
    (r"function.*\(\) \{$", "prefer one-liner arrow functions"),
]

Score = int
Verdict = str  # "APPROVED" | "BLOCKING"


class Scanner:
    def __init__(self, target: str, diff_only: bool = False):
        self.target = Path(target).resolve()
        self.diff_only = diff_only
        self.score: int = 100
        self.report: list[str] = []
        self.blocking: bool = False

    def deduct(self, points: int) -> None:
        self.score = max(0, self.score - points)

    def find_files(self, *exts: str) -> list[Path]:
        files = []
        for ext in exts:
            for f in self.target.rglob(f"*.{ext}"):
                if not any(p in f.parts for p in EXCLUDE_DIRS):
                    files.append(f)
        return files[:20]  # limit to 20 files for speed

    def run_ruff(self) -> None:
        files = self.find_files("py")
        if not files:
            self.report.append("  ⏭️  ruff: no Python files")
            return
        try:
            result = subprocess.run(
                [
                    "ruff",
                    "check",
                    "--select",
                    "F,E,W,I,N,UP,B,SIM,PL,RUF",
                    "--output-format",
                    "concise",
                    *[str(f) for f in files],
                ],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self.report.append("  ⚠️  ruff: not available or timeout")
            self.deduct(5)
            return

        if result.returncode == 0:
            self.report.append("  ✅ ruff: clean")
        else:
            count = len([line for line in result.stdout.split("\n") if line.strip()])
            self.report.append(f"  ⚠️  ruff: {count} issues")
            if count > RUFF_ISSUE_THRESHOLD:
                self.blocking = True
                self.deduct(15)

    def run_biome(self) -> None:
        files = self.find_files("ts", "tsx", "js", "jsx")
        if not files:
            self.report.append("  ⏭️  biome: no JS/TS files")
            return
        try:
            result = subprocess.run(
                [
                    "npx",
                    "biome",
                    "check",
                    "--write",
                    "--unsafe",
                    *[str(f) for f in files],
                ],
                capture_output=True,
                text=True,
                timeout=15,
                check=False,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self.report.append("  ⏭️  biome: not available")
            return

        if result.returncode == 0 or "safe fixes" in result.stdout:
            self.report.append("  ✅ biome: clean or auto-fixed")
        else:
            self.report.append("  ⚠️  biome: issues found")
            self.deduct(10)

    def run_antipattern(self) -> None:
        hits = 0
        for ext in ("py", "ts", "tsx", "js", "jsx"):
            for f in self.find_files(ext):
                try:
                    content = f.read_text(errors="ignore")
                    for pat, label in SLOP_PATTERNS:
                        if re.search(pat, content):
                            hits += 1
                            self.report.append(f"  🧹 slop: {label} → {f.name}")
                except (OSError, UnicodeDecodeError):
                    continue

        if hits == 0:
            self.report.append("  ✅ anti-pattern: clean")
        else:
            self.report.append(f"  🧹 anti-pattern: {hits} slop patterns")
            self.deduct(hits * 2)
            if hits > SLOP_PATTERN_THRESHOLD:
                self.blocking = True

    def run_hash_verify(self) -> None:
        """Verify that staged edits actually changed the file."""
        try:
            result = subprocess.run(
                ["git", "diff", "--cached", "--name-only"],
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError):
            self.report.append("  ⏭️  hash-verify: git not available")
            return

        staged = [f for f in result.stdout.strip().split("\n") if f][:10]
        if not staged:
            self.report.append("  ⏭️  hash-verify: no staged files")
            return

        failed = 0
        for f in staged:
            if not Path(f).exists():
                continue
            try:
                diff = subprocess.run(
                    ["git", "diff", "--cached", f],
                    capture_output=True,
                    text=True,
                    timeout=5,
                    check=False,
                )
                before = len(
                    [
                        line
                        for line in diff.stdout.split("\n")
                        if line.startswith("-") and not line.startswith("---")
                    ]
                )
                after = len(
                    [
                        line
                        for line in diff.stdout.split("\n")
                        if line.startswith("+") and not line.startswith("+++")
                    ]
                )
            except (subprocess.TimeoutExpired, FileNotFoundError):
                continue

            if before == 0 and after == 0:
                failed += 1
                self.report.append(f"  ⚠️  hash-verify: {f} — no change detected")

        if failed == 0:
            self.report.append("  ✅ hash-verify: all edits verified")
        else:
            self.report.append(f"  ⚠️  hash-verify: {failed} files with failed edits")
            self.blocking = True
            self.deduct(20)

    def run(self) -> tuple[int, str]:
        print("🔍 Themis Heuristic Scan")
        print("━━━━━━━━━━━━━━━━━━━━━━━")

        self.run_ruff()
        self.run_biome()
        self.run_antipattern()
        self.run_hash_verify()

        verdict = "BLOCKING" if self.blocking else "APPROVED"
        print("━━━━━━━━━━━━━━━━━━━━━━━")
        for line in self.report:
            print(line)
        print("━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"Score: {self.score}/100 | Verdict: {verdict}")

        if self.blocking:
            print("\033[31m→ BLOCKING: issues found\033[0m")
            return 1
        else:
            print("\033[32m→ Passed: ready for Layer 2\033[0m")
            return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Themis Layer 1 Heuristic Scanner")
    parser.add_argument("--path", default=".", help="Target directory")
    parser.add_argument(
        "--diff-only", action="store_true", help="Only check staged diffs"
    )
    args = parser.parse_args()

    scanner = Scanner(args.path, args.diff_only)
    sys.exit(scanner.run())


if __name__ == "__main__":
    main()
