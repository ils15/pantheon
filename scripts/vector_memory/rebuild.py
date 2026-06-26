"""
Vector Memory Rebuild — Full re-index from source files.
- Wipes existing index (meta + content + FTS5 + vectors)
- Re-reads all memory bank files
- Rebuilds complete index
- Safe to run at any time (data is derived from markdown files)
"""

import sys
from pathlib import Path

# Ensure this directory is on the path for sibling imports
_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from index import index_all  # noqa: E402
from schema import VECTOR_DB, init_db  # noqa: E402


def rebuild() -> dict:
    """Full rebuild: reset database and re-index everything."""
    print("=== Pantheon Vector Memory Rebuild ===\n")

    # Step 1: Remove existing database
    if VECTOR_DB.exists():
        print(f"[1/4] Removing existing database: {VECTOR_DB}")
        VECTOR_DB.unlink()
        # Also remove WAL and SHM files
        for ext in ["-wal", "-shm"]:
            p = VECTOR_DB.parent / (VECTOR_DB.name + ext)
            if p.exists():
                p.unlink()
    else:
        print("[1/4] No existing database found")

    # Step 2: Initialize fresh database
    print("[2/4] Creating fresh database with schema...")
    conn = init_db()
    print("    \u2705 Schema created")

    # Step 3: Index all files
    print("[3/4] Indexing all memory bank files...")
    stats = index_all(conn)
    print(f"    \u2705 {stats['new']} new entries indexed")
    print(f"    \u23ed\ufe0f  {stats['skipped']} skipped")
    if stats["errors"]:
        print(f"    \u274c {stats['errors']} errors")

    # Step 4: Summary
    print("\n[4/4] Rebuild complete!")
    print(f"    Database: {VECTOR_DB}")
    print(f"    Total entries: {stats['new']}")

    conn.close()
    return stats


if __name__ == "__main__":
    rebuild()
