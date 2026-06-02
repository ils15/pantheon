---
name: themis
description: Quality & security gate — ruff/Biome linting, dead/legacy code detection, OWASP Top 10, coverage >80%, correctness, deprecation audit. Called by implementers; escalates blockers to zeus.
mode: subagent
tools: Agent, AskUserQuestion, Grep, Grep, Read, Bash, Bash, Edit
skills: code-review-checklist, security-audit-pro, tdd-with-agents, mcp-security
agents:
  - mnemosyne
user-invocable: true
permission:
  edit: ask
  bash:
    pytest *: allow
    ruff *: allow
    grep *: allow
    npx vitest *: allow
    pip-audit *: allow
    dep-audit *: allow
temperature: 0.1
steps: 20
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving library documentation
---

