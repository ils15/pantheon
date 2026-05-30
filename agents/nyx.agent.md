---
name: nyx
color: "#50C878"
hidden: true
description: Observability & monitoring specialist — OpenTelemetry tracing, token/cost tracking, agent performance analytics, LangSmith integration. Calls apollo for discovery, sends to themis.
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
  - web/fetch
permission:
  edit: ask
  bash: allow
agents: ['apollo']
handoffs:
  - label: "🌀 Report Anomaly"
    agent: zeus
    prompt: "Observability detected anomalies in agent execution. Review and decide on corrective action."
    send: false
user-invocable: true
temperature: 0.1
steps: 15
skills:
  - agent-observability
  - agent-evaluation
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving observability documentation"
---