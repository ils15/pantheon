# ADR-0002: Bounded Research Framework

**Status:** Accepted
**Date:** 2026-05-16

## Context
Planning large features took 30+ minutes. Research agents (Athena, Apollo) iterated without limits, seeking "perfect understanding" before producing plans.

## Decision
Hard limits for research:
- **Athena**: max 3 direct searches + delegate to Apollo if complex. 80% convergence OR 5 min → stop
- **Apollo**: max 10 parallel searches per batch, max 5 batches. 8 min limit
- **Output**: structured findings, NOT raw dumps

## Consequences
- Planning time: 30+ min → ~5 min (70%+ improvement)
- Plans are incremental (plan-review-implement-approve)
- Risk: edge cases may be missed → mitigated by Themis review
