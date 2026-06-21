# NOTE-007: Quality Trend Report

**Status:** Active
**Date:** 2026-05-22

## Purpose

Define the standard format for quality trend reports across all 6 Pantheon platforms. Trend reports are generated after each CI run on `main` and serve as the input for release readiness decisions in NOTE-008.

## Report Structure

### Header

```
╔══════════════════════════════════════════════════════════════╗
║  PANTHON QUALITY TREND REPORT                    v3.7.x     ║
║  Report date: 2026-05-22 14:32 UTC                          ║
║  Run ID:      github_run_id=1234567890                      ║
║  Branch:      main (commit abc1234)                         ║
║  Platforms:   6 / 6 checked                                 ║
║  Overall:     ✅ PASS (score: 0.997)                        ║
╚══════════════════════════════════════════════════════════════╝
```

### Per-Platform Section

Each platform gets a summary card:

```
┌──────────────────────────────────────────────────────────────┐
│  OpenCode v3.7.2                          Status: ✅ PASS    │
│  ──────────────────────────────────────────────────────────  │
│  Pass rate:  100.0%   (537 / 537 checks)                    │
│  Warnings:   9                                               │
│  Categories: schema=pass, output=pass, tools=pass, ...       │
│  Failed categories: (none)                                   │
└──────────────────────────────────────────────────────────────┘
```

Status indicators:
- **✅** — Pass rate = 100% and warnings <= baseline (36)
- **⚠️** — Pass rate >= 95% or warnings > baseline
- **❌** — Pass rate < 95% or any check failed

### Full Example Report

```
╔══════════════════════════════════════════════════════════════╗
║  PANTHON QUALITY TREND REPORT                    v3.7.2     ║
║  Report date: 2026-05-22 14:32 UTC                          ║
║  Run ID:      1234567890                                    ║
║  Branch:      main (abc1234)                                ║
║  Platforms:   6 / 6 checked                                 ║
║  Overall:     ✅ PASS (score: 0.997)                        ║
╚══════════════════════════════════════════════════════════════╝

PLATFORMS
────────────────────────────────────────────────────────────────

✅ OpenCode v3.7.2
   Pass rate: 100.0%   (537 / 537 checks, 9 warnings)
   All categories pass

✅ Claude v3.7.2
   Pass rate: 100.0%   (518 / 518 checks, 10 warnings)
   All categories pass

✅ Cline v3.7.2
   Pass rate: 100.0%   (510 / 510 checks, 2 warnings)
   All categories pass

✅ Continue v3.7.2
   Pass rate: 100.0%   (520 / 520 checks, 8 warnings)
   All categories pass

✅ Cursor v3.7.2
   Pass rate: 100.0%   (515 / 515 checks, 5 warnings)
   All categories pass

✅ Windsurf v3.7.2
   Pass rate: 100.0%   (512 / 512 checks, 7 warnings)
   All categories pass

CHECKS SUMMARY
────────────────────────────────────────────────────────────────
Total checks: 3,112  (3,102 passed, 0 failed, 10 warnings)

ROUTING HEALTH
────────────────────────────────────────────────────────────────
Status: ✅ Healthy
Checks: 122 / 122 passed
Agents: 18 / 18 validated

SYNC HEALTH
────────────────────────────────────────────────────────────────
Status: ✅ Fresh
Drift:  0 platforms stale

TREND SCORE
────────────────────────────────────────────────────────────────
Score: 0.997  (GREEN)
Thresholds: >= 0.95 GREEN, >= 0.80 YELLOW, < 0.80 RED
```

## Trend Data Format

For each CI run, capture structured data for historical analysis:

### JSON Record (stored in `data/trends/`)

```json
{
  "run_id": "1234567890",
  "date": "2026-05-22T14:32:00Z",
  "branch": "main",
  "commit": "abc1234def5678",
  "version": "3.7.2",
  "platforms": {
    "opencode": { "pass_rate": 1.0, "checks": 537, "passed": 537, "failed": 0, "warnings": 9 },
    "claude": { "pass_rate": 1.0, "checks": 518, "passed": 518, "failed": 0, "warnings": 10 },
    "cline": { "pass_rate": 1.0, "checks": 510, "passed": 510, "failed": 0, "warnings": 2 },
    "continue": { "pass_rate": 1.0, "checks": 520, "passed": 520, "failed": 0, "warnings": 8 },
    "cursor": { "pass_rate": 1.0, "checks": 515, "passed": 515, "failed": 0, "warnings": 5 },
    "windsurf": { "pass_rate": 1.0, "checks": 512, "passed": 512, "failed": 0, "warnings": 7 }
  },
  "routing_healthy": true,
  "routing_checks": 122,
  "routing_passed": 122,
  "sync_fresh": true,
  "sync_drift_count": 0,
  "sync_stale_platforms": []
}
```

### File Naming Convention

```
data/trends/<YYYY-MM-DD>-<run_id>.json
```

Example: `data/trends/2026-05-22-1234567890.json`

### Index File

A rolling index of the last 100 runs is maintained at:

```
data/trends/_index.json
```

```json
{
  "runs": [
    { "run_id": "1234567890", "date": "2026-05-22T14:32:00Z", "score": 0.997, "overall": "PASS" },
    { "run_id": "1234567889", "date": "2026-05-22T10:15:00Z", "score": 0.995, "overall": "PASS" }
  ],
  "latest_score": 0.997,
  "latest_overall": "PASS",
  "trend": "stable"
}
```

## Scoring Formula

### Composite Score

```
Score = Σ(platform_pass_rate × platform_weight)
```

Where:
- `platform_pass_rate` = platform.checks_passed / platform.checks_total
- Default `platform_weight` = 1/6 (equal weight across all 6 platforms)
- Weights are adjustable for platform-criticality weighting

### Thresholds

| Score Range | Status | Color | Action |
|-------------|--------|-------|--------|
| >= 0.95 | PASS | GREEN | Release permitted |
| >= 0.80 | WARNING | YELLOW | Review required before release |
| < 0.80 | FAIL | RED | Release blocked |

### Example Calculation

```
Platform     Pass Rate  Weight  Contribution
─────────────────────────────────────────────
OpenCode     1.000      0.1667  0.1667
Claude       1.000      0.1667  0.1667
Cline        1.000      0.1667  0.1667
Continue     1.000      0.1667  0.1667
Cursor       1.000      0.1667  0.1667
Windsurf     1.000      0.1667  0.1667
─────────────────────────────────────────────
Score = 1.000  →  GREEN ✅
```

## Collection Method

```
1. Conformance matrix CI job finishes
2. Each platform outputs adapter-conformance.json artifact
3. Conformance summary job aggregates artifacts
4. Summary job produces trend JSON record
5. Collector script (scripts/collect-trend.mjs) archives to data/trends/
6. On every PR to main:
   a. Generate trend report comparing against baseline
   b. Post report as CI job summary
   c. Block merge if score < 0.80
```

### Script Interface

```
# Generate a trend report for the current CI run
node scripts/collect-trend.mjs --report

# Compare against baseline (last known good)
node scripts/collect-trend.mjs --compare

# Archive a trend record manually
node scripts/collect-trend.mjs --import path/to/adapter-conformance.json

# View trend history
node scripts/collect-trend.mjs --history --limit 20
```

## Data Retention

| Data | Retention | Location |
|------|-----------|----------|
| Per-run JSON records | 90 days | `data/trends/<date>-<run>.json` |
| Rolling index | Last 100 runs | `data/trends/_index.json` |
| CI artifacts | 7 days | GitHub Actions (auto-expire) |

## Related Documents

- NOTE-006: Observability Dashboard Specification (visualization layer)
- NOTE-008: Multi-Platform Release Gate Checklist (consumes trend data)
- NOTE-005: Failure Triage Runbook (incident response from regressions)
