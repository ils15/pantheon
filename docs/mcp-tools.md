# MCP Tool Registry

Canonical reference for Pantheon agents. Lists every tool across the 3 native MCP servers, with signatures, descriptions, and which agents use them.

> **Agent tip:** Tool names are platform-dependent. See [Platform Naming Conventions](#platform-naming-conventions) below to map these names to your runtime.

---

## Servers

Pantheon provides 4 native MCP servers. See below for full tool registries.

### pantheon-resources (read-only)

Read-only resource server. No tools — read resources directly via `pantheon://` URIs using `read_mcp_resource`.

| Resource URI | Description |
|---|---|
| `pantheon://agents` | List all 14 agent definitions (YAML frontmatter) |
| `pantheon://agents/{name}` | Single agent config by name (case-insensitive) |
| `pantheon://routing` | Full `routing.yml` — delegation rules, handoff contracts |
| `pantheon://skills` | List all skills with descriptions |
| `pantheon://skills/{name}` | Specific skill `SKILL.md` content |
| `pantheon://deepwork/{slug}` | Deepwork `PLAN.md` |
| `pantheon://deepwork/{slug}/status` | Deepwork `STATUS.md` (defaults to IN_PROGRESS) |
| `pantheon://memory-bank/{path}` | Any file under `.pantheon/memory-bank/` (path traversal blocked) |
| `pantheon://code-mode/scripts` | List all available code-mode scripts |
| `pantheon://code-mode/scripts/{name}` | View script content by name |
| `pantheon://memory/sessions` | List all memory sessions with counts and timestamps |
| `pantheon://memory/status` | Memory server stats: entries, sessions, disk usage |

**Used by:** ALL agents. Common reads: `routing` (zeus, athena), `agents/{name}` (any), `skills/{name}` (implementers), `memory-bank/{path}` (aphrodite, mnemosyne).

**Call pattern:**
```
read_mcp_resource(server="pantheon-resources", uri="pantheon://routing")
```

---

### pantheon-memory (persistent storage)

Vector memory with ChromaDB + sentence-transformers. 14 tools for storing, searching, linking, compressing, and managing memories across sessions.

| Tool | Signature | Description | Who uses it |
|------|-----------|-------------|-------------|
| `memory_recall` | `(context: str, n_results?: 3)` | Auto-retrieve relevant memories for prompt injection | ALL agents — called at session start |
| `memory_store` | `(content, category?, agent?, session_id?, importance?: 0.5, links?)` | Persist a fact, decision, or pattern | Implementers: hermes, aphrodite, demeter, prometheus, hephaestus, nyx, mnemosyne, zeus |
| `memory_search` | `(query: str, n_results?: 5, category_filter?)` | Vector similarity search with freshness decay + importance boost | apollo, themis, mnemosyne |
| `memory_delete` | `(entry_id: str)` | Permanently delete an entry | mnemosyne only |
| `memory_update` | `(entry_id, content?, category?, importance?)` | Update an existing entry's content/metadata | mnemosyne only |
| `memory_export` | `(session_id?, filename?)` | Export memories as formatted markdown | mnemosyne only |
| `memory_link` | `(from_id, to_id, relation?: "references")` | Create bidirectional relationship between entries | mnemosyne, hephaestus |
| `memory_traverse` | `(entry_id, max_depth?: 1)` | Walk knowledge graph from entry following links | mnemosyne only |
| `memory_compress` | `(session_id, max_entries?: 50, compression_ratio?: 0.5)` | Compress oldest entries into summaries (DCP-style) | mnemosyne only |
| `memory_consolidate` | `(session_id?)` | Merge duplicate/similar entries via cosine similarity | mnemosyne only |
| `memory_verify` | `(entry_id)` | Validate entry exists and check freshness | mnemosyne only |
| `memory_sessions` | `(format?: "json")` | List all unique session IDs with counts and timestamps | mnemosyne, nyx |
| `memory_expand` | `(entry_id)` | Restore a compressed entry back to detailed form | mnemosyne only |
| `memory_cleanup` | `(session_prefix?: "test-")` | Delete test/old sessions (prefix min 3 chars) | mnemosyne only |

**Call pattern:**
```
memory_recall(context="implementing JWT auth in FastAPI")
memory_store(content="Decided to use refresh token rotation", category="decision", importance=0.9)
memory_search(query="existing auth patterns", n_results=5)
```

---

### pantheon-persistence (KV store + FTS5 search)

Lightweight key-value store with SQLite FTS5, TTL-based expiration, and namespace isolation. Zero external dependencies (stdlib only).

| Tool | Signature | Description | Who uses it |
|------|-----------|-------------|-------------|
| `kv_store` | `(namespace, key, value, ttl?, scope?)` | Store a key-value pair with optional TTL (seconds) | ALL agents — cache, session state |
| `kv_get` | `(namespace, key, scope?)` | Retrieve a value by namespace + key (auto-filters expired) | ALL agents — read cached data |
| `kv_delete` | `(namespace, key, scope?)` | Remove a key-value pair | zeus, talos — cleanup tasks |
| `kv_list` | `(namespace, prefix?, scope?, limit?)` | List keys in a namespace with optional prefix filter | apollo, zeus — discovery |
| `kv_search` | `(query, namespace?, scope?, limit?)` | FTS5 full-text search with BM25 ranking | mnemosyne, zeus — find across namespaces |
| `purge_expired` | `(scope?, dry_run?)` | Purge expired TTL entries with deletelog audit trail | mnemosyne, zeus — maintenance |

**Call pattern:**
```
kv_store(namespace="cache-apollo", key="api-response", value="...", ttl=3600)
kv_get(namespace="cache-apollo", key="api-response")
kv_search(query="auth token refresh")
purge_expired(scope="project", dry_run=True)
```

---

### pantheon-code-mode (script execution)

Confined automation scripts from `.pantheon/code-mode/`. One tool, 30s timeout, `.sh` and `.py` only.

| Tool | Signature | Description | Who uses it |
|------|-----------|-------------|-------------|
| `execute_code_script` | `(script_name: str, args?: list[str])` | Run a script from `.pantheon/code-mode/` and return output | Agents with `bash: allow` (zeus, hermes, aphrodite, demeter, themis, prometheus, hephaestus, talos) |

**NOT available to:** athena, apollo, gaia, iris, nyx, mnemosyne (no bash access).

**Use cases by agent:**
| Agent | Typical scripts |
|-------|----------------|
| zeus | Orchestration sequences |
| hermes | `pytest`, `ruff check`, `ruff format` |
| aphrodite | `npm test`, `biome check` |
| demeter | `alembic upgrade head && pytest` |
| themis | Lint/quality check scripts during review |
| prometheus | Docker builds, CI/CD pipeline scripts |
| talos | Automated hotfix sequences, batch fixes |

**Call pattern:**
```
execute_code_script("lint-and-test.sh", args=["backend/"])
```

---

## Platform Naming Conventions

Each platform exposes MCP tools with different naming. The same tool `memory_recall` from server `pantheon-memory` gets different names:

| Platform | Naming Pattern | Example for `memory_recall` |
|----------|---------------|-----------------------------|
| **OpenCode** | `{server}_{tool}` | `pantheon-memory_memory_recall` |
| **** | `mcp__{server}__{tool}` | `mcp__pantheon-memory__memory_recall` |
| **** | `<use_mcp_tool>` XML | `<use_mcp_tool><server_name>pantheon-memory</server_name><tool_name>memory_recall</tool_name></use_mcp_tool>` |
| **** | Original name | `memory_recall` (injected via schema) |
| **** | Original name | `memory_recall` (injected via schema) |
| **Continue** | Original name | `memory_recall` (injected via schema) |
| ** ** | Original name | `memory_recall` (injected via schema) |

---

## Permission Tiers

| Server | Recommended Tier | Rationale |
|--------|-----------------|-----------|
| pantheon-resources | `allow` | Read-only, same trust boundary as repo |
| pantheon-code-mode | `ask` | Executes scripts — needs user confirmation |
| pantheon-memory | `allow` | Read/write within agent sandbox, no system access |
| pantheon-persistence | `allow` | SQLite KV, same trust boundary as repo |

---

## Security Notes

- **pantheon-resources** — path traversal protection on `memory-bank/{path}`
- **pantheon-code-mode** — only `.sh`/`.py` in `.pantheon/code-mode/`, 30s timeout, no `../` escape
- **pantheon-memory** — all data in `~/.pantheon/memory/chroma.sqlite3`, no system-level access
- **pantheon-persistence** — SQLite KV in `~/.pantheon/persistence/`, TTL auto-purge, namespace isolation

See `skill: mcp-security` for complete rules.
