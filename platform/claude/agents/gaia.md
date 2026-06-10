---
name: gaia
description: Remote sensing domain specialist — satellite image processing, spectral analysis, SAR, change detection, time series, ML/DL classification. Read-only analysis of geospatial data.
mode: primary
tools: Grep, Grep, Glob, Grep, Glob, Read, WebFetch, AskUserQuestion
skills: remote-sensing-analysis, internet-search
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

