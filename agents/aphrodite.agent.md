---
name: aphrodite
color: "#4A90D9"
hidden: true
description: "Frontend specialist — React 19, TypeScript strict, WCAG accessibility, responsive design, TDD, modern API patterns, deprecated npm detection. Calls apollo for discovery, sends to themis for review."
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: primary
tools:
  - agent
  - vscode/askQuestions
  - search/codebase
  - search/usages
  - read/readFile
  - read/problems
  - edit/editFiles
  - execute/runInTerminal
  - execute/testFailure
  - execute/getTerminalOutput
  - search/changes
  - browser/openBrowserPage
  - browser/navigatePage
  - browser/readPage
  - browser/clickElement
  - browser/typeInPage
  - browser/hoverElement
  - browser/dragElement
  - browser/handleDialog
  - browser/screenshotPage
  - context7_resolve-library-id
  - context7_query-docs
permission:
  edit: allow
  bash: allow
agents: ['apollo']
handoffs:
  - label: "➡️ Send to Themis"
    agent: themis
    prompt: "Please perform a code review and accessibility audit on these frontend changes according to your instructions."
    send: true
user-invocable: true
temperature: 0.5
steps: 25
skills:
  - frontend-analyzer
  - simplify
  - tdd-with-agents
  - nextjs-seo-optimization
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving React/TypeScript documentation"
  - name: playwright
    tools:
      - browser_screenshotPage
      - browser_navigate
      - browser_snapshot
    when: "visual verification and E2E testing"

---