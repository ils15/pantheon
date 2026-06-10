---
name: prometheus
description: Infrastructure specialist — Docker multi-stage builds, docker-compose, CI/CD workflows, health checks, env management, deprecation scans. Calls apollo, sends to themis.
mode: primary
tools: Agent, AskUserQuestion, Grep, Grep, Read, Edit, Bash, Bash
skills: docker-best-practices
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.2
steps: 20
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving Docker/CI documentation
---

