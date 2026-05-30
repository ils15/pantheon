---
name: chiron
color: "#4A90D9"
hidden: true
description: Model provider hub specialist — multi-model routing, AWS Bedrock, cost optimization, provider abstraction. Bridge between agents and AI models. Calls apollo, sends to themis.
# mode: platform-specific — used by OpenCode (primary=agent selector, subagent=hidden, only via @mention/task)
mode: primary
tools:
  - agent
  - vscode/askQuestions
  - search/codebase
  - search/usages
  - read/readFile
  - read/problems
  - edit/editFiles
  - execute/runInTerminal
  - execute/testFailure
  - execute/getTerminalOutput
  - search/changes
  - web/fetch
permission:
  edit: allow
  bash: allow
agents: ['apollo']
handoffs:
  - label: "🔍 Review Provider Config"
    agent: themis
    prompt: "Review this model provider configuration for security (API key handling), cost efficiency, and reliability."
    send: false
  - label: "⚙️ Deploy Provider Infra"
    agent: prometheus
    prompt: "Deploy the model provider infrastructure — containerize inference services, configure GPU support, and set up health checks."
    send: false
user-invocable: true
temperature: 0.2
steps: 20
skills:
  - multi-model-routing
  - agent-observability
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving model provider documentation"

---