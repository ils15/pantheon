---
name: hermes
color: "#4A90D9"
hidden: true
description: "Backend specialist — FastAPI, Python, async, TDD (RED→GREEN→REFACTOR), modern Python stdlib, obsolete lib detection. Calls apollo for discovery, sends to themis."
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: subagent
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
    - search/changes
    - context7_resolve-library-id
    - context7_query-docs
permission:
  edit: allow
  bash: allow
handoffs:
    - { label: "Send to Themis", agent: themis, prompt: "Please perform a code review and security audit on these backend changes according to your instructions.", send: true }
agents: ['apollo']
globs:
  - "**/*.py"
  - "**/routers/**/*.py"
  - "**/services/**/*.py"
skills:
  - api-design-patterns
  - fastapi-async-patterns
  - simplify
  - tdd-with-agents
  - test-architecture
  - database-optimization
  - cache-strategy
user-invocable: true
temperature: 0.3
steps: 20
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"

---