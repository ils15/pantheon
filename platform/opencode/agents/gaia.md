---
name: gaia
description: Remote sensing domain specialist — satellite image processing, spectral analysis, SAR, change detection, time series, ML/DL classification. Read-only analysis of geospatial data.
mode: subagent
tools:
  task: true
  grep: true
  glob: true
  list: true
  read: true
  webfetch: true
  question: true
skills:
  - remote-sensing-analysis
  - internet-search
handoffs:
  - label: 🔍 Review Analysis
    agent: themis
    prompt: Review this remote sensing analysis for methodological correctness, data pipeline integrity, and scientific validity.
    send: false
  - label: 📋 Plan Implementation
    agent: athena
    prompt: Create an implementation plan based on this remote sensing analysis.
    send: false
agents:
  - apollo
user-invocable: true
permission:
  edit: deny
  bash: deny
temperature: 0.2
steps: 20
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving geospatial library documentation
---

