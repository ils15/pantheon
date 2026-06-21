# NOTE-006: Observability Dashboard Specification

**Status:** Active
**Date:** 2026-05-22

## Purpose

Define the telemetry schema and dashboard layout for cross-platform observability across all 6 Pantheon platforms. This spec enables real-time monitoring of conformance health, sync freshness, and routing integrity.

## Telemetry Schema

### Conformance Metrics (per platform)

| Metric | Source | Target | Collection |
|--------|--------|--------|------------|
| `conformance.pass_rate` | `test-adapter-conformance.mjs` | >= 100% | CI conformance-matrix.yml |
| `conformance.checks_total` | `test-adapter-conformance.mjs` | >= 2000 | CI conformance-matrix.yml |
| `conformance.warnings` | `test-adapter-conformance.mjs` | < 10 | CI conformance-matrix.yml |
| `conformance.platforms_passed` | `test-adapter-conformance.mjs` | 6 | CI conformance-matrix.yml |
| `conformance.platforms_failed` | `test-adapter-conformance.mjs` | 0 | CI conformance-matrix.yml |
| `conformance.last_run` | `test-adapter-conformance.mjs` (--json) | N/A | CI conformance-matrix.yml |

### Sync Health Metrics

| Metric | Source | Target | Collection |
|--------|--------|--------|------------|
| `sync.freshness` | `validate-sync.mjs` (exit code) | 0 | CI sync-check.yml |
| `sync.drift_count` | sync dry-run output | 0 | CI sync-check.yml |
| `sync.stale_platforms` | sync dry-run output | 0 | CI sync-check.yml |
| `sync.last_check` | CI timestamp | N/A | CI sync-check.yml |

### Routing Health Metrics

| Metric | Source | Target | Collection |
|--------|--------|--------|------------|
| `routing.checks_passed` | `validate-routing.mjs` | >= 120 | CI ci.yml |
| `routing.checks_failed` | `validate-routing.mjs` | 0 | CI ci.yml |
| `routing.agents_count` | `validate-routing.mjs` | 18 | CI ci.yml |
| `routing.valid` | `validate-routing.mjs` (exit code) | 0 | CI ci.yml |

## Dimension Labels

All metrics use the following label convention:

| Label | Values | Description |
|-------|--------|-------------|
| `platform` | `opencode`, `claude`, `cline`, `continue`, `cursor`, `windsurf` | Target platform |
| `environment` | `ci`, `local` | Collection environment |
| `branch` | `main`, `feature/*`, `release/*` | Git branch context |

## Dashboard Layout

### Section 1: Platform Health Overview

```
┌─────────────────────────────────────────────────────────────┐
│  PLATFORM HEALTH OVERVIEW                    [Last refresh] │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────┤
│ OpenCode │  Claude  │  Cline   │ Continue │  Cursor  │Windsurf│
│   ✅ 100%│   ✅ 100%│   ⚠️ 98%│   ✅ 100%│   ✅ 100%│   ✅ 100%│
│ 537 checks│ 518 checks│ 510 checks│ 520 checks│ 515 checks│ 512 checks│
│ 14:32 UTC │ 14:32 UTC │ 14:32 UTC │ 14:32 UTC │ 14:32 UTC │ 14:32 UTC │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

- **Card per platform**: OpenCode, Claude, Cline, Continue, Cursor, Windsurf
- **Status indicator**: Green (✅) / Red (❌) / Yellow (⚠️)
- **Pass rate %**: Current conformance pass rate
- **Checks total**: Number of checks passed / total
- **Last conformance run timestamp**: Human-readable relative time

### Section 2: Quality Trends

```
┌─────────────────────────────────────────────────────────────┐
│  QUALITY TRENDS                              [Last 10 runs] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Conformance Pass Rate (all platforms)                      │
│  100% ┤████████████████████████████████████████████████      │
│   95% ┤███████████████████████████████████████               │
│   90% ┤████████████████████████                              │
│       └──────────────────────────────────────────────        │
│         #1   #2   #3   #4   #5   #6   #7   #8   #9   #10    │
│                                                             │
│  Warnings Over Time                                         │
│   15  ┤                                                      │
│   10  ┤         ● ●                                         │
│    5  ┤ ● ● ●       ● ● ● ● ● ●                            │
│    0  └──────────────────────────────────────────────        │
│         #1   #2   #3   #4   #5   #6   #7   #8   #9   #10    │
│                                                             │
│  Sync Drift Count                                           │
│    3  ┤    ●                                                 │
│    2  ┤   ● ●                                               │
│    1  ┤  ●     ●                                            │
│    0  └──────────────────────────────────────────────        │
│         #1   #2   #3   #4   #5   #6   #7   #8   #9   #10    │
└─────────────────────────────────────────────────────────────┘
```

- **Time series chart**: Conformance pass rate over last 10 CI runs
- **Time series chart**: Number of warnings over last 10 CI runs
- **Sync drift count**: Number of platforms out of sync over time
- **Run identifiers**: CI run numbers with links to GitHub Actions logs
- **Threshold lines**: Visual indicators for target values (100% pass, <10 warnings, 0 drift)

### Section 3: Routing Health

```
┌─────────────────────────────────────────────────────────────┐
│  ROUTING HEALTH                              [Last checked] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Checks passed: 122 / 122    ✅ Fully valid           │   │
│  │ Agents: 18 / 18             ✅ All registered         │   │
│  │ Handoffs: 100%              ✅ All reference valid    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Checks passed/total**: Routing validation checks
- **Agent count**: Expected 18 agents present
- **Handoff validity**: Percentage of valid handoff references

### Section 4: Release Readiness

```
┌─────────────────────────────────────────────────────────────┐
│  RELEASE READINESS GATES                    [PR #1234]      │
├─────────────────────────────────────────────────────────────┤
│  ✅ All platforms conformant                                 │
│  ✅ Sync fresh                                               │
│  ✅ Routing valid                                            │
│  ✅ CHANGELOG updated                                        │
│  ✅ Version consistency (package.json == plugin.json)        │
│  ─────────────────────────────────────────────               │
│  OVERALL: ✅ PASS                                            │
└─────────────────────────────────────────────────────────────┘
```

Each gate shows:
- **Green check (✅)**: Gate passed
- **Red X (❌)**: Gate blocked
- **Yellow warning (⚠️)**: Soft check failed (non-blocking)
- **Overall**: PASS / BLOCKED

## Data Collection Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ CI Workflow  │────>│ JSON Artifact│────>│ Collector    │
│ (per trigger)│     │ (per run)    │     │ Script       │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │ Trend DB     │
                                         │ (JSON store) │
                                         └──────┬───────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │ Dashboard    │
                                         │ (renders)    │
                                         └──────────────┘
```

### Artifact Format (per CI run)

The `adapter-conformance.json` artifact from each CI run feeds into the dashboard:

```json
{
  "timestamp": "2026-05-22T14:32:00Z",
  "run_id": "1234567890",
  "summary": {
    "platforms": 6,
    "passed": 6,
    "failed": 0,
    "warned": 1,
    "totalChecks": 3112,
    "totalPass": 3102,
    "totalFail": 0,
    "totalWarn": 10
  },
  "platforms": {
    "opencode": { "checks": 537, "pass": 537, "fail": 0, "warn": 9 },
    "claude": { "checks": 518, "pass": 518, "fail": 0, "warn": 10 },
    "cline": { "checks": 510, "pass": 508, "fail": 0, "warn": 2 },
    "continue": { "checks": 520, "pass": 520, "fail": 0, "warn": 8 },
    "cursor": { "checks": 515, "pass": 515, "fail": 0, "warn": 5 },
    "windsurf": { "checks": 512, "pass": 512, "fail": 0, "warn": 7 }
  }
}
```

## Dashboard Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Data ingestion | GitHub Actions artifacts | Collect conformance JSON per run |
| Trend store | `data/trends/` directory (JSON files) | Historical run data |
| Rendering | GitHub Pages or static site | Dashboard display |
| Refresh | On push to main + manual trigger | Always current |

## Alert Thresholds

| Condition | Severity | Action |
|-----------|----------|--------|
| Any platform pass rate < 100% | HIGH | Block PR merge, notify lead |
| Warnings > 36 (baseline) | MEDIUM | Flag for manual review |
| Sync check fails | HIGH | Block PR merge until sync |
| Routing validation fails | CRITICAL | Block all merges immediately |
| 2+ consecutive runs with warnings trending up | MEDIUM | Investigate root cause |

## Related Documents

- NOTE-007: Quality Trend Report (aggregation and scoring format)
- NOTE-008: Multi-Platform Release Gate Checklist (release procedure)
- NOTE-005: Failure Triage Runbook (incident response)
