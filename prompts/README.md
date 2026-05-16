# Prompt Files

Reusable prompt templates for common development workflows. Each prompt specifies a target agent, required tools, and structured instructions.

## Available Prompts (11)

| Prompt | Agent | Purpose |
|---|---|---|
| **orchestrate-with-zeus** | Zeus | Full feature orchestration — planning, implementation, review, deployment |
| **implement-feature** | Zeus | End-to-end feature implementation with TDD and quality gates |
| **plan-architecture** | Athena | Strategic architecture planning with research and TDD-driven plan |
| **debug-issue** | Apollo | Rapid debugging with parallel file discovery and analysis |
| **audit** | Themis | Comprehensive code review with security audit and coverage analysis |
| **optimize-database** | Demeter | Database schema, query, and performance optimization |
| **focus** | Zeus | Pin a session goal to keep all work aligned with a single objective |
| **conclave** | Athena | Multi-perspective trade-off analysis — council of specialists synthesizes one recommendation |
| **sketch** | Athena | Interview a rough idea into a structured feature spec (3–5 questions) |
| **subtask** | Zeus | Delegate a bounded child task to a specialist and receive a structured result |
| **mirrordeps** | Apollo | Clone a dependency's source locally so agents can read its implementation directly |

## Usage

### VS Code Copilot Chat
```
/implement-feature Add user authentication with JWT
/plan-architecture Design microservice communication layer
/debug-issue TypeError in user registration flow
/audit Changes in src/auth/
/optimize-database Slow query on orders table
/focus Implement email verification end-to-end with TDD
/conclave Should we use Redis or PostgreSQL for session storage?
/sketch Add a notification system for order shipments
/subtask @hermes Implement POST /products endpoint
/mirrordeps langchain
```

### Claude Code (project-scoped)
```
/project:implement-feature Add user authentication with JWT
/project:audit Changes in src/auth/
/project:focus Implement email verification end-to-end
/project:conclave Redis vs PostgreSQL for session storage?
/project:sketch Add notification system
/project:mirrordeps langchain
```

> **Note:** `/forge` (model tier selection) is OpenCode-only — not available on VS Code or Claude Code.
