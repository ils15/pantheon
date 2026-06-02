---
name: hephaestus
color: "#4A90D9"
hidden: true
description: AI tooling & pipelines specialist — LangChain/LangGraph chains, RAG architecture, vector stores, embedding strategies. Forges AI infrastructure. Calls apollo, sends to themis.
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
  - context7_resolve-library-id
  - context7_query-docs
permission:
  edit: allow
  bash: allow
agents: ['apollo']
handoffs:
  - label: "🔍 Review Pipeline"
    agent: themis
    prompt: "Review this AI pipeline for correctness, security (prompt injection, data exfiltration), and performance."
    send: false
  - label: "📊 Deploy Pipeline"
    agent: prometheus
    prompt: "Deploy this AI pipeline — consider GPU requirements, model volume mounts, and inference health checks."
    send: false
user-invocable: true
temperature: 0.3
steps: 20
skills:
  - rag-pipelines
  - mcp-server-development
  - agent-evaluation
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving LangChain/LangGraph documentation"
---