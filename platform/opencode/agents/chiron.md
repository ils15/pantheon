---
name: chiron
description: Model provider hub specialist — multi-model routing, AWS Bedrock, cost optimization, provider abstraction. Bridge between agents and AI models. Calls apollo, sends to themis.
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
  - multi-model-routing
  - agent-observability
handoffs:
  - label: 🔍 Review Provider Config
    agent: themis
    prompt: Review this model provider configuration for security (API key handling), cost efficiency, and reliability.
    send: false
  - label: ⚙️ Deploy Provider Infra
    agent: prometheus
    prompt: Deploy the model provider infrastructure — containerize inference services, configure GPU support, and set up health checks.
    send: false
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

