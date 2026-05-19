# Wave 1: Core Robustness

> **Features:** Relentless Mode, Wisdom Accumulation, Comment Checker, Write-Existing-File Guard
> **Objetivo:** Maior impacto imediato na robustez e UX do Pantheon
> **Otimização:** Anti-rationalization table extraída, artifact protocol deduplicado, hooks vazios removidos

---

## 🔍 Deduplicação Aplicada nesta Wave

| Item | Antes | Depois | Economia |
|------|-------|--------|----------|
| Anti-rationalization table | Copiada em Hermes/Aphrodite/Demeter | Extraída para `tdd-with-agents` skill | ~54 linhas |
| Artifact protocol inline | 5 agentes com regras duplicadas | Referência única a `artifact-protocol.instructions.md` | ~50 linhas |
| Empty hook boilerplate | `hooks: []` em 18 agentes | Removido de todos os agentes | ~90 linhas |

---

## 📋 Tasks

### Task 1.1: Relentless Mode

**Arquivos a criar:**
- `skills/relentless-mode/SKILL.md`

**Conteúdo da skill:**
- Instruções para loop auto-referencial até `<promise>DONE</promise>`
- Detecção de idle + todos incompletos
- System reminder injection quando agente para
- Configuração: `maxIterations` (default 100), `cooldownMs` (default 3000)

**Comando:**
- `/relentless-mode "descrição da task"`

**Hook a registrar:**
- `relentless-mode` (Event + Message)

**Agente principal:** Zeus

**Critério de sucesso:**
- Agente continua trabalhando até DONE ou maxIterations
- User pode cancelar com Esc×2
- System reminder injetado corretamente quando idle

---

### Task 1.2: Wisdom Accumulation

**Arquivos a criar:**
- `skills/wisdom-accumulation/SKILL.md`

**Diretório de storage:**
- `.pantheon/learnings/<feature>/learnings.md`

**Conteúdo da skill:**
- Instruções para extrair learnings após cada wave
- Formato: Conventions, Successes, Failures, Gotchas, Commands
- Como Zeus injeta learnings no próximo wave

**Hook a registrar:**
- `wisdom-accumulator` (PostToolUse)

**Agente principal:** Zeus

**Critério de sucesso:**
- Learnings extraídos após cada wave
- Learnings injetados no próximo wave
- Learnings deletados após merge da feature

---

### Task 1.3: Comment Checker

**Arquivos a criar:**
- `skills/ai-slop-remover/SKILL.md`

**Conteúdo da skill:**
- Padrões de AI slop para detectar:
  - `# This function...` (verbose comments)
  - `# Handle edge cases` (redundant error handling comments)
  - `# In this implementation...` (AI filler)
  - Over-engineered patterns
- Bypass: `# @allow` para linha, `# comment-checker-disable-file` para arquivo

**Hook a registrar:**
- `comment-checker` (PostToolUse)

**Agentes afetados:** Hermes, Aphrodite, Demeter, Talos

**Critério de sucesso:**
- Comentários slop detectados e flagged
- Comentários limpos passam sem warning
- Bypass funciona corretamente

---

### Task 1.4: Write-Existing-File Guard

**Arquivos a criar:**
- (Hook only, no skill file needed)

**Hook a registrar:**
- `write-existing-file-guard` (PreToolUse)

**Lógica:**
- Track: Arquivos lidos na sessão (set de paths)
- Quando agente tenta `write` em arquivo existente:
  - Se path está no set de lidos → permite
  - Se path NÃO está no set → bloqueia + injeta warning

**Agentes afetados:** Hermes, Aphrodite, Demeter, Talos

**Critério de sucesso:**
- Write em arquivo não-lido é bloqueado
- Write em arquivo lido é permitido
- Write em arquivo novo é permitido

---

## ✅ Checklist de Validação

- [ ] Relentless Mode: Skill criada e funcional
- [ ] Relentless Mode: Hook registra idle detection
- [ ] Relentless Mode: System reminder injetado corretamente
- [ ] Wisdom: Skill criada e funcional
- [ ] Wisdom: Hook extrai learnings pós-wave
- [ ] Wisdom: Learnings injetados no próximo wave
- [ ] Comment Checker: Skill criada e funcional
- [ ] Comment Checker: Hook detecta AI slop
- [ ] Comment Checker: Bypass funciona
- [ ] Write Guard: Hook registra arquivos lidos
- [ ] Write Guard: Bloqueia write sem read
- [ ] Write Guard: Permite write com read

---

## 📦 Artefatos Gerados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `skills/relentless-mode/SKILL.md` | Skill | Loop auto-referencial até DONE |
| `skills/wisdom-accumulation/SKILL.md` | Skill | Extração de learnings entre waves |
| `skills/ai-slop-remover/SKILL.md` | Skill | Detecção de AI slop em comentários |
| `hooks/relentless-mode` | Hook | Detecta idle + injeta reminder |
| `hooks/wisdom-accumulator` | Hook | Extrai learnings pós-wave |
| `hooks/comment-checker` | Hook | Detecta AI slop em comentários |
| `hooks/write-existing-file-guard` | Hook | Previne overwrite sem read |

---

## 🎯 Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Tasks completas sem intervenção | +50% |
| AI slop em comentários | -87% |
| Overwrites acidentais | -100% |
| Token overhead por sessão | <1000 tokens (otimizado) |
| Linhas duplicadas removidas | ~194 linhas |
