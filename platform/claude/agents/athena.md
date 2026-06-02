---
name: athena
description: Strategic planner & architect — research-first, plan-only, never implements. Plans include quality gates (ruff/Biome, dep detection, LTS policy). Calls apollo for discovery.
mode: primary
tools: Agent, AskUserQuestion, Grep, Grep, Glob, Grep, Glob, Read, WebFetch
skills: interview, codemap, metis-gap-analysis, init-deep
agents:
  - apollo
  - themis
  - zeus
user-invocable: true
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
---

