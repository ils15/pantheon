# 🧠 Memory Bank Standards & Universal Usage

Esta instrução define como o Memory Bank deve ser iniciado e mantido em qualquer projeto que utilize a arquitetura `copilot-agents`.

## 🎯 Objetivo
O Memory Bank é a "Fonte Única da Verdade" (Single Source of Truth) do projeto. Ele serve para que qualquer agente possa retomar o trabalho com contexto total, mesmo após longos períodos ou troca de modelos.

## 📂 Estrutura Universal (docs/memory-bank/)

Todo projeto novo deve conter estes arquivos básicos:
1. `index.md`: O mapa central.
2. `architecture.md`: Padrões e stack tecnológica.
3. `active-context.md`: O que está acontecendo agora.

## 📝 Como Alimentar a Memória (Exemplos)

### Exemplo 1: Athena planeja um novo recurso
**Ação:** Athena lê o `index.md` e percebe que não há nada sobre o sistema de e-mail atual.
**Comando:** `@apollo Find all email related logic`
**Resultado:** Athena inclui no plano a atualização do Memory Bank:
> "Fase 4: Delegar à Mnemosyne a criação do KI de 'Email System' no Memory Bank."

### Exemplo 2: Hermes finaliza uma API complexa
**Handoff:** `@mnemosyne Documente a nova API de Pagamentos no Memory Bank.`
**Ação da Mnemosyne:** 
- Cria `docs/memory-bank/payments-system.md`.
- Atualiza `index.md` para listar o novo arquivo.
- Atualiza `active-context.md` marcando a entrega.

## 💡 Melhores Práticas
- **Seja Conciso:** O Memory Bank deve ter *Knowledge Items* (conhecimento puro), não logs de chat.
- **Link Entre Arquivos:** Use links markdown relativos para navegar entre KIs.
- **Mantenha Vivo:** Se uma decisão de arquitetura mudar, apague o antigo e escreva o novo IMEDIATAMENTE.
- **Zero Overhead:** Se a informação pode ser extraída do código facilmente, não duplique (ex: não liste todas as funções, liste o *propósito* do módulo).

## 🚀 Guia de Inicialização para Novos Projetos
Ao clonar esta arquitetura para um novo projeto, execute:
1. `mkdir -p docs/memory-bank`
2. Copie os templates iniciais (disponíveis em `skills/artifact-management/`).
3. Peça ao Athena: `@athena Inicialize o Memory Bank para este novo projeto analisando a estrutura atual.`
