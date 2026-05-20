# Skills Reference — Pantheon

## Overview

Skills are reference modules loaded on demand by agents. Each skill provides domain-specific knowledge — architecture patterns, security checklists, optimization strategies, and implementation guides. Agents load skills when their task matches the skill's description, keeping context focused and token-efficient.

There are **36 skills** divided into **9 domains**.

## Skills by Domain

### Domain 1: Orchestration & Workflow

1. **agent-coordination** — `skills/agent-coordination/SKILL.md`
   - Master guide to the multi-agent system with category routing, model selection, and sprint management for rapid, TDD-driven feature development.
   - Used by: Zeus, Athena

2. **artifact-management** — `skills/artifact-management/SKILL.md`
   - Complete guide to the artifact trail system — plans directory structure, templates, and best practices for documenting feature implementations.
   - Used by: Zeus, Mnemosyne

3. **memory-bank** — `skills/memory-bank/SKILL.md`
   - Complete guide to Pantheon memory bank — structure, rules, optimization, session→active-context graduation, and compression strategies.
   - Used by: Mnemosyne, All agents

### Domain 2: AI & Machine Learning

3. **rag-pipelines** — `skills/rag-pipelines/SKILL.md`
   - RAG architecture, chunking strategies, embedding models, vector store selection, retrieval optimization, context window management, hallucination mitigation, and evaluation frameworks (faithfulness, answer relevance).
   - Used by: Hephaestus

4. **multi-model-routing** — `skills/multi-model-routing/SKILL.md`
   - Model routing strategies (fallback, latency-based, cost-based, capability-based), provider abstraction layer, AWS Bedrock integration, local inference (Ollama, vLLM), cost attribution and tracking, rate limiting, and guardrails.
   - Used by: Chiron, Hephaestus

5. **streaming-patterns** — `skills/streaming-patterns/SKILL.md`
   - Server-Sent Events (SSE), WebSocket connections, LLM token streaming, chunked transfer encoding, backpressure handling, reconnection strategies, and real-time update patterns for observability pipelines.
   - Used by: Nyx

6. **agent-evaluation** — `skills/agent-evaluation/SKILL.md`
   - Hallucination detection (factual consistency, faithfulness), output quality scoring (relevance, coherence, helpfulness), behavioral testing (edge cases, adversarial inputs), automated red-teaming, regression benchmarking, and human-in-the-loop evaluation workflows.
   - Used by: Hephaestus, Themis

7. **prompt-injection-security** — `skills/prompt-injection-security/SKILL.md`
   - Prompt injection attack taxonomy (direct, indirect, jailbreaking, leakage), detection strategies (classifier-based, LLM-as-judge, pattern matching), input sanitization, output guardrails, content filters, rate limiting on LLM calls, and red-teaming methodologies.
   - Used by: Themis, Echo

8. **conversational-ai-design** — `skills/conversational-ai-design/SKILL.md`
    - NLU pipeline design (intent classification, entity extraction, slot filling), dialogue state management, Rasa framework integration, multi-turn conversation patterns, context windowing, fallback handling, and conversation testing strategies.
    - Used by: Echo

### Domain 3: Backend Development

9. **fastapi-async-patterns** — `skills/fastapi-async-patterns/SKILL.md`
    - Async FastAPI endpoint design, dependency injection, service/repository pattern, Pydantic validation, error handling middleware, rate limiting, background tasks, file uploads, WebSocket support, and Gemini integration.
    - Used by: Hermes

10. **api-design-patterns** — `skills/api-design-patterns/SKILL.md`
    - RESTful API design principles, HTTP method semantics, status code selection, pagination strategies (cursor, offset), filtering and sorting, error response formats, OpenAPI/Swagger documentation, versioning, and HATEOAS considerations.
    - Used by: Hermes

### Domain 4: Frontend Development

11. **frontend-analyzer** — `skills/frontend-analyzer/SKILL.md`
    - React/Next.js component architecture analysis, typography system extraction, color palette identification, layout pattern recognition ( flexbox, grid, spacing), responsive breakpoint mapping, font stack detection, and design token inventory.
    - Used by: Aphrodite

12. **nextjs-seo-optimization** — `skills/nextjs-seo-optimization/SKILL.md`
    - Next.js App Router metadata API, JSON-LD structured data (schema.org), auto-generated XML sitemaps, Open Graph and Twitter Card tags, canonical URL strategy, dynamic OG image generation, Core Web Vitals optimization for SEO, and i18n SEO patterns.
    - Used by: Aphrodite

### Domain 5: Database & Storage

13. **database-migration** — `skills/database-migration/SKILL.md`
    - Alembic migration workflows, zero-downtime migration strategies (expand-contract), backward-compatible schema changes, data migration with batch processing, rollback procedures, merge conflict resolution, and migration testing.
    - Used by: Demeter

14. **database-optimization** — `skills/database-optimization/SKILL.md`
    - Index analysis and recommendation (B-tree, GiST, GIN, BRIN), N+1 query detection using SQLAlchemy event listeners, query execution plan analysis (EXPLAIN ANALYZE), connection pooling configuration, caching layers, materialized views, read replica offloading, async query batching, and profiling.
    - Used by: Demeter, Prometheus

### Domain 6: Quality & Security

15. **code-review-checklist** — `skills/code-review-checklist/SKILL.md`
    - Systematic code review process with quality gates (trailing whitespace, hard tabs, wild imports), SOLID principles validation, error handling patterns (explicit vs silent), test coverage analysis, type safety verification, and structured feedback with severity levels.
    - Used by: Themis

16. **security-audit-pro** — `skills/security-audit-pro/SKILL.md`
    - Professional security audit — SAST, SCA, container security, SBOM, PII detection, and compliance (GDPR, LGPD, HIPAA).
    - Used by: Themis, Hermes, Demeter

17. **tdd-with-agents** — `skills/tdd-with-agents/SKILL.md`
    - TDD lifecycle enforcement (RED → GREEN → REFACTOR), test-first development across all layers, advanced testing patterns (E2E, load, mutation, contract, visual regression), coverage thresholds (>80%).
    - Used by: Hermes, Aphrodite, Demeter, Themis

18. **docker-best-practices** — `skills/docker-best-practices/SKILL.md`
    - Multi-stage Docker builds, layer caching optimization, .dockerignore patterns, non-root user execution, health check configuration, GPU container setup (CUDA), memory and CPU limits, secrets management (Docker secrets, not env vars), and docker-compose patterns for dev/prod parity.
    - Used by: Prometheus

20. **mcp-server-development** — `skills/mcp-server-development/SKILL.md`
    - Model Context Protocol (MCP) architecture, server creation with FastMCP/ Python SDK, tool definition and registration, resource exposure, prompt templates, transport layer configuration (stdio, SSE), authentication, error handling, and testing MCP servers.
    - Used by: Hephaestus, Chiron, Nyx

21. **agent-observability** — `skills/agent-observability/SKILL.md`
    - OpenTelemetry instrumentation (traces, metrics, logs), LangSmith integration for LLM call tracing, Prometheus metric exposition, Grafana dashboard design, cost tracking per agent/feature, token usage attribution, structured JSON logging with correlation IDs, and alerting rules.
    - Used by: Nyx, Chiron

22. **cache-strategy** — `skills/cache-strategy/SKILL.md`
    - Cache architecture patterns — Redis (read-through, write-through, write-behind), CDN, TTL strategies, invalidation patterns, session stores.
    - Used by: Demeter, Hermes

### Domain 8: Domain Specialists

23. **remote-sensing-analysis** — `skills/remote-sensing-analysis/SKILL.md`
    - Complete remote sensing pipeline: spectral indices (NDVI, EVI, NBR, NDWI, MNDWI), SAR processing, change detection algorithms, time series analysis, land use/land cover (LULC) product inter-comparison (MapBiomas, CGLS, ESRI, GLAD, ESA WorldCover), accuracy metrics (Kappa, OA, F1, Dice), and ML/DL model training for RS imagery.
    - Used by: Gaia

24. **internet-search** — `skills/internet-search/SKILL.md`
    - Web research methodology with source trust hierarchy (official docs > academic > community), structured API patterns for general web (DuckDuckGo, Wikipedia, Jina Reader), tech community (Stack Overflow, Hacker News, Reddit, Dev.to), official vendor docs, academic databases (Semantic Scholar, CrossRef, arXiv), GitHub search, package registries, and remote sensing data sources. All sources free, no API key required.
    - Used by: Athena, Apollo, Gaia, Zeus

25. **prompt-improver** — `skills/prompt-improver/SKILL.md`
    - Prompt analysis and optimization: clarity and specificity evaluation, context window management, output format specification, NLU optimization for intent/entity extraction, chain-of-thought prompting, token efficiency, few-shot example selection, and systematic prompt testing.
    - Used by: All agents

26. **interview** — `skills/interview/SKILL.md`
    - Turn a rough idea into a structured spec through a short Q&A interview. Ask 3–5 targeted questions one at a time, then produce a complete markdown spec with goals, requirements, constraints, and open questions.
    - Used by: Athena, Zeus
    - Domain: Planning

27. **session-goal** — `skills/session-goal/SKILL.md`
    - Pin a session objective so all todos, delegation decisions, and verification steps stay aligned with a single stated goal. Prevents scope creep and drift across long multi-agent sessions.
    - Used by: Zeus, Athena
    - Domain: Orchestration

28. **auto-continue** — `skills/auto-continue/SKILL.md`
    - Safe auto-continue pattern for multi-step orchestration — how to automatically work through todo lists without unnecessary interruptions while always stopping at mandatory safety gates (plan approval, phase review, git commit).
    - Used by: Zeus, Hermes, Aphrodite, Demeter
    - Domain: Orchestration

29. **metis-gap-analysis** — `skills/metis-gap-analysis/SKILL.md`
    - Pre-plan gap analysis — catch hidden intentions, ambiguities, missing acceptance criteria, AI slop patterns, and edge cases before the plan is delivered to the user.
    - Used by: Athena, Zeus
    - Domain: Planning

30. **codemap** — `skills/codemap/SKILL.md`
    - Hierarchical codebase map generation — directory trees, entry points, module relationships and dependency analysis.
    - Used by: Apollo, Zeus

31. **init-deep** — `skills/init-deep/SKILL.md`
    - Generate hierarchical AGENTS.md files throughout the project directory tree. Each directory gets context-specific instructions for agents working in that scope.
    - Used by: Athena, Prometheus
    - Domain: Planning

32. **handoff** — `skills/handoff/SKILL.md`
    - Generate structured session handoff for continuing work in a new session. Captures current state, what was done, what remains, decisions, and relevant files.
    - Used by: All agents
    - Domain: Orchestration

33. **task-system** — `skills/task-system/SKILL.md`
    - File-backed task management with dependencies (blockedBy/blocks), automatic parallel execution, and session persistence. For complex work with 3+ interdependent tasks.
    - Used by: Zeus, Athena
    - Domain: Orchestration

34. **wisdom-accumulation** — `skills/wisdom-accumulation/SKILL.md`
    - Extract and pass learnings between implementation waves — conventions, successes, failures, gotchas, and commands. Temporary, scoped to feature, deleted after merge.
    - Used by: All agents
    - Domain: Utilities

## Skills File Structure

Each skill follows a consistent layout:

```
skills/[skill-name]/
├── SKILL.md          — main reference document (YAML frontmatter + content)
├── scripts/          — optional helper scripts (if any)
└── examples/         — optional example files, templates, or configs (if any)
```

The `SKILL.md` file contains YAML frontmatter with `name`, `description`, and platform metadata, followed by the full reference content in Markdown.

## How Skills Work

- **On-demand loading**: Skills are loaded when an agent's task matches the skill's description. The agent invokes the skill via the `skill` tool, injecting the domain knowledge into context.
- **Agent frontmatter**: Agents declare which skills they use via the `skills:` field in their `.agent.md` frontmatter. The platform uses this to determine relevance.
- **VS Code Copilot**: Automatically injects skill content when the agent detects a matching task description. Skills appear in the Available Skills list and can be loaded via `/skill` commands.
- **OpenCode platform**: Skills are listed in the system prompt's `<available_skills>` block. The agent invokes `skill` with the matching name to load the full content.
- **Other platforms**: Each platform loads skills differently. Refer to platform-specific documentation for integration details.

## Quick Reference Table

| # | Skill Name | Domain | Used By |
|---|------------|--------|---------|
| 1 | agent-coordination | Orchestration & Workflow | Zeus, Athena |
| 2 | artifact-management | Orchestration & Workflow | Zeus, Mnemosyne |
| 3 | memory-bank | Orchestration & Workflow | Mnemosyne, All agents |
| 4 | auto-continue | Orchestration | Zeus, Hermes, Aphrodite, Demeter |
| 5 | session-goal | Orchestration | Zeus, Athena |
| 6 | task-system | Orchestration | Zeus, Athena |
| 7 | rag-pipelines | AI & Machine Learning | Hephaestus |
| 8 | multi-model-routing | AI & Machine Learning | Chiron, Hephaestus |
| 9 | streaming-patterns | AI & Machine Learning | Nyx |
| 10 | agent-evaluation | AI & Machine Learning | Hephaestus, Themis |
| 11 | prompt-injection-security | AI & Machine Learning | Themis, Echo |
| 12 | conversational-ai-design | AI & Machine Learning | Echo |
| 13 | fastapi-async-patterns | Backend Development | Hermes |
| 14 | api-design-patterns | Backend Development | Hermes |
| 15 | frontend-analyzer | Frontend Development | Aphrodite |
| 16 | nextjs-seo-optimization | Frontend Development | Aphrodite |
| 17 | database-migration | Database & Storage | Demeter |
| 18 | database-optimization | Database & Storage | Demeter, Prometheus |
| 19 | cache-strategy | Database & Storage | Demeter, Hermes |
| 20 | code-review-checklist | Quality & Security | Themis |
| 21 | security-audit-pro | Quality & Security | Themis, Hermes, Demeter |
| 22 | tdd-with-agents | Quality & Security | Hermes, Aphrodite, Demeter, Themis |
| 23 | docker-best-practices | Infrastructure & DevOps | Prometheus |
| 24 | mcp-server-development | Infrastructure & DevOps | Hephaestus, Chiron, Nyx |
| 25 | agent-observability | Infrastructure & DevOps | Nyx, Chiron |
| 26 | remote-sensing-analysis | Domain Specialists | Gaia |
| 27 | internet-search | Domain Specialists | Athena, Apollo, Gaia, Zeus |
| 28 | prompt-improver | Domain Specialists | All agents |
| 29 | interview | Planning | Athena, Zeus |
| 30 | metis-gap-analysis | Planning | Athena, Zeus |
| 31 | codemap | Planning | Apollo, Zeus |
| 32 | init-deep | Planning | Athena, Prometheus |
| 33 | handoff | Utilities | All agents |
| 34 | wisdom-accumulation | Utilities | All agents |

---

[Main Documentation](../README.md)
