---
name: athena
color: "#FFD700"
description: "Strategic planner & architect — research-first, plan-only, never implements. Plans include quality gates (ruff/Biome, dep detection, LTS policy). Calls apollo for discovery."
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: primary
tools:
  - agent
  - vscode/askQuestions
  - search/codebase
  - search/usages
  - search/fileSearch
  - search/textSearch
  - search/listDirectory
  - read/readFile
  - web/fetch
permission:
  edit: deny
  bash: deny
agents: ['apollo', 'themis', 'zeus']
handoffs:
    - { label: "Validate Plan", agent: "themis", prompt: "Validate this implementation plan for completeness, risk coverage, and test strategy before execution.", send: false }
    - { label: "Implement Plan", agent: "zeus", prompt: "Implement the plan outlined above following TDD methodology.", send: false }

user-invocable: true
temperature: 0.1
steps: 15
skills:
  - interview
  - codemap
  - metis-gap-analysis
  - init-deep
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"

---