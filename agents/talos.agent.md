---
name: talos
color: "#50C878"
hidden: true
disable_model_invocation: true
description: "Hotfix express lane — direct fixes for small bugs, CSS, typos, minor logic. No TDD ceremony, no orchestration overhead. Standalone, no subagents. Escalates complex issues to zeus."
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: primary
tools:
  - search/codebase
  - search/usages
  - read/readFile
  - read/problems
  - edit/editFiles
  - execute/runInTerminal
  - execute/testFailure
permission:
  edit: allow
  bash:
    "git add *": allow
    "npx prettier *": allow
    "git *": allow
handoffs:
  - label: "🚨 Escalate to Zeus"
    agent: zeus
    prompt: "This fix is more complex than expected and requires multi-agent orchestration. Please take over."
    send: false
user-invocable: true
temperature: 0.3
steps: 30
skills:
  - simplify
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"
---