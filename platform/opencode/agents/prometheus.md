---
name: prometheus
description: Infrastructure specialist — Docker multi-stage builds, docker-compose, CI/CD workflows, health checks, env management, deprecation scans. Calls apollo, sends to themis.
mode: subagent
tools:
  task: true
  question: true
  grep: true
  read: true
  edit: true
  bash: true
skills:
  - docker-best-practices
handoffs:
  - label: ➡️ Validate Infrastructure
    agent: themis
    prompt: Validate these infrastructure changes for best practices, security, and correctness.
    send: false
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.2
steps: 15
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving Docker/CI documentation
---

