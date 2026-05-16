# 🛠️ Tech Context — Pantheon

> **Framework multi-agente baseado em configuração, não em código runtime.**

---

## Full Stack

| Layer | Technology | Notes |
|---|---|---|
| **Agent Definitions** | Markdown + YAML frontmatter (.agent.md / .md) | 17 agentes |
| **Configuration** | JSON (opencode.json) + JSONC | OpenCode/Copilot/Cursor |
| **Skills** | Markdown (SKILL.md) | 31 skills on-demand |
| **Instructions** | Markdown (.instructions.md) | 9 arquivos de padrões |
| **Prompts** | Markdown (.prompt.md) | 13 templates |
| **Platform Scripts** | Shell + npm | select-plan.sh, npm run sync |
| **Memory** | `/memories/repo/` (fatos) + `docs/memory-bank/` (narrativa) | Two-tier strategy |
| **CI/CD** | GitHub Actions | Lint, test, build |

---

## Local Setup

Nenhum runtime instalável necessário. Pantheon é um framework de configuração:

```bash
# 1. Clone
git clone <repo-url> && cd pantheon

# 2. Agentes já estão em agents/ e ~/.config/opencode/agents/
# (nenhuma instalação de dependência necessária)

# 3. Verificar planos de modelo disponíveis
./platform/select-plan.sh list

# 4. Selecionar um plano
./platform/select-plan.sh opencode-go

# 5. Verificar status
./platform/select-plan.sh status
```

---

## Required Configuration

| Item | Localização | Descrição |
|---|---|---|
| `opencode.json` | `/pantheon/` e `~/.config/opencode/` | Config principal OpenCode |
| Agent `.md` files | `~/.config/opencode/agents/` | Definições dos 17 agentes |
| Agent `.agent.md` files | `agents/` | VS Code Copilot format (mesmos agentes) |
| Platform plans | `platform/plans/` | Modelo por serviço + tier |
| Memory bank | `docs/memory-bank/` | Contexto narrativo do projeto |

---

## Common Commands

```bash
# Listar planos de modelo
./platform/select-plan.sh list

# Selecionar plano
./platform/select-plan.sh opencode-go

# Ver plano ativo
./platform/select-plan.sh status

# Ver modelos por agente
./platform/select-plan.sh models

# Sincronizar config OpenCode (se configurado com repo)
opencode sync status
```

---

## CI/CD Requirements

GitHub Actions com stages: lint (ruff/Biome) → test (pytest/vitest, >80% coverage) → security audit (pip-audit/npm-deprecated-check) → build (se aplicável).

---

> **Note:** Para pré-requisitos de agentes, veja o `README.md`.
