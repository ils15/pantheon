---
name: nyx
description: Observability & monitoring specialist — OpenTelemetry tracing, token/cost tracking, agent performance analytics, LangSmith integration. Calls apollo for discovery, sends to themis.
mode: primary
tools: Agent, AskUserQuestion, Grep, Grep, Read, Edit, Bash, Bash, Bash, WebFetch
skills: agent-observability, agent-evaluation
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

