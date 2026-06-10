---
name: hephaestus
description: AI tooling & pipelines specialist — LangChain/LangGraph chains, RAG architecture, vector stores, embedding strategies. Forges AI infrastructure. Calls apollo, sends to themis.
mode: primary
tools: Agent, AskUserQuestion, Grep, Grep, Read, Edit, Bash, Bash, Bash, WebFetch
skills: rag-pipelines, mcp-server-development, agent-evaluation
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

