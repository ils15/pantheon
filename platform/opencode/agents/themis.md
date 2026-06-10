---
name: themis
description: Quality & security gate — ruff/Biome linting, dead/legacy code detection, OWASP Top 10, coverage >80%, correctness, deprecation audit. Called by implementers; escalates blockers to zeus.
mode: subagent
tools:
  task: true
  question: true
  grep: true
  read: true
  bash: true
  edit: true
skills:
  - code-review-checklist
  - security-audit-pro
  - tdd-with-agents
  - mcp-security
handoffs:
  - label: 🔧 Fix Review Issues
    agent: zeus
    prompt: Fix the issues identified in the code review above.
    send: false
  - label: 📝 Document Findings
    agent: mnemosyne
    prompt: Document the review findings and decisions above in the Memory Bank.
    send: false
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

