# Agent Skills

Custom Agent Skills for VS Code Copilot. Skills are folders with instructions, scripts, and resources that enable specialized capabilities.

**Location**: `skills/` directory. Each skill has a `SKILL.md` with YAML frontmatter (`name`, `description`).

## Available Skills (17)

### Orchestration & Coordination
| Skill | Purpose |
|---|---|
| **agent-coordination** | Master guide to the multi-agent system for TDD-driven feature development |
| **orchestration-workflow** | Step-by-step walkthrough for orchestrating features end-to-end |
| **artifact-management** | Artifact trail system — plans directory structure, templates, documentation |
| **tdd-with-agents** | TDD enforcement across all agents — RED→GREEN→REFACTOR cycle |

### Backend & API
| Skill | Purpose |
|---|---|
| **api-design-patterns** | RESTful API design with HTTP methods, status codes, pagination, OpenAPI |
| **fastapi-async-patterns** | Async FastAPI endpoints with service/repository patterns |
| **database-migration** | Alembic migration patterns — zero-downtime, backward-compatible |
| **database-optimization** | SQL query optimization, index analysis, N+1 detection |

### Frontend
| Skill | Purpose |
|---|---|
| **frontend-analyzer** | Analyze React/Next.js components — typography, colors, layout systems |
| **nextjs-seo-optimization** | Next.js SEO with meta tags, structured data, sitemaps |
| **web-ui-analysis** | Web UI analysis for design patterns and accessibility |

### Infrastructure & DevOps
| Skill | Purpose |
|---|---|
| **docker-best-practices** | Optimized Dockerfiles with multi-stage builds, security, health checks |
| **performance-optimization** | Backend/frontend performance profiling and optimization |
| **security-audit** | Security audit checklist — OWASP Top 10, dependency scanning |

### Quality & Review
| Skill | Purpose |
|---|---|
| **code-review-checklist** | Systematic code review with SOLID principles, quality gates |
| **playwright-e2e-testing** | End-to-end testing with Playwright — patterns and templates |

### Utilities
| Skill | Purpose |
|---|---|
| **prompt-improver** | Analyze and optimize prompts for better LLM performance |
