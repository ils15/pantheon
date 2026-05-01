# VSCode Copilot Agents - Central Orchestrator

> **Quick links:**
> - [Main Documentation](README.md) — overview, architecture, quick start
> - [Agent Details](agents/README.md) — all 16 agents with commands and skills
> - [Skills Reference](skills/README.md) — all 27 skills by domain
> - [Platform Setup Guides](docs/platforms/) — VS Code, OpenCode, Claude Code, Cursor, Windsurf

## 🏛️ Agent Architecture

Architecture based on **Conductor-Delegate pattern** (extensible — add new specialized agents as the project grows):
- 1 Orchestrator (Zeus) + Planning + Discovery + Implementation + QA + Infra + Memory + Domain Specialists

### Orchestrator Tier

#### ⚡ **Zeus** (agents/zeus.agent.md)
Central coordinator delegating work to specialized subagents.

**When to use:** Complex feature implementation, multi-layer coordination, cross-functional tasks  
**Role:** Feature orchestration, phase transition, context management  
**Delegates to:** athena → apollo → {hefesto, quiron, eco} → {hermes, aphrodite, maat} → nix → ra → temis → iris → mnemosyne → talos (hotfixes)

**Example:**
```
/implement-feature Add JWT authentication to API

Zeus orchestrates:
1. Athena plans architecture
2. Apollo explores codebase
3. Hefesto builds AI pipelines (RAG, vector search)
4. Quíron configures model routing + providers
5. Eco designs conversational flows (if chatbot)
6. Hermes implements backend
7. Aphrodite implements frontend
8. Maat handles database migrations
9. Nix sets up observability + cost tracking
10. Ra updates Docker
11. Temis reviews all changes
12. Iris opens PR + handles GitHub flow
13. Mnemosyne documents
```

#### 🔧 **Agent Lifecycle Hooks (March 2026)**

When Zeus delegates work to implementation agents and receives results, VS Code Copilot hooks fire automatically:

**Delegation Handoff (SubagentStart Hook)**:
- Fires when Zeus delegates to Hermes/Aphrodite/Maat
- **Interactive approval**: Shows handler script result in VS Code inline
- **Audit trail**: Logs to `logs/agent-sessions/delegations.log`
- Example: User sees "[Hermes: Backend API Implementation]" with ✅/❌ status inline

**Completion Capture (SubagentStop Hook)**:
- Fires when implementing agent returns result to Zeus
- **Auto-logging**: Captures success (PR link, commit hash) or failure
- **Audit trail**: Logs to `logs/agent-sessions/delegation-failures.log` (failures only)
- **QA escalation**: If failure, automates handoff to Temis review

**Security Gates (PreToolUse Hook)**:
- Blocks destructive tool calls: `rm -rf`, `DROP TABLE`, `TRUNCATE`
- Allows safe operations without user interruption
- Audit logged in `logs/agent-sessions/delegations.log`

See `.github/copilot-instructions.md` → "Agent Lifecycle Hooks" section for configuration details.

---

## 🏗️ Nested Subagents (NEW in v2.8.2)

**What are nested subagents?** Instead of Zeus centralizing all discovery, implementation agents can now autonomously call Apollo to investigate specific scopes in isolation. This improves performance, context efficiency, and parallelism.

**Enabled via:**
```json
{
  "chat.subagents.allowInvocationsFromSubagents": true
}
```

**Implementation Agents with Nested Apollo Delegation:**

| Agent | When to use nested Apollo | Example |
|-------|---------------------------|---------|
| **Athena** | Complex architecture (>5 modules) | "Plan caching — call Apollo to explore existing cache patterns" |
| **Hermes** | Discovering backend patterns | "Implement endpoint — call Apollo to find similar endpoints" |
| **Aphrodite** | Locating existing components | "Build component — call Apollo to find design system components" |
| **Maat** | Database optimization patterns | "Optimize queries — call Apollo to find existing indexes" |
| **Ra** | Infrastructure patterns | "Deploy service — call Apollo to find Docker/compose patterns" |

**How it works (example):**
```
Hermes implementing POST /products endpoint

Hermes: "I need to find POST endpoint patterns"
↓
CALLS Apollo as nested subagent (isolated context)
↓
Apollo searches: "Find all POST endpoints with validation patterns"
↓
Apollo returns: ["src/routes/users/post.py", "src/routes/orders/post.py"]
↓
Hermes incorporates findings into implementation
↓
Result: Clean context for both agents, 60-70% token savings
```

**Benefits:**
- ✅ **Context isolation** — Nested agent has clean context window
- ✅ **Parallelism** — Multiple agents can spawn nested Apollo tasks simultaneously
- ✅ **Efficiency** — Focused research returns only synthesized findings (no raw dumps)
- ✅ **Recursion safety** — Max nesting depth 5 prevents infinite loops
- ✅ **Transparency** — User sees exactly who delegated to whom

---

### Planning Tier

#### 🧠 **Athena** (agents/athena.agent.md)
Strategic planner optimized for speed. Generates concise TDD-driven implementation roadmaps (3-5 phases max).

**When to use:** Architecture decisions, technology research, detailed planning before implementation  
**Tools:** `search/codebase`, `search/usages`, `search/fileSearch`, `search/textSearch`, `search/listDirectory`, `read/readFile`, `web/fetch`  
**Calls:** apollo (OPTIONAL for complex discovery), hands off to zeus for implementation  
**Skills:** plan-architecture.prompt  
**Performance:** ~30s average (70% faster than previous version)

**Example:**
```
/plan-architecture Implement caching layer (L1 local + L2 Redis)

Athena:
1. Quick codebase search (or delegates to Apollo if complex)
2. Creates concise 3-5 phase TDD plan
3. Requests approval via interactive questions
4. Hands off to Zeus for execution

⚡ Optimized: Direct search for simple cases, Apollo only when needed
```

---

### Discovery Tier

#### 🔍 **Apollo** (agents/apollo.agent.md)
Investigation agent for rapid codebase discovery plus external docs and GitHub research. Supports planner, debugger, and other agents with fast file location and evidence gathering.

**When to use:** Rapid codebase exploration, bug root cause discovery, finding files before implementation, helping any agent locate code  
**Called by:** Athena (planning), Zeus (debugging), Hermes/Aphrodite/Maat (locating existing patterns)  
**Tools:** `search/codebase`, `search/usages`, `web/fetch`, `read/readFile`, `search/fileSearch`, `search/textSearch`, `search/listDirectory`, `openBrowserPage`, `navigatePage`, `readPage`, `screenshotPage` (read-only parallel searches + public docs/GitHub pages + optional browser recon)  
**Parallelism:** Up to 10 simultaneous search queries  
**Web/GitHub Research:** Pulls docs and GitHub references; escalates deep research to Athena  
**Skills:** debug-issue.prompt  

**Example:**
```
/debug-issue NullPointerException in user service

Apollo searches (parallel):
1. "UserService" class definition
2. "NullPointer" error messages
3. User initialization code
4. Recent git commits to UserService
5. Unit tests for UserService
6. Mock data in tests

→ Synthesizes findings into root cause
→ Recommends Athena fetch: SQLAlchemy async patterns, FastAPI error handling best practices
```

---

### Implementation Tier (Parallel Executors)

#### 🔥 **Hermes** (agents/hermes.agent.md)
Backend APIs, FastAPI services, async business logic.

**When to use:** API endpoint implementation, service layer creation, async I/O handling  
**Specialization:** FastAPI, Python, async/await, TDD backend  
**Depends on:** maat (database), ra (deployment)  
**Can call:** apollo (for codebase discovery)  
**Skills:** backend-standards.instructions, tdd-testing, api-design, security-audit  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `read/problems`, `execute/testFailure`, `execute/getTerminalOutput`, `search/changes`  

**Backend Standards Applied:**
- Async/await on ALL I/O operations
- Type hints on all parameters
- Max 300 lines per file
- TDD first (RED → GREEN → REFACTOR)
- >80% test coverage
- Error propagation (no silent fallbacks)

---

#### 💎 **Aphrodite** (agents/aphrodite.agent.md)
Frontend UI/UX, React components, responsive design.

**When to use:** Component creation, UI improvements, accessibility fixes, state management  
**Specialization:** React, TypeScript, responsive design, WCAG accessibility  
**Depends on:** hermes (API endpoints)  
**Can call:** apollo (for component discovery)  
**Skills:** frontend-standards.instructions, tdd-testing, api-design  
**Tools:** `search/codebase`, `search/usages`, `agent/askQuestions`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `read/problems`, `execute/testFailure`, `execute/getTerminalOutput`, `search/changes`, `openBrowserPage`, `navigatePage`, `readPage`, `clickElement`, `typeInPage`, `hoverElement`, `dragElement`, `handleDialog`, `screenshotPage`  

**Frontend Standards Applied:**
- TypeScript strict mode
- Accessibility: ARIA, semantic HTML
- Responsive design (mobile-first)
- Component composition patterns
- State management discipline
- >80% test coverage (vitest)
- **Visual verification:** screenshot diff + accessibility audit via browser integration after each component

---

#### 🌊 **Maat** (agents/maat.agent.md)
Database design, SQL optimization, migration management.

**When to use:** Schema design, query optimization, N+1 prevention, migration strategy  
**Specialization:** SQLAlchemy ORM, Alembic migrations, query analysis  
**Dependencies:** athena (planning), hermes (schema needs)  
**Skills:** database-standards.instructions, database-migration, performance-optimization, security-audit  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `read/problems`, `execute/testFailure`, `execute/getTerminalOutput`  

**Database Standards Applied:**
- Zero-downtime migration strategy
- Backward compatibility (expand-contract)
- Index strategy for performance
- N+1 query prevention
- Query plan analysis (EXPLAIN ANALYZE)
- Connection pooling configuration

---

#### ⚙️ **Ra** (agents/ra.agent.md)
Infrastructure, Docker containerization, deployment orchestration.

**When to use:** Container optimization, deployment strategy, infrastructure as code, CI/CD  
**Specialization:** Docker, docker-compose, multi-stage builds, health checks, CI/CD workflows  
**Depends on:** All agents (needs their deployment requirements)  
**Skills:** docker-deployment, performance-optimization  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `execute/getTerminalOutput`, `read/problems`  

**Infrastructure Standards Applied:**
- Multi-stage Docker builds
- Non-root user execution
- Health checks on all services
- Zero-downtime deployment strategy
- Environment variable management
- Secrets from vault (not hardcoded)

---

#### 🔨 **Hefesto** (agents/hefesto.agent.md)
AI tooling & pipelines specialist — RAG, LangChain/LangGraph chains, vector databases, embedding strategies.

**When to use:** Building RAG pipelines, vector search, LangChain chain composition, AI workflow orchestration  
**Specialization:** LangChain, LangGraph, RAG architecture, vector stores (Pinecone, Weaviate, pgvector, Chroma), embeddings  
**Depends on:** quiron (model providers), maat (database for vector sources), ra (containerization for inference)  
**Can call:** apollo (for codebase discovery)  
**Skills:** rag-pipelines, vector-search, mcp-server-development  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `read/problems`, `execute/testFailure`, `execute/getTerminalOutput`, `search/changes`, `web/fetch`  

**AI Pipeline Standards Applied:**
- Chain composition with proper error boundaries
- Async/await for all LLM I/O
- >80% test coverage
- Hallucination and faithfulness evaluation
- Embedding dimension optimization
- Query retry with exponential backoff

---

#### 🧬 **Quíron** (agents/quiron.agent.md)
Model provider hub specialist — multi-model routing, AWS Bedrock, cost optimization, provider abstraction.

**When to use:** Configuring model providers, setting up fallback strategies, AWS Bedrock integration, cost tracking  
**Specialization:** AWS Bedrock, multi-model routing, provider abstraction, local inference (Ollama/vLLM)  
**Depends on:** ra (infrastructure for model serving), hefesto (pipeline integration)  
**Can call:** apollo (for codebase discovery)  
**Skills:** multi-model-routing  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `read/problems`, `execute/testFailure`, `execute/getTerminalOutput`, `search/changes`, `web/fetch`  

**Model Provider Standards Applied:**
- Never hardcode API keys (always from vault/secrets)
- Exponential backoff on rate limits
- Cost attribution per agent/feature
- Model routing based on task complexity
- Guardrails for content safety

---

#### 🗣️ **Eco** (agents/eco.agent.md)
Conversational AI specialist — Rasa NLU pipelines, dialogue management, intent/entity design, multi-turn conversations.

**When to use:** Designing chatbots, NLU pipelines, dialogue flows, multi-platform chat integration  
**Specialization:** Rasa NLU, dialogue state management, intent/entity extraction, conversation testing  
**Depends on:** hermes (backend actions), hefesto (RAG context retrieval for responses)  
**Can call:** apollo (for codebase discovery)  
**Skills:** conversational-ai-design  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `read/problems`, `execute/testFailure`, `execute/getTerminalOutput`, `search/changes`, `web/fetch`  

**Conversational AI Standards Applied:**
- Intent naming: `domain_action_object` format
- Entity naming: snake_case, descriptive
- Story coverage for happy + edge case paths
- NLU evaluation: intent accuracy, entity F1
- Fallback handling for out-of-scope inputs

---

#### 👁️ **Nix** (agents/nix.agent.md)
Observability & monitoring specialist — OpenTelemetry tracing, token/cost tracking, LangSmith integration, agent performance analytics.

**When to use:** Setting up monitoring, diagnosing performance issues, tracking token costs, configuring alerting  
**Specialization:** OpenTelemetry, LangSmith, Prometheus/Grafana, cost attribution, distributed tracing  
**Depends on:** All agents (instrumentation), ra (monitoring infrastructure)  
**Can call:** apollo (for codebase discovery)  
**Skills:** agent-observability  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/readFile`, `read/problems`, `execute/testFailure`, `execute/getTerminalOutput`, `search/changes`, `web/fetch`  

**Observability Standards Applied:**
- Structured JSON logging with correlation IDs
- OpenTelemetry context propagation across all agents
- Metric naming: `mythic.<agent>.<metric>.<unit>`
- Sensitive data redaction from logs/traces
- Cost reconciliation against provider billing

---

### Domain Specialist Tier

#### 🌍 **Gaia** (agents/gaia.agent.md)
Remote sensing domain expert — scientific literature research, LULC analysis, and geospatial image processing.

**When to use:** Analysis of LULC products (MapBiomas, CGLS, ESRI, GLAD, ESA WorldCover), inter-product agreement metrics, scientific literature search in indexed journals (MDPI Remote Sensing, RSE, IEEE TGRS, ISPRS), technical-scientific review of raster processing pipelines, evidence-based methodological recommendations  
**Specialization:** LULC agreement metrics, temporal frequency analysis, raster processing, spatial statistics, scientific literature search  
**Tools:** `search/codebase`, `search/usages`, `read/readFile`, `web/fetch`, `search/fileSearch`, `search/textSearch`, `search/listDirectory`, `vscode/askQuestions`  
**Skills:** remote-sensing-analysis  

**Capabilities:**
- Parallel search across IEEE TGRS, Remote Sensing of Environment, MDPI, ISPRS, arXiv
- Analysis of Python/R remote sensing implementations in the codebase
- Agreement metrics: Kappa, OA, F1, Dice, temporal frequency
- Raster pipeline review grounded in scientific literature
- LULC product ensemble method recommendations

---

### Publishing & GitHub Tier

#### 🌈 **Iris** (agents/iris.agent.md)
GitHub operations specialist — branches, pull requests, issues, releases, and tags.

**When to use:** After Temis approves a phase and the user has committed locally; creating and managing PRs; opening/closing GitHub Issues; creating release tags and changelogs; any GitHub repository operation  
**Specialization:** Branch naming conventions, Conventional Commits, PR templating, semantic versioning, GitHub release notes  
**Called by:** Zeus (after Temis review gate), user (direct invocation)  
**Depends on:** Temis (review approval), user (`git commit` gate)  
**Handoffs to:** Mnemosyne (release documentation), Zeus (outcome status)  
**Tools:** `agent`, `vscode/askQuestions`, `read/readFile`, `search/codebase`, `search/changes`, `execute/runInTerminal`, `execute/getTerminalOutput`  

**GitHub Standards Applied:**
- Conventional Commits for branch names and PR titles (`feat/`, `fix/`, `chore/`, `docs/`, `release/`)
- Every PR opens as **DRAFT** unless instructed otherwise
- PR description always includes: what changed, why, how to test, breaking changes
- Checks for `.github/pull_request_template.md` before drafting PR body
- Semantic versioning: BREAKING → MAJOR, `feat:` → MINOR, `fix:`/others → PATCH
- **Never** merges without explicit human confirmation via `vscode/askQuestions`
- **Never** uses `--force` push or bypasses branch protection
- Confirms identity before any write operation (e.g. via `mcp_github_get_me` on VS Code)

---

### Hotfix Tier (Express Lane)

#### ⚒️ **Talos** (agents/talos.agent.md)
Hotfix and Rapid Repair specialist. Bypasses standard orchestration for small bugs and direct fast fixes.

**When to use:** CSS fixes, typos, simple logic bugs that don't require architectural changes  
**Specialization:** Speed, precision, bypassing standard orchestration  
**Depends on:** None (works independently for small fixes)  
**Tools:** `search/codebase`, `search/usages`, `read/readFile`, `edit/editFiles`, `execute/runInTerminal`, `read/problems`, `execute/testFailure`  

**Hotfix Standards Applied:**
- No mandatory TDD for trivial fixes (like CSS classes)
- Edits files directly
- Runs existing tests to verify unbroken build
- No `PLAN-` or `REVIEW-` artifacts required
- Recommends commit immediately after fix

---

### Quality Assurance Tier

#### ⚖️ **Temis** (agents/temis.agent.md)
Code review, security audit, quality gates, and lightweight code quality checks.

**When to use:** MANDATORY after every implementation phase (Hermes/Aphrodite/Maat/Ra). Called automatically before merge.  
**Specialization:** Lightweight quality checks, OWASP security audit, >80% coverage validation  
**Reviews:** All outputs from hermes, aphrodite, maat, ra  
**Skills:** code-review-standards.instructions, security-audit, tdd-testing  
**Tools:** `search/codebase`, `search/usages`, `edit/editFiles`, `execute/runInTerminal`, `read/problems`, `search/changes`, `execute/testFailure`, `openBrowserPage`, `navigatePage`, `readPage`, `clickElement`, `screenshotPage`  

**Quality Checks (LIGHTWEIGHT - CHANGED FILES ONLY):**
- ✅ **Trailing whitespace** — grep-based check (BLOCKER if found)
- ✅ **Hard tabs in Python** — grep-based check (BLOCKER if found)
- ✅ **Wild imports** (`from X import *`) — grep-based check (MEDIUM severity)
- ✅ **Format validation** — Leverages `format-*` hooks to auto-verify code style compatibility
- ✅ **Type checking** — Runs `type-check.json` hook to validate Python/TypeScript types
- ✅ **Secret scanning** — Leverages `secret-scan.json` hook to ensure no hardcoded credentials
- ✅ **Optional: If tools installed** — ruff, black, isort, eslint, prettier

**Quality Gates (MANUAL REVIEW):**
- ✅ >80% test coverage
- ✅ All OWASP Top 10 checks pass
- ✅ No hardcoded secrets
- ✅ TypeScript strict mode (frontend)
- ✅ Type hints on all functions (backend)
- ✅ Accessibility compliance (frontend)
- ✅ No SQL injection vulnerabilities
- ✅ Proper error handling
- ✅ Optional integrated-browser evidence for critical UI flows (screenshots/interactions)

---

### Agent Collaboration with Hooks (Phase 1-3)

Every agent inherits workspace-level hooks when active. This enables automated validation:

| Agent | Inherited Hooks | Use Case |
|-------|-----------------|----------|
| **Hermes** (Backend) | `format.json`, `type-check.json`, `import-audit.json`, `secret-scan.json` | Auto-formats Python code; validates types; blocks wildcard imports; prevents API key commits |
| **Aphrodite** (Frontend) | `format.json`, `type-check.json`, `secret-scan.json` | Auto-formats JS/TS; validates TypeScript strict; prevents secret leaks |
| **Maat** (Database) | `format.json`, `secret-scan.json` | Formats SQL migrations; blocks hardcoded DB passwords |
| **Ra** (Infrastructure) | `format.json`, `secret-scan.json` | Auto-formats YAML/docker-compose; prevents API key leaks in configs |
| **Temis** (Review) | All hooks (reads-only for validation) | Leverages hooks to auto-verify code quality before approval |
| **Iris** (GitHub) | `security.json` (PreToolUse) | Blocked from destructive git operations (rm -rf, force push); ensures safe workflows |

**Hook execution is automatic** — agents don't invoke hooks explicitly. Hooks fire on tool use events (PreToolUse, PostToolUse) when the agent is active.

---

### Memory Tier

#### 📚 **Mnemosyne** (agents/mnemosyne.agent.md)
Memory bank management, decision documentation, progress tracking.

**When to use:** Explicit invocation only — project initialization or significant architectural decisions  
**Specialization:** `project.md` initialization, ADR writing (`decisions/YYYY-MM-DD-topic.md`)  
**Input from:** User / Zeus (explicit request only — NOT automatic after phases)  
**Skills:** None specific (documentation focused)  

**Two-Tier Strategy:**

| Tier | Where | What | Token cost |
|---|---|---|---|
| **Tier 1 — Native** | `/memories/repo/` | Atomic facts (stack, commands, conventions) | Zero — auto-loaded |
| **Tier 2 — Reference** | `docs/memory-bank/` | Minimal project docs: `project.md` (fill once) + `decisions/` ADRs | Read cost per file |
| **Session** | `/memories/session/` | Current conversation plans, work-in-progress | One read per conversation |

**Responsibilities:**
- [ ] Write atomic facts to `/memories/repo/` (Tier 1) when discovering permanent facts  
- [ ] Create `docs/memory-bank/project.md` once when a product first adopts Pantheon (Tier 2)  
- [ ] Append ADR files to `decisions/` for significant architectural decisions (Tier 2, append-only, on-demand)  

> Mnemosyne is **not** invoked automatically after phases. Sprint state lives in `/memories/session/` (ephemeral) or git commits (permanent).

---

---

## 🔒 MANDATORY QUALITY GATE WORKFLOW

**CRITICAL RULE**: @temis is NOT optional. Every implementation phase MUST pass @temis review:

```
Implementation Agents Code → @temis IMMEDIATELY
                                    ↓
                    Automated Quality Checks (ruff, black, isort, eslint, prettier)
                                    ↓
                            ✅ APPROVED or ❌ NEEDS_REVISION
                                    ↓
                    (If NEEDS_REVISION: Agent fixes and resubmits)
                                    ↓
                            Manual Code Review (OWASP, coverage, tests)
                                    ↓
                    ✅ APPROVED → Next Phase or ⏸️ User commits
```

**Implementers DO NOT skip @temis.** Without approval, code is not ready for merge.

---

## ✋ MANDATORY PAUSE POINTS

The Zeus system is controlled by the user through **MANDATORY PAUSE POINTS** at each phase:

### Pause Point 1: Planning Approval
```
Athena creates concise plan (in CHAT, not file)
     ↓
⏸️  STOP: User reviews and approves plan
     ↓
Plan presented in chat (no files created unless requested)
```

### Pause Point 2: Phase Implementation Review
```
Hermes/Aphrodite/Maat implements phase
     ↓
Temis reviews code
     ↓
⏸️  STOP: Show result summary in chat
     ↓
No phase-N-complete.md created (info stays in git commits)
```

### Pause Point 3: Git Commit
```
Agent provides commit message suggestion
     ↓
⏸️  STOP: User executes "git commit" manually
     ↓
Next phase starts
```

**Benefit:** You maintain control and can interrupt at any time. **No file bloat.**

---

## 📋 Task Dispatch Patterns

### Pattern 1: Simple Bug Fix (Apollo → Hermes → Temis)
```
User: /debug-issue API returns 500 on POST /users

1. Apollo runs 3-5 parallel searches
   ├─ Extract error stack trace
   ├─ Find POST /users endpoint
   ├─ Find UserService.create()
   └─ Check error handling

2. Hermes implements fix (TDD WORKFLOW)
   ├─ Write FAILING test first
   ├─ Run test → expects FAILURE/RED
   ├─ Write minimal code to fix
   ├─ Run test → expects PASS/GREEN
   └─ Refactor and document

3. Temis reviews
   └─ Approve if coverage >80% + no OWASP issues
   
⏸️  MANDATORY STOP: User commits to git
```

### Pattern 2: Feature Implementation (Athena → Hermes/Aphrodite/Maat → Temis → Ra)
```
User: /implement-feature Add email verification flow

1. Athena plans (concise, 3-5 phases)
   ├─ Design database schema
   ├─ Design API endpoints
   ├─ Design frontend components
   └─ Present plan IN CHAT (no plan.md file)
   
⏸️  MANDATORY STOP: User approves plan in chat

2. For each phase (Parallel execution allowed):
   
   Phase N Implementation:
   ├─ Hermes: Write FAILING tests → minimal code → PASSING tests
   ├─ Aphrodite: Write FAILING tests → minimal code → PASSING tests  
   └─ Maat: Write migration tests → minimal schema → passing tests
   
   Phase N Review:
   ├─ Temis validates >80% coverage + OWASP compliance
   └─ Summary presented IN CHAT (no phase-N-complete.md)
   
⏸️  MANDATORY STOP: User commits phase (git commit)

3. After all phases:
   └─ Summary presented IN CHAT (no complete.md)

4. Ra updates deployment (if needed)
   └─ Docker changes, env variables, health checks
```

### Pattern 3: Performance Optimization (Apollo → Maat → Temis)
```
User: /optimize-database GET /products endpoint slow

1. Apollo discovers (PARALLEL SEARCHES: 3-10)
   ├─ Current ProductService.list() implementation
   ├─ Current database queries  
   ├─ Related indexes
   ├─ N+1 patterns
   └─ Cache usage
   
   ⏸️  Apollo returns structured findings IN CHAT, not raw code

2. Maat analyzes (CONTEXT EFFICIENT)
   ├─ Runs EXPLAIN ANALYZE
   ├─ Identifies N+1 queries
   ├─ Proposes index strategy
   ├─ Writes migration test FIRST (TDD)
   └─ Implements minimal migration code

3. Temis validates
   ├─ Benchmarks before/after
   ├─ Validates >80% test coverage
   └─ Summary presented IN CHAT (no artifact files)
   
⏸️  MANDATORY STOP: User commits to git
```

### Pattern 4: Hotfix (Talos — Express Lane)
```
User: /fix CSS bug MobileMenuButton missing hidden class

1. Talos searches (TARGETED — 1-3 searches max)
   └─ Find the component file directly

2. Talos fixes (NO TDD REQUIRED FOR TRIVIAL FIX)
   ├─ Edit the file directly
   ├─ Run existing tests to verify no regressions
   └─ Report change in 1-2 lines

⏸️  MANDATORY STOP: User commits to git
```

### Pattern 5: Infrastructure Change (Ra)
```
User: /deploy Add Redis container to docker-compose

1. Apollo discovers (optional, if codebase unfamiliar)
   └─ Find existing compose files and service configs

2. Ra implements
   ├─ Adds Redis service to docker-compose.yml
   ├─ Configures healthchecks and restart policies
   ├─ Updates env template (.env.example)
   └─ Documents startup order

3. Ra validates
   ├─ Dry-run: docker-compose config (no errors)
   └─ Startup test: all services healthy

⏸️  MANDATORY STOP: User commits to git
```

---

## 🧠 CONTEXT WINDOW MANAGEMENT

Each specialized agent **conserves tokens** through strategies:

### Apollo (Discovery)
- **Input:** Problem description
- **Output:** Structured SUMMARY, NOT raw code
- **Strategy:** Parallel search (3-10 simultaneous) returns only high-signal findings
- **Savings:** 60-70% fewer tokens than raw code dump

### Hermes/Aphrodite/Maat (Implementation)
- **Input:** Specific phase scope + tests to pass
- **Output:** ONLY files it modifies in this phase
- **Strategy:** Doesn't re-read complete architecture, only its files
- **Savings:** 50% fewer tokens vs monolithic agent

### Temis (Review)
- **Input:** Git diff (changed files only)
- **Output:** Structured comments with status (APPROVED/NEEDS_REVISION/FAILED)
- **Strategy:** Reviews only changed lines, not entire repository
- **Savings:** 60% fewer tokens than full codebase review

### Result
- **Traditional:** Single agent uses 80-90% context only on research/analysis
- **Zeus system:** 10-15% context for analysis, **70-80% free** for deep reasoning

---

## 🎯 TDD ENFORCEMENT WORKFLOW

All implementation agents (Hermes, Aphrodite, Maat) follow **RIGOROUSLY**:

### Phase 1: RED (Test Fails)
```python
# Write test FIRST
def test_user_password_hashing():
    user = User(email="test@example.com", password="secret123")
    assert user.password != "secret123"  # Should be hashed
    assert user.verify_password("secret123")  # Verify works

# Run test → FAILS/RED ❌
FAILED: AssertionError: password should be hashed
```

### Phase 2: GREEN (Test Passes)
```python
# Write MINIMAL code to make test pass
class User:
    def __init__(self, email, password):
        self.email = email
        self.password = hash_password(password)  # Minimal: just hash
    
    def verify_password(self, plaintext):
        return verify_hash(plaintext, self.password)

# Run test → PASSES/GREEN ✅
PASSED: user password is hashed and verified
```

### Phase 3: REFACTOR
```python
# Improve code quality WITHOUT changing behavior
# Add validation, documentation, optimization
class User:
    """User model with secure password handling."""
    
    def __init__(self, email: str, password: str):
        if not email or not password:
            raise ValueError("Email and password required")
        self.email = email
        self.password = self._hash_password(password)
    
    @staticmethod
    def _hash_password(plaintext: str) -> str:
        """Hash password using bcrypt."""
        return bcrypt.hashpw(plaintext.encode(), bcrypt.gensalt())
    
    def verify_password(self, plaintext: str) -> bool:
        """Verify plaintext password against hash."""
        return bcrypt.checkpw(plaintext.encode(), self.password)

# Run test → STILL PASSES ✅
```

### TDD Checklist
- [ ] Write FAILING test first
- [ ] Run test, see RED/FAILED
- [ ] Write minimal code to pass
- [ ] Run test, see GREEN/PASSED
- [ ] Refactor if needed
- [ ] All tests still pass
- [ ] Coverage >80%

---

## 📄 DOCUMENTATION PHILOSOPHY: MINIMAL & IN-CODE

🚨 **CRITICAL RULE**: **NO excessive file creation**. Information lives in:
1. **Git commits** (what changed and why)
2. **Code comments** (complex logic only)
3. **Tests** (behavior documentation)
4. **README updates** (if feature changes usage)
5. **`/memories/repo/`** (atomic facts — auto-loaded, zero token cost)
6. **`docs/memory-bank/`** (narrative context — sprint state, decisions)

### ❌ DO NOT CREATE:
- `plan.md` files (present plans in chat)
- `phase-N-complete.md` files (info in git commits)
- `complete.md` files (info in git history)
- Excessive documentation artifacts
- Status tracking files

### ✅ DOCUMENTATION RULES:
1. **Plans**: Present in CHAT, get approval, proceed
2. **Progress**: Track via git commits with descriptive messages
3. **Completion**: Summary in CHAT, no files created
4. **Decisions**: Append `decisions/YYYY-MM-DD-topic.md` via Mnemosyne
5. **Facts**: Write to `/memories/repo/` for permanent, auto-loaded context

### Example Workflow (NO files created):
```
1. Athena presents plan in chat:
   📋 Plan: Email Verification (3 phases)
   1️⃣ Database schema
   2️⃣ API endpoints  
   3️⃣ Frontend components
   
   User: ✅ Approved

2. Hermes implements Phase 1
   → Creates code + tests
   → Temis reviews
   → Suggests commit: "feat: add verification schema"
   → User commits
   
3. Continue phases...

4. Final summary in CHAT:
   ✅ Feature Complete
   - 3 phases done
   - 92% coverage
   - 7 files modified
   Ready to deploy!
```

**Benefit**: Clean repo, no documentation bloat, all info in git history.

---

## 🏺 Artifact Protocol

The system operates with **structured artifacts** — persisted outputs that create an audit trail and enable human-in-the-loop approval at every phase.

### Artifact Types

| Prefix | Produced by | Persisted by | Location |
|---|---|---|---|
| `PLAN-` | Athena | Mnemosyne | `docs/memory-bank/.tmp/PLAN-<feature>.md` ⚠️ gitignored (optional - only if requested) |
| `IMPL-` | Hermes / Aphrodite / Maat | Mnemosyne | `docs/memory-bank/.tmp/IMPL-<phase>-<agent>.md` ⚠️ gitignored |
| `REVIEW-` | Temis | Mnemosyne | `docs/memory-bank/.tmp/REVIEW-<feature>.md` ⚠️ gitignored |
| `DISC-` | Explore (`#runSubagent`) | Mnemosyne | `docs/memory-bank/.tmp/DISC-<topic>.md` ⚠️ gitignored |
| `ADR-` | Any agent | Mnemosyne | `docs/memory-bank/_notes/ADR-<topic>.md` ✅ committed |

**Reference:** `instructions/artifact-protocol.instructions.md`

### Full Flow with Artifact Gates

```
You (Architect)
    └─► Zeus (Orchestrator)
            │
            ├─► Athena ──────────────── Plan presented in CHAT (artifact optional)
            │       └─► Apollo (optional for complex discovery)
            │
            │   ⏸️ GATE 1: You approve plan in chat
            │
            ├─► [PARALLEL 🔀]
            │       ├─► Hermes ───── IMPL-phase2-hermes.md
            │       ├─► Aphrodite ── IMPL-phase2-aphrodite.md
            │       └─► Maat ──────── IMPL-phase2-maat.md
            │
            ├─► Temis ───────────────── REVIEW-<feature>.md
            │       └─► "Human Review Focus" (you must validate)
            │
            │   ⏸️ GATE 2: You approve REVIEW artifact
            │
            └─► [optional] Ra → deploy
                    ⏸️ GATE 3: You execute git commit
```

### Parallel Execution Declaration

When Zeus dispatches multiple workers, it always announces:
```
🔀 PARALLEL EXECUTION — Phase 2
Running simultaneously (independent scopes):
- @hermes   → backend endpoints + tests
- @aphrodite → frontend components
- @maat     → database migration
All three produce IMPL artifacts. Temis reviews after all complete.
```

---

## 🔧 Direct Invocation

Each agent can be invoked directly for bypass orchestration:

Enter these commands in VS Code Copilot Chat. Do not run them in `bash`, `zsh`, or another shell.

```text
# Invoke specific agent
@apollo: Find all authentication-related files

@athena: Plan email verification feature

@hermes: Create POST /products endpoint with TDD

@aphrodite: Build ProductCard component with Storybook

@maat: Optimize users table queries

@ra: Create multi-stage Docker build for new service

@temis: Review this PR for security issues

@mnemosyne: Update memory bank with completed features

@talos: Fix the hidden lg:flex CSS bug on MobileMenuButton.tsx

@gaia: Analyze inter-product agreement metrics and recommend ensemble method

@zeus: Orchestrate full feature implementation
```

---

## 🎯 Agent Selection Guide

| Need | Agent | Trigger |
|------|-------|---------|
| Plan architecture | athena | `/plan-architecture` |
| Debug issue | apollo | `/debug-issue` |
| Find files/code | apollo | Direct: @apollo |
| New API endpoint | hermes | Direct: @hermes |
| New component | aphrodite | Direct: @aphrodite |
| Database optimization | maat | `/optimize-database` |
| Build AI pipelines (RAG, vector, chains) | hefesto | Direct: @hefesto |
| Configure model providers / routing | quiron | Direct: @quiron |
| Design conversational AI / chatbots | eco | Direct: @eco |
| Set up observability / monitoring | nix | Direct: @nix |
| Deploy changes | ra | Direct: @ra |
| Code review | temis | `/review-code` |
| Open PR / manage GitHub | iris | Direct: @iris |
| Create release / tag | iris | Direct: @iris |
| Open or triage issues | iris | Direct: @iris |
| Document architectural decisions (ADRs) | mnemosyne | Direct: @mnemosyne |
| Initialize project.md | mnemosyne | Direct: @mnemosyne |
| Remote sensing / LULC analysis | gaia | Direct: @gaia |
| Coordinate feature | zeus | `/implement-feature` |

---

## 🧭 Agent types + handoff

| Type | When to use | Handoff notes |
|------|-------------|---------------|
| Local interactive | Planning, strategy, review, and user-in-the-loop decisions | Use explicit handoff prompts and keep context short and actionable. |
| Background | Long-running implementation or parallel execution | Prefer isolated worktrees and review tool/terminal commands before approval. |
| Cloud | Heavy builds, tests, or tasks that benefit from hosted compute | Return a concise results summary plus changed files for review. |
| Third-party | Specialized domain tools from extensions | Verify trust, capabilities, and tool scope before use. |

**Handoff best practices (aligned to VS Code agents):**
- Keep handoffs explicit: state status, key context, open questions, and recommended next action.
- Use subagents for focused, context-isolated research; they return findings to the caller instead of taking independent action.
- Do not auto-invoke strategic or release agents; require explicit user approval before roadmap or release decisions.
- If handoffs get noisy, capture the minimal context and ask the next agent to confirm assumptions.

**Examples inspired by groupzer0/vs-code-agents:**
- Separation of concerns: Planner plans, Implementer implements, Reviewer reviews.
- Quality gates: Require review (Temis) before declaring a phase complete.
- Memory discipline: Capture decisions in Mnemosyne, avoid extra docs in the repo.
- Skills-driven reuse: Prefer skills for repeated standards instead of duplicating rules.

## 🎯 MODEL STRATEGY

Pantheon uses a **plan-based model configuration system**. Agents are model-agnostic at the canonical level — they declare abstract tiers (`fast`, `default`, `premium`) instead of concrete model names. The actual model resolution happens through platform-specific plan files.

### Tier System

| Tier | Purpose | Cost Profile | Agents |
|---|---|---|---|
| `fast` | Quick, cheap operations | Low (0-0.33x) | Apollo, Iris, Mnemosyne, Talos, Nix |
| `default` | Balanced quality/speed | Medium (1x) | Hermes, Aphrodite, Maat, Ra, Hefesto, Quíron, Eco, Gaia |
| `premium` | Deep reasoning, critical | High (3-7.5x) | Zeus, Athena, Temis |

### Plan Files

Plan files in `platform/plans/` define which concrete models map to each tier for a given service+plan combination:

```
platform/plans/
├── schema.json                 ← JSON Schema for plan validation
├── opencode-go.json            ← OpenCode Go ($10/mo) — DeepSeek, Kimi, Qwen
├── opencode-zen-free.json      ← OpenCode Zen Free — GPT-5 Nano, MiniMax
├── copilot-free.json           ← GitHub Copilot Free — GPT-5 mini (50 req/mo)
├── copilot-pro.json            ← GitHub Copilot Pro ($10/mo) — Claude Sonnet/Opus
├── copilot-pro-plus.json       ← GitHub Copilot Pro+ ($39/mo) — Opus 4.7
├── copilot-student.json        ← GitHub Copilot Student (free) — 300 req/mo
├── copilot-business.json       ← GitHub Copilot Business ($19/user/mo)
├── copilot-enterprise.json     ← GitHub Copilot Enterprise ($39/user/mo)
├── cursor-hobby.json           ← Cursor Hobby (free) — Composer 2
├── cursor-pro.json             ← Cursor Pro ($20/mo) — Claude/GPT models
├── cursor-ultra.json           ← Cursor Ultra ($200/mo) — $400 credit pool
├── claude-pro.json             ← Claude Pro ($20/mo) — Sonnet/Opus
├── claude-max-5x.json          ← Claude Max 5x ($100/mo) — Opus priority
├── claude-max-20x.json         ← Claude Max 20x ($200/mo) — 1M ctx Opus
├── byok-cheap.json             ← Bring Your Own Key (cheap) — Gemini Flash
├── byok-balanced.json          ← BYOK (balanced) — Sonnet/Opus
└── byok-best.json              ← BYOK (best) — Claude full suite
```

### How to Select a Plan

```bash
# List all available plans
./platform/select-plan.sh list

# Select OpenCode Go plan
./platform/select-plan.sh opencode-go

# Select Copilot Pro plan
./platform/select-plan.sh copilot-pro

# Show current active plan
./platform/select-plan.sh status

# Show model-to-agent mapping
./platform/select-plan.sh models
```

### How It Works

1. **Canonical agents** declare handoff model requirements as abstract tiers (`handoffs: [{model: premium}]`)
2. **Plan files** (`platform/plans/<plan>.json`) map tiers → concrete models per platform
3. **`plan-active.json`** symlink points to the active plan
4. **Platform adapters** read the active plan and resolve tiers to concrete model names
5. **`opencode.json`** provides per-agent model overrides for OpenCode users

### Handoff Tier Assignments

| Direction | Tier | Reason |
|---|---|---|
| Any → Temis | `premium` | Critical quality + security gate |
| Any → Zeus | `premium` | Complex orchestration decisions |
| Athena → Zeus | `premium` | Plan handoff needs careful execution |
| Any → Mnemosyne | `fast` | Simple documentation writes |
| Hefesto/Quíron → Ra | `default` | Infrastructure config generation |
| Eco → Talos | `fast` | Quick hotfix dispatch |

### OpenCode Configuration

The root `opencode.json` provides per-agent model overrides using OpenCode's `agent.<name>.model` config format. Defaults to OpenCode Go plan models.

```json
{
  "model": "opencode/kimi-k2.6",
  "small_model": "opencode/deepseek-v4-flash",
  "agent": {
    "zeus":    { "model": "opencode/kimi-k2.6" },
    "apollo":  { "model": "opencode/deepseek-v4-flash" },
    "temis":   { "model": "opencode/kimi-k2.6" }
  }
}
```

### Full Model Availability by Platform

See [platform/plans/](platform/plans/) for all 16+ plan configurations across OpenCode, GitHub Copilot, Cursor, Claude Code, and BYOK options.

### Canonical Agent Models

Each agent's `model:` frontmatter field (top-level) remains as a suggested model list for the platform. These are hints, not hard requirements. The actual model used depends on the active plan.

---

## 🔧 CUSTOM AGENT EXTENSION

To create a new specialized agent (example: Database-Expert):

### Step 1: Create Agent File
```bash
mkdir -p agents
cat > agents/database-expert-subagent.agent.md << 'EOF'
---
name: database-expert
user-invocable: false  # Only for internal delegation
description: Specialized database architect and query optimizer
argument-hint: "Analyze and optimize database schema and queries"
model: ['GPT-5.4 (copilot)', 'Claude Opus 4.6 (copilot)']
tools: ['search/codebase', 'search/usages', 'edit/editFiles', 'execute/runInTerminal']
---

You are a DATABASE EXPERT SUBAGENT.

**Your specialty:** SQL optimization, schema design, perf tuning
**Your scope:** Database layer changes, migrations, index strategy

**Core workflow:**
1. Analyze current database structure
2. Identify bottlenecks with EXPLAIN ANALYZE
3. Propose schema or index optimizations
4. Write migration tests FIRST (TDD)
5. Implement minimal schema changes
6. Return structured findings

[Add your detailed instructions]
EOF
```

### Step 2: Register with Zeus
Edit `agents/zeus.agent.md` and add:
```markdown
**10. DatabaseExpert-subagent**: SQL and schema design specialist
- Use for query performance analysis
- Invoke for complex schema designs
- Always returns structured findings, never raw SQL dumps
```

### Step 3: Register with Athena (for planning phase)
Edit `agents/athena.agent.md` and add:
```markdown
**When researching database architecture, delegate to DatabaseExpert-subagent:**
- Goal: Analyze current schema and identify optimization opportunities
- Instructions: Use EXPLAIN ANALYZE, check indexes, find N+1 patterns
- Return: Structured findings with specific recommendations
```

### Step 4: Test Integration
```bash
# Invoke directly
@database-expert: Analyze the users table queries for N+1 problems

# Or through Zeus
@zeus: Use database-expert to optimize the product search queries
```

### Custom Agent Checklist
- [ ] Create `.agent.md` file with proper frontmatter
- [ ] Set `user-invokable: false` if internal only
- [ ] Define tools needed (search, edit, runCommands, etc)
- [ ] Add single responsibility focus
- [ ] Document in Zeus agents list
- [ ] Document in relevant Planning/Implementation agents
- [ ] Test with sample task
- [ ] Add to memory bank if discovering new patterns

---

## 🚀 PRODUCT ADOPTION

When using Pantheon in a product repo, follow this pattern:

### Instructions loading hierarchy

There are **three levels** of instruction loading — choose the right one:

| Level | Where | Scope | Use for |
|---|---|---|---|
| **User-global** | `~/.copilot/instructions/` | All repos, all users (personal) | Personal style preferences, cross-project conventions |
| **Repo-shared** | `.github/copilot-instructions.md` | This repo, all team members | Product standards, agent coordination rules |
| **Repo-per-file** | `.vscode/settings.json` → `codeGeneration.instructions` | Per file pattern | Language-specific rules wired to `instructions/*.instructions.md` |

> **Common mistake:** People migrate `.github/copilot-instructions.md` to `~/.copilot/instructions/` thinking it's "more powerful" — it's not. They serve different audiences. Keep repo standards in `.github/` so team members automatically get them.

### What to copy
```bash
# Copy agents, instructions, prompts, skills — these are the framework
cp -r agents/ instructions/ prompts/ skills/ /path/to/your-product/

# Initialize empty memory bank (do NOT copy Pantheon content)
mkdir -p /path/to/your-product/docs/memory-bank/decisions
```

> **Do NOT copy** `docs/memory-bank/` content from Pantheon — it describes the framework itself, not your product.

### Initialize the product's memory bank
After copying, run this in the product repo:
```
@athena Initialize the Memory Bank for this project —
analyze the repo structure and fill project.md
```

Athena will populate `project.md`, write Tier 1 facts to `/memories/repo/`, and prepare `active-context.md` for your first sprint.

### Native memory is automatic
No setup needed for `/memories/repo/` — VS Code Copilot handles it per-repo. Agents write to it as facts are discovered.

### Memory bank per product
Each product maintains its own `docs/memory-bank/` with its own sprint state, decisions, and project context. Mythic-agents' own memory bank is the template/reference — not the product's source of truth.

---

## 🌐 Ecosystem & Inspiration

Pantheon draws from and diverges from the broader multi-agent landscape. Understanding the ecosystem helps when extending the framework or adopting best practices.

### Other notable multi-agent frameworks

| Framework | Pattern | Strengths | Key difference from Pantheon |
|---|---|---|---|
| **AutoGen** (Microsoft) | Event-driven async conversations | Deep observability, async messaging, research-grade | General-purpose; Pantheon is VS Code-native with `.agent.md` files |
| **CrewAI** | Role-based crews | Visual editor, self-hosted, clean Python API | Framework-level; Pantheon lives inside VS Code with zero infra |
| **LangGraph** | Stateful graph of actors | Cyclical execution, precise state control | Code-first graph DSL; Pantheon uses markdown+YAML as config |
| **MetaGPT** | Software company roles (PM, Architect, QA) | Full project lifecycle, SOP-driven | Simulates a company; Pantheon delegates to you at every gate |
| **OpenAI Swarm** | Lightweight handoffs | Minimal, easy to test | Sequential only; Pantheon supports parallel subagents |
| **Semantic Kernel** | Modular SDK (C#/Python/Java) | Enterprise-grade, model-agnostic | SDK dependency; Pantheon is config-only, no code to install |

**Community resources:**
- [`github/awesome-copilot`](https://github.com/github/awesome-copilot) — curated shared agents, skills, instructions, prompts for VS Code Copilot (22k+ stars)
- **awesome-copilot MCP server**: installs agents/skills directly into VS Code — `copilot plugin marketplace add github/awesome-copilot`
- [VS Code Custom Agents docs](https://code.visualstudio.com/docs/copilot/customization/custom-agents) — official reference for `.agent.md` authoring
- [VS Code Agent Skills docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills) — on-demand skill loading (Level 1/2/3 progressive disclosure)
- [VS Code Subagents docs](https://code.visualstudio.com/docs/copilot/agents/subagents) — parallel execution, context isolation, orchestration patterns
- [digitarald/chatarald](https://github.com/digitarald/chatarald) — real-world TDD subagent example (`.github/agents/tdd.agent.md` with worktrees)

### Optimization patterns adopted in this framework

Based on industry best practices across all frameworks above:

| Technique | Where applied in Pantheon |
|---|---|
| **Context isolation via subagents** | Apollo runs in isolated context window; only its summary returns to Zeus/Athena |
| **Parallel execution** | Zeus dispatches Hermes + Aphrodite + Maat simultaneously when scopes don't overlap |
| **Scoped `agents:` property** | Each orchestrator declares exactly which subagents it may invoke — prevents drift |
| **Tool minimization per agent** | Apollo has no `edit/` tools; Talos has no `agent` tool — smallest possible surface |
| **Progressive context loading** | Zeus reads `04-active-context.md` only when a sprint is active (Tier 2 on demand) |
| **Auto-loaded Tier 1 memory** | `/memories/repo/` facts are injected by VS Code — zero explicit read calls needed |
| **Human approval gates** | `agent/askQuestions` blocks at Planning, Review, and Commit — no auto-merging |
| **Model-role alignment** | Fast models (Haiku, Gemini Flash) for shallow discovery; Sonnet for planning and production code; GPT-5.4 for complex orchestration |

---

## 📚 References

- **Agent Skills:** `skills/*/SKILL.md`
- **Custom Instructions:** `instructions/*-standards.instructions.md`
- **Prompt Files:** `prompts/*.prompt.md`
- **Agent Definitions:** `agents/*.agent.md`
- **Memory Bank:** `docs/memory-bank/` (template — initialize per product)
- **Memory Standards:** `instructions/memory-bank-standards.instructions.md`
- **VSCode Settings:** `.vscode/settings.json`

---

**Last Updated:** February 25, 2026  
**Architecture Pattern:** Conductor-Delegate (extensible — add new domain agents as needed)  
**Mythology Reference:** Greek (Zeus, Athena, Apollo, Hermes, Aphrodite, Talos, Temis/Thêmis, Mnemosyne, **Gaia**), Egyptian (Ra, Maat)
