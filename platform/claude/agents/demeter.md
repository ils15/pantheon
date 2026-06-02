---
name: demeter
description: Database specialist — SQLAlchemy 2.0, Alembic, query optimization, N+1 prevention, TDD migrations, modern DB libs. Calls apollo for discovery, sends to themis.
mode: primary
tools: Agent, Grep, Grep, Read, Edit, Bash, Bash, Bash
skills: database-migration, database-optimization, cache-strategy, simplify
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
    when: resolving SQLAlchemy/Alembic documentation
---

