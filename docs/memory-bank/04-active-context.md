# 🔄 Active Context

> **Priority file** — agents read this first when starting any task.  
> Keep it current. A stale active context is worse than none.

---

## Current Focus

**Finalização do ciclo de adaptações Pantheon** — 14 adaptações implementadas (5 alta + 5 média + 4 baixa prioridade) completando o ciclo cross-platform de evolução do framework.

**Status**: ✅ Ciclo completo em 2026-05-02

---

## Previous Decision

**Low-Priority Feature Batch + Ciclo de Adaptações Completo**

**Date:** 2026-05-02

**Rationale**: Final 4 items complete the full Pantheon adaptation cycle (cross-platform agent support, GitHub workflow integration, cloud/background execution, plugin marketplace packaging).

**Files Changed**:
- agents/iris.agent.md — Added \`/assign-issue\` Workflow section
- agents/zeus.agent.md — Added Cloud Delegation + Worktree Isolation sections
- platform/opencode/README.md — Added Plugin Installation + Compatibility sections
- docs/memory-bank/04-active-context.md — Updated current focus + decisions (this file)
- docs/memory-bank/05-progress-log.md — Added cycle completion entry

---

## Previous Decision

Adopt the new agent routing mix in custom agent frontmatter and docs: \`GPT-5.4 mini\` should be included wherever \`Claude Haiku 4.5\` remains available as a lightweight option.

**Date:** 2026-04-03

**Rationale**: Copilot now exposes stronger low-latency agent options and VS Code releases 1.111-1.114 added several agent workflow improvements that are worth documenting together: Chat Customizations editor, agent-scoped hooks, debug snapshots/troubleshooting, nested subagents, and semantic-only `#codebase` search.

**Files Changed**:
- [agents/apollo.agent.md](../../agents/apollo.agent.md) — model list updated and formatting normalized
- [agents/mnemosyne.agent.md](../../agents/mnemosyne.agent.md) — model list updated
- [agents/talos.agent.md](../../agents/talos.agent.md) — model list updated
- [agents/themis.agent.md](../../agents/themis.agent.md) — handoff model updated
- [agents/zeus.agent.md](../../agents/zeus.agent.md) — handoff model and docs updated
- [AGENTS.md](../../AGENTS.md) — added feature adoption notes
- [README.md](../../README.md) — updated model table and usage guidance

## Most Recent Decision

Implement **bounded research framework** to accelerate @athena planning (30+min → 5min) and @apollo discovery (20+min → 8min) by enforcing:
1. Hard time limits (5-8 min per phase)
2. Query limits (3-10 searches max)
3. Convergence rule (80% understanding → stop)

**Date:** 2026-03-20

**Rationale**: Large feature planning has become bottleneck. New framework enables incremental delivery (plan-review-implement-approve-plan-next-phase) instead of 30+ min upfront analysis. Applies to all research-heavy agents.

**Files Changed**:
- [docs/RESEARCH-OPTIMIZATION-QUICK-REF.md](RESEARCH-OPTIMIZATION-QUICK-REF.md) — Team quick reference  
- [prompts/quick-plan-large-feature.prompt.md](../prompts/quick-plan-large-feature.prompt.md) — Athena fast-path
- [prompts/quick-discovery-large-codebase.prompt.md](../prompts/quick-discovery-large-codebase.prompt.md) — Apollo fast-path
- agents/athena.agent.md, agents/apollo.agent.md — Updated guidance

---


## Active Blockers

<!-- Anything preventing progress. If none, write "None." -->
- None

---

## Next Steps

1. Consider v3.0.0 release tagging (all 14 adaptations complete)
2. Share plugin installation docs with team
3. Monitor adoption of \`/assign-issue\` workflow
4. Gather feedback on worktree isolation and cloud delegation patterns
5. Plan next development cycle based on team input

---

## References

<!-- Links to related files or decision notes. -->
- [00-overview.md](00-overview.md) — Project scope
- [01-architecture.md](01-architecture.md) — System design
- [_notes/](_notes/_index.md) — Architectural decision records
- [_tasks/](_tasks/_index.md) — Task history

---

> **For agents:** This file reflects the current sprint/feature state.  
> `@mnemosyne` is responsible for keeping it updated after each delivery.  
> When closing a feature, move context to `_notes/` and reset this file.
