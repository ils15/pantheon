# Skills Reference — mythic-agents

## Overview

Skills are reference modules loaded on demand by agents. Each skill provides domain-specific knowledge — architecture patterns, security checklists, optimization strategies, and implementation guides. Agents load skills when their task matches the skill's description, keeping context focused and token-efficient.

There are **27 skills** divided into **8 domains**.

## Skills by Domain

### Domain 1: Orchestration & Workflow

1. **agent-coordination** — `skills/agent-coordination/SKILL.md`
   - Master guide to the multi-agent system for rapid, TDD-driven feature development with guaranteed code quality and audit trails.
   - Used by: Zeus, Athena

2. **orchestration-workflow** — `skills/orchestration-workflow/SKILL.md`
   - Practical step-by-step walkthrough for orchestrating features end-to-end using the multi-agent system, from planning through deployment.
   - Used by: Zeus, Athena

3. **artifact-management** — `skills/artifact-management/SKILL.md`
   - Complete guide to the artifact trail system — plans directory structure, templates, and best practices for documenting feature implementations.
   - Used by: Zeus, Mnemosyne

### Domain 2: AI & Machine Learning

4. **rag-pipelines** — `skills/rag-pipelines/SKILL.md`
   - RAG architecture, chunking strategies, embedding models, vector store selection, retrieval optimization, context window management, hallucination mitigation, and evaluation frameworks (faithfulness, answer relevance).
   - Used by: Hefesto

5. **vector-search** — `skills/vector-search/SKILL.md`
   - Embedding generation pipelines, vector database configuration (Pinecone, Weaviate, pgvector, Chroma, Qdrant), similarity search algorithms (cosine, dot product, euclidean), hybrid search (dense + sparse), filtering, index types (IVF, HNSW), and reranking strategies.
   - Used by: Hefesto

6. **multi-model-routing** — `skills/multi-model-routing/SKILL.md`
   - Model routing strategies (fallback, latency-based, cost-based, capability-based), provider abstraction layer, AWS Bedrock integration, local inference (Ollama, vLLM), cost attribution and tracking, rate limiting, and guardrails.
   - Used by: Quíron, Hefesto

7. **streaming-patterns** — `skills/streaming-patterns/SKILL.md`
   - Server-Sent Events (SSE), WebSocket connections, LLM token streaming, chunked transfer encoding, backpressure handling, reconnection strategies, and real-time update patterns for observability pipelines.
   - Used by: Nix

8. **agent-evaluation** — `skills/agent-evaluation/SKILL.md`
   - Hallucination detection (factual consistency, faithfulness), output quality scoring (relevance, coherence, helpfulness), behavioral testing (edge cases, adversarial inputs), automated red-teaming, regression benchmarking, and human-in-the-loop evaluation workflows.
   - Used by: Hefesto, Temis

9. **prompt-injection-security** — `skills/prompt-injection-security/SKILL.md`
   - Prompt injection attack taxonomy (direct, indirect, jailbreaking, leakage), detection strategies (classifier-based, LLM-as-judge, pattern matching), input sanitization, output guardrails, content filters, rate limiting on LLM calls, and red-teaming methodologies.
   - Used by: Temis, Eco

10. **conversational-ai-design** — `skills/conversational-ai-design/SKILL.md`
    - NLU pipeline design (intent classification, entity extraction, slot filling), dialogue state management, Rasa framework integration, multi-turn conversation patterns, context windowing, fallback handling, and conversation testing strategies.
    - Used by: Eco

### Domain 3: Backend Development

11. **fastapi-async-patterns** — `skills/fastapi-async-patterns/SKILL.md`
    - Async FastAPI endpoint design, dependency injection, service/repository pattern, Pydantic validation, error handling middleware, rate limiting, background tasks, file uploads, WebSocket support, and Gemini integration.
    - Used by: Hermes

12. **api-design-patterns** — `skills/api-design-patterns/SKILL.md`
    - RESTful API design principles, HTTP method semantics, status code selection, pagination strategies (cursor, offset), filtering and sorting, error response formats, OpenAPI/Swagger documentation, versioning, and HATEOAS considerations.
    - Used by: Hermes

### Domain 4: Frontend Development

13. **frontend-analyzer** — `skills/frontend-analyzer/SKILL.md`
    - React/Next.js component architecture analysis, typography system extraction, color palette identification, layout pattern recognition ( flexbox, grid, spacing), responsive breakpoint mapping, font stack detection, and design token inventory.
    - Used by: Aphrodite

14. **web-ui-analysis** — `skills/web-ui-analysis/SKILL.md`
    - WCAG 2.1 accessibility compliance audit (perceivable, operable, understandable, robust), color contrast ratio calculation, semantic HTML structure, ARIA landmark validation, keyboard navigation testing, responsive design review, and Core Web Vitals assessment (LCP, FID, CLS).
    - Used by: Aphrodite

15. **nextjs-seo-optimization** — `skills/nextjs-seo-optimization/SKILL.md`
    - Next.js App Router metadata API, JSON-LD structured data (schema.org), auto-generated XML sitemaps, Open Graph and Twitter Card tags, canonical URL strategy, dynamic OG image generation, Core Web Vitals optimization for SEO, and i18n SEO patterns.
    - Used by: Aphrodite

### Domain 5: Database & Storage

16. **database-migration** — `skills/database-migration/SKILL.md`
    - Alembic migration workflows, zero-downtime migration strategies (expand-contract), backward-compatible schema changes, data migration with batch processing, rollback procedures, merge conflict resolution, and migration testing.
    - Used by: Maat

17. **database-optimization** — `skills/database-optimization/SKILL.md`
    - Index analysis and recommendation (B-tree, GiST, GIN, BRIN), N+1 query detection using SQLAlchemy event listeners, query execution plan analysis (EXPLAIN ANALYZE), connection pooling configuration, query profiling, and schema denormalization trade-offs.
    - Used by: Maat

18. **performance-optimization** — `skills/performance-optimization/SKILL.md`
    - Multi-layer optimization: N+1 detection and elimination, index strategy design, caching layers (application, query, HTTP), materialized views, read replica offloading, async query batching, and profiling with cProfile and pg_stat_statements.
    - Used by: Maat, Ra

### Domain 6: Quality & Security

19. **code-review-checklist** — `skills/code-review-checklist/SKILL.md`
    - Systematic code review process with quality gates (trailing whitespace, hard tabs, wild imports), SOLID principles validation, error handling patterns (explicit vs silent), test coverage analysis, type safety verification, and structured feedback with severity levels.
    - Used by: Temis

20. **security-audit** — `skills/security-audit/SKILL.md`
    - OWASP Top 10 coverage (injection, broken auth, XSS, insecure deserialization, SSRF, etc.), input validation and sanitization, CSRF protection, SQL injection prevention, dependency vulnerability scanning, secret detection, HTTPS enforcement, and security headers.
    - Used by: Temis, Hermes, Maat

21. **tdd-with-agents** — `skills/tdd-with-agents/SKILL.md`
    - TDD lifecycle enforcement (RED → GREEN → REFACTOR), test-first development across backend (pytest, unittest), frontend (vitest, testing-library), and database (migration tests), coverage thresholds (>80%), mocking strategies, fixture management, and agent-level TDD evaluation criteria.
    - Used by: Hermes, Aphrodite, Maat, Temis

### Domain 7: Infrastructure & DevOps

22. **docker-best-practices** — `skills/docker-best-practices/SKILL.md`
    - Multi-stage Docker builds, layer caching optimization, .dockerignore patterns, non-root user execution, health check configuration, GPU container setup (CUDA), memory and CPU limits, secrets management (Docker secrets, not env vars), and docker-compose patterns for dev/prod parity.
    - Used by: Ra

23. **mcp-server-development** — `skills/mcp-server-development/SKILL.md`
    - Model Context Protocol (MCP) architecture, server creation with FastMCP/ Python SDK, tool definition and registration, resource exposure, prompt templates, transport layer configuration (stdio, SSE), authentication, error handling, and testing MCP servers.
    - Used by: Hefesto, Quíron, Nix

24. **agent-observability** — `skills/agent-observability/SKILL.md`
    - OpenTelemetry instrumentation (traces, metrics, logs), LangSmith integration for LLM call tracing, Prometheus metric exposition, Grafana dashboard design, cost tracking per agent/feature, token usage attribution, structured JSON logging with correlation IDs, and alerting rules.
    - Used by: Nix, Quíron

### Domain 8: Domain Specialists

25. **remote-sensing-analysis** — `skills/remote-sensing-analysis/SKILL.md`
    - Complete remote sensing pipeline: spectral indices (NDVI, EVI, NBR, NDWI, MNDWI), SAR processing, change detection algorithms, time series analysis, land use/land cover (LULC) product inter-comparison (MapBiomas, CGLS, ESRI, GLAD, ESA WorldCover), accuracy metrics (Kappa, OA, F1, Dice), and ML/DL model training for RS imagery.
    - Used by: Gaia

26. **internet-search** — `skills/internet-search/SKILL.md`
    - Web research methodology with source trust hierarchy (official docs > academic > community), structured API patterns for general web (DuckDuckGo, Wikipedia, Jina Reader), tech community (Stack Overflow, Hacker News, Reddit, Dev.to), official vendor docs, academic databases (Semantic Scholar, CrossRef, arXiv), GitHub search, package registries, and remote sensing data sources. All sources free, no API key required.
    - Used by: Athena, Apollo, Gaia, Zeus

27. **prompt-improver** — `skills/prompt-improver/SKILL.md`
    - Prompt analysis and optimization: clarity and specificity evaluation, context window management, output format specification, NLU optimization for intent/entity extraction, chain-of-thought prompting, token efficiency, few-shot example selection, and systematic prompt testing.
    - Used by: All agents

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
| 2 | orchestration-workflow | Orchestration & Workflow | Zeus, Athena |
| 3 | artifact-management | Orchestration & Workflow | Zeus, Mnemosyne |
| 4 | rag-pipelines | AI & Machine Learning | Hefesto |
| 5 | vector-search | AI & Machine Learning | Hefesto |
| 6 | multi-model-routing | AI & Machine Learning | Quíron, Hefesto |
| 7 | streaming-patterns | AI & Machine Learning | Nix |
| 8 | agent-evaluation | AI & Machine Learning | Hefesto, Temis |
| 9 | prompt-injection-security | AI & Machine Learning | Temis, Eco |
| 10 | conversational-ai-design | AI & Machine Learning | Eco |
| 11 | fastapi-async-patterns | Backend Development | Hermes |
| 12 | api-design-patterns | Backend Development | Hermes |
| 13 | frontend-analyzer | Frontend Development | Aphrodite |
| 14 | web-ui-analysis | Frontend Development | Aphrodite |
| 15 | nextjs-seo-optimization | Frontend Development | Aphrodite |
| 16 | database-migration | Database & Storage | Maat |
| 17 | database-optimization | Database & Storage | Maat |
| 18 | performance-optimization | Database & Storage | Maat, Ra |
| 19 | code-review-checklist | Quality & Security | Temis |
| 20 | security-audit | Quality & Security | Temis, Hermes, Maat |
| 21 | tdd-with-agents | Quality & Security | Hermes, Aphrodite, Maat, Temis |
| 22 | docker-best-practices | Infrastructure & DevOps | Ra |
| 23 | mcp-server-development | Infrastructure & DevOps | Hefesto, Quíron, Nix |
| 24 | agent-observability | Infrastructure & DevOps | Nix, Quíron |
| 25 | remote-sensing-analysis | Domain Specialists | Gaia |
| 26 | internet-search | Domain Specialists | Athena, Apollo, Gaia, Zeus |
| 27 | prompt-improver | Domain Specialists | All agents |

---

[Main Documentation](../README.md)
