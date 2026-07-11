# NOTE-005: Failure Triage Runbook

**Status:** Active  
**Date:** 2026-05-22

## Quick Symptom → Action Table
| Symptom | Severity | Likely Cause | Action |
|---------|----------|-------------|--------|
| Conformance check fails | HIGH | Adapter out of sync | `npm run sync && node scripts/test-adapter-conformance.mjs` |
| Agent not found on platform | CRITICAL | Missing from platform output dir | `npm run sync -- <platform>` to regenerate |
| Hook not executing | MEDIUM | Platform doesn't support hooks | Check NOTE-004, use fallback pathway |
| Delegation fails | HIGH | Platform missing agent delegation tool | Verify adapter.json toolMap, re-sync |
| Routing validation fails | HIGH | routing.yml inconsistency | `node scripts/validate-routing.mjs --verbose` |
| E2E flow hangs | MEDIUM | Agent not responding | Check platform agent config, verify tools available |
| Sync check fails | HIGH | Canonical vs generated mismatch | `npm run sync` then re-verify |
| Release gate blocked | CRITICAL | Version mismatch or CHANGELOG missing | Check release-gate.yml requirements |

## Restart Procedures

### Level 1: Quick Restart
```bash
npm run validate
npm run sync:check
node scripts/test-adapter-conformance.mjs
```
If all pass → resume orchestration.

### Level 2: Full Reset
```bash
npm run sync
npm run validate
node scripts/test-adapter-conformance.mjs --verbose
npm test
```
If all pass → resume from last checkpoint.

### Level 3: Platform Reset
```bash
npm run sync -- <platform>
npm run sync:check
node scripts/test-adapter-conformance.mjs --platform <platform>
```

## Escalation Path
1. **Self-healing**: Wave lead triages using this runbook
2. **Zeus escalation**: If blocked > 1 hour, escalate to @zeus
3. **Human engineering**: If platform-specific issue → create GitHub issue with adapter details
4. **Platform vendor**: If platform bug → report to platform maintainers

## Rollback Procedure
```bash
git revert HEAD
npm run sync
node scripts/test-adapter-conformance.mjs
```
