---
description: "Store or recall a memory interactively. /pantheon-remember <text> → stores it. /pantheon-remember recall <key> → retrieves it. Omitting args starts interactive mode. Usage: /pantheon-remember"
---
# /pantheon-remember — Memory Store & Recall

**What:** Stores a memory entry via `memory_store()` or recalls via `memory_recall()`. Interactive mode if no arguments.

## Usage

```
/pantheon-remember "Decisão: usar FastAPI em vez de Flask"         → Store (namespace: default)
/pantheon-remember "Decisão: ..." --namespace=decisions             → Store em namespace específico
/pantheon-remember recall "FastAPI decision"                        → Recall por key
/pantheon-remember recall "FastAPI decision" --namespace=decisions   → Recall em namespace
/pantheon-remember                                                   → Modo interativo (pergunta→store→pergunta recall)
```

## Behavior

### Store mode (default)
1. Chama `memory_store()` com o texto fornecido
2. Metadata: preenche `agent`, `type`, `timestamp` automaticamente
3. Pergunta: "Quer buscar algo relacionado? (y/n)"
   - `y` → `memory_recall()` com extração automática de keywords
   - `n` → fim

### Recall mode
1. Chama `memory_recall()` com a key fornecida
2. Se não achar, tenta `memory_search()` como fallback

### Interactive mode (no args)
1. "O que você quer armazenar?"
2. Recebe texto → `memory_store()`
3. "Quer buscar algo relacionado?"
4. Opcional: "Qual namespace?" (default: "default")

## Output

```
✅ Stored — id: 42 | namespace: decisions | key: auto-generated
📎 Related entries (memory_recall):
  - #1: "Decisão: usar FastAPI..." (score: 0.92)
```
