<p align="center">
  <img src="images/logo.png" alt="Pantheon Logo" width="500"/>
</p>

<h1 align="center">Pantheon</h1>

<p align="center">
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-3.4.0-blue" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="docs/platforms/"><img src="https://img.shields.io/badge/platforms-vscode|opencode|claude|cursor|windsurf-green" alt="Platforms"></a>
  <a href="agents/README.md"><img src="https://img.shields.io/badge/agents-16-purple" alt="Agents"></a>
  <a href="skills/README.md"><img src="https://img.shields.io/badge/skills-27-orange" alt="Skills"></a>
  <a href="docs/platforms/"><img src="https://img.shields.io/badge/built%20with-copilot|opencode|claude|cursor|windsurf-8250DF" alt="Built with"></a>
</p>

**16 specialized AI agents** that plan, build, review, and deploy features through enforced TDD, persistent project memory, and human approval at every gate.

Stop settling for generalist single-agent coding. Pantheon's conductor-delegate architecture dispatches expert agents with isolated context windows — parallel execution, zero context bleed, and quality gates that block anything below 80% coverage.

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
|--------|-------------|----------|
| Average test coverage | 65–75% | **92%** |
| TDD enforcement | Optional | **Enforced (RED→GREEN→REFACTOR)** |
| Code review cadence | End of feature | **After every phase** |
| Bugs reaching production | 3–5 per feature | **Near zero** |
| Context efficiency | 10–20% reasoning | **70–80% reasoning** |
| Parallel execution | Sequential only | **Multi-agent parallel** |
| Documentation | Manual | **Auto-committed in git** |
| Architecture pattern | Monolithic | **Specialized conductor-delegate** |

> Metrics based on internal benchmarks across 50+ feature implementations in the Pantheon
> test suite. Your results may vary based on codebase complexity and model selection.

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
        Hephaestus["Hephaestus<br/>AI Pipelines<br/>RAG / LangChain"]:::ai
        Chiron["Chiron<br/>Model Routing<br/>Provider Hub"]:::ai
        Echo["Echo<br/>Conversational AI<br/>Rasa NLU"]:::ai
    end

    subgraph Impl["Implementation<br/>Parallel Execution"]
        Hermes["Hermes<br/>Backend APIs"]:::executor
        Aphrodite["Aphrodite<br/>Frontend UI"]:::executor
        Demeter["Demeter<br/>Database"]:::executor
    end

    subgraph Quality["Quality & Observability"]
        Themis["Themis<br/>Security & Coverage Audit"]:::qa
        Nyx["Nyx<br/>Observability<br/>Tracing & Cost"]:::qa
    end

    subgraph Deploy["Deployment & Release"]
        Prometheus["Prometheus<br/>Infrastructure<br/>Docker / CI/CD"]:::infra
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
    Hephaestus & Chiron & Echo --> Zeus

    Zeus -->|"Phase 3 (Implementation)"| Impl
    Hermes & Aphrodite & Demeter --> Quality

    Impl -.->|Nested Apollo| Apollo

    Nyx --> Themis
    Themis --> Gate2
    Gate2 -->|Approved| Zeus

    Zeus -->|"Phase 4 (Deploy & Release)"| Deploy
    Prometheus & Iris & Mnemosyne --> Gate3
    Gate3 -->|"git commit"| User

    User -.->|"/fix"| Express
    User -.->|"/plan-architecture"| Domain
```

---

## Platform Support

Pantheon runs on 5 platforms. Here is how each supports the framework's key features:

| Feature | VS Code | OpenCode | Claude Code | Cursor | Windsurf |
|---------|:-------:|:--------:|:-----------:|:-----:|:--------:|
| Custom Agents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Skills System | ✅ | ✅ | ✅ | ✅ | ✅ |
| Parallel Execution | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| Handoff UI | ✅ | ❌ | ❌ | ❌ | ❌ |
| MCP Servers | ✅ | ✅ | ✅ | ✅ | ❌ |
| Agent Hooks | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Status | ✅ Active | ✅ Active | ✅ Active | ✅ Active | ✅ Active |

- **VS Code**: Best-in-class. Full subagent orchestration, handoff UI, lifecycle hooks.
- **OpenCode**: Near-complete. Permission blocks via `opencode.json`, tool mapping adapter.
- **Claude Code**: CLI-native. Agent handoff workflow, skills via markdown rules.
- **Cursor**: `.mdc` rules with `alwaysApply` and `globs` for Agent mode.
- **Windsurf**: Preview. Markdown-based agent definitions, basic workflow support.

> See [docs/platforms/](docs/platforms/) for setup guides and limitations.

---

### Approval Gates

| Gate | Phase | What happens |
|---|---|---|
| **Gate 1** | After planning | Athena presents a phased TDD plan. You review and approve (or request changes) before any code is written. |
| **Gate 2** | After implementation & review | Themis audits all changed files for OWASP compliance, coverage >80%, and quality. You validate items only you can judge. |
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

```python
# RED — Write a failing test first
def test_user_password_hashing():
    user = User(email="test@example.com", password="secret123")
    assert user.password != "secret123"   # Should be hashed
    assert user.verify_password("secret123")  # Verify works

# Run → FAILS ❌ (password is stored in plaintext)

# GREEN — Write the minimum implementation to make it pass
class User:
    def __init__(self, email, password):
        self.email = email
        self.password = hash_password(password)  # Minimal: just hash

    def verify_password(self, plaintext):
        return verify_hash(plaintext, self.password)

# Run → PASSES ✅

# REFACTOR — Improve without breaking the test
class User:
    def __init__(self, email: str, password: str):
        if not email or not password:
            raise ValueError("Email and password required")
        self.email = email
        self.password = self._hash_password(password)

    @staticmethod
    def _hash_password(plaintext: str) -> str:
        return bcrypt.hashpw(plaintext.encode(), bcrypt.gensalt())

    def verify_password(self, plaintext: str) -> bool:
        return bcrypt.checkpw(plaintext.encode(), self.password)

# Run → STILL PASSES ✅
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

AI Infrastructure (v3)
  ├── Hephaestus — AI pipelines: RAG, LangChain/LangGraph, vector stores
  ├── Chiron — model routing: providers, fallback, cost optimization
  └── Echo — conversational AI: Rasa NLU, dialogue management

Implementation (Parallel Executors)
  ├── Hermes — backend: FastAPI, async, type-safe APIs
  ├── Aphrodite — frontend: React, TypeScript, WCAG accessibility
  └── Demeter — database: SQLAlchemy, Alembic, query optimization

Quality & Observability
  ├── Themis — code review, OWASP security audit, coverage gate
  └── Nyx — observability: OpenTelemetry, token/cost tracking

Infrastructure, Deployment & Release
  ├── Prometheus — infrastructure: Docker, CI/CD, deployment
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
        H["Hephaestus<br/>AI Pipelines"]:::tier1b
        Q["Chiron<br/>Model Routing"]:::tier1b
        E["Echo<br/>Conversational AI"]:::tier1b
    end

    subgraph T2["Implementation"]
        I1["Hermes<br/>Backend"]:::tier2
        I2["Aphrodite<br/>Frontend"]:::tier2
        I3["Demeter<br/>Database"]:::tier2
    end

    subgraph T3["Quality"]
        T1a["Themis<br/>Security & Review"]:::tier3
        N["Nyx<br/>Observability"]:::tier3
    end

    subgraph T4["Infrastructure & Release"]
        R["Prometheus<br/>Infrastructure"]:::tier4
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

<p align="center">
  <img src="images/Schema.png" alt="Pantheon System Architecture" width="100%"/>
</p>

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

## Model Plans

Pantheon uses a **plan-based model configuration** system. Agents declare abstract tiers
(`fast`/`default`/`premium`) instead of hardcoded model names. The actual model depends on
your subscription plan:

```bash
./platform/select-plan.sh list         # See all available plans
./platform/select-plan.sh models       # See agent-to-model assignments
./platform/select-plan.sh status       # Show current active plan
```

| Tier | Purpose | Example Agents | Typical Models |
|------|---------|---------------|----------------|
| `fast` | Quick, cheap ops | Apollo, Iris, Mnemosyne, Talos, Nyx | DeepSeek V4 Flash, Gemini Flash |
| `default` | Balanced quality/speed | Hermes, Aphrodite, Demeter, Prometheus, Echo | Claude Sonnet, GPT-5, Kimi K2 |
| `premium` | Deep reasoning, critical | Zeus, Athena, Themis | Claude Opus, Kimi K2.6, GPT-5.4 |

Plan configurations live in `platform/plans/` with 16+ pre-configured options:

```
platform/plans/
├── opencode-go.json          # OpenCode Go ($10/mo)
├── opencode-zen-free.json    # OpenCode Zen Free
├── copilot-free.json         # GitHub Copilot Free
├── copilot-pro.json          # GitHub Copilot Pro ($10/mo)
├── copilot-pro-plus.json     # GitHub Copilot Pro+ ($39/mo)
├── copilot-student.json      # GitHub Copilot Student (free)
├── copilot-business.json     # GitHub Copilot Business
├── copilot-enterprise.json   # GitHub Copilot Enterprise
├── cursor-hobby.json         # Cursor Hobby (free)
├── cursor-pro.json           # Cursor Pro ($20/mo)
├── cursor-ultra.json         # Cursor Ultra ($200/mo)
├── claude-pro.json           # Claude Pro ($20/mo)
├── claude-max-5x.json        # Claude Max 5x ($100/mo)
├── claude-max-20x.json       # Claude Max 20x ($200/mo)
├── byok-cheap.json           # BYOK (cheap) — Gemini Flash
├── byok-balanced.json        # BYOK (balanced) — Sonnet/Opus
├── byok-best.json            # BYOK (best) — Claude full suite
└── schema.json               # Plan validation schema
```

To select a plan:
```bash
./platform/select-plan.sh copilot-pro    # Activate Copilot Pro plan
./platform/select-plan.sh opencode-go    # Activate OpenCode Go plan
```

---

## Quick Start

### 1. Choose your platform

Pantheon supports 5 platforms. Pick the one that matches your editor:

- **VS Code Copilot** — native `.agent.md` files, full subagent orchestration, lifecycle hooks
- **OpenCode** — config-based agent loading, permission blocks, tool mapping adapter
- **Claude Code** — CLI-based, agent handoff workflow, skills via markdown rules
- **Cursor** — `.mdc` rules with `alwaysApply` and `globs` for Agent mode
- **Windsurf** — markdown agent definitions with workflow support (preview)

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
2. Deploy parallel AI infrastructure + implementation (Hephaestus + Hermes + Aphrodite + Demeter)
3. Have Nyx instrument + Themis review all code (approval gate)
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
├── opencode.json              — OpenCode platform config
├── sync-opencode.sh           — OpenCode sync script
├── plugin.json                — marketplace plugin manifest
│
├── agents/                    — 16 agent definitions (.agent.md)
│   ├── zeus.agent.md          — orchestrator
│   ├── athena.agent.md        — strategic planner
│   ├── apollo.agent.md        — codebase & web discovery
│   ├── hermes.agent.md        — backend APIs
│   ├── aphrodite.agent.md     — frontend UI
│   ├── demeter.agent.md          — database
│   ├── themis.agent.md         — quality & security review
│   ├── prometheus.agent.md            — infrastructure
│   ├── iris.agent.md          — GitHub operations
│   ├── mnemosyne.agent.md     — memory & documentation
│   ├── talos.agent.md         — hotfixes
│   ├── gaia.agent.md          — remote sensing
│   ├── hephaestus.agent.md       — AI pipelines
│   ├── chiron.agent.md        — model routing
│   ├── echo.agent.md           — conversational AI
│   ├── nyx.agent.md           — observability
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
│   ├── plans/                 * model plan configs (16+ plans)
│   │   ├── opencode-go.json
│   │   ├── copilot-pro.json
│   │   ├── claude-pro.json
│   │   ├── cursor-pro.json
│   │   ├── byok-cheap.json
│   │   ├── plan-active.json
│   │   └── schema.json
│   ├── select-plan.sh         * plan selection tool
│   ├── opencode/              * OpenCode configs
│   ├── claude/                * Claude Code configs
│   ├── cursor/                * Cursor rules
│   ├── windsurf/              * Windsurf configs
│   └── _template/             * template for new platforms
│
├── scripts/                   — tooling & automation
│   ├── install.mjs            * multi-platform installer
│   ├── sync-platforms.mjs     * agent format sync engine
│   └── validate-sync.mjs      * sync integrity check
│
├── docs/
│   ├── INSTALLATION.md        — generic installation guide
│   ├── SETUP.md               — step-by-step tutorial
│   ├── PLATFORMS.md           — platform comparison
│   ├── RELEASING.md           — versioning & release process
│   ├── INDEX.md               — documentation index
│   ├── platforms/             — platform-specific setup guides
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
├── template/                  — project templates
│   ├── CLAUDE.md
│   └── README.md
│
├── logs/                      — agent session audit logs
│
├── .github/
│   ├── copilot-instructions.md
│   ├── hooks/                 * lifecycle hooks (security, format, logging)
│   │   ├── security.json      * PreToolUse: blocks destructive ops
│   │   ├── format.json        * PostToolUse: auto-format
│   │   ├── logging.json       * SessionStart: audit trail
│   │   └── README.md
│   └── workflows/             * CI/CD workflows
│       ├── verify.yml
│       ├── release-drafter.yml
│       ├── release.yml
│       ├── validate-agents.yml
│       ├── sync-check.yml
│       ├── tag-version-sync.yml
│       ├── version-recommendation.yml
│       └── pr-conventional-labels.yml
│
├── .vscode/                   — VS Code workspace settings
└── node_modules/              — npm dependencies
```

---

## How Agents Collaborate

### Standard Feature Workflow

```
User → Zeus: "Implement email verification"

1. PLAN:       Zeus → Athena → Apollo → Athena → USER (approve gate 1)
2. AI INFRA:   Zeus → Hephaestus/Chiron/Echo (if AI components needed)
3. BUILD:      Zeus → Hermes + Aphrodite + Demeter (parallel execution)
4. OBSERVE:    Nyx instruments tracing, cost, and metrics
5. REVIEW:     Themis audits all code → USER (approve gate 2)
6. DEPLOY:     Prometheus (infra) + Iris (release) + Mnemosyne (docs)
7. COMMIT:     USER (git commit gate 3)
```

### Direct Invocation

Agents can also be invoked directly for focused tasks:

```
@apollo: Find all authentication-related files and usages
@hermes: Create POST /products endpoint with cursor pagination
@aphrodite: Refactor ProductCard for WCAG AA compliance
@demeter: Analyze and fix N+1 queries on orders table
: Build a RAG pipeline with pgvector for product docs
: Configure AWS Bedrock with Claude fallback
: Design an NLU pipeline for customer support chatbot
: Set up OpenTelemetry tracing for the payment service
: Review this PR for security vulnerabilities
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

### Adding a new model plan

1. Add `<name>.json` to `platform/plans/` following `schema.json`
2. Map tiers (`fast`/`default`/`premium`) to concrete models
3. Activate via `./platform/select-plan.sh <name>`

---

## Security & Privacy

- **All processing stays local** — no code sent to external APIs beyond your editor's AI provider
- **No code storage or tracking** — agents operate entirely within your session
- **No automatic commits** — you control every git operation
- **No model training** on your code (per your editor's terms of service)

**Themis enforces on every phase:**
- OWASP Top 10 compliance
- SQL injection, XSS, CSRF prevention
- Hardcoded secret detection
- Minimum 80% test coverage (hard block)

**Agent hooks enforce at runtime (.github/hooks/):**
- `security.json` — blocks destructive operations (rm -rf, DROP TABLE, TRUNCATE)
- `format.json` — auto-formats modified files (Biome)
- `logging.json` — audit trail of all agent sessions

---

## FAQ

**How much does this cost?**
You need an existing subscription for your AI coding editor (Copilot, Claude Pro, Cursor
Pro, or OpenCode). Pantheon itself is free and open-source (MIT).

**Can I use this outside VS Code?**
Yes — 5 platforms supported (VS Code, OpenCode, Claude Code, Cursor, Windsurf). See
[Platform Setup Guides](docs/platforms/).

**How are platform configs synced?**
Edit `agents/*.agent.md` (the canonical format), then run `npm run sync-platforms.mjs`.
The sync engine transforms agents into every platform's native format.

**Can I override Themis's code review?**
You can proceed past the review gate even if Themis flags issues — except test coverage.
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
| [docs/platforms/](docs/platforms/) | Platform-specific setup guides (5 platforms) |
| [docs/platforms/vscode.md](docs/platforms/vscode.md) | VS Code setup |
| [docs/platforms/opencode.md](docs/platforms/opencode.md) | OpenCode setup |
| [docs/platforms/claude.md](docs/platforms/claude.md) | Claude Code setup |
| [docs/platforms/cursor.md](docs/platforms/cursor.md) | Cursor setup |
| [docs/platforms/windsurf.md](docs/platforms/windsurf.md) | Windsurf setup |
| [agents/README.md](agents/README.md) | Agent directory |
| [skills/README.md](skills/README.md) | Skill directory |
| [platform/plans/](platform/plans/) | Model plan configurations |
| [.github/hooks/](.github/hooks/) | Agent lifecycle hooks |
| [skills/agent-coordination/SKILL.md](skills/agent-coordination/SKILL.md) | When to use which agent |
| [skills/orchestration-workflow/SKILL.md](skills/orchestration-workflow/SKILL.md) | Step-by-step walkthrough |
| [skills/tdd-with-agents/SKILL.md](skills/tdd-with-agents/SKILL.md) | TDD standards and rules |

---

**License:** MIT  
**Architecture Pattern:** Conductor-Delegate  
**Mythology:** Greek (Zeus, Athena, Apollo, Hermes, Aphrodite, Talos, Themis, Mnemosyne, Gaia, Hephaestus, Chiron, Echo, Nyx) · Egyptian (Prometheus, Demeter) · Roman (Iris)
