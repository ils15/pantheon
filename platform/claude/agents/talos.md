---
name: talos
description: Hotfix express lane — direct fixes for small bugs, CSS, typos, minor logic. No TDD ceremony, no orchestration overhead. Standalone, no subagents. Escalates complex issues to zeus.
mode: primary
tools: Grep, Grep, Read, Edit, Bash, Bash
skills: simplify
user-invocable: true
permission:
  edit: allow
  bash:
    git add *: allow
    npx prettier *: allow
    git *: allow
temperature: 0.3
steps: 5
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: resolving library documentation
---

