---
description: "Compress old memory entries into summarized form. /pantheon-forget lists entries older than N days, then replaces them with a compressed summary. --auto applies without confirmation. Usage: /pantheon-forget"
---
# /pantheon-forget — Memory Range Compression

**What:** Applies range compression to old memory entries — groups entries by time period and namespace, generates a concise summary via fast LLM, replaces N raw entries with 1 summary. Companion to memory_consolidate (merge) vs memory_forget (compress).

## Usage

```
/pantheon-forget                                    → Lista candidatas (7+ dias, modo interativo)
/pantheon-forget --days=30                          → Só entradas com 30+ dias
/pantheon-forget --namespace=sessions               → Namespace específico
/pantheon-forget --namespace=sessions --days=14     Combinado
/pantheon-forget --auto                             → Comprime sem confirmação
/pantheon-forget --auto --days=30 --compress         → Agressivo: 30+ dias + comprimir em 1 arquivo
/pantheon-forget --dry-run                          → Preview sem modificar
```

## Flags

| Flag | Default | Descrição |
|------|---------|-----------|
| `--days=<N>` | `7` | Idade mínima em dias |
| `--namespace=<ns>` | `all` | Namespace específico |
| `--auto` | off | Comprimir sem confirmação |
| `--dry-run` | off | Preview sem modificar |
| `--compress` | off | Comprimir tudo em 1 único entry (modo agressivo) |

## How It Works

1. `memory_list()` → obtém entradas, filtra por idade
2. Agrupa por namespace + mês
3. Cada grupo: envia para LLM fast com prompt:
   ```
   Summarize these N memory entries into 2-3 sentences:
   [entries...]
   ```
4. Substitui grupo por entry único com key `compressed:<namespace>:<YYYY-MM>`
5. Entradas originais são deletadas via `memory_forget()`

## Output

```
🗜️ Memory Range Compression

Group: sessions · 2026-06 (15 entries · 1.2K tokens)
  → "Sessões de junho focadas em migração FastAPI, ajustes de rota e correção de testes."
  → Compressed: 15 → 1 entry ✅

Group: decisions · 2026-05 (8 entries · 640 tokens)
  → "Decisões de maio sobre arquitetura: monorepo mantido, SQLAlchemy 2.0 como padrão."
  → Compressed: 8 → 1 entry ✅

Summary: 2 groups compressed, 23 entries → 2 entries (-91%)
Tokens saved: ~1.8K
```
