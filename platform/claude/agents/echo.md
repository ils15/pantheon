---
name: echo
description: Conversational AI specialist — Rasa NLU pipelines, dialogue management, intent classification, entity extraction, multi-turn conversation design. Bridges AI to humans. Calls apollo, sends to themis.
mode: primary
tools: Agent, AskUserQuestion, Grep, Grep, Read, Edit, Bash, Bash, Bash, WebFetch
skills: conversational-ai-design, prompt-improver
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

