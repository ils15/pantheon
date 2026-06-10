---
name: nyx
description: Observability & monitoring specialist — OpenTelemetry tracing, token/cost tracking, agent performance analytics, LangSmith integration. Calls apollo for discovery, sends to themis.
mode: subagent
tools:
  task: true
  question: true
  grep: true
  read: true
  edit: true
  bash: true
  webfetch: true
skills:
  - agent-observability
  - agent-evaluation
handoffs:
  - label: 🌀 Report Anomaly
    agent: zeus
    prompt: Observability detected anomalies in agent execution. Review and decide on corrective action.
    send: false
agents:
  - apollo
user-invocable: true
permission:
  edit: ask
  bash: allow
temperature: 0.1
steps: 15
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving observability documentation
---

