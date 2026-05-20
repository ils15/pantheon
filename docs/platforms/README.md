# Pantheon Platforms

Guia de instalação para todas as plataformas suportadas.

---

## Quick Install (all platforms)

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Auto-detect and install for your current platform
node scripts/install.mjs

# Or target a specific project
node scripts/install.mjs --target /path/to/your-project
```

---

## Platform Guides

| Platform | Link | Install Method | Config File(s) |
|---|---|---|---|
| **OpenCode** | [`opencode.md`](opencode.md) | `cp -r platform/opencode/agents/ .opencode/` | `opencode.json` |
| **VS Code Copilot** | [`vscode.md`](vscode.md) | Marketplace plugin `ils15/pantheon` | `.vscode/settings.json` |
| **Claude Code** | [`claude.md`](claude.md) | `cp -r platform/claude/agents/ .claude/` | `.claude/settings.json` |
| **Cursor** | [`cursor.md`](cursor.md) | `cp -r platform/cursor/rules/ .cursor/` | `.cursor/rules/` |
| **Windsurf** | [`windsurf.md`](windsurf.md) | `cp -r platform/windsurf/rules/ .windsurf/rules/` | `.windsurf/rules/` |
| **Continue.dev** | [`continue.md`](continue.md) | `cp -r platform/continue/rules/ .continue/` | `config.yaml` |
| **Cline** | [`cline.md`](cline.md) | Via `scripts/install.mjs cline` | `.clinerules/` |

---

## Step Limits (opencode.json)

Configuração `steps` por agente — controla quantas tool calls o agente pode fazer antes de ser forçado a responder:

| Agente | Steps | Justificativa |
|---|---|---|
| Zeus | 30 | Orquestrador — delega para 5+ subagentes |
| Hermes, Aphrodite | 30 | TDD: test → code → test → refactor → lint |
| Demeter | 20 | Migrações + queries + índices |
| Hephaestus | 25 | RAG pipelines + embeddings + chains |
| Themis | 20 | Revisão multi-arquivo: lint + cobertura + OWASP |
| Athena | 20 | Planejamento + pesquisa + Agora synthesis |
| Chiron, Echo, Gaia | 20 | Configuração multi-provedor |
| **Mnemosyne** | **20** | ADR: ler código → escrever → verificar → commitar |
| Apollo | 15 | Pesquisa paralela (3-10 buscas) |
| Nyx, Argus | 15 | Observabilidade / análise visual |
| Iris | 12 | GitHub: branch → commit → push → PR |
| Prometheus | 15 | Docker + CI/CD |
| **Talos** | **5** | Hotfix rápido (1 arquivo, sem TDD) |

> Ajuste `steps` em `opencode.json` conforme necessário. Cada tool call conta como 1 step.

---

## File Structure (after install)

```
seu-projeto/
├── agents/              # (copiado de pantheon/agents/)
│   ├── zeus.agent.md
│   ├── athena.agent.md
│   └── ...
├── skills/              # (copiado de pantheon/skills/)
├── instructions/        # (copiado de pantheon/instructions/)
├── prompts/             # (copiado de pantheon/prompts/)
└── opencode.json        # Config principal (OpenCode) ou platform config
```
