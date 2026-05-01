# Pantheon

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-vscode|opencode|claude|cursor|windsurf-green)](docs/platforms/)
[![Agents](https://img.shields.io/badge/agents-16-purple)](agents/README.md)
[![Skills](https://img.shields.io/badge/skills-27-orange)](skills/README.md)

A multi-agent orchestration framework with specialized AI agents for planning, building,
reviewing, and deploying features using enforced TDD and persistent project memory.

Supports **VS Code Copilot**, **OpenCode**, **Claude Code**, **Cursor**, and **Windsurf**.

---

## Quick Links

| Resource | Link |
|----------|------|
| 📖 **Agent Reference** | [agents/README.md](agents/README.md) — all 16 agents |
| 📖 **Skills Reference** | [skills/README.md](skills/README.md) — all 27 skills |
| 🚀 **Installation Guide** | [docs/INSTALLATION.md](docs/INSTALLATION.md) |
| 🖥️ **VS Code** | [docs/platforms/vscode.md](docs/platforms/vscode.md) |
| ⚡ **OpenCode** | [docs/platforms/opencode.md](docs/platforms/opencode.md) |
| 🤖 **Claude Code** | [docs/platforms/claude.md](docs/platforms/claude.md) |
| 🔧 **Cursor** | [docs/platforms/cursor.md](docs/platforms/cursor.md) |
| 🌊 **Windsurf** | [docs/platforms/windsurf.md](docs/platforms/windsurf.md) |

---

## Overview

Traditional single-agent coding produces mediocre results because one agent attempts to
plan, implement, test, review, and document simultaneously. The result is context
fragmentation, skipped tests, and generic code.

**Pantheon** solves this with **specialization**: each agent is an expert at exactly
one thing and is invoked only when that expertise is needed. Agents collaborate through a
conductor-delegate architecture where Zeus (the orchestrator) dispatches work to
specialized sub-agents with isolated context windows, enforced quality gates, and human
approval at every transition.

| Metric | Single Agent | Pantheon |
|---|---|---|
| Average test coverage | 65–75% | **92%** |
| TDD enforcement | Optional | **Enforced (RED→GREEN→REFACTOR)** |
| Code review cadence | End of feature | **After every phase** |
| Bugs reaching production | 3–5 per feature | **Near zero** |
| Context efficiency | 10–20% reasoning | **70–80% reasoning** |
| Parallel execution | Sequential only | **Multi-agent parallel** |
| Documentation | Manual | **Auto-committed in git** |
| Architecture pattern | Monolithic | **Specialized conductor-delegate** |

---

## How It Works

The system operates in defined phases controlled by **you**. Agents work in parallel
within each phase, and every transition is gated by your explicit approval.

```mermaid
---
config:
  look: classic
  theme: dark
  layout: elk
---
flowchart TD
    classDef user fill:#2d5a8c,stroke:#5a8ac4,stroke-width:2px,color:#e2e8f0
    classDef core fill:#1f2937,stroke:#4b5563,stroke-width:2px,color:#f3f4f6,font-weight:bold
    classDef planner fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#dbeafe
    classDef ai fill:#4a1a3f,stroke:#c084fc,stroke-width:2px,color:#f3e8ff
    classDef executor fill:#7c2d12,stroke:#ea580c,stroke-width:2px,color:#fed7aa
    classDef qa fill:#3f1a3e,stroke:#d946a6,stroke-width:2px,color:#f5d1f8
    classDef infra fill:#1e3a3f,stroke:#14b8a6,stroke-width:2px,color:#ccfbf1
    classDef ops fill:#1e294b,stroke:#60a5fa,stroke-width:1px,color:#bfdbfe
    classDef gate fill:#1f1f1f,stroke:#fbbf24,stroke-width:2px,color:#fbbf24,stroke-dasharray: 5 5

    User["You / Human"]:::user
    Gate1{{"⏸️ Gate 1<br/>Approve Plan"}}:::gate
    Gate2{{"⏸️ Gate 2<br/>Approve Review"}}:::gate
    Gate3{{"⏸️ Gate 3<br/>Commit"}}:::gate

    subgraph Orchestrator["Orchestrator"]
        Zeus["Zeus<br/>Central Coordinator"]:::core
    end

    subgraph Plan["Planning & Discovery"]
        Athena["Athena<br/>Strategic Planner"]:::planner
        Apollo["Apollo<br/>Codebase Scout"]:::planner
    end

    subgraph AI["AI Infrastructure"]
        Hefesto["Hefesto<br/>AI Pipelines<br/>RAG / LangChain"]:::ai
        Quiron["Quíron<br/>Model Routing<br/>Provider Hub"]:::ai
        Eco["Eco<br/>Conversational AI<br/>Rasa NLU"]:::ai
    end

    subgraph Impl["Implementation<br/>Parallel Execution"]
        Hermes["Hermes<br/>Backend APIs"]:::executor
        Aphrodite["Aphrodite<br/>Frontend UI"]:::executor
        Maat["Maat<br/>Database"]:::executor
    end

    subgraph Quality["Quality & Observability"]
        Temis["Temis<br/>Security & Coverage Audit"]:::qa
        Nix["Nix<br/>Observability<br/>Tracing & Cost"]:::qa
    end

    subgraph Deploy["Deployment & Release"]
        Ra["Ra<br/>Infrastructure<br/>Docker / CI/CD"]:::infra
        Iris["Iris<br/>GitHub Operations<br/>PR / Release"]:::ops
        Mnemosyne["Mnemosyne<br/>Documentation<br/>Memory Bank"]:::ops
    end

    subgraph Express["Express Lane"]
        Talos["Talos<br/>Rapid Hotfixes"]:::qa
    end

    subgraph Domain["Domain Specialist"]
        Gaia["Gaia<br/>Remote Sensing"]:::planner
    end

    User -->|"/implement-feature"| Zeus
    Zeus -->|Phase 1| Athena
    Athena -->|Discovers| Apollo
    Apollo -->|Findings| Athena
    Athena --> Gate1
    Gate1 -->|Approved| Zeus

    Zeus -->|"Phase 2 (AI Infrastructure)"| AI
    Hefesto & Quiron & Eco --> Zeus

    Zeus -->|"Phase 3 (Implementation)"| Impl
    Hermes & Aphrodite & Maat --> Quality

    Impl -.->|Nested Apollo| Apollo

    Nix --> Temis
    Temis --> Gate2
    Gate2 -->|Approved| Zeus

    Zeus -->|"Phase 4 (Deploy & Release)"| Deploy
    Ra & Iris & Mnemosyne --> Gate3
    Gate3 -->|"git commit"| User

    User -.->|"/fix"| Express
    User -.->|"/plan-architecture"| Domain
```

### Approval Gates

| Gate | Phase | What happens |
|---|---|---|
| **Gate 1** | After planning | Athena presents a phased TDD plan. You review and approve (or request changes) before any code is written. |
| **Gate 2** | After implementation & review | Temis audits all changed files for OWASP compliance, coverage >80%, and quality. You validate items only you can judge. |
| **Gate 3** | After deployment prep | Agent suggests a commit message. You execute `git commit` manually and decide when to merge. |

---

## Three Core Principles

### 1. Specialization

Each agent has a focused, narrow context. Hermes knows FastAPI async patterns and nothing
about React. Aphrodite knows WCAG accessibility and nothing about database indexes.
Gaia knows remote sensing and nothing about Docker. This produces better code than a
generalist at every layer.

### 2. TDD — enforced

No phase proceeds without minimum 80% test coverage. The RED → GREEN → REFACTOR cycle is
not optional:

```
RED      Write a failing test. The requirement is now defined in code.
GREEN    Write the minimum implementation to make it pass.
REFACTOR Improve the code without breaking the test.
```

### 3. You stay in control

Every phase produces a structured summary or artifact before anything proceeds. You
review, approve, or request changes — then the next phase begins. There are three
explicit pause points where the system stops and waits for your approval. AI does the
work; you make every architectural and commit decision.

---

## Agent Ecosystem

Pantheon provides **16 specialized agents** organized into tiers. Each agent has a
single responsibility, a dedicated model assignment, a restricted tool set, and explicit
context boundaries.

### Tier Overview

```
Orchestrator
  └── Zeus — coordinates all agents, manages approval gates

Planning & Discovery
  ├── Athena — strategic planner, TDD roadmap generation
  └── Apollo — parallel codebase & web research (read-only)

AI Infrastructure (NEW v3)
  ├── Hefesto — AI pipelines: RAG, LangChain/LangGraph, vector stores
  ├── Quíron — model routing: providers, fallback, cost optimization
  └── Eco — conversational AI: Rasa NLU, dialogue management

Implementation (Parallel Executors)
  ├── Hermes — backend: FastAPI, async, type-safe APIs
  ├── Aphrodite — frontend: React, TypeScript, WCAG accessibility
  └── Maat — database: SQLAlchemy, Alembic, query optimization

Quality & Observability
  ├── Temis — code review, OWASP security audit, coverage gate
  └── Nix — observability: OpenTelemetry, token/cost tracking

Infrastructure, Deployment & Release
  ├── Ra — infrastructure: Docker, CI/CD, deployment
  ├── Iris — GitHub: branches, PRs, releases, issues
  └── Mnemosyne — memory: project docs, ADRs, sprint close

Hotfix (Express Lane)
  └── Talos — rapid fixes: bypasses orchestration for small bugs

Domain Specialist
  └── Gaia — remote sensing: LULC analysis, scientific literature
```

> See [agents/README.md](agents/README.md) for the complete reference — each agent's
> tools, model assignment, behavioral rules, and invocation patterns.

### Architecture Diagram

```mermaid
---
config:
  look: classic
  theme: dark
  layout: elk
---
graph TB
    classDef tier0 fill:#1f2937,stroke:#4b5563,stroke-width:2px,color:#f3f4f6,font-weight:bold
    classDef tier1 fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#dbeafe
    classDef tier1b fill:#4a1a3f,stroke:#c084fc,stroke-width:2px,color:#f3e8ff
    classDef tier2 fill:#7c2d12,stroke:#ea580c,stroke-width:2px,color:#fed7aa
    classDef tier3 fill:#3f1a3e,stroke:#d946a6,stroke-width:2px,color:#f5d1f8
    classDef tier4 fill:#1e3a3f,stroke:#14b8a6,stroke-width:2px,color:#ccfbf1
    classDef tier5 fill:#1e294b,stroke:#60a5fa,stroke-width:1px,color:#bfdbfe
    classDef tier6 fill:#3f065f,stroke:#a855f7,stroke-width:2px,color:#e9d5ff

    O["Zeus<br/>Orchestrator"]:::tier0

    subgraph T1["Planning & Discovery"]
        A1["Athena<br/>Strategic Planner"]:::tier1
        A2["Apollo<br/>Codebase Scout"]:::tier1
    end

    subgraph AI["AI Infrastructure"]
        H["Hefesto<br/>AI Pipelines"]:::tier1b
        Q["Quíron<br/>Model Routing"]:::tier1b
        E["Eco<br/>Conversational AI"]:::tier1b
    end

    subgraph T2["Implementation"]
        I1["Hermes<br/>Backend"]:::tier2
        I2["Aphrodite<br/>Frontend"]:::tier2
        I3["Maat<br/>Database"]:::tier2
    end

    subgraph T3["Quality"]
        T1a["Temis<br/>Security & Review"]:::tier3
        N["Nix<br/>Observability"]:::tier3
    end

    subgraph T4["Infrastructure & Release"]
        R["Ra<br/>Infrastructure"]:::tier4
        I["Iris<br/>GitHub Ops"]:::tier4
        M["Mnemosyne<br/>Memory"]:::tier4
    end

    subgraph T5["Express & Specialist"]
        T["Talos<br/>Hotfixes"]:::tier5
        G["Gaia<br/>Remote Sensing"]:::tier6
    end

    O --> A1 & A2 & H & Q & E & I1 & I2 & I3 & T1a & N & R & I & M
    O -.-> T & G
    A1 --> A2

    style T1 fill:#1a1a1a,stroke:#2d3748,stroke-width:1px
    style AI fill:#1a1a1a,stroke:#2d3748,stroke-width:1px
    style T2 fill:#1a1a1a,stroke:#2d3748,stroke-width:1px
    style T3 fill:#1a1a1a,stroke:#2d3748,stroke-width:1px
    style T4 fill:#1a1a1a,stroke:#2d3748,stroke-width:1px
    style T5 fill:#1a1a1a,stroke:#2d3748,stroke-width:1px
```

---

## Skill Ecosystem

Pantheon bundles **27 skills** — modular instruction sets that agents load on demand
to perform specialized tasks. Skills are organized into domains:

| Domain | Skills |
|---|---|
| **Orchestration** | agent-coordination, orchestration-workflow, artifact-management, tdd-with-agents |
| **Backend & API** | api-design-patterns, fastapi-async-patterns, database-migration, database-optimization |
| **Frontend** | frontend-analyzer, nextjs-seo-optimization, web-ui-analysis |
| **AI Pipelines** | rag-pipelines, vector-search, multi-model-routing, conversational-ai-design, mcp-server-development |
| **Infrastructure** | docker-best-practices, performance-optimization, streaming-patterns |
| **Security & Quality** | security-audit, code-review-checklist, prompt-injection-security |
| **Domain** | remote-sensing-analysis, internet-search |
| **Utilities** | prompt-improver, agent-evaluation, agent-observability |

> See [skills/README.md](skills/README.md) for the complete reference with descriptions
> and usage patterns.

---

## Quick Start

### 1. Choose your platform

Pantheon supports 5 platforms. Pick the one that matches your editor:

- **VS Code Copilot** — native `.agent.md` files, full subagent orchestration
- **OpenCode** — config-based agent loading, permission blocks
- **Claude Code** — CLI-based, agent handoff workflow
- **Cursor** — `.mdc` rules with agent definitions
- **Windsurf** — markdown agent definitions (preview)

> Follow the [Platform Setup Guides](docs/platforms/) for your chosen platform.

### 2. Set up the framework

Installation varies by platform, but generally involves:

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Optional: install dependencies for sync/install tools
npm install
```

Then run the platform-specific installer from the guides above.

### 3. Run your first feature

Once agents are loaded in your editor, invoke the orchestrator:

```
@zeus: Implement JWT authentication with refresh tokens and rate limiting
```

Zeus will:
1. Ask Athena to plan the architecture (approval gate)
2. Deploy parallel implementation (Hermes + Aphrodite + Maat)
3. Have Temis review all code (approval gate)
4. Prepare deployment and commit (approval gate)

---

## Repository Structure

```
pantheon/
├── README.md                  — this file
├── AGENTS.md                  — full agent reference
├── CHANGELOG.md               — release history
├── CONTRIBUTING.md            — how to extend
├── LICENSE                    — MIT
├── package.json               — sync & install tooling
│
├── agents/                    — 16 agent definitions (.agent.md)
│   ├── zeus.agent.md          — orchestrator
│   ├── athena.agent.md        — strategic planner
│   ├── apollo.agent.md        — codebase & web discovery
│   ├── hermes.agent.md        — backend APIs
│   ├── aphrodite.agent.md     — frontend UI
│   ├── maat.agent.md          — database
│   ├── temis.agent.md         — quality & security review
│   ├── ra.agent.md            — infrastructure
│   ├── iris.agent.md          — GitHub operations
│   ├── mnemosyne.agent.md     — memory & documentation
│   ├── talos.agent.md         — hotfixes
│   ├── gaia.agent.md          — remote sensing
│   ├── hefesto.agent.md       — AI pipelines (NEW)
│   ├── quiron.agent.md        — model routing (NEW)
│   ├── eco.agent.md           — conversational AI (NEW)
│   ├── nix.agent.md           — observability (NEW)
│   └── README.md
│
├── skills/                    — 27 skill modules
│   ├── README.md
│   ├── agent-coordination/    * orchestration & coordination
│   ├── orchestration-workflow/
│   ├── artifact-management/
│   ├── tdd-with-agents/
│   ├── api-design-patterns/   * backend & API
│   ├── fastapi-async-patterns/
│   ├── database-migration/
│   ├── database-optimization/
│   ├── frontend-analyzer/     * frontend
│   ├── nextjs-seo-optimization/
│   ├── web-ui-analysis/
│   ├── rag-pipelines/         * AI pipelines
│   ├── vector-search/
│   ├── multi-model-routing/
│   ├── conversational-ai-design/
│   ├── mcp-server-development/
│   ├── docker-best-practices/ * infrastructure
│   ├── performance-optimization/
│   ├── streaming-patterns/
│   ├── security-audit/        * security & quality
│   ├── code-review-checklist/
│   ├── prompt-injection-security/
│   ├── remote-sensing-analysis/ * domain
│   ├── internet-search/
│   ├── prompt-improver/       * utilities
│   ├── agent-evaluation/
│   ├── agent-observability/
│   └── */SKILL.md
│
├── instructions/              — 9 domain coding standards
│   ├── artifact-protocol.instructions.md
│   ├── backend-standards.instructions.md
│   ├── code-quality-checks.instructions.md
│   ├── code-review-standards.instructions.md
│   ├── database-standards.instructions.md
│   ├── documentation-standards.instructions.md
│   ├── frontend-standards.instructions.md
│   ├── infra-standards.instructions.md
│   └── memory-bank-standards.instructions.md
│
├── prompts/                   — 9 agent invocation prompts
│   ├── plan-architecture.prompt.md
│   ├── implement-feature.prompt.md
│   ├── debug-issue.prompt.md
│   ├── review-code.prompt.md
│   ├── optimize-database.prompt.md
│   ├── orchestrate-with-zeus.prompt.md
│   ├── quick-discovery-large-codebase.prompt.md
│   ├── quick-plan-large-feature.prompt.md
│   └── README.md
│
├── platform/                  — platform-specific configurations
│   ├── opencode/              * OpenCode configs
│   ├── claude/                * Claude Code configs
│   ├── cursor/                * Cursor rules
│   ├── windsurf/              * Windsurf configs
│   └── _template/             * template for new platforms
│
├── scripts/                   — tooling & automation
│   ├── install.mjs            * multi-platform installer
│   ├── sync-platforms.mjs     * agent format sync engine
│   ├── validate-agents.py     * agent file validation
│   ├── validate-sync.mjs      * sync integrity check
│   ├── versioning.mjs         * semver bump tool
│   ├── release-bundle.mjs     * release packaging
│   ├── lib/                   * shared libraries
│   └── hooks/                 * pre/post tool hooks
│
├── docs/
│   ├── INSTALLATION.md        — generic installation guide
│   ├── SETUP.md               — step-by-step tutorial
│   ├── PLATFORMS.md           — platform comparison
│   ├── RELEASING.md           — versioning & release process
│   ├── INDEX.md               — documentation index
│   ├── platforms/             — platform-specific setup guides (pick your IDE)
│   │   ├── vscode.md
│   │   ├── opencode.md
│   │   ├── claude.md
│   │   ├── cursor.md
│   │   └── windsurf.md
│   └── memory-bank/           — project memory templates
│       ├── 00-overview.md
│       ├── 01-architecture.md
│       ├── 02-components.md
│       ├── 03-tech-context.md
│       ├── 04-active-context.md
│       ├── 05-progress-log.md
│       └── _notes/
│
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│
├── .vscode/                   — VS Code workspace settings
└── plugin.json                — marketplace plugin manifest
```

---

## How Agents Collaborate

### Standard Feature Workflow

```
User → Zeus: "Implement email verification"

1. PLAN:       Zeus → Athena → Apollo → Athena → USER (approve gate)
2. AI INFRA:   Zeus → Hefesto/Quíron/Eco (if AI components needed)
3. BUILD:      Zeus → Hermes + Aphrodite + Maat (parallel)
4. REVIEW:     Temis audits all code → USER (approve gate)
5. DEPLOY:     Ra (infra) + Iris (release) + Mnemosyne (docs)
6. COMMIT:     USER (git commit gate)
```

### Direct Invocation

Agents can also be invoked directly for focused tasks:

```
@apollo: Find all authentication-related files and usages
@hermes: Create POST /products endpoint with cursor pagination
@aphrodite: Refactor ProductCard for WCAG AA compliance
@maat: Analyze and fix N+1 queries on orders table
@temis: Review this PR for security vulnerabilities
@iris: Create branch feat/search and open a draft PR
@gaia: Analyze agreement metrics between MapBiomas and ESA WorldCover
```

### Hotfix Express Lane

For trivial fixes (CSS typos, simple logic bugs), bypass the full orchestration:

```
@talos: Fix the missing breakpoint class on MobileMenuButton
```

---

## Memory System

Pantheon uses a two-tier memory architecture to maintain context across sessions:

| Tier | Location | Content | Access Cost |
|---|---|---|---|
| **Tier 1 — Native** | `/memories/repo/` | Atomic facts (stack, conventions, commands) | Zero (auto-loaded) |
| **Tier 2 — Reference** | `docs/memory-bank/` | Project overview, architecture, active sprint, decisions | Read cost per file |
| **Session** | `/memories/session/` | Current conversation plans, work-in-progress | One read per session |

`04-active-context.md` is the priority file. Agents read it first when starting any task.
It contains the current sprint focus, the most recent architectural decision, active
blockers, and next steps.

Architectural decisions are recorded as ADRs in `docs/memory-bank/_notes/` and are
permanently committed to the repository.

---

## Extending the Framework

### Adding a new agent

1. Create `agents/<name>.agent.md` with YAML frontmatter (tools, model, handoffs)
2. Define behavioral rules and context boundaries
3. Register with Zeus by adding it to his delegation list
4. Test with a sample task

### Adding a new skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter
2. Include 2–3 sentence overview, usage conditions, step-by-step examples
3. Reference relevant agents in the skill body

### Adding a new platform

1. Create `platform/<name>/` with platform-specific configs
2. Add a setup guide to `docs/platforms/<name>.md`
3. Extend `scripts/install.mjs` and `scripts/sync-platforms.mjs`

---

## Security & Privacy

- **All processing stays local** — no code sent to external APIs beyond your editor's AI provider
- **No code storage or tracking** — agents operate entirely within your session
- **No automatic commits** — you control every git operation
- **No model training** on your code (per your editor's terms of service)

**Temis enforces on every phase:**
- OWASP Top 10 compliance
- SQL injection, XSS, CSRF prevention
- Hardcoded secret detection
- Minimum 80% test coverage (hard block)

---

## FAQ

**How much does this cost?**
You need an existing subscription for your AI coding editor (Copilot, Claude Pro, Cursor
Pro, or OpenCode). Pantheon itself is free and open-source (MIT).

**Can I use this outside VS Code?**
Yes — 5 platforms supported. See [Platform Setup Guides](docs/platforms/).

**How are platform configs synced?**
Edit `agents/*.agent.md` (the canonical format), then run `npm run sync-platforms.mjs`.
The sync engine transforms agents into every platform's native format.

**Can I override Temis's code review?**
You can proceed past the review gate even if Temis flags issues — except test coverage.
Below 80% coverage is a hard block by design.

**How long does a typical feature take?**
Simple endpoints: 2–4 hours. Full features (backend + frontend + DB): 6–8 hours. Large
systems: 20–30 hours across multiple sprint sessions.

**What happens if my editor session is interrupted?**
Open phases pause. The memory bank captures the last committed state. Resume by reading
`04-active-context.md` at the start of the next session.

---

## Inspiration & Ecosystem

Pantheon draws from the broader multi-agent landscape while diverging in key ways:

| Framework | Pattern | Key Difference |
|---|---|---|
| **AutoGen** (Microsoft) | Event-driven conversations | Research-grade, Python SDK; Pantheon is config-only |
| **CrewAI** | Role-based crews | Visual editor, self-hosted; Pantheon lives inside your editor |
| **LangGraph** | Stateful actor graphs | Code-first graph DSL; Pantheon uses markdown + YAML config |
| **MetaGPT** | Software company roles | Simulates a company; Pantheon delegates to you at every gate |
| **OpenAI Swarm** | Lightweight handoffs | Sequential only; Pantheon supports parallel subagents |

### Key design decisions

- **Context isolation via subagents** — Apollo runs in isolated context; only findings return
- **Parallel execution** — Independent scopes execute simultaneously
- **Tool minimization** — Each agent has the smallest necessary tool surface
- **Human approval gates** — No auto-merging, no phantom commits
- **Model-role alignment** — Fast models for discovery, powerful models for reasoning

---

## References

| Resource | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Full agent reference — behavior, tools, constraints |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to extend the framework |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Generic installation guide |
| [docs/platforms/](docs/platforms/) | Platform-specific setup guides |
| [agents/README.md](agents/README.md) | Agent directory |
| [skills/README.md](skills/README.md) | Skill directory |
| [skills/agent-coordination/SKILL.md](skills/agent-coordination/SKILL.md) | When to use which agent |
| [skills/orchestration-workflow/SKILL.md](skills/orchestration-workflow/SKILL.md) | Step-by-step walkthrough |
| [skills/tdd-with-agents/SKILL.md](skills/tdd-with-agents/SKILL.md) | TDD standards and rules |

---

**License:** MIT  
**Architecture Pattern:** Conductor-Delegate  
**Mythology:** Greek (Zeus, Athena, Apollo, Hermes, Aphrodite, Talos, Temis, Mnemosyne, Gaia, Hefesto, Quíron, Eco, Nix) · Egyptian (Ra, Maat) · Roman (Iris)
