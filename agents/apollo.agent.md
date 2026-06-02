---
name: apollo
color: "#50C878"
hidden: true
description: "Read-only investigation scout — 3–10 parallel searches across codebase, external docs, and GitHub. Called by: athena, zeus, hermes, aphrodite, demeter. No edits, no commands."
tools:
  - search/codebase
  - search/usages
  - search/fileSearch
  - search/textSearch
  - search/listDirectory
  - read/readFile
  - web/fetch
  - browser/openBrowserPage
  - browser/navigatePage
  - browser/readPage
  - browser/screenshotPage
permission:
  edit: deny
  bash: deny
handoffs:
  - label: "📊 Return Findings to Zeus"
    agent: zeus
    prompt: "Process these discovery findings and proceed with orchestration."
    send: false
  - label: "📊 Return Findings to Athena"
    agent: athena
    prompt: "Use these findings to refine or complete the plan."
    send: false
# mode: platform-specific — used by OpenCode (subagent=not in selector, only invoked by other agents)
mode: subagent
user-invocable: false
temperature: 0.1
steps: 15
skills:
  - internet-search
  - codemap
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"
  - name: exa
    tools:
      - exa_web_search_exa
      - exa_web_fetch_exa
    when: "web search and content fetching"
---