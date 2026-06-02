---
name: hermes
description: Backend specialist — FastAPI, Python, async, TDD (RED→GREEN→REFACTOR), modern Python stdlib, obsolete lib detection. Calls apollo for discovery, sends to themis.
mode: subagent
tools: Agent, Grep, Grep, Read, Edit, Bash, Bash, Bash
skills: api-design-patterns, fastapi-async-patterns, simplify, tdd-with-agents, test-architecture, database-optimization, cache-strategy
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.3
steps: 20
globs:
  - "**/*.py"
  - "**/routers/**/*.py"
  - "**/services/**/*.py"
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving library documentation
---

