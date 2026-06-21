# TASK-015: Cleanup Commands, MCPs & Agent Invocation Fixes

**Date:** 2026-05-28
**Status:** IN_PROGRESS
**Priority:** HIGH

## Goal
Fix command duplicates, stale files, sync script improvements, MCP config, Context7 agent integration, and documentation updates.

## FASE 1: Limpeza de Comandos
- [x] 1.1 Deletar `commands/council.md`
- [x] 1.2 Fix `commands/subtask.md` — remover `agent: "subtask"`
- [x] 1.3 Enhance `commands/pantheon.md` — synthesis structure
- [x] 1.4 Fix `.claude/commands/subtask.md`
- [x] 1.5 Fix `.claude/commands/pantheon.md` — `agent: agora` → `agent: zeus`
- [x] 1.6 Renomear `.claude/commands/council.md` → `.bak`

## FASE 2: Limpeza de Arquivos Stale
- [x] 2.1 Deletar `platform/opencode/.opencode/commands/council.md` ✅
- [x] 2.2 Atualizar `platform/opencode/.opencode/commands/subtask.md` ✅
- [x] 2.3 Atualizar `platform/opencode/.opencode/commands/pantheon.md` ✅
- [x] 2.4 Deletar `.claude/commands/council.md.bak` ✅
- [x] 2.5 Audit stale files ✅ Themis APPROVED
- [x] 2.6 Deletar `platform/claude/commands/council.md` ✅
- [x] 2.7 Fix `platform/claude/commands/subtask.md` ✅
- [x] 2.8 Deletar `.windsurf/workflows/council.md` ✅
- [x] 2.9 Deletar `platform/windsurf/workflows/council.md` ✅

## FASE 3: Melhoria no Script de Sync
- [x] 3.1 Limpeza stale files deployCommands() ✅
- [x] 3.2 Limpeza stale skills deploySkills() ✅
- [x] 3.3 Flag `--clean` adicionada ✅

## FASE 4: Sincronização
- [x] 4.1 Sync OpenCode --clean ✅
- [x] 4.2 Sync Claude --clean ✅
- [x] 4.3 sync:check validated (7 platforms) ✅

## FASE 5: OpenCode Config
- [x] 5.1 `headerTimeout: 10000` adicionado ✅
- [x] 5.2 Playwright MCP já configurado ✅

## FASE 6: Agentes — Context7
- [x] 6.1 hermes.agent.md + Context7 ✅
- [x] 6.2 aphrodite.agent.md + Context7 ✅
- [x] 6.3 hephaestus.agent.md + Context7 ✅
- [x] 6.4 demeter.agent.md + Context7 ✅

## FASE 7: Documentação
- [x] 7.1 commands.md atualizado ✅
- [x] 7.2 stack.md atualizado ✅

## Extra
- [x] Fix bash syntax sync-platform.sh (line 448) ✅
- [x] Clean stale files em ~/.config/opencode/commands/ ✅
- [x] Themis FINAL review: APPROVED ✅

## Notes
- FASE 1 já concluída antes da criação deste task
- Cada fase é validada por Themis antes de avançar
- Ao final, deletar este task file
