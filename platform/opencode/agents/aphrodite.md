---
name: aphrodite
description: Frontend specialist — React 19, TypeScript strict, WCAG accessibility, responsive design, TDD, modern API patterns, deprecated npm detection. Calls apollo for discovery, sends to themis for review.
mode: subagent
tools:
  task: true
  question: true
  grep: true
  read: true
  edit: true
  bash: true
skills:
  - frontend-analyzer
  - simplify
  - tdd-with-agents
  - nextjs-seo-optimization
handoffs:
  - label: ➡️ Send to Themis
    agent: themis
    prompt: Please perform a code review and accessibility audit on these frontend changes according to your instructions.
    send: true
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.5
steps: 25
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving React/TypeScript documentation
  - name: playwright
    tools:
      - browser_screenshotPage
      - browser_navigate
      - browser_snapshot
    when: visual verification and E2E testing
---

