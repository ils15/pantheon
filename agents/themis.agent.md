---
name: themis
color: "#FFD700"
hidden: true
description: "Quality & security gate — ruff/Biome linting, dead/legacy code detection, OWASP Top 10, coverage >80%, correctness, deprecation audit. Called by implementers; escalates blockers to zeus."
# mode: platform-specific — used by OpenCode (subagent=not in selector, only invoked by other agents)
mode: subagent
tools:
  - agent
  - vscode/askQuestions
  - search/codebase
  - search/usages
  - read/readFile
  - read/problems
  - search/changes
  - execute/runInTerminal
  - execute/testFailure
  - edit/editFiles
  - browser/openBrowserPage
  - browser/navigatePage
  - browser/readPage
  - browser/clickElement
  - browser/screenshotPage
permission:
  edit: ask
  bash:
    "pytest *": allow
    "ruff *": allow
    "grep *": allow
    "npx vitest *": allow
    "pip-audit *": allow
    "dep-audit *": allow
agents: ['mnemosyne']
handoffs:
  - label: "🔧 Fix Review Issues"
    agent: zeus
    prompt: "Fix the issues identified in the code review above."
    send: false
  - label: "📝 Document Findings"
    agent: mnemosyne
    prompt: "Document the review findings and decisions above in the Memory Bank."
    send: false
user-invocable: true
temperature: 0.1
steps: 20
skills:
  - code-review-checklist
  - security-audit-pro
  - tdd-with-agents
  - mcp-security
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"
---