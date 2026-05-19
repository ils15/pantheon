# Wave 3: Session & Context Management

> **Features:** /handoff, /init-deep, Directory Context Injection
> **Objetivo:** Gestão de sessão e contexto mais inteligente
> **Otimização:** Memory Bank read deduplication, Apollo discovery cache

---

## 🔍 Deduplicação Aplicada nesta Wave

| Item | Antes | Depois | Economia |
|------|-------|--------|----------|
| Memory Bank reads | 3-5x por sessão | 1x (first reader injeta no context) | -60-80% input tokens |
| Apollo discovery em DAG waves | Cada agente busca independentemente | Cache por sessão (keyed by search hash) | -30-50% discovery tokens |
| Handoff template inconsistency | Falta `__themis` em 3 plan files | Adicionado em todos os plans | Qualidade consistente |

---

## 📋 Tasks

### Task 3.1: /handoff

**Arquivos a criar:**
- `skills/handoff/SKILL.md`

**Comando:**
- `/handoff`

**Conteúdo da skill:**
- Formato do handoff:
  - Estado Atual
  - O que foi feito
  - O que falta
  - Decisões importantes
  - Arquivos relevantes
- Como Mnemosyne gera o resumo
- Como nova sessão usa o handoff

**Agente principal:** Mnemosyne

**Critério de sucesso:**
- Handoff gerado com todas as seções
- Nova sessão retoma work sem perder contexto
- ~500 tokens por handoff

---

### Task 3.2: /init-deep

**Arquivos a criar:**
- `skills/init-deep/SKILL.md`

**Comando:**
- `/init-deep [--max-depth=3]`

**Conteúdo da skill:**
- Como gerar AGENTS.md hierárquicos por diretório
- Walk-up tree: AGENTS.md em cada nível
- Formato do AGENTS.md por diretório

**Agente principal:** Athena

**Critério de sucesso:**
- AGENTS.md gerados em todos os diretórios
- Contexto preciso por diretório
- Zero token waste

---

### Task 3.3: Directory Context Injection

**Arquivos a criar:**
- (Hook only, no skill file needed)

**Hook a registrar:**
- `directory-agents-injector` (PreToolUse + PostToolUse)

**Lógica:**
- Quando agente lê arquivo:
  - Walk up directory tree
  - Coleta todos AGENTS.md encontrados
  - Injeta no contexto

**Agentes afetados:** Todos

**Critério de sucesso:**
- Contexto do diretório injetado automaticamente
- ~100 tokens extras por read
- Zero configuração manual

---

## ✅ Checklist de Validação

- [ ] Handoff: Skill criada e funcional
- [ ] Handoff: Comando /handoff funciona
- [ ] Handoff: Nova sessão retoma work
- [ ] Init-deep: Skill criada e funcional
- [ ] Init-deep: Comando /init-deep funciona
- [ ] Init-deep: AGENTS.md gerados hierarquicamente
- [ ] Directory Injection: Hook registra walk-up tree
- [ ] Directory Injection: Contexto injetado automaticamente
- [ ] Directory Injection: Zero configuração manual

---

## 📦 Artefatos Gerados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `skills/handoff/SKILL.md` | Skill | Resumo de sessão para nova sessão |
| `skills/init-deep/SKILL.md` | Skill | AGENTS.md hierárquicos por diretório |
| `hooks/directory-agents-injector` | Hook | Auto-injeta AGENTS.md + README.md |

---

## 🎯 Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Perda de contexto ao reiniciar | -100% |
| Token waste com contexto irrelevante | -80% |
| Tempo de setup de nova sessão | -50% |
| Memory Bank reads por sessão | -60-80% |
| Apollo discovery tokens | -30-50% |
