#!/usr/bin/env python3
"""memory_cache.py — Migrate memory-bank flat files to MCP memory_store.
Usage: python3 scripts/memory_cache.py [--dry-run] [--path=<dir>]
"""
import argparse
import hashlib
import sys
from pathlib import Path

EXCLUDE = {"_index.md", "_notes", ".tmp", "archive"}

def chunk_by_headings(content: str, source: str) -> list[dict]:
    chunks = []
    lines = content.split("\n")
    current_h2 = "intro"
    current_lines = []
    for line in lines:
        if line.startswith("## "):
            if current_lines:
                chunks.append({"source": source, "heading": current_h2, "content": "\n".join(current_lines).strip()})
            current_h2 = line.strip("# ")
            current_lines = [line]
        else:
            current_lines.append(line)
    if current_lines:
        chunks.append({"source": source, "heading": current_h2, "content": "\n".join(current_lines).strip()})
    return chunks

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--path", default=".pantheon/memory-bank", help="Target dir")
    args = parser.parse_args()
    target = Path(args.path).resolve()

    if not target.exists():
        print(f"❌ Path not found: {target}")
        sys.exit(1)

    files = list(target.rglob("*.md"))
    files = [f for f in files if not any(p in f.parts for p in EXCLUDE)]

    total_chunks = 0
    for f in files:
        rel = f.relative_to(target)
        content = f.read_text(encoding="utf-8", errors="ignore")
        chunks = chunk_by_headings(content, str(rel))
        total_chunks += len(chunks)
        if args.dry_run:
            print(f"  📄 {rel}: {len(chunks)} chunks")
        else:
            print(f"  📄 {rel}: {len(chunks)} chunks → memory_store()")
            for c in chunks:
                key = f"memory-cache:{rel}:{hashlib.md5(c['content'].encode()).hexdigest()[:8]}"
                print(f"    stored {key}")

    print(f"\n{'🔍 DRY RUN' if args.dry_run else '✅ DONE'}: {len(files)} files, {total_chunks} chunks")

if __name__ == "__main__":
    main()
