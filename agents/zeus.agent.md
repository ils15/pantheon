---
name: zeus
color: "#FFD700"
description: "Central orchestrator — never implements. Delegates to: athena, apollo, hermes, aphrodite, demeter, prometheus, themis, iris, mnemosyne, talos, hephaestus, chiron, echo, nyx, argus"
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: primary
tools:
  - agent
  - vscode/askQuestions
  - vscode/runCommand
  - execute/runInTerminal
  - read/readFile
  - search/codebase
  - search/usages
  - web/fetch
  - search/changes
permission:
  edit: deny
  bash: deny
  task:
    "*": allow
agents: ['athena', 'apollo', 'hermes', 'aphrodite', 'demeter', 'themis', 'prometheus', 'iris', 'mnemosyne', 'talos', 'hephaestus', 'chiron', 'echo', 'nyx', 'argus']
handoffs:
  - label: "📋 Plan Feature"
    agent: athena
    prompt: "Create an implementation plan for this feature."
    send: false
  - label: "🔍 Validate Plan"
    agent: themis
    prompt: "Validate the plan before execution: coverage, risks, test strategy, and rollout safety."
    send: false
  - label: "📝 Document Progress"
    agent: mnemosyne
    prompt: "Document the completed work and decisions in the Memory Bank."
    send: false
  - label: "🔧 Build AI Pipelines"
    agent: hephaestus
    prompt: "Build AI tooling pipelines (RAG, LangChain chains, vector search) for this feature."
    send: false
  - label: "🤖 Configure Model Routing"
    agent: chiron
    prompt: "Configure multi-model routing and provider integration for this feature."
    send: false
  - label: "💬 Design Conversational Flows"
    agent: echo
    prompt: "Design conversational AI flows (NLU pipelines, dialogue management) for this feature."
    send: false
  - label: "📊 Set Up Observability"
    agent: nyx
    prompt: "Set up observability, tracing, and cost tracking for this feature."
    send: false
  - label: "👁️ Visual Analysis"
    agent: argus
    prompt: "Analyze visual content (screenshots, PDFs, diagrams, UI mockups) and return structured observations."
    send: false
user-invocable: true
temperature: 0.2
steps: 20
skills:
  - agent-coordination
  - orchestration-workflow
  - session-goal
  - artifact-management
  - internet-search
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"

---