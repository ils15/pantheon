---
name: iris
description: GitHub operations specialist — branches, pull requests, issues, releases, tags. Called by zeus after review. Never pushes or merges without explicit human approval. Integrates with VS Code GitHub Pull Requests extension.
mode: primary
tools: Agent, AskUserQuestion, Read, Grep, Bash, Bash, WebFetch
skills: artifact-management
agents:
  - mnemosyne
  - themis
user-invocable: true
permission:
  edit: deny
  bash:
    git *: allow
    gh *: allow
temperature: 0.2
steps: 15
---

