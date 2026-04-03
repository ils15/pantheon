# 🔄 Active Context

> **Priority file** — agents read this first when starting any task.  
> Keep it current. A stale active context is worse than none.

---

## Current Focus

**Copilot Agent Docs Alignment** — Keeping agent configs and documentation aligned with current Copilot/VS Code capabilities, including GPT-5.4 mini routing and recent agent tooling updates.

**Status**: ✅ Model routing updated, docs being aligned, research complete for 1.111-1.114 feature adoption

---

## Previous Decision

Adopt the new agent routing mix in custom agent frontmatter and docs: `GPT-5.4 mini` should be included wherever `Claude Haiku 4.5` remains available as a lightweight option.

**Date:** 2026-04-03

**Rationale**: Copilot now exposes stronger low-latency agent options and VS Code releases 1.111-1.114 added several agent workflow improvements that are worth documenting together: Chat Customizations editor, agent-scoped hooks, debug snapshots/troubleshooting, nested subagents, and semantic-only `#codebase` search.

**Files Changed**:
- [agents/apollo.agent.md](../../agents/apollo.agent.md) — model list updated and formatting normalized
- [agents/mnemosyne.agent.md](../../agents/mnemosyne.agent.md) — model list updated
- [agents/talos.agent.md](../../agents/talos.agent.md) — model list updated
- [agents/temis.agent.md](../../agents/temis.agent.md) — handoff model updated
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

## Most Recent Decision

Implement VS Code Copilot agent lifecycle hooks (March 2026 API) across 5 configuration points:
- **Phase 1**: Security (PreToolUse) + Formatting (PostToolUse) + Session Logging (SessionStart)
- **Phase 2**: Delegation Tracking (SubagentStart/Stop) with interactive handoff buttons

**Date:** 2026-03-15

**Rationale**: Addresses Zeus coordination requirements from `.github/copilot-instructions.md` mandate: "Every implementing agent IMMEDIATELY calls @temis after completing code" — hooks automate this workflow with audit trail and interactive approval gates.

---

## Active Blockers

<!-- Anything preventing progress. If none, write "None." -->
- None

---

## Next Steps

1. Deploy bounded research rules to team (share [RESEARCH-OPTIMIZATION-QUICK-REF.md](RESEARCH-OPTIMIZATION-QUICK-REF.md))
2. Start next sprint with @athena 5-minute planning (use quick-plan-large-feature.prompt)
3. Monitor metrics: plan time, discovery time, execution smoothness
4. After 2 weeks: Review feedback and adjust convergence thresholds if needed
5. Update memory bank on deployment success/learnings

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
