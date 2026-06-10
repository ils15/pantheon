---
name: hephaestus
description: AI tooling & pipelines specialist — LangChain/LangGraph chains, RAG architecture, vector stores, embedding strategies. Forges AI infrastructure. Calls apollo, sends to themis.
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
  - rag-pipelines
  - mcp-server-development
  - agent-evaluation
handoffs:
  - label: 🔍 Review Pipeline
    agent: themis
    prompt: Review this AI pipeline for correctness, security (prompt injection, data exfiltration), and performance.
    send: false
  - label: 📊 Deploy Pipeline
    agent: prometheus
    prompt: Deploy this AI pipeline — consider GPU requirements, model volume mounts, and inference health checks.
    send: false
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.3
steps: 20
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving LangChain/LangGraph documentation
---

