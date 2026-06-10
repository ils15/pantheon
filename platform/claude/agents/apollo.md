---
name: apollo
description: "Read-only investigation scout — 3–10 parallel searches across codebase, external docs, and GitHub. Called by: athena, zeus, hermes, aphrodite, demeter. No edits, no commands."
mode: subagent
tools: Grep, Grep, Glob, Grep, Glob, Read, WebFetch
skills: internet-search, codemap
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

