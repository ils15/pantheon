---
name: echo
description: Conversational AI specialist — Rasa NLU pipelines, dialogue management, intent classification, entity extraction, multi-turn conversation design. Bridges AI to humans. Calls apollo, sends to themis.
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
  - conversational-ai-design
  - prompt-improver
handoffs:
  - label: 🔍 Review Conversation Design
    agent: themis
    prompt: Review this conversational AI design for NLU accuracy, dialogue coherence, and security (intent hijacking, dialogue poisoning).
    send: false
  - label: ⚡ Hotfix Conversation
    agent: talos
    prompt: Quick fix for this conversational AI issue — intent misclassification, response formatting, or dialogue state bug.
    send: false
agents:
  - apollo
user-invocable: true
permission:
  edit: allow
  bash: allow
temperature: 0.4
steps: 20
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving Rasa/NLU documentation
---

