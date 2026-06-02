---
name: demeter
color: "#4A90D9"
hidden: true
description: "Database specialist — SQLAlchemy 2.0, Alembic, query optimization, N+1 prevention, TDD migrations, modern DB libs. Calls apollo for discovery, sends to themis."
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: primary
tools:
  - agent
  - search/codebase
  - search/usages
  - read/readFile
  - read/problems
  - edit/editFiles
  - execute/runInTerminal
  - execute/testFailure
  - execute/getTerminalOutput
  - context7_resolve-library-id
  - context7_query-docs
permission:
  edit: allow
  bash: allow
agents: ['apollo']
handoffs:
  - label: "➡️ Send to Themis"
    agent: themis
    prompt: "Please perform a code review and security audit on these database/migration changes."
    send: true
user-invocable: true
temperature: 0.2
steps: 20
skills:
  - database-migration
  - database-optimization
  - cache-strategy
  - simplify
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving SQLAlchemy/Alembic documentation"
---