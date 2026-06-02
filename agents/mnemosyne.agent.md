---
name: mnemosyne
color: "#50C878"
hidden: true
description: "Memory bank quality owner — initializes docs/memory-bank/, writes ADRs and task records on explicit request. Called by zeus. Never invoked automatically after phases."
# mode: platform-specific — used by OpenCode (subagent=not in selector, only invoked by other agents)
mode: subagent
tools:
  - agent
  - search/codebase
  - search/usages
  - read/readFile
  - edit/editFiles
permission:
  edit: allow
  bash: deny
user-invocable: true
temperature: 0.1
steps: 10
skills:
  - artifact-management
  - handoff
  - task-system
---