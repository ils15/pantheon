# Wave 5: Infrastructure & Polish

> **Features:** Session Recovery, File-Based Prompts, Category-Based Routing, Auto-Update Checker, Hash-Anchored Edits
> **Objetivo:** Infraestrutura, polish e otimizações finais
> **Otimização:** Context7 MCP cache, copilot-free plan fix, simplify skill reduzida (linters já cuidam)

---

## 🔍 Deduplicação Aplicada nesta Wave

| Item | Antes | Depois | Economia |
|------|-------|--------|----------|
| Context7 MCP response | Chamada externa repetida por sessão | Cache por sessão (keyed by libraryId + query) | -5-10% external calls |
| Copilot-free plan cost leak | Zeus/Themis usando premium models no pool gratuito | Removido override → usa modelo gratuito | Previne cost leak |
| Simplify skill | Incluía dead code detection (linters já fazem) | Reduzida para structural changes only | Skill mais focada |
| Category Routing vs Tier System | Potencial confusão entre os dois | Documentado: tier = por agente, category = por tipo de task | Zero duplicação |

---

## 📋 Tasks

### Task 5.1: Session Recovery Patterns

**Arquivos a criar:**
- `skills/session-recovery/SKILL.md`

**Hooks a registrar:**
- `session-recovery` (Event) — recupera de missing tool results
- `thinking-block-validator` (Transform) — previne thinking block errors
- `json-error-recovery` (PostToolUse) — recupera de JSON parse errors

**Conteúdo da skill:**
- Padrões de recovery para erros comuns
- Como hooks recuperam automaticamente
- Quando recovery falha (fallback para user)

**Agentes afetados:** Todos

**Critério de sucesso:**
- Sessão não quebra por erros recuperáveis
- User vê resultado, não o erro
- ~50 tokens por recovery check

---

### Task 5.2: File-Based Prompts

**Arquivos a criar:**
- `skills/file-prompts/SKILL.md` (documentação)

**Conteúdo da skill:**
- Como usar `file://` URLs em prompts de agentes
- Suporte a `~` expansion e relative paths
- Como versionar prompts separadamente do config

**Agentes afetados:** Todos

**Critério de sucesso:**
- Prompts carregados de arquivos externos
- Version control separado para prompts
- Zero token overhead

---

### Task 5.3: Category-Based Routing

**Arquivos a criar:**
- `skills/category-routing/SKILL.md`

**Categorias:**
- `deep` → Problemas complexos (GPT-5.5 medium)
- `quick` → Mudanças simples (GPT-5.4-mini)
- `visual-engineering` → Frontend/UI (Gemini)
- `ultrabrain` → Arquitetura complexa (GPT-5.5 xhigh)

**Conteúdo da skill:**
- Como Zeus roteia por categoria
- Como categoria mapeia para modelo
- Como configurar categorias customizadas

**Agente principal:** Zeus

**Critério de sucesso:**
- Modelo certo pra task certa, automaticamente
- Zero config manual de modelo
- ~50 tokens por routing decision

**Deduplicação:**
- Complementar a `platform/plans/` tier system
- Tier system = qual modelo por agente
- Category routing = qual modelo por tipo de task

---

### Task 5.4: Auto-Update Checker

**Arquivos a criar:**
- (Hook only, no skill file needed)

**Hook a registrar:**
- `auto-update-checker` (Event)

**Lógica:**
- No startup da sessão:
  - Compara versão local com latest release no GitHub
  - Se update disponível → injeta toast notification

**Agentes afetados:** Todos

**Critério de sucesso:**
- User notificado quando update disponível
- ~100 tokens por check (uma vez por sessão)
- Sempre atualizado

---

### Task 5.5: Hash-Anchored Edits

**Arquivos a criar:**
- `skills/hashline-edits/SKILL.md`

**Conteúdo da skill:**
- Como funciona hash-anchored edits (`LINE#ID`)
- Como hash é injetado no read
- Como edit referencia hash
- Como hash mismatch é detectado e rejeitado

**Agentes afetados:** Hermes, Aphrodite, Demeter

**Critério de sucesso:**
- 6.7% → 68.3% success rate em edits
- Zero corrupção de arquivo por stale lines
- ~200 tokens por read (hash injection)

**Deduplicação:**
- Complementa Write-Existing-File Guard
- Write Guard = previne overwrite
- Hashline = previne stale edit

---

## ✅ Checklist de Validação

- [ ] Session Recovery: Skill criada e funcional
- [ ] Session Recovery: Hooks registram recovery
- [ ] Session Recovery: Erros recuperados automaticamente
- [ ] File Prompts: Skill criada e funcional
- [ ] File Prompts: file:// URLs funcionam
- [ ] File Prompts: ~ expansion funciona
- [ ] Category Routing: Skill criada e funcional
- [ ] Category Routing: Roteamento por categoria funciona
- [ ] Category Routing: Modelo certo pra task certa
- [ ] Auto-Update: Hook registra startup check
- [ ] Auto-Update: Notificação injetada quando update disponível
- [ ] Hashline Edits: Skill criada e funcional
- [ ] Hashline Edits: Hash injection no read
- [ ] Hashline Edits: Hash validation no edit
- [ ] Hashline Edits: Stale edit rejeitado

---

## 📦 Artefatos Gerados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `skills/session-recovery/SKILL.md` | Skill | Recovery de erros comuns |
| `skills/file-prompts/SKILL.md` | Skill | File-based prompts |
| `skills/category-routing/SKILL.md` | Skill | Semantic delegation por categoria |
| `skills/hashline-edits/SKILL.md` | Skill | Hash-anchored edit validation |
| `hooks/session-recovery` | Hook | Recovery de missing tool results |
| `hooks/thinking-block-validator` | Hook | Previne thinking block errors |
| `hooks/json-error-recovery` | Hook | Recovery de JSON parse errors |
| `hooks/auto-update-checker` | Hook | Verifica versão no startup |

---

## 🎯 Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Sessão quebrada por erros recuperáveis | -90% |
| Edit success rate | +40% |
| Modelo correto por task | 100% |
| Token overhead total | <2000/session (otimizado) |
| External calls (Context7) | -5-10% |
| Copilot-free cost leak | 0 (fixado) |
