# Prompt Files

Reusable prompt templates for common development workflows. Each prompt specifies a target agent, required tools, and structured instructions.

## Available Prompts (6)

| Prompt | Agent | Purpose |
|---|---|---|
| **orchestrate-with-zeus** | Zeus | Full feature orchestration — planning, implementation, review, deployment |
| **implement-feature** | Zeus | End-to-end feature implementation with TDD and quality gates |
| **plan-architecture** | Athena | Strategic architecture planning with research and TDD-driven plan |
| **debug-issue** | Apollo | Rapid debugging with parallel file discovery and analysis |
| **review-code** | Themis | Comprehensive code review with security audit and coverage analysis |
| **optimize-database** | Demeter | Database schema, query, and performance optimization |

## Usage

Invoke via VS Code Copilot Chat:
```
/implement-feature Add user authentication with JWT
/plan-architecture Design microservice communication layer
/debug-issue TypeError in user registration flow
/review-code Changes in src/auth/
/optimize-database Slow query on orders table
```
