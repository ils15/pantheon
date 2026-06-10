---
name: chiron
description: Model provider hub specialist — multi-model routing, AWS Bedrock, cost optimization, provider abstraction. Bridge between agents and AI models. Calls apollo, sends to themis.
mode: primary
tools: Agent, AskUserQuestion, Grep, Grep, Read, Edit, Bash, Bash, Bash, WebFetch
skills: multi-model-routing, agent-observability
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.2
steps: 20
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving model provider documentation
---

