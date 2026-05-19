# Wave 4: Domain Skills

> **Features:** Security (Nemesis), Test Architecture (Sisyphus), Cache Strategy (Cronus)
> **Objetivo:** Skills de domínio para agentes existentes — zero novos agentes
> **Otimização:** Merge perf+db optimization, split tdd-with-agents, security-audit removido de implementadores

---

## 🔍 Deduplicação Aplicada nesta Wave

| Item | Antes | Depois | Economia |
|------|-------|--------|----------|
| `performance-optimization` + `database-optimization` | 2 skills com overlap (N+1, indexes, query optimization) | Merge → `database-optimization` com seção de caching | ~105 linhas |
| `tdd-with-agents` (976 linhas) | Skill gigante com agent evaluation code | Split → TDD core (~400 linhas) + `agent-evaluation` separado | Skill mais focada |
| `security-audit` em Hermes/Demeter | Implementadores com skill de auditor | Removido → só Themis usa `security-audit-pro` | ~426 linhas |
| Cache Strategy vs `performance-optimization` | `performance-optimization` menciona cache sem patterns | `cache-strategy` ensina patterns → complementar, não duplicata | Zero duplicação |

---

## 📋 Tasks

### Task 4.1: Security Skill (Nemesis)

**Arquivos a criar:**
- `skills/security-audit-pro/SKILL.md`

**Conteúdo da skill:**
- SAST: SQL injection, XSS, CSRF, path traversal
- SCA: Dependências com CVEs conhecidas
- Container: Non-root user, health checks, secrets
- SBOM: Software Bill of Materials
- PII: Detecção de dados pessoais no código
- Compliance: GDPR, LGPD, HIPAA patterns

**Agentes que usam:**
- **Themis** (principal) — durante review
- **Hermes** (secundário) — durante implementação

**Critério de sucesso:**
- Security review 10x mais profundo que OWASP grep atual
- Compliance como código
- ~1000 tokens quando skill ativa

**Deduplicação:**
- Substitui `security-audit` skill atual (mais abrangente)

---

### Task 4.2: Test Architecture Skill (Sisyphus)

**Arquivos a criar:**
- `skills/test-architecture/SKILL.md`

**Conteúdo da skill:**
- E2E: Testes de ponta a ponta com Playwright
- Load: Testes de carga com k6/locust
- Mutation: Testa se testes testam algo (mutação de código)
- Contract: Testes de contrato API (Pact)
- Visual regression: Screenshot diff para UI

**Agentes que usam:**
- **Hermes** (principal) — durante implementação
- **Themis** (secundário) — durante review

**Critério de sucesso:**
- Elimina "tests pass but test nothing"
- Cobertura de testes 5x mais ampla
- ~1000 tokens quando skill ativa

**Deduplicação:**
- Complementar a `tdd-with-agents` skill
- tdd-with-agents = testes unitários
- test-architecture = E2E, load, mutation

---

### Task 4.3: Cache Strategy Skill (Cronus)

**Arquivos a criar:**
- `skills/cache-strategy/SKILL.md`

**Conteúdo da skill:**
- Redis: Read-through, write-through, write-behind
- CDN: Cache headers, stale-while-revalidate
- TTL: Estratégias de expiração
- Invalidation: Cache invalidation patterns
- Session stores: Redis para sessões

**Agentes que usam:**
- **Demeter** (principal) — durante schema design
- **Hermes** (secundário) — durante implementação

**Critério de sucesso:**
- Cache strategy consistente em todo o projeto
- Elimina "ad-hoc redis.get() sem estratégia"
- ~800 tokens quando skill ativa

**Deduplicação:**
- `performance-optimization` skill menciona cache mas não ensina patterns
- Cache strategy é complementar, não duplicata

---

## ✅ Checklist de Validação

- [ ] Security: Skill criada e funcional
- [ ] Security: SAST patterns cobertos
- [ ] Security: SCA patterns cobertos
- [ ] Security: Container security coberto
- [ ] Security: PII detection coberto
- [ ] Security: Compliance patterns cobertos
- [ ] Test Architecture: Skill criada e funcional
- [ ] Test Architecture: E2E patterns cobertos
- [ ] Test Architecture: Load testing coberto
- [ ] Test Architecture: Mutation testing coberto
- [ ] Test Architecture: Contract testing coberto
- [ ] Test Architecture: Visual regression coberto
- [ ] Cache Strategy: Skill criada e funcional
- [ ] Cache Strategy: Redis patterns cobertos
- [ ] Cache Strategy: CDN patterns cobertos
- [ ] Cache Strategy: TTL strategies cobertas
- [ ] Cache Strategy: Invalidation patterns cobertos

---

## 📦 Artefatos Gerados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `skills/security-audit-pro/SKILL.md` | Skill | SAST/SCA/container/PII/compliance |
| `skills/test-architecture/SKILL.md` | Skill | E2E/load/mutation/contract/visual |
| `skills/cache-strategy/SKILL.md` | Skill | Redis/CDN/TTL/invalidation |

---

## 🎯 Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Vulnerabilidades detectadas pre-deploy | +10x |
| Tests que realmente testam algo | +5x |
| Cache strategy consistente | 100% |
| Token overhead por skill | <1000 tokens |
| Linhas duplicadas removidas | ~531 linhas |
