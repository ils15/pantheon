# Pantheon Persistence MCP

**Server:** `pantheon-persistence`
**Script:** `scripts/mcp_persistence_server.py`
**Dependencies:** Zero (stdlib only: sqlite3)

A lightweight key-value store with SQLite + FTS5, TTL, and namespaces.
Separate from `pantheon-memory` (vector/ChromaDB).

## Purpose

- **Cache entre agentes** — compartilhar descobertas rápidas sem ir pro ChromaDB
- **Estado de execução** — steps de jobs, progresso, checkpoints
- **Dados efêmeros com TTL** — cache que expira sozinho
- **Dados locais** — tokens temporários, debug info (evita ir pro GitHub)

## Architecture

```
pantheon-persistence MCP
├── Global DB: ~/.config/opencode/persistence/global.db
└── Project DB: .pantheon/persistence/project.db
```

- **Global**: dados cross-projeto (cache de agentes, preferências)
- **Project**: dados específicos do projeto atual

## Tools (6)

### kv_store
Store a key-value pair with optional TTL.

`kv_store(namespace, key, value, ttl?, scope?)`
- `ttl`: seconds. null = forever
- `scope`: "project" (default) or "global"
- Returns `{"status": "stored", "namespace": ns, "key": k}`

### kv_get
Retrieve a value by namespace + key.

`kv_get(namespace, key, scope?)`
- Auto-filters expired entries (SQL-level)
- Returns value string or null

### kv_delete
Remove an entry.

`kv_delete(namespace, key, scope?)`
- Returns `{"status": "deleted"}` or `{"status": "not_found"}`

### kv_list
List entries in a namespace with optional prefix filter.

`kv_list(namespace, prefix?, scope?, limit?)`
- Returns array of `{key, value, created_at, expires_at}`
- Respects TTL (expired items not returned)

### kv_search
Full-text search across all namespaces using SQLite FTS5.

`kv_search(query, namespace?, scope?, limit?)`
- BM25-ranked results
- Terms are sanitized and quoted for injection safety
- Returns array of `{namespace, key, value, created_at, score}`

### purge_expired
Remove expired entries and rotate deletelog.

`purge_expired(scope?, dry_run?)`
- Soft-delete with deletelog audit trail
- dry_run previews without purging
- Deletelog rotates at 1MB (keeps last 3)

## TTL Lifecycle

```python
# Cache que expira em 1 hora
kv_store(namespace="cache-apollo", key="api-response", value="...", ttl=3600)

# Dado permanente (sobrescreve sem perder created_at)
kv_store(namespace="config", key="db-url", value="postgres://...")

# Busca: expirados são invisíveis automaticamente
result = kv_get(namespace="cache-apollo", key="api-response")  # None se expirou

# Limpeza manual (opcional — TTL já filtra na leitura)
purge_expired(scope="project")
```

## Naming Conventions

| Namespace | Purpose | TTL |
|-----------|---------|-----|
| `cache-{agent}` | Descobertas temporárias | 300-3600s |
| `session-{id}` | Estado de sessão | 7200s |
| `job-{id}` | Progresso de job | 86400s |
| `config` | Config persistente | null |
| `local-only` | Dados sensíveis | 3600s |

## Comparison with pantheon-memory

| Aspect | persistence (this) | memory |
|--------|-------------------|--------|
| Storage | SQLite KV | ChromaDB vector |
| Search | FTS5 (exato/keyword) | Cosine similarity (semântico) |
| TTL | ✅ Por entrada | ❌ Nenhum |
| Namespace | ✅ Coluna + scope | ✅ Session + category |
| Deploys | stdlib, 0 deps | chromadb + sentence-transformers |
| Startup | <0.5s | 3-8s |
| Tools | 6 | 14 |
| Lines | 449 | 1,344 |
