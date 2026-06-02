---
name: prometheus
color: "#4A90D9"
hidden: true
description: "Infrastructure specialist — Docker multi-stage builds, docker-compose, CI/CD workflows, health checks, env management, deprecation scans. Calls apollo, sends to themis."
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
  - execute/getTerminalOutput
permission:
  edit: allow
  bash: allow
agents: ['apollo']
handoffs:
  - label: "➡️ Validate Infrastructure"
    agent: themis
    prompt: "Validate these infrastructure changes for best practices, security, and correctness."
    send: false
user-invocable: true
temperature: 0.2
steps: 15
skills:
  - docker-best-practices
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving Docker/CI documentation"
---