---
name: apollo
description: "Read-only investigation scout — 3–10 parallel searches across codebase, external docs, and GitHub. Called by: athena, zeus, hermes, aphrodite, demeter. No edits, no commands."
mode: subagent
tools:
  task: true
  grep: true
  glob: true
  list: true
  read: true
  webfetch: true
skills:
  - internet-search
  - codemap
handoffs:
  - label: 📊 Return Findings to Zeus
    agent: zeus
    prompt: Process these discovery findings and proceed with orchestration.
    send: false
  - label: 📊 Return Findings to Athena
    agent: athena
    prompt: Use these findings to refine or complete the plan.
    send: false
user-invocable: false
permission:
  edit: deny
  bash: deny
temperature: 0.1
steps: 15
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving library documentation
  - name: exa
    tools:
      - exa_web_search_exa
      - exa_web_fetch_exa
    when: web search and content fetching
---

