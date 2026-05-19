# Plano de Implementação — Pantheon v4.0: Agentes Existentes Expandidos

> **Data:** 2026-05-19
> **Status:** Aguardando aprovação
> **Princípio:** Zero novos agentes. Tudo integrado como skills, hooks e comandos nos 18 existentes.
> **Otimização:** Deduplicação e caching aplicados em todas as fases (Agora synthesis: 5 especialistas).

---

## 📖 Conceitos Fundamentais

### O que é um HOOK

**Hook** = interceptador automático que roda em eventos do ciclo de vida do agente. O agente **não invoca** — o sistema dispara sozinho.

| Tipo | Quando dispara | Pode |
|------|----------------|------|
| **PreToolUse** | Antes de usar ferramenta | Bloquear, modificar input, injetar contexto |
| **PostToolUse** | Depois de usar ferramenta | Adicionar warnings, modificar output, injetar mensagens |
| **Message** | Durante processamento de mensagem | Transformar conteúdo, detectar keywords, ativar modos |
| **Event** | Mudanças no ciclo de vida da sessão | Recovery, fallback, notificações |

**Exemplo real:** `write-existing-file-guard` (PreToolUse)
```
Agente tenta: write("src/auth.py", "...")
Hook dispara ANTES → verifica: "src/auth.py" foi lido nesta sessão?
  ├─ SIM → permite
  └─ NÃO → bloqueia + injeta: "⚠️ Read the file first before overwriting"
```

**Custo:** Zero tokens quando não dispara. ~50-200 tokens quando dispara.

---

### O que é uma SKILL

**Skill** = conjunto de instruções + contexto + MCPs opcionais que o agente **carrega sob demanda**. Só existe no contexto quando invocada.

**Estrutura de uma skill:**
```
skills/<nome>/
├── SKILL.md          ← Instruções especializadas (injetado no system prompt)
└── (opcional) scripts/  ← Scripts de apoio
```

**Exemplo real:** `security-audit-pro`
```
Agente: "Preciso auditar segurança deste endpoint"
Agente carrega skill: security-audit-pro
→ SKILL.md é injetado no system prompt
→ Agente agora sabe: OWASP Top 10, SAST patterns, SCA scan, container security
→ Quando termina, skill sai do contexto (zero custo residual)
```

**Custo:** ~500-2000 tokens enquanto ativa. Zero quando não usada.

---

### O que é um SUBAGENTE

**Subagente** = agente invocado via `task()` ou delegação do Zeus. Roda em contexto isolado, retorna resultado estruturado.

**Hierarquia atual:**
```
Zeus (orchestrator)
  └─ Athena (planner)
      └─ Apollo (discovery)
  └─ Hermes (backend)
      └─ Apollo (nested discovery)
  └─ Aphrodite (frontend)
      └─ Apollo (nested discovery)
```

---

## 🗺️ Mapa Completo de Implementação

---

### FASE 1: Core Robustness (4 features — maior impacto imediato)

---

#### 1. Relentless Mode

**O que é:** Loop auto-referencial que mantém o agente trabalhando até detectar `<promise>DONE</promise>`. Não para no meio.

**Como implementar:**
- Arquivo: `skills/relentless-mode/SKILL.md`
- Comando: `/relentless-mode "descrição da task"`
- Hook: `relentless-mode` (Event + Message) — detecta quando agente para sem DONE
- Config: `maxIterations: 100` (default), configurável

**Fluxo:**
```
User: /relentless-mode "Implement JWT auth"
  ↓
Zeus ativa relentless-mode mode
  ↓
Zeus trabalha → para sem completar
  ↓
Hook detecta: agente idle + todos incompletos + sem DONE tag
  ↓
Hook injeta: "[SYSTEM REMINDER] You have incomplete todos — continue"
  ↓
Zeus retoma → repete até DONE ou maxIterations
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Zeus** | Auto-continue sem intervenção manual | — |
| **Hermes** | Pode ser invocado com relentless-mode para tasks complexas | — |
| **Apollo** | — | — |

**Impacto no Pantheon:**
- Elimina "agente parou no meio" — problema #1 de UX
- Reduz interações do user em ~40% para tasks complexas

**Performance:**
- Custo: ~100 tokens por iteração extra (system reminder)
- Benefício: 2-3x mais tasks completas sem intervenção

**Deduplicação:**
- Já temos `auto-continue` skill → Relentless Mode é a versão **agressiva** (não para até DONE)
- Todo-continuation = "continue se tem todos pendentes"
- Relentless Mode = "continue até DONE explícito, injeta reminder se parar"
- **Compartilham** a mesma detecção de idle, mas Relentless Mode tem loop explícito

---

#### 2. Wisdom Accumulation

**O que é:** Após cada wave de implementação, extrai learnings (conventions, successes, failures, gotchas, commands) e passa para o próximo wave.

**Como implementar:**
- Arquivo: `skills/wisdom-accumulation/SKILL.md` (instruções para extrair learnings)
- Storage: `.pantheon/learnings/<feature>/learnings.md`
- Hook: `wisdom-accumulator` (PostToolUse) — extrai learnings quando agente completa task
- Zeus injeta learnings no prompt do próximo wave

**Formato do learnings.md:**
```markdown
# Learnings: Feature X

## Conventions
- Use async/await em todos os I/O
- Validação com Pydantic v2

## Successes
- Repository pattern funcionou bem com SQLAlchemy 2.0

## Failures
- Não usar session.commit() em async — usar await session.flush()

## Gotchas
- O endpoint /users tem rate limit de 100 req/min

## Commands
- Test runner: `pytest tests/ -v --cov=src`
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Zeus** | Passa learnings entre waves automaticamente | — |
| **Hermes** | Recebe learnings do wave anterior (ex: "não use session.commit()") | — |
| **Aphrodite** | Recebe learnings de Hermes (ex: "API retorna snake_case") | — |
| **Demeter** | Contribui learnings de migrações | — |

**Impacto no Pantheon:**
- Elimina repetição de erros entre waves
- Padrões ficam consistentes entre backend/frontend/db
- Reduz "agente não sabia que..." em ~60%

**Performance:**
- Custo: ~300 tokens por learnings.md (injetado no próximo wave)
- Benefício: Evita 1-2 iterações de correção por wave

**Deduplicação:**
- Já temos `/memories/repo/` (fatos permanentes) e `docs/memory-bank/` (decisões)
- Wisdom é **temporário** — dura só a feature, não polui memória permanente
- **Não duplica** — é scoped à feature, deletado após merge

---

#### 3. Comment Checker

**O que é:** Hook pós-edit que detecta e bloqueia AI slop em comentários.

**Como implementar:**
- Arquivo: `skills/ai-slop-remover/SKILL.md` (instruções de detecção)
- Hook: `comment-checker` (PostToolUse) — roda após edit/write
- Detecta padrões:
  - `# This function...` (verbose comments)
  - `# Handle edge cases` (redundant error handling comments)
  - `# In this implementation...` (AI filler)
  - Over-engineered patterns (excessiva abstração)

**Fluxo:**
```
Agente edita arquivo → adiciona comentário
  ↓
Hook PostToolUse dispara
  ↓
Analisa comentário contra padrões de AI slop
  ├─ LIMPO → permite
  └─ SLOP DETECTADO → injeta warning:
      "⚠️ Comment flagged as AI slop: 'This function handles...'
       Replace with: 'Hash and verify user password.'"
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Hermes** | Comentários mais limpos, estilo senior dev | Perde liberdade de escrever comentários verbose |
| **Aphrodite** | JSDoc/TSDoc mais concisos | — |
| **Demeter** | Migration comments mais diretos | — |
| **Talos** | Hotfixes com comentários limpos | — |

**Impacto no Pantheon:**
- Código lê como senior escreveu, não AI
- Reduz "AI smell" em code reviews
- Bypass: `# @allow` para linha, `# comment-checker-disable-file` para arquivo

**Performance:**
- Custo: ~50 tokens por análise (grep-based, não LLM)
- Benefício: Zero custo de review de comentários slop

**Deduplicação:**
- Não duplica nada existente
- Complementa Themis (que foca em segurança/cobertura, não estilo de comentários)

---

#### 4. Write-Existing-File Guard

**O que é:** Hook PreToolUse que previne overwrite de arquivo sem ler primeiro.

**Como implementar:**
- Hook: `write-existing-file-guard` (PreToolUse)
- Track: Arquivos lidos na sessão (set de paths)
- Quando agente tenta `write` em arquivo existente:
  - Se path está no set de lidos → permite
  - Se path NÃO está no set → bloqueia + injeta: "⚠️ Read the file before overwriting"

**Fluxo:**
```
Agente: write("src/auth.py", "novo conteúdo...")
  ↓
Hook PreToolUse dispara
  ↓
Verifica: "src/auth.py" foi lido nesta sessão?
  ├─ SIM (read("src/auth.py") foi chamado) → permite
  └─ NÃO → bloqueia:
      "⚠️ Cannot overwrite src/auth.py — read it first to preserve context"
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Hermes** | Previne perder código existente | Precisa ler antes de editar (1 tool call extra) |
| **Aphrodite** | Previne sobrescrever componentes | — |
| **Demeter** | Previne perder migrations existentes | — |
| **Talos** | Previne hotfixes destrutivos | Precisa ler antes de editar |

**Impacto no Pantheon:**
- Elimina "agente sobrescreveu arquivo e perdeu código" — bug #2 de UX
- Zero falsos positivos (só bloqueia se arquivo existe E não foi lido)

**Performance:**
- Custo: ~10 tokens por check (set lookup)
- Benefício: Previne perda de código (custo de recovery: ~5000+ tokens)

**Deduplicação:**
- Não duplica nada existente
- Complementa o workflow TDD (que já exige entender código antes de mudar)

---

### FASE 2: Planning & Delegation Quality (4 features)

---

#### 5. Metis Gap Analysis

**O que é:** Sub-step do Athena que analisa o plano antes de entregar — catch hidden intentions, ambiguities, missing acceptance criteria.

**Como implementar:**
- Arquivo: `skills/metis-gap-analysis/SKILL.md`
- Integrado no fluxo do Athena (não é agente separado)
- Roda APÓS Athena gerar plano, ANTES de entregar ao user

**Fluxo:**
```
Athena gera plano
  ↓
Metis (skill) analisa plano:
  ├─ Hidden intentions? (o que o user quis mas não disse)
  ├─ Ambiguities? (termos vagos, escopo não definido)
  ├─ Missing acceptance criteria? (como saber que funcionou)
  ├─ AI slop patterns? (over-engineering, scope creep)
  └─ Edge cases? (o que não foi coberto)
  ↓
Se encontrou gaps → injeta no plano:
  "⚠️ Gaps identificados:
   - Escopo não define se inclui mobile
   - Falta critério de performance
   - Não especifica rollback strategy"
  ↓
Athena revisa plano com gaps → entrega ao user
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Athena** | Planos mais robustos, menos ambiguidades | 1 step extra no workflow (~200 tokens) |
| **Zeus** | Recebe planos mais claros para executar | — |

**Impacto no Pantheon:**
- Reduz "plano não cobriu X" em ~50%
- User vê gaps antes de aprovar, não depois

**Performance:**
- Custo: ~200 tokens por análise (skill injetada, não agente separado)
- Benefício: Evita 1-2 iterações de re-planejamento

**Deduplicação:**
- Já temos Momus no OMO → aqui é skill do Athena, não agente separado
- **Não duplica** Momus — é o mesmo conceito, implementado como skill

---

#### 6. IntentGate

**O que é:** Hook pré-delegação do Zeus que verifica se entendeu a intenção real antes de rotear.

**Como implementar:**
- Hook: `intent-gate` (PreToolUse — quando Zeus vai delegar via `task()`)
- Analisa a mensagem do user antes de classificar/delegar
- Se intenção ambígua → pede clarificação antes de delegar

**Fluxo:**
```
User: "Melhora a performance do endpoint"
  ↓
Zeus vai delegar para Hermes
  ↓
IntentGate dispara:
  ├─ Intenção clara? → SIM → delega
  └─ Intenção ambígua? → NÃO → injeta:
      "⚠️ Intenção ambígua. Você quer:
       1. Otimizar queries DB?
       2. Adicionar caching?
       3. Reduzir payload?
       4. Parallelizar processamento?"
  ↓
User responde → Zeus delega com intenção clara
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Zeus** | Delegações mais precisas, menos retrabalho | 1 verificação extra antes de delegar |
| **Todos** | Recebem tasks com escopo claro | — |

**Impacto no Pantheon:**
- Reduz "agente fez coisa errada" em ~40%
- User vê ambiguidades antes, não depois

**Performance:**
- Custo: ~100 tokens por verificação
- Benefício: Evita delegação errada (custo de correção: ~2000+ tokens)

**Deduplicação:**
- Não duplica nada existente
- Complementa o pause point de planning approval

---

#### 7. Task System

**O que é:** Tasks file-backed com dependencies (`blockedBy`/`blocks`), sobrevivem restart.

**Como implementar:**
- Arquivo: `skills/task-system/SKILL.md`
- Storage: `.pantheon/tasks/*.json`
- Schema:
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

**Fluxo:**
```
Zeus cria tasks com dependencies:
  T-001: Build frontend (blockedBy: [])
  T-002: Build backend (blockedBy: [])
  T-003: Integration tests (blockedBy: [T-001, T-002])
  ↓
T-001 e T-002 rodam em paralelo
  ↓
Quando ambos completam → T-003 desbloqueia automaticamente
  ↓
Tasks persistem em .pantheon/tasks/ → sobrevivem restart
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Zeus** | Tasks com dependencies, paralelismo automático | — |
| **Hermes** | Sabe quando está bloqueado por outro agent | — |
| **Aphrodite** | Sabe quando pode começar | — |

**Impacto no Pantheon:**
- Substitui TodoWrite para work complexo
- DAG execution mais explícito e rastreável
- Sobrevive restart de sessão

**Performance:**
- Custo: ~200 tokens por task (JSON file, não contexto)
- Benefício: Paralelismo automático, zero overhead de coordenação

**Deduplicação:**
- Já temos TodoWrite → Task System é para work com dependencies
- **Coexistem:** TodoWrite para simples, Task System para complexo
- Regra: 3+ tasks com dependencies → usa Task System

---

#### 8. Review-Work Parallel

**O que é:** Expande Themis para rodar 5 checks paralelos em vez de sequencial.

**Como implementar:**
- Arquivo: `skills/review-work/SKILL.md`
- Themis dispara 5 sub-checks em paralelo:
  1. Goal verification (implementação bate com plano?)
  2. Code quality (SOLID, clean code, type hints)
  3. Security (OWASP Top 10, secrets, injection)
  4. QA (testes cobrem happy path + edge cases?)
  5. Context mining (missing file refs, undocumented decisions?)

**Fluxo:**
```
Themis recebe código para review
  ↓
Dispara 5 checks em paralelo (subagents):
  ├─ Goal verification → "✅ Implementação bate com plano"
  ├─ Code quality → "⚠️ 2 funções sem type hints"
  ├─ Security → "✅ Sem secrets, sem SQL injection"
  ├─ QA → "⚠️ Falta teste para edge case X"
  └─ Context mining → "✅ Todos file refs documentados"
  ↓
Agrega resultados → APPROVED ou NEEDS_REVISION
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Themis** | Review mais completo, 5 dimensões paralelas | 5 subagent calls (mas paralelos, não sequenciais) |
| **Hermes** | Feedback mais detalhado | — |
| **Aphrodite** | Feedback mais detalhado | — |

**Impacto no Pantheon:**
- Review 3x mais rápido (paralelo vs sequencial)
- Cobertura de review 5x mais ampla

**Performance:**
- Custo: ~500 tokens por sub-check × 5 = ~2500 tokens (mas paralelos)
- Benefício: Detecta 5x mais issues no mesmo tempo

**Deduplicação:**
- Já temos Themis review → Review-Work é a versão **expandida**
- **Não duplica** — substitui o review sequencial atual

---

### FASE 3: Session & Context Management (3 features)

---

#### 9. /handoff

**O que é:** Comando para Mnemosyne gerar resumo estruturado de sessão para continuar em nova sessão.

**Como implementar:**
- Comando: `/handoff`
- Arquivo: `skills/handoff/SKILL.md`
- Mnemosyne gera:
```markdown
# Handoff: Feature X

## Estado Atual
- Wave 2 completo (backend + frontend mocks)
- Wave 3 pendente (integração real)

## O que foi feito
- POST /reviews endpoint (src/routes/reviews/post.py)
- ReviewCard component (src/components/ReviewCard.tsx)
- Migration: reviews table (alembic/versions/xxx.py)

## O que falta
- Conectar frontend à API real
- Integration tests
- Error handling para 404/500

## Decisões importantes
- Usar Redis para cache de reviews (TTL 5min)
- Paginação com cursor, não offset

## Arquivos relevantes
- src/routes/reviews/
- src/components/ReviewCard.tsx
- alembic/versions/xxx_reviews.py
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Mnemosyne** | Nova responsabilidade: gerar handoffs | — |
| **Zeus** | Pode retomar work em nova sessão sem perder contexto | — |

**Impacto no Pantheon:**
- Elimina "perdi contexto ao reiniciar sessão"
- Handoff é portátil — pode ser usado em qualquer sessão

**Performance:**
- Custo: ~500 tokens por handoff (gerado uma vez)
- Benefício: Economiza ~3000 tokens de re-explicação

**Deduplicação:**
- Não duplica nada existente
- Complementa memory bank (que é permanente, handoff é temporário)

---

#### 10. /init-deep

**O que é:** Skill que gera `AGENTS.md` hierárquicos por diretório.

**Como implementar:**
- Comando: `/init-deep [--max-depth=3]`
- Arquivo: `skills/init-deep/SKILL.md`
- Gera:
```
project/
├── AGENTS.md              # Contexto do projeto inteiro
├── src/
│   ├── AGENTS.md          # Contexto do src/
│   ├── routes/
│   │   └── AGENTS.md      # Contexto das rotas
│   └── components/
│       └── AGENTS.md      # Contexto dos components
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Apollo** | Contexto mais rico ao explorar diretórios | — |
| **Hermes** | Sabe padrões do diretório que está trabalhando | — |
| **Aphrodite** | Sabe design system do componente | — |

**Impacto no Pantheon:**
- Agentes leem AGENTS.md do diretório automaticamente
- Zero token waste com contexto irrelevante

**Performance:**
- Custo: ~200 tokens por AGENTS.md (lido só quando agente está no diretório)
- Benefício: Contexto preciso, sem poluição

**Deduplicação:**
- Já temos `codemap` skill → /init-deep é a versão **hierárquica**
- **Não duplica** — codemap gera mapa, init-deep gera contexto por diretório

---

#### 11. Directory Context Injection

**O que é:** Melhoria no walk-up tree para auto-injetar AGENTS.md + README.md quando lê arquivos.

**Como implementar:**
- Hook: `directory-agents-injector` (PreToolUse + PostToolUse)
- Quando agente lê `src/routes/users/post.py`:
  - Walk up: `src/routes/users/AGENTS.md` → `src/routes/AGENTS.md` → `src/AGENTS.md` → `AGENTS.md`
  - Injeta todos que encontra no contexto

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Todos** | Contexto automático do diretório | ~100 tokens extras por read |

**Impacto no Pantheon:**
- Agentes sempre têm contexto do diretório
- Zero configuração manual

**Performance:**
- Custo: ~100 tokens por read (walk-up + inject)
- Benefício: Contexto preciso, evita erros de padrão

**Deduplicação:**
- Já existe no OMO → trazemos para Pantheon
- **Não duplica** — é melhoria do hook existente

---

### FASE 4: Domain Skills (3 features — sem novos agentes)

---

#### 12. Security Skill (Nemesis)

**O que é:** Skill de segurança para Themis — SAST, SCA, container scan, SBOM, PII, compliance.

**Como implementar:**
- Arquivo: `skills/security-audit-pro/SKILL.md`
- Usada por: **Themis** (principal), **Hermes** (durante implementação)
- Cobre:
  - SAST: SQL injection, XSS, CSRF, path traversal
  - SCA: Dependências com CVEs conhecidas
  - Container: Non-root user, health checks, secrets
  - SBOM: Software Bill of Materials
  - PII: Detecção de dados pessoais no código
  - Compliance: GDPR, LGPD, HIPAA patterns

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Themis** | Security review automatizado, não só grep-based | — |
| **Hermes** | Sabe padrões de segurança durante implementação | — |

**Impacto no Pantheon:**
- Security review 10x mais profundo que OWASP grep atual
- Compliance como código, não checklist manual

**Performance:**
- Custo: ~1000 tokens quando skill ativa
- Benefício: Detecta vulnerabilidades antes do deploy

**Deduplicação:**
- Já temos `security-audit` skill → `security-audit-pro` é a versão **expandida**
- **Substitui** security-audit atual (mais abrangente)

---

#### 13. Test Architecture Skill (Sisyphus)

**O que é:** Skill de testes para Hermes — E2E, load, mutation, contract, visual regression.

**Como implementar:**
- Arquivo: `skills/test-architecture/SKILL.md`
- Usada por: **Hermes** (durante implementação), **Themis** (durante review)
- Cobre:
  - E2E: Testes de ponta a ponta com Playwright
  - Load: Testes de carga com k6/locust
  - Mutation: Testa se testes testam algo (mutação de código)
  - Contract: Testes de contrato API (Pact)
  - Visual regression: Screenshot diff para UI

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Hermes** | Sabe escrever testes E2E, load, mutation | — |
| **Themis** | Pode rodar mutation testing para validar qualidade dos testes | — |

**Impacto no Pantheon:**
- Elimina "tests pass but test nothing"
- Cobertura de testes 5x mais ampla

**Performance:**
- Custo: ~1000 tokens quando skill ativa
- Benefício: Tests que realmente testam algo

**Deduplicação:**
- Já temos `tdd-with-agents` skill → `test-architecture` é **complementar**
- tdd-with-agents = como escrever testes unitários
- test-architecture = como escrever testes E2E, load, mutation

---

#### 14. Cache Strategy Skill (Cronus)

**O que é:** Skill de cache para Demeter — Redis, CDN, TTL, invalidation, write-through.

**Como implementar:**
- Arquivo: `skills/cache-strategy/SKILL.md`
- Usada por: **Demeter** (durante schema design), **Hermes** (durante implementação)
- Cobre:
  - Redis: Read-through, write-through, write-behind
  - CDN: Cache headers, stale-while-revalidate
  - TTL: Estratégias de expiração
  - Invalidation: Cache invalidation patterns
  - Session stores: Redis para sessões

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Demeter** | Sabe quando e como usar cache no schema | — |
| **Hermes** | Sabe patterns de cache durante implementação | — |

**Impacto no Pantheon:**
- Cache strategy consistente em todo o projeto
- Elimina "ad-hoc redis.get() sem estratégia"

**Performance:**
- Custo: ~800 tokens quando skill ativa
- Benefício: 10-100x performance em reads frequentes

**Deduplicação:**
- Não duplica nada existente
- `performance-optimization` skill menciona cache mas não ensina patterns

---

### FASE 5: Infrastructure & Polish (5 features)

---

#### 15. Session Recovery Patterns

**O que é:** Documentar + implementar hooks de recovery.

**Como implementar:**
- Arquivo: `skills/session-recovery/SKILL.md`
- Hooks:
  - `session-recovery` (Event) — recupera de missing tool results
  - `thinking-block-validator` (Transform) — previne thinking block errors
  - `json-error-recovery` (PostToolUse) — recupera de JSON parse errors

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Todos** | Recovery automático de erros comuns | — |

**Impacto no Pantheon:**
- Sessão não quebra por erros recuperáveis
- User vê resultado, não o erro

**Performance:**
- Custo: ~50 tokens por recovery check
- Benefício: Evita perda de sessão inteira

**Deduplicação:**
- Não duplica nada existente

---

#### 16. File-Based Prompts

**O que é:** Suportar `file://` URLs em prompts de agentes.

**Como implementar:**
- Config: `prompt: "file://./prompts/zeus-prompt.md"`
- Arquivo: `skills/file-prompts/SKILL.md` (documentação)
- Suporta `~` expansion e relative paths

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Todos** | Prompts versionados separadamente do config | — |

**Impacto no Pantheon:**
- Prompts em git, não em JSON
- Sharing de prompts entre projetos

**Performance:**
- Custo: Zero (carregado uma vez no startup)
- Benefício: Prompts mais limpos, versionados

**Deduplicação:**
- Não duplica nada existente

---

#### 17. Category-Based Routing

**O que é:** Semantic delegation por tipo de task.

**Como implementar:**
- Arquivo: `skills/category-routing/SKILL.md`
- Categorias:
  - `deep` → Problemas complexos (GPT-5.5 medium)
  - `quick` → Mudanças simples (GPT-5.4-mini)
  - `visual-engineering` → Frontend/UI (Gemini)
  - `ultrabrain` → Arquitetura complexa (GPT-5.5 xhigh)

**Fluxo:**
```
Zeus delega:
  task(category="deep", prompt="Refactor auth system")
  → Roteia para modelo otimizado para deep reasoning
  → Não precisa especificar modelo manualmente
```

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Zeus** | Delegation mais inteligente, modelo certo pra task | — |
| **Todos** | Recebem modelo otimizado para o tipo de task | — |

**Impacto no Pantheon:**
- Modelo certo pra task certa, automaticamente
- Zero config manual de modelo

**Performance:**
- Custo: ~50 tokens por routing decision
- Benefício: Modelo mais barato para tasks simples, mais caro só quando precisa

**Deduplicação:**
- Já temos `platform/plans/` com tier system → category routing é **complementar**
- Tier system = qual modelo por agente
- Category routing = qual modelo por tipo de task

---

#### 18. Auto-Update Checker

**O que é:** Hook que verifica versão do Pantheon no startup.

**Como implementar:**
- Hook: `auto-update-checker` (Event)
- No startup da sessão:
  - Compara versão local com latest release no GitHub
  - Se update disponível → injeta toast notification

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Todos** | Sabem quando tem update disponível | — |

**Impacto no Pantheon:**
- Sempre na versão mais recente
- Zero esforço manual

**Performance:**
- Custo: ~100 tokens por check (uma vez por sessão)
- Benefício: Sempre atualizado

**Deduplicação:**
- Não duplica nada existente

---

#### 19. Hash-Anchored Edits

**O que é:** `LINE#ID` content hash validation — previne stale-line errors.

**Como implementar:**
- Arquivo: `skills/hashline-edits/SKILL.md`
- Quando agente lê arquivo, cada linha ganha hash:
```
11#VK| function hello() {
22#XJ|   return "world";
33#MB| }
```
- Quando agente edita, referencia o hash:
```
edit(line="22#XJ", newContent='  return "hello";')
```
- Se arquivo mudou, hash não bate → edit rejeitado

**Impacto nos agentes:**

| Agente | Ganha | Perde |
|--------|-------|-------|
| **Hermes** | Edits mais precisos, zero stale-line errors | Precisa usar hash references |
| **Aphrodite** | Edits mais precisos | — |
| **Demeter** | Migrations mais seguras | — |

**Impacto no Pantheon:**
- 6.7% → 68.3% success rate em edits (dados do OMO)
- Zero corrupção de arquivo por stale lines

**Performance:**
- Custo: ~200 tokens por read (hash injection)
- Benefício: 10x mais edits bem-sucedidos

**Deduplicação:**
- Não duplica nada existente
- Complementa Write-Existing-File Guard (que previne overwrite, hashline previne stale edit)

---

## 🔍 Deduplicação e Otimização (Agora Synthesis)

> 5 especialistas (Athena, Hermes, Themis, Nyx, Chiron) analisaram o plano e identificaram oportunidades de deduplicação e otimização.

### Phase 1 — Quick Wins (zero risco, ~776 linhas salvas)

| # | O que | Onde | Economia |
|---|-------|------|----------|
| 1 | Extrair tabela anti-rationalization de Hermes/Aphrodite/Demeter → `tdd-with-agents` skill | 3 agentes | ~54 linhas |
| 2 | Substituir artifact protocol inline → referência única a `artifact-protocol.instructions.md` | 5 agentes | ~50 linhas |
| 3 | Remover `hooks: []` vazio de todos os 18 agentes | 18 agentes | ~90 linhas |
| 4 | Remover `security-audit` skill de Hermes/Demeter (implementadores, não auditores) | 2 agentes | ~426 linhas |
| 5 | Fix copilot-free plan (premium models queimando pool gratuito) | 1 plan file | Previne cost leak |

### Phase 2 — Structural Deduplication

| # | O que | Impacto |
|---|-------|---------|
| 6 | Merge `performance-optimization` + `database-optimization` → skill única com seção de caching | ~105 linhas |
| 7 | Split `tdd-with-agents` (976 linhas) → TDD core (~400 linhas) + agent-evaluation separado | Skill mais focada |
| 8 | Remover format/secret/import checks do Themis (hooks já fazem no write-time) | -15-20% review time |
| 9 | Agent group defaults nos plan files (elimina redundância de "fast agents → fast model") | ~50 linhas |
| 10 | Fix handoff template inconsistency (falta `__themis` em 3 plan files) | Qualidade consistente |

### Phase 3 — Caching & Runtime (maior ROI)

| # | O que | Economia |
|---|-------|----------|
| 11 | Apollo discovery cache por sessão (keyed by search hash) | 30-50% discovery tokens |
| 12 | Memory Bank read deduplication (first reader injeta no context) | 5-15% input tokens |
| 13 | Context7 MCP response cache por sessão (keyed by libraryId + query) | 5-10% external calls |

### Deduplicações Aplicadas no Plano v4.0

| Feature v4.0 | Deduplicação Aplicada |
|--------------|----------------------|
| **Security Skill (Nemesis)** | `security-audit` removida de Hermes/Demeter → só Themis usa `security-audit-pro` |
| **Test Architecture** | Split de `tdd-with-agents` → TDD core (unit) + `test-architecture` (E2E/load/mutation) |
| **Cache Strategy** | Merge com `database-optimization` → seção de caching unificada |
| **Review-Work Parallel** | Format/secret/import checks removidos do Themis (hooks já fazem) → foco em OWASP + coverage + lógica |
| **Wisdom Accumulation** | Não duplica `/memories/repo/` (permanente) — wisdom é temporário, scoped à feature |
| **IntentGate** | Não duplica planning approval — é pré-delegação, não pré-execução |
| **Relentless Mode** | Compartilha detecção de idle com `auto-continue`, mas adiciona loop explícito até DONE |
| **Hash-Anchored Edits** | Complementa Write-Existing-File Guard (um previne overwrite, outro previne stale edit) |
| **Category Routing** | Complementa `platform/plans/` tier system (tier = por agente, category = por tipo de task) |
| **Directory Context Injection** | Melhoria do hook existente no OMO — não duplica, adapta para Pantheon |

### Impacto de Otimização no Token Budget

| Métrica | Antes Otimização | Depois Otimização | Economia |
|---------|------------------|-------------------|----------|
| Linhas duplicadas no framework | ~776 | 0 | -776 linhas |
| Token overhead por sessão | ~5000 | ~2000 | -60% |
| Discovery tokens (Apollo em DAG waves) | 100% | 50-70% | -30-50% |
| Memory Bank reads por sessão | 3-5x | 1x | -60-80% |
| Review time (Themis) | 100% | 80-85% | -15-20% |
| **Net token impact** | -10000/session | **-13000/session** | **+30% savings** |

---

## 📊 Resumo de Impacto

### Por Agente

| Agente | Novas Skills | Novos Hooks | Novos Comandos | Mudança Líquida |
|--------|--------------|-------------|----------------|-----------------|
| **Zeus** | Wisdom Accumulation, Category Routing | IntentGate, Wisdom Accumulator | Relentless Mode | +4 |
| **Athena** | Metis Gap Analysis, /init-deep | — | /init-deep | +3 |
| **Apollo** | Directory Context Injection | Directory Agents Injector | — | +2 |
| **Hermes** | Test Architecture, Cache Strategy, Event Streaming, Security | Comment Checker, Write Guard | — | +6 |
| **Aphrodite** | Visual Regression, AI Slop Remover | Comment Checker, Write Guard | — | +4 |
| **Demeter** | Cache Strategy, Search Engines | Write Guard | — | +3 |
| **Themis** | Security Audit Pro, Review-Work, AI Quality Gate | — | — | +3 |
| **Mnemosyne** | /handoff, Task System | — | /handoff | +3 |
| **Talos** | AI Slop Remover | Comment Checker, Write Guard | — | +3 |
| **Iris** | — | Auto-Update Checker | — | +1 |
| **Prometheus** | — | — | — | 0 |
| **Nyx** | Session Recovery | Session Recovery | — | +2 |
| **Hephaestus** | Search Engines, AI Quality Gate | — | — | +2 |
| **Echo** | AI Quality Gate | — | — | +1 |
| **Chiron** | — | — | — | 0 |
| **Gaia** | — | — | — | 0 |
| **Argus** | — | — | — | 0 |
| **Agora** | — | — | — | 0 |

### Totais

| Métrica | Antes | Depois (com otimização) | Delta |
|---------|-------|------------------------|-------|
| Agentes | 18 | 18 | 0 |
| Skills | ~10 | 16 (+6 novas, -1 removida) | +5 |
| Hooks | ~5 | 10 | +5 |
| Comandos | ~5 | 8 | +3 |
| Linhas duplicadas removidas | — | 776 | -776 |
| Token overhead estimado | — | ~2000/session (otimizado) | -60% vs original |
| Token savings estimado | — | ~17000/session (otimizado) | +13% vs original |
| **Net token impact** | — | — | **-15000/session** |

### Ganhos de Performance Estimados

| Métrica | Antes | Depois (com otimização) | Melhoria |
|---------|-------|------------------------|----------|
| Tasks completas sem intervenção | ~60% | ~90% | +50% |
| Erros de delegação | ~20% | ~8% | -60% |
| Retrabalho por plano ambíguo | ~30% | ~10% | -67% |
| AI slop em comentários | ~40% | ~5% | -87% |
| Overwrites acidentais | ~10% | ~0% | -100% |
| Review coverage | 3 dimensões | 5 dimensões | +67% |
| Edit success rate | ~50% | ~70% | +40% |
| Apollo discovery tokens (DAG waves) | 100% | 50-70% | -30-50% |
| Memory Bank reads por sessão | 3-5x | 1x | -60-80% |
| Themis review time | 100% | 80-85% | -15-20% |

---

## 🚫 O que NÃO será implementado (e por quê)

| Feature | Por que não |
|---------|-------------|
| **Model Fallback Chains** | Não necessário. Já temos `platform/plans/` que resolve o problema de forma mais limpa. |
| **6 novos agentes** | Tudo integrado como skills/hooks nos 18 existentes. Zero overhead de contexto permanente. |
| **Tmux Visualization** | Específico do OMO plugin, não aplicável ao Pantheon como framework de agentes. |
| **Skill-Embedded MCPs** | Já temos MCP config no `opencode.json` — não precisa de skill-embedded. |
| **Security-audit em Hermes/Demeter** | Implementadores não são auditores. Security review é responsabilidade do Themis. |
| **Format/secret/import checks no Themis** | Hooks já fazem no write-time. Themis foca em OWASP, coverage, lógica semântica. |
| **Themis batch review** | Perde granularidade de feedback por agente. Worth exploring no futuro, não prioridade. |
| **Merge frontend-analyzer + web-ui-analysis** | Use cases diferentes: component analysis vs live browser analysis. |

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Token overhead de hooks | +2000 tokens/session (otimizado) | Hooks só disparam quando necessário, custo real ~1000 |
| Complexidade de manutenção | Mais skills/hooks para manter | Cada skill é isolada, fácil de remover se não funcionar |
| Conflito entre hooks | Dois hooks tentando modificar mesma mensagem | Prioridade definida: PreToolUse > PostToolUse > Event |
| Skills não sendo carregadas | Agente não sabe o que fazer | Fallback para instruções base do agente |
| Apollo cache stale | Cache retorna resultados desatualizados | Cache keyed by search hash + TTL por sessão |
| Memory Bank dedup stale | Contexto injetado fica desatualizado | Re-read se arquivo modificado desde última injeção |
| Remoção de checks do Themis | Algo passa pelo hook mas não pelo review | Hooks são authoritative para format/secrets/imports; Themis foca em semântica |

---

**Total: 19 features · 0 novos agentes · 6 novas skills · 5 novos hooks · 3 novos comandos**
