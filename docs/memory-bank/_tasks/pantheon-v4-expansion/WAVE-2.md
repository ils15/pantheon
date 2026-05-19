# Wave 2: Planning & Delegation Quality

> **Features:** Metis Gap Analysis, IntentGate, Task System, Review-Work Parallel
> **Objetivo:** Planos mais robustos, delegações mais precisas, review mais completo
> **Otimização:** Themis foca em semântica (hooks já fazem format/secrets), agent group defaults nos plans

---

## 🔍 Deduplicação Aplicada nesta Wave

| Item | Antes | Depois | Economia |
|------|-------|--------|----------|
| Themis format/secret/import checks | Duplicado com hooks | Removido do Themis (hooks são authoritative) | -15-20% review time |
| Security-audit em Hermes/Demeter | Implementadores com skill de auditor | Removido (só Themis usa `security-audit-pro`) | ~426 linhas |
| Agent group defaults nos plans | "fast agents → fast model" repetido 11x | Introduzido agent group defaults no schema | ~50 linhas |

---

## 📋 Tasks

### Task 2.1: Metis Gap Analysis

**Arquivos a criar:**
- `skills/metis-gap-analysis/SKILL.md`

**Conteúdo da skill:**
- Instruções para analisar plano gerado pelo Athena
- Checkpoints:
  - Hidden intentions? (o que o user quis mas não disse)
  - Ambiguities? (termos vagos, escopo não definido)
  - Missing acceptance criteria? (como saber que funcionou)
  - AI slop patterns? (over-engineering, scope creep)
  - Edge cases? (o que não foi coberto)
- Formato de output: Lista de gaps injetados no plano

**Integração:**
- Roda APÓS Athena gerar plano, ANTES de entregar ao user
- Não é agente separado — é skill do Athena

**Agente principal:** Athena

**Critério de sucesso:**
- Gaps identificados antes do user aprovar plano
- Planos mais robustos, menos ambiguidades
- ~200 tokens por análise

---

### Task 2.2: IntentGate

**Arquivos a criar:**
- (Hook only, no skill file needed)

**Hook a registrar:**
- `intent-gate` (PreToolUse — quando Zeus vai delegar via `task()`)

**Lógica:**
- Analisa mensagem do user antes de classificar/delegar
- Se intenção clara → delega
- Se intenção ambígua → pede clarificação com opções

**Agente principal:** Zeus

**Critério de sucesso:**
- Delegações ambíguas interceptadas
- User vê opções de clarificação
- Redução de ~40% em "agente fez coisa errada"

---

### Task 2.3: Task System

**Arquivos a criar:**
- `skills/task-system/SKILL.md`

**Diretório de storage:**
- `.pantheon/tasks/*.json`

**Schema do task:**
```json
{
  "id": "T-001",
  "subject": "Build frontend",
  "description": "...",
  "status": "pending",
  "blockedBy": [],
  "blocks": ["T-003"],
  "owner": "Aphrodite",
  "threadID": "session-abc"
}
```

**Conteúdo da skill:**
- Como criar tasks com dependencies
- Como tasks desbloqueiam automaticamente
- Como tasks sobrevivem restart
- Regra: 3+ tasks com dependencies → usa Task System, senão TodoWrite

**Agente principal:** Zeus, Mnemosyne

**Critério de sucesso:**
- Tasks criados com dependencies
- Paralelismo automático quando não bloqueado
- Tasks persistem em `.pantheon/tasks/`

---

### Task 2.4: Review-Work Parallel

**Arquivos a criar:**
- `skills/review-work/SKILL.md`

**Conteúdo da skill:**
- 5 checks paralelos:
  1. Goal verification (implementação bate com plano?)
  2. Code quality (SOLID, clean code, type hints)
  3. Security (OWASP Top 10, secrets, injection)
  4. QA (testes cobrem happy path + edge cases?)
  5. Context mining (missing file refs, undocumented decisions?)
- Como agregar resultados → APPROVED ou NEEDS_REVISION

**Agente principal:** Themis

**Critério de sucesso:**
- 5 checks rodam em paralelo
- Review 3x mais rápido
- Cobertura 5x mais ampla

---

## ✅ Checklist de Validação

- [ ] Metis: Skill criada e funcional
- [ ] Metis: Gaps identificados antes de aprovação
- [ ] Metis: Planos mais robustos
- [ ] IntentGate: Hook registra pré-delegação
- [ ] IntentGate: Ambiguidades interceptadas
- [ ] IntentGate: Clarificação oferecida ao user
- [ ] Task System: Skill criada e funcional
- [ ] Task System: Tasks com dependencies
- [ ] Task System: Paralelismo automático
- [ ] Task System: Persistência em JSON
- [ ] Review-Work: Skill criada e funcional
- [ ] Review-Work: 5 checks paralelos
- [ ] Review-Work: Agregação de resultados

---

## 📦 Artefatos Gerados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `skills/metis-gap-analysis/SKILL.md` | Skill | Gap analysis de planos |
| `skills/task-system/SKILL.md` | Skill | Tasks file-backed com dependencies |
| `skills/review-work/SKILL.md` | Skill | 5 checks paralelos de review |
| `hooks/intent-gate` | Hook | Verifica intenção antes de delegar |

---

## 🎯 Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Retrabalho por plano ambíguo | -67% |
| Erros de delegação | -60% |
| Review coverage | +67% |
| Tempo de review | -66% (paralelo) |
| Linhas duplicadas removidas | ~476 linhas |
| Themis review time | -15-20% |
