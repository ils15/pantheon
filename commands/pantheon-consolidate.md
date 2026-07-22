---
description: "Find and merge duplicate or similar memory entries. /pantheon-consolidate scans for duplicates, shows preview, and merges on confirm. --auto skips confirmation. Usage: /pantheon-consolidate"
agent: "zeus"
---
# /pantheon-consolidate — Memory Consolidation

**What:** Finds similar/duplicate memory entries within a namespace using prefix grouping + Jaccard similarity, then merges them into a single entry. Reduces noise and improves search quality.

## Usage

```
/pantheon-consolidate                              → Scan todos namespaces, modo interativo
/pantheon-consolidate --namespace=decisions         → Só decisions namespace
/pantheon-consolidate --namespace=sessions --auto   → Merge automático (sem confirmar)
/pantheon-consolidate --dry-run                     → Preview sem modificar nada
```

## Flags

| Flag | Default | Descrição |
|------|---------|-----------|
| `--namespace=<ns>` | `all` | Namespace específico |
| `--auto` | off | Merge sem confirmação |
| `--dry-run` | off | Preview sem modificar |
| `--similarity=<0-1>` | `0.7` | Threshold de similaridade Jaccard |

## How It Works

1. `memory_list()` → obtém entradas do namespace
2. Agrupa por prefixo de key (até primeiro `/` ou `-`)
3. Calcula similaridade Jaccard entre valores do mesmo grupo
4. Se >= threshold → candidato a merge
5. Modo interativo: mostra cada grupo e pergunta "Merge? (y/n)"
6. Auto: substitui N entradas por 1 entrada consolidada
7. Entradas originais são deletadas via `memory_forget()`

## Output

```
🧹 Memory Consolidation — namespace: decisions

Group: "FastAPI"
  [1] "Decisão: usar FastAPI..." (2026-07-20)
  [2] "FastAPI async patterns..." (2026-07-18)
  [3] "FastAPI migration..." (2026-07-15)
  Similarity: 0.82 ✅ → Merge candidate

Merge into: "Decisões sobre FastAPI: async patterns, migração concluída, preferência sobre Flask."
(y/n): y  ✅ Merged (3 → 1)

Summary: 3 groups scanned, 2 merges performed, 5 entries → 3 entries
```
