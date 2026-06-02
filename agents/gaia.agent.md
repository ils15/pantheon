---
name: gaia
color: "#4A90D9"
hidden: true
disable_model_invocation: true
description: "Remote sensing domain specialist — satellite image processing, spectral analysis, SAR, change detection, time series, ML/DL classification. Read-only analysis of geospatial data."
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: primary
tools:
  - search/codebase
  - search/usages
  - search/fileSearch
  - search/textSearch
  - search/listDirectory
  - read/readFile
  - web/fetch
  - vscode/askQuestions
permission:
  edit: deny
  bash: deny
agents: ['apollo']
handoffs:
  - label: "🔍 Review Analysis"
    agent: themis
    prompt: "Review this remote sensing analysis for methodological correctness, data pipeline integrity, and scientific validity."
    send: false
  - label: "📋 Plan Implementation"
    agent: athena
    prompt: "Create an implementation plan based on this remote sensing analysis."
    send: false
user-invocable: true
temperature: 0.2
steps: 20
skills:
  - remote-sensing-analysis
  - internet-search
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving geospatial library documentation"
---