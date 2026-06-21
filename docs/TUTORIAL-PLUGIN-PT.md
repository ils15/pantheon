# Tutorial de Instalação — Plugin TUI Sidebar do Pantheon para OpenCode

## O que é

Plugin sidebar que renderiza um painel lateral no OpenCode TUI com informações do Pantheon: versão do projeto, branch git, uso de contexto, custo da sessão, botão de compressão, lista de comandos e agents.

Desenvolvido em SolidJS + JSX, o plugin é carregado diretamente pelo OpenCode TUI via `tui.json`.

## Pré-requisitos

- **OpenCode** com interface TUI instalado e funcionando
- **Pantheon agents** configurados no OpenCode (veja `AGENTS.md` na raiz do projeto)
- **Node.js** 18+ (para instalar dependências e fazer o build)
- **Git** (opcional, para clonar o repositório)

## Instalação passo a passo

### a. Clone o repositório (se não tiver)

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon
```

Se já tiver o repositório clonado, apenas entre na pasta:

```bash
cd pantheon
```

### b. Entre na pasta do plugin

```bash
cd .opencode/plugins/pantheon-tui
```

### c. Instale as dependências

```bash
npm install
```

Isso instala `@opencode-ai/plugin`, `@opentui/core`, `@opentui/solid`, `solid-js` e suas dependências transitivas.

### d. Faça o build

```bash
npm run build
```

O build copia `index.tsx` para `dist/tui.tsx`. A saída esperada é algo como:

```
> pantheon-tui@1.0.0 build
> cp index.tsx dist/tui.tsx
```

### e. Ative no tui.json

Crie ou edite o arquivo `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["/ABSOLUTO/CAMINHO/PARA/pantheon/.opencode/plugins/pantheon-tui/dist/tui.tsx"]
}
```

**IMPORTANTE:** O caminho precisa ser **ABSOLUTO**. Substitua `/ABSOLUTO/CAMINHO/PARA/pantheon` pelo caminho real onde o repositório foi clonado.

Exemplo real:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["/home/joao/pantheon/.opencode/plugins/pantheon-tui/dist/tui.tsx"]
}
```

### f. Reinicie o OpenCode

Feche e abra o OpenCode TUI. O sidebar do Pantheon deve aparecer automaticamente na lateral direita.

## Verificação

Com o OpenCode TUI aberto, olhe para a barra lateral direita. Você deve ver algo como:

```
⚡ Pantheon 0.1.0 · Python 3.12.3
⎇ main

 Context
████████████░░░░░░░░░ 40%
 12.345 / 200.000 · $0.00

 [Compress]

 ▶ Commands (16)
 ▶ Agents (14)
```

Se aparecer, a instalação foi concluída com sucesso.

## Funcionalidades

### Header
Exibe `⚡ Pantheon`, a versão do projeto (lida do campo `version` no `pyproject.toml` da raiz do repositório) e a versão do Python em uso.

### Branch
Mostra o branch git atual com o ícone `⎇`. Se não houver repositório git detectado, a linha não aparece.

### Context bar
Barra de progresso que mostra quantos tokens da sessão atual estão sendo usados em relação ao limite do modelo:

| Cor | Uso | Significado |
|-----|-----|-------------|
| 🟢 Verde | < 70% | Folga confortável |
| 🟡 Amarelo | 70% – 89% | Aproximando do limite |
| 🔴 Vermelho | ≥ 90% | Crítico — recomenda-se comprimir |

Abaixo da barra, exibe `tokens_usados / limite_total · $custo_acumulado`.

### Botão Compress
Dispara a compressão de contexto da sessão atual para liberar tokens. Equivalente ao comando de compressão manual.

### Commands
Lista colapsável dos 16 comandos disponíveis no Pantheon:

| Comando | Descrição |
|---------|-----------|
| `/pantheon` | Council synthesis |
| `/pantheon-status` | System status |
| `/audit` | Full audit |
| `/cancel` | Cancel task |
| `/deepwork` | Deep work mode |
| `/focus` | Focus on scope |
| `/forge` | Forge ahead |
| `/metamorphosis` | Code migration |
| `/mirrordeps` | Mirror dependencies |
| `/optimize` | Optimize code |
| `/ping` | Health check |
| `/praxis` | Practice mode |
| `/reflect` | Reflect on state |
| `/sketch` | Quick prototype |
| `/stop-continuation` | Stop auto-continue |
| `/subtask` | Lightweight task |

### Agents
Lista colapsável dos 14 agents do Pantheon, organizados por tier:

| Tier | Agents |
|------|--------|
| ⚡ Premium | athena, themis (destacados com `✦`) |
| ⚡ Default | zeus, hermes, aphrodite, demeter, prometheus, hephaestus |
| ⚡ Fast | apollo, nyx, gaia, iris, mnemosyne, talos |

## Solução de problemas

| Problema | Causa | Solução |
|----------|-------|---------|
| Plugin não aparece no sidebar | Caminho errado em `tui.json` | Verifique se o caminho é **absoluto** e aponta para `dist/tui.tsx`. Caminhos relativos não funcionam. |
| Versão exibindo como `"dev"` | `pyproject.toml` não encontrado ou sem campo `version` | O arquivo `pyproject.toml` precisa existir na raiz do projeto com `version = "X.Y.Z"`. O plugin procura na pasta acima de `.opencode/`. |
| Erro de dependências | `npm install` não foi executado | Execute `npm install` dentro da pasta do plugin antes do build. |
| Sidebar não aparece no VS Code | Plugin é exclusivo do OpenCode TUI | Este plugin funciona **apenas** no OpenCode TUI. Não funciona em VS Code, Cursor, Windsurf ou outros editores. |
| MacOS: `~/.config/opencode` não existe | OpenCode pode não ter criado o diretório | Crie manualmente: `mkdir -p ~/.config/opencode`. O OpenCode TUI também cria esse diretório na primeira execução. |
| Windows: caminho com barras invertidas | O `tui.json` pode não interpretar `\` corretamente | Use forward slashes (`/`) ou escape com `\\\\`. Exemplo: `C:/Users/joao/pantheon/.opencode/plugins/pantheon-tui/dist/tui.tsx` |
| Erro `Cannot find module` ao iniciar | Dependências não instaladas ou build não executado | Execute `npm install && npm run build` dentro de `.opencode/plugins/pantheon-tui/`. |

## Estrutura do projeto

O plugin está localizado dentro do repositório Pantheon:

```
pantheon/
└── .opencode/
    └── plugins/
        └── pantheon-tui/
            ├── package.json        — Dependências: @opencode-ai/plugin, @opentui/core, @opentui/solid, solid-js
            ├── index.tsx           — Código fonte em SolidJS + JSX
            ├── dist/
            │   └── tui.tsx         — Artefato do build (cópia do index.tsx)
            └── node_modules/       — Dependências instaladas (gitignorado)
```

## Nota

Este plugin é **exclusivo** para o OpenCode TUI. Não funciona em VS Code, Cursor, Claude Code, Windsurf ou qualquer outro editor. O TUI é a única interface que suporta plugins sidebar neste formato.

Para mais informações sobre o Pantheon, consulte a documentação em `docs/` e os arquivos de instrução em `instructions/`.
