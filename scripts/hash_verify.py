#!/usr/bin/env python3
"""Hash-Anchored Edit Verification — standalone script.

Verifies that file edits actually changed content by comparing SHA-256
hashes before and after an edit. Detects failed/no-op edits.

Usage:
  python3 scripts/hash_verify.py <file> [--before-hash=<sha256>] [--diff-min-lines=10]
  python3 scripts/hash_verify.py --staged           # Check all staged files
  python3 scripts/hash_verify.py --batch <file>...  # Check multiple files
"""

import argparse
import hashlib
import subprocess
import sys
from pathlib import Path

EXIT_SUCCESS = 0
EXIT_FAILURE = 1
EXIT_WARNING = 2


def sha256_of(file: Path) -> str:
    """Return hex SHA-256 of file content."""
    return hashlib.sha256(file.read_bytes()).hexdigest()


def compute_diff_size(file: Path) -> int:
    """Return number of changed lines in working-tree diff."""
    try:
        result = subprocess.run(
            ["git", "diff", "--", str(file)],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return 0

    diff = result.stdout
    added = len(
        [
            line
            for line in diff.split("\n")
            if line.startswith("+") and not line.startswith("+++")
        ]
    )
    removed = len(
        [
            line
            for line in diff.split("\n")
            if line.startswith("-") and not line.startswith("---")
        ]
    )
    return added + removed


def verify_file(file: Path, before_hash: str | None, diff_min_lines: int) -> dict:
    """Verify a single file edit."""
    if not file.exists():
        return {"file": str(file), "status": "error", "message": "File does not exist"}

    after_hash = sha256_of(file)

    if before_hash:
        # Compare explicit before/after hashes
        if after_hash == before_hash:
            return {
                "file": str(file),
                "status": "failed",
                "hash_before": before_hash,
                "hash_after": after_hash,
                "message": "Hash unchanged — edit did not modify file content",
            }
    else:
        # Auto-detect: check git diff
        diff_changes = compute_diff_size(file)
        if diff_changes == 0:
            return {
                "file": str(file),
                "status": "failed",
                "hash_after": after_hash,
                "message": "No git diff detected — edit did not modify file",
            }

        if diff_changes < diff_min_lines:
            return {
                "file": str(file),
                "status": "warning",
                "hash_after": after_hash,
                "diff_lines": diff_changes,
                "message": f"Edit detected but diff is small ({diff_changes} lines vs min {diff_min_lines})",
            }

    return {
        "file": str(file),
        "status": "verified",
        "hash_after": after_hash,
        "message": "Edit verified — file content changed",
    }


def check_staged_files(diff_min_lines: int) -> list[dict]:
    """Verify all staged (git-add'ed) files."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return [{"status": "error", "message": "Git not available"}]

    staged = [f.strip() for f in result.stdout.split("\n") if f.strip()]
    results = []
    for fname in staged[:20]:  # limit to 20 files
        fpath = Path(fname)
        if fpath.exists():
            results.append(verify_file(fpath, None, diff_min_lines))
    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Hash-anchored edit verification — ensures file edits actually changed content."
    )
    parser.add_argument("files", nargs="*", help="File(s) to verify")
    parser.add_argument(
        "--before-hash", help="Expected SHA-256 hash before edit (for single-file mode)"
    )
    parser.add_argument(
        "--diff-min-lines",
        type=int,
        default=3,
        help="Minimum diff lines to consider edit meaningful (default: 3)",
    )
    parser.add_argument(
        "--staged", action="store_true", help="Verify all staged files instead"
    )
    parser.add_argument(
        "--batch", action="store_true", help="Treat positional args as batch file list"
    )
    args = parser.parse_args()

    if args.staged:
        results = check_staged_files(args.diff_min_lines)
    elif args.batch or len(args.files) > 1:
        results = [verify_file(Path(f), None, args.diff_min_lines) for f in args.files]
    elif args.files:
        results = [
            verify_file(Path(args.files[0]), args.before_hash, args.diff_min_lines)
        ]
    else:
        print("Usage: python3 scripts/hash_verify.py <file> [--before-hash=<sha256>]")
        print("       python3 scripts/hash_verify.py --staged")
        print("       python3 scripts/hash_verify.py --batch <file>...")
        sys.exit(EXIT_FAILURE)

    # Print results
    any_failed = False
    any_warning = False

    for r in results:
        status_tag = {
            "verified": "✅",
            "warning": "⚠️",
            "failed": "❌",
            "error": "❌",
        }.get(r["status"], "❓")
        print(f"{status_tag} {r['file']}: {r['message']}")
        if r["status"] == "failed" or r["status"] == "error":
            any_failed = True
        elif r["status"] == "warning":
            any_warning = True

    if any_failed:
        print("\n❌ HASH VERIFY FAILED — some edits did not modify files")
        sys.exit(EXIT_FAILURE)
    elif any_warning:
        print("\n⚠️  HASH VERIFY PASSED WITH WARNINGS — small diffs detected")
        sys.exit(EXIT_WARNING)
    else:
        print("\n✅ HASH VERIFY: all edits verified")
        sys.exit(EXIT_SUCCESS)


if __name__ == "__main__":
    main()
