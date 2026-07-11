"""
Vector Memory CLI — Command-line interface for all Level 3 operations.
Usage: python -m scripts.vector_memory.cli [command]

Commands:
  index   — Index new entries (idempotent)
  rebuild — Full re-index from scratch
  query   — Recall "search query" [--top-k 5] [--type adr]
  status  — Show database stats
"""

import argparse
import sys
from pathlib import Path

# Ensure this directory is on the path for sibling imports
_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))


def cmd_index():
    """Index new entries (idempotent)."""
    from index import index_all

    stats = index_all()
    print(
        f"Indexed: {stats['new']} new, {stats['skipped']} skipped, "
        f"{stats['errors']} errors"
    )


def cmd_rebuild():
    """Full re-index from scratch."""
    from rebuild import rebuild

    rebuild()


def cmd_query():
    """Recall with optional filters."""
    from query import format_recall_results, recall

    parser = argparse.ArgumentParser(description="Vector memory recall")
    parser.add_argument("query", nargs="+", help="Search query terms")
    parser.add_argument("--top-k", type=int, default=5, help="Number of results")
    parser.add_argument("--type", help="Filter by source type (adr, subtask_summary)")
    parser.add_argument("--agent", help="Filter by agent name")
    parser.add_argument("--since", help="Filter by date (YYYY-MM-DD)")
    args = parser.parse_args(sys.argv[2:])

    results = recall(
        " ".join(args.query),
        top_k=args.top_k,
        source_type=args.type,
        agent=args.agent,
        since=args.since,
    )
    print(format_recall_results(results, " ".join(args.query)))


def cmd_status():
    """Show database statistics."""
    from schema import init_db

    conn = init_db()
    cur = conn.execute("SELECT COUNT(*) FROM memory_meta")
    total = cur.fetchone()[0]
    cur = conn.execute(
        "SELECT COUNT(*) FROM memory_meta WHERE source_type = 'adr'"
    )
    adrs = cur.fetchone()[0]
    cur = conn.execute(
        "SELECT COUNT(*) FROM memory_meta "
        "WHERE source_type = 'subtask_summary'"
    )
    summaries = cur.fetchone()[0]

    has_vec = conn.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' AND name='vec_memory'"
    ).fetchone()

    print("Vector Memory Status")
    print(f"  Total entries: {total}")
    print(f"  ADRs: {adrs}")
    print(f"  Subtask summaries: {summaries}")
    print(
        "  Vector backend: "
        f"{'available' if has_vec else 'not loaded (FTS5 fallback active)'}"
    )
    print(
        "  Database: "
        ".pantheon/memory-bank/.vectordb/pantheon-memory.db"
    )

    conn.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]

    if command == "index":
        cmd_index()
    elif command == "rebuild":
        cmd_rebuild()
    elif command == "query":
        cmd_query()
    elif command == "status":
        cmd_status()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
