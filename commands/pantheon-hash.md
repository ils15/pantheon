---
description: "Track file changes via content hashing"
agent: zeus
---

Track file modifications using SHA-256 hashes:

1. Hash all files before edits: kv_store("hash:<path>", sha256(content))
2. After edits, compare: kv_get("hash:<path>") vs new hash
3. Report which files changed and by how much
4. Useful for audit trail and change detection
