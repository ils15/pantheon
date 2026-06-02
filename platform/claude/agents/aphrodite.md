---
name: aphrodite
description: Frontend specialist — React 19, TypeScript strict, WCAG accessibility, responsive design, TDD, modern API patterns, deprecated npm detection. Calls apollo for discovery, sends to themis for review.
mode: primary
tools: Agent, AskUserQuestion, Grep, Grep, Read, Edit, Bash, Bash, Bash
skills: frontend-analyzer, simplify, tdd-with-agents, nextjs-seo-optimization
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.5
steps: 20
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

