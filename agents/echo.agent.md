---
name: echo
color: "#4A90D9"
hidden: true
description: Conversational AI specialist — Rasa NLU pipelines, dialogue management, intent classification, entity extraction, multi-turn conversation design. Bridges AI to humans. Calls apollo, sends to themis.
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
  edit: allow
  bash: allow
agents: ['apollo']
handoffs:
  - label: "🔍 Review Conversation Design"
    agent: themis
    prompt: "Review this conversational AI design for NLU accuracy, dialogue coherence, and security (intent hijacking, dialogue poisoning)."
    send: false
  - label: "⚡ Hotfix Conversation"
    agent: talos
    prompt: "Quick fix for this conversational AI issue — intent misclassification, response formatting, or dialogue state bug."
    send: false
user-invocable: true
temperature: 0.4
steps: 20
skills:
  - conversational-ai-design
  - prompt-improver
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving Rasa/NLU documentation"
---