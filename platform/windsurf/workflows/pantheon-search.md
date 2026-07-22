---
description: "Search memories by text with optional namespace filter, category, and result limit. /pantheon-search <query> --namespace=<ns> --top=<N> --stats. Usage: /pantheon-search"
---
# /pantheon-search — Memory Search

**What:** Searches memory entries via `memory_search()` with hybrid vector + keyword (RRF fusion). Supports namespace filter, result limit, and stats view.

## Usage

```
/pantheon-search "FastAPI performance"                             → Busca em todos os namespaces
/pantheon-search "FastAPI" --namespace=decisions                    → Busca só em decisions
/pantheon-search "bug pattern" --namespace=sessions --top=10        → 10 resultados
/pantheon-search --stats                                            → memory_stats() completo
/pantheon-search --stats --namespace=decisions                       → Stats por namespace
```

## Flags

| Flag | Default | Descrição |
|------|---------|-----------|
| `--namespace=<ns>` | `all` | Filtrar por namespace específico |
| `--top=<N>` | `5` | Número de resultados (max 50) |
| `--stats` | off | Mostrar estatísticas em vez de buscar |

## Output (search)

```
🔍 Memory Search: "FastAPI performance"

Results (namespace: all):
  #1 │ decisions │ "Decisão: usar FastAPI..." │ score: 0.89 │ 2026-07-20
  #2 │ repo      │ "FastAPI async patterns"  │ score: 0.74 │ 2026-07-18
  #3 │ sessions  │ "FastAPI migration done"  │ score: 0.61 │ 2026-07-15

Found 3 results in 2 namespaces (0.23s)
```

## Output (stats)

```
📊 Memory Stats
Total entries: 142
Namespaces: decisions (58), sessions (44), repo (28), default (12)
Vector entries: 142
DB size: 1.2 MB
```
