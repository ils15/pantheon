# Pantheon Model Routing — Deep Analysis with Per-Plan Fallback Chains

**Generated:** 2026-05-20 10:51
**Plans analyzed:** 17
**Agents:** 16 (4 tiers)
**Data:** LMSYS Arena Coding, SWE-bench Verified, Artificial Analysis (May 2026)

## Token-Based Pricing Strategy

> We are **token-based**. Every API call costs per input + output token.
> For coding: **deepseek-v4-flash** (SWE-bench 79%, $0.28/1M) is sufficient — 89x cheaper than Opus.
> For reasoning: quality matters — use best available.
> **Fallback chains use ONLY models available in the same plan** — no cross-plan mixing.

## Global Model Universe

All unique models across 17 plans (23 total):

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Available in Plans |
|-------|------------|-----------|-----------------|---------|-------------------|
| `claude-opus-4-6` | 1549 | 80.8% | $25.00 | 1200ms | copilot-business, copilot-pro, copilot-student |
| `claude-opus-4-6-20250514` | 1549 | 80.8% | $25.00 | 1200ms | claude-pro |
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | byok-balanced, byok-balanced, byok-best, copilot-business, copilot-enterprise, copilot-free, copilot-free, copilot-pro-plus, copilot-pro-plus, copilot-pro, copilot-student, cursor-pro, cursor-ultra |
| `claude-sonnet-4-6-20250514` | 1521 | 78.5% | $15.00 | 800ms | claude-max-20x, claude-max-5x, claude-pro |
| `deepseek-v4-pro` | 1502 | 80.6% | $3.48 | 800ms | opencode-go |
| `claude-opus-4-7-20250514` | 1498 | 79.5% | $75.00 | 1500ms | claude-max-20x, claude-max-5x |
| `claude-opus-4-7` | 1498 | 79.5% | $75.00 | 1500ms | byok-balanced, byok-best, copilot-enterprise, copilot-pro-plus, cursor-pro, cursor-ultra |
| `claude-haiku-4-5-20250514` | 1478 | 73.3% | $5.00 | 400ms | claude-max-20x, claude-max-20x, claude-max-5x, claude-max-5x, claude-max-5x, claude-max-5x, claude-max-5x, claude-max-5x, claude-max-5x, claude-pro, claude-pro, claude-pro, claude-pro, claude-pro, claude-pro, claude-pro |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | byok-best, byok-best, byok-best, byok-best, byok-best, byok-best, copilot-business, copilot-business, copilot-business, copilot-business, copilot-enterprise, copilot-enterprise, copilot-enterprise, copilot-enterprise, copilot-pro, copilot-pro, copilot-pro, copilot-pro, copilot-student, copilot-student, cursor-pro, cursor-ultra |
| `kimi-k2.6` | 1460 | 77.5% | $7.50 | 900ms | opencode-go |
| `gemini-3.1-pro` | 1454 | 80.6% | $20.00 | 650ms | copilot-business, copilot-enterprise, copilot-pro-plus, copilot-pro |
| `qwen3.6-plus` | 1447 | 75.0% | $4.00 | 600ms | opencode-go |
| `gpt-5.4-mini` | 1440 | 74.5% | $2.50 | 500ms | copilot-business, copilot-business, copilot-enterprise, copilot-enterprise, copilot-pro-plus, copilot-pro, copilot-pro, copilot-student, copilot-student |
| `gemini-3-pro` | 1437 | 77.0% | $12.00 | 600ms | byok-cheap, cursor-pro, cursor-ultra |
| `gemini-3-flash` | 1436 | 74.0% | $3.00 | 300ms | byok-balanced, byok-balanced, byok-balanced, byok-balanced, byok-balanced, byok-balanced, byok-balanced, byok-cheap, byok-cheap, byok-cheap |
| `deepseek-v4-flash` | 1432 | 79.0% | $0.28 | 350ms | opencode-go, opencode-go, opencode-go, opencode-go, opencode-go, opencode-go |
| `kimi-k2.5` | 1430 | 76.0% | $2.50 | 700ms | opencode-go, opencode-zen-free |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | copilot-business, copilot-enterprise, copilot-free, copilot-free, copilot-free, copilot-free, copilot-pro-plus, copilot-pro-plus, copilot-pro-plus, copilot-pro-plus, copilot-pro-plus, copilot-pro-plus, copilot-pro, copilot-student, copilot-student, copilot-student, cursor-hobby, cursor-hobby, cursor-hobby, cursor-hobby, cursor-pro, cursor-pro, cursor-pro, cursor-pro, cursor-pro, cursor-ultra, cursor-ultra, cursor-ultra, cursor-ultra, cursor-ultra |
| `minimax-m2.5` | 1410 | 72.0% | $1.17 | 400ms | opencode-go |
| `minimax-m2.5-free` | 1350 | 68.0% | $0.00 | 400ms | opencode-zen-free, opencode-zen-free, opencode-zen-free |
| `gpt-5.4-nano` | 1350 | 65.0% | $0.40 | 200ms | cursor-pro, cursor-ultra |
| `gpt-5-nano` | 1300 | 60.0% | $0.40 | 150ms | copilot-free, cursor-hobby, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free |
| `gpt-5-nano` | 1300 | 60.0% | $0.40 | 150ms | copilot-free, cursor-hobby, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free, opencode-zen-free |

## 4-Tier Agent Classification

| Tier | Purpose | Agents | Model Strategy |
|------|---------|--------|----------------|
| **1. Premium** | Reasoning, planning, delegation | zeus, athena, themis | Best ELO available in plan |
| **2. Default** | Analysis, advanced tasks | gaia, hephaestus, prometheus | Balance quality + cost |
| **3. Coding** | Day-to-day code generation | hermes, aphrodite, demeter | Cost-efficient, SWE ≥ 73% |
| **4. Fast** | Research, ops, docs, hotfixes | apollo, nyx, iris, mnemosyne, talos | Cheapest, fastest |

## Per-Plan Deep Analysis

---

### byok-balanced (API cost)

**Available models (3):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | gaia override |
| `claude-opus-4-7` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `gemini-3-flash` | 1436 | 74.0% | $3.00 | 300ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-flash` | `N/A` | $45.0000 |
| apollo | fast | `gemini-3-flash` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $1.5000 |
| athena | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `gemini-3-flash` | `N/A` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-flash` | `N/A` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-flash` | `N/A` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-flash` | `N/A` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-flash` | `N/A` | $45.0000 |
| iris | fast | `gemini-3-flash` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $1.5000 |
| mnemosyne | fast | `gemini-3-flash` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $4.5000 |
| nyx | fast | `gemini-3-flash` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $1.5000 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-flash` | `N/A` | $22.5000 |
| talos | fast | `gemini-3-flash` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $0.9000 |
| themis | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `gemini-3-flash` | `N/A` | $150.0000 |
| zeus | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `gemini-3-flash` | `N/A` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `claude-sonnet-4-6` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7` | $0.30 |
| Fast (apollo×5) | 5 | `gemini-3-flash` | $0.01 |
| **TOTAL** | | | **$0.55** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gemini-3-flash` (SWE 74.0%, $3.00/1M).
- **Tier 4 (Fast):** `gemini-3-flash` — Fast (300ms). Good for research/ops.

---

### byok-best (API cost (highest))

**Available models (3):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-opus-4-7` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `N/A` | $45.0000 |
| apollo | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $2.5000 |
| athena | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `N/A` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `N/A` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `N/A` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `N/A` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `N/A` | $45.0000 |
| iris | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $7.5000 |
| nyx | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $2.5000 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `N/A` | $22.5000 |
| talos | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `N/A` | $1.5000 |
| themis | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `N/A` | $150.0000 |
| zeus | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `N/A` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `claude-sonnet-4-6` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7` | $0.30 |
| Fast (apollo×5) | 5 | `claude-haiku-4-5` | $0.01 |
| **TOTAL** | | | **$0.55** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `claude-haiku-4-5` (SWE 73.3%, $5.00/1M).
- **Tier 4 (Fast):** `claude-haiku-4-5` — Fast (400ms). Good for research/ops.

---

### byok-cheap (API cost (lowest))

**Available models (2):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `gemini-3-pro` | 1437 | 77.0% | $12.00 | 600ms | premium tier |
| `gemini-3-flash` | 1436 | 74.0% | $3.00 | 300ms | fast tier |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $9.0000 |
| apollo | fast | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $1.5000 |
| athena | premium | `gemini-3-pro` | `gemini-3-flash` | `N/A` | `N/A` | $24.0000 |
| demeter | coding | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $4.5000 |
| gaia | default | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $6.0000 |
| hephaestus | default | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $9.0000 |
| hermes | coding | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $9.0000 |
| iris | fast | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $1.5000 |
| mnemosyne | fast | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $4.5000 |
| nyx | fast | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $1.5000 |
| prometheus | default | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $4.5000 |
| talos | fast | `gemini-3-flash` | `gemini-3-pro` | `N/A` | `N/A` | $0.9000 |
| themis | premium | `gemini-3-pro` | `gemini-3-flash` | `N/A` | `N/A` | $24.0000 |
| zeus | premium | `gemini-3-pro` | `gemini-3-flash` | `N/A` | `N/A` | $24.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `gemini-3-pro` | $0.02 |
| Coding (hermes) | 1 | `gemini-3-flash` | $0.00 |
| Coding (aphrodite) | 1 | `gemini-3-flash` | $0.01 |
| Coding (demeter) | 1 | `gemini-3-flash` | $0.00 |
| Review (themis) | 2 | `gemini-3-pro` | $0.05 |
| Fast (apollo×5) | 5 | `gemini-3-flash` | $0.01 |
| **TOTAL** | | | **$0.10** |

**Assessment:**

- **Tier 1 (Premium):** `gemini-3-pro` — Strong (ELO 1437). Good for planning and review.
- **Tier 2 (Default):** `gemini-3-flash` — Good (SWE-bench 74.0%). Suitable for most work.
- **Tier 3 (Coding):** uses default — Good (SWE-bench 74.0%). Cost: $3.00/1M.
- **Tier 4 (Fast):** `gemini-3-flash` — Fast (300ms). Good for research/ops.

---

### claude-max-20x ($200/mo)

**Available models (3):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6-20250514` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-opus-4-7-20250514` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `claude-haiku-4-5-20250514` | 1478 | 73.3% | $5.00 | 400ms | fast tier |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| apollo | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $2.5000 |
| athena | premium | `claude-opus-4-7-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $22.5000 |
| gaia | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| iris | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $7.5000 |
| nyx | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $2.5000 |
| prometheus | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $22.5000 |
| talos | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $1.5000 |
| themis | premium | `claude-opus-4-7-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $150.0000 |
| zeus | premium | `claude-opus-4-7-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7-20250514` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6-20250514` | $0.02 |
| Coding (aphrodite) | 1 | `claude-sonnet-4-6-20250514` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6-20250514` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7-20250514` | $0.30 |
| Fast (apollo×5) | 5 | `claude-haiku-4-5-20250514` | $0.01 |
| **TOTAL** | | | **$0.55** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7-20250514` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6-20250514` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `claude-haiku-4-5-20250514` (SWE 73.3%, $5.00/1M).
- **Tier 4 (Fast):** `claude-haiku-4-5-20250514` — Fast (400ms). Good for research/ops.

---

### claude-max-5x ($100/mo)

**Available models (3):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6-20250514` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-opus-4-7-20250514` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `claude-haiku-4-5-20250514` | 1478 | 73.3% | $5.00 | 400ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| apollo | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $2.5000 |
| athena | premium | `claude-opus-4-7-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $22.5000 |
| gaia | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| iris | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $7.5000 |
| nyx | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $2.5000 |
| prometheus | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $22.5000 |
| talos | fast | `claude-haiku-4-5-20250514` | `claude-sonnet-4-6-20250514` | `claude-opus-4-7-20250514` | `N/A` | $1.5000 |
| themis | premium | `claude-opus-4-7-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $150.0000 |
| zeus | premium | `claude-opus-4-7-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7-20250514` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6-20250514` | $0.02 |
| Coding (aphrodite) | 1 | `claude-sonnet-4-6-20250514` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6-20250514` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7-20250514` | $0.30 |
| Fast (apollo×5) | 5 | `claude-haiku-4-5-20250514` | $0.01 |
| **TOTAL** | | | **$0.55** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7-20250514` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6-20250514` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `claude-haiku-4-5-20250514` (SWE 73.3%, $5.00/1M).
- **Tier 4 (Fast):** `claude-haiku-4-5-20250514` — Fast (400ms). Good for research/ops.

---

### claude-pro ($20/mo)

**Available models (3):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-opus-4-6-20250514` | 1549 | 80.8% | $25.00 | 1200ms | premium tier |
| `claude-sonnet-4-6-20250514` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-haiku-4-5-20250514` | 1478 | 73.3% | $5.00 | 400ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| apollo | fast | `claude-haiku-4-5-20250514` | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `N/A` | $2.5000 |
| athena | premium | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $50.0000 |
| demeter | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $22.5000 |
| gaia | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6-20250514` | `claude-opus-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $45.0000 |
| iris | fast | `claude-haiku-4-5-20250514` | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `N/A` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5-20250514` | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `N/A` | $7.5000 |
| nyx | fast | `claude-haiku-4-5-20250514` | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `N/A` | $2.5000 |
| prometheus | default | `claude-sonnet-4-6-20250514` | `claude-opus-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $22.5000 |
| talos | fast | `claude-haiku-4-5-20250514` | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `N/A` | $1.5000 |
| themis | premium | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $50.0000 |
| zeus | premium | `claude-opus-4-6-20250514` | `claude-sonnet-4-6-20250514` | `claude-haiku-4-5-20250514` | `N/A` | $50.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-6-20250514` | $0.05 |
| Coding (hermes) | 1 | `claude-sonnet-4-6-20250514` | $0.02 |
| Coding (aphrodite) | 1 | `claude-sonnet-4-6-20250514` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6-20250514` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-6-20250514` | $0.10 |
| Fast (apollo×5) | 5 | `claude-haiku-4-5-20250514` | $0.01 |
| **TOTAL** | | | **$0.25** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-6-20250514` — Excellent (ELO 1549). Top-tier reasoning.
- **Tier 2 (Default):** `claude-sonnet-4-6-20250514` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `claude-haiku-4-5-20250514` (SWE 73.3%, $5.00/1M).
- **Tier 4 (Fast):** `claude-haiku-4-5-20250514` — Fast (400ms). Good for research/ops.

---

### copilot-business ($19/user/mo)

**Available models (6):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-opus-4-6` | 1549 | 80.8% | $25.00 | 1200ms | premium tier |
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | iris override |
| `gemini-3.1-pro` | 1454 | 80.6% | $20.00 | 650ms | aphrodite override |
| `gpt-5.4-mini` | 1440 | 74.5% | $2.50 | 500ms | nyx override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gemini-3.1-pro` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $60.0000 |
| apollo | fast | `gpt-5-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $1.0000 |
| athena | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $50.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $45.0000 |
| iris | fast | `claude-haiku-4-5` | `claude-opus-4-6` | `claude-sonnet-4-6` | `gemini-3.1-pro` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5` | `claude-opus-4-6` | `claude-sonnet-4-6` | `gemini-3.1-pro` | $7.5000 |
| nyx | fast | `gpt-5.4-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $1.2500 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $22.5000 |
| talos | fast | `gpt-5.4-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $0.7500 |
| themis | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $50.0000 |
| zeus | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $50.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-6` | $0.05 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `gemini-3.1-pro` | $0.06 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-6` | $0.10 |
| Fast (apollo×5) | 5 | `claude-haiku-4-5` | $0.01 |
| **TOTAL** | | | **$0.27** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-6` — Excellent (ELO 1549). Top-tier reasoning.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5-mini` (SWE 73.0%, $2.00/1M).
- **Tier 4 (Fast):** `claude-haiku-4-5` — Fast (400ms). Good for research/ops.

---

### copilot-enterprise ($39/user/mo)

**Available models (6):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-opus-4-7` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | iris override |
| `gemini-3.1-pro` | 1454 | 80.6% | $20.00 | 650ms | aphrodite override |
| `gpt-5.4-mini` | 1440 | 74.5% | $2.50 | 500ms | nyx override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gemini-3.1-pro` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $60.0000 |
| apollo | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $1.0000 |
| athena | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3.1-pro` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3.1-pro` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3.1-pro` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3.1-pro` | $45.0000 |
| iris | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | $7.5000 |
| nyx | fast | `gpt-5.4-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $1.2500 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3.1-pro` | $22.5000 |
| talos | fast | `gpt-5.4-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $0.7500 |
| themis | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $150.0000 |
| zeus | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `gemini-3.1-pro` | $0.06 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7` | $0.30 |
| Fast (apollo×5) | 5 | `claude-haiku-4-5` | $0.01 |
| **TOTAL** | | | **$0.57** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5-mini` (SWE 73.0%, $2.00/1M).
- **Tier 4 (Fast):** `claude-haiku-4-5` — Fast (400ms). Good for research/ops.

---

### copilot-free ($0/mo)

**Available models (3):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | zeus override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | fast tier |
| `gpt-5-nano` | 1300 | 60.0% | $0.40 | 150ms | free tier |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $6.0000 |
| apollo | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $1.0000 |
| athena | premium | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $4.0000 |
| demeter | coding | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $3.0000 |
| gaia | default | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $4.0000 |
| hephaestus | default | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $6.0000 |
| hermes | coding | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $6.0000 |
| iris | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $1.0000 |
| mnemosyne | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $3.0000 |
| nyx | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $1.0000 |
| prometheus | default | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $3.0000 |
| talos | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `gpt-5-nano` | `N/A` | $0.6000 |
| themis | premium | `claude-sonnet-4-6` | `gpt-5-mini` | `gpt-5-nano` | `N/A` | $30.0000 |
| zeus | premium | `claude-sonnet-4-6` | `gpt-5-mini` | `gpt-5-nano` | `N/A` | $30.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-sonnet-4-6` | $0.03 |
| Coding (hermes) | 1 | `gpt-5-mini` | $0.00 |
| Coding (aphrodite) | 1 | `gpt-5-mini` | $0.01 |
| Coding (demeter) | 1 | `gpt-5-mini` | $0.00 |
| Review (themis) | 2 | `claude-sonnet-4-6` | $0.06 |
| Fast (apollo×5) | 5 | `gpt-5-mini` | $0.01 |
| **TOTAL** | | | **$0.11** |

**Assessment:**

- **Tier 1 (Premium):** `gpt-5-mini` — Moderate (ELO 1420). May struggle with complex orchestration.
- **Tier 2 (Default):** `gpt-5-mini` — Good (SWE-bench 73.0%). Suitable for most work.
- **Tier 3 (Coding):** uses default — Good (SWE-bench 73.0%). Cost: $2.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5-nano` for better cost ($0.40/1M).
- **Tier 4 (Fast):** `gpt-5-mini` — Moderate (450ms). Acceptable.

---

### copilot-pro-plus ($39/mo)

**Available models (5):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | gaia override |
| `claude-opus-4-7` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `gemini-3.1-pro` | 1454 | 80.6% | $20.00 | 650ms | aphrodite override |
| `gpt-5.4-mini` | 1440 | 74.5% | $2.50 | 500ms | nyx override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gemini-3.1-pro` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gpt-5.4-mini` | $60.0000 |
| apollo | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | $1.0000 |
| athena | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `gemini-3.1-pro` | `gpt-5.4-mini` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | `gpt-5.4-mini` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | `gpt-5.4-mini` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | `gpt-5.4-mini` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | `gpt-5.4-mini` | $45.0000 |
| iris | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | $1.0000 |
| mnemosyne | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | $3.0000 |
| nyx | fast | `gpt-5.4-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | $1.2500 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | `gpt-5.4-mini` | $22.5000 |
| talos | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3.1-pro` | $0.6000 |
| themis | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `gemini-3.1-pro` | `gpt-5.4-mini` | $150.0000 |
| zeus | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `gemini-3.1-pro` | `gpt-5.4-mini` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `gemini-3.1-pro` | $0.06 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7` | $0.30 |
| Fast (apollo×5) | 5 | `gpt-5-mini` | $0.01 |
| **TOTAL** | | | **$0.56** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5-mini` (SWE 73.0%, $2.00/1M).
- **Tier 4 (Fast):** `gpt-5-mini` — Moderate (450ms). Acceptable.

---

### copilot-pro ($10/mo)

**Available models (6):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-opus-4-6` | 1549 | 80.8% | $25.00 | 1200ms | premium tier |
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | iris override |
| `gemini-3.1-pro` | 1454 | 80.6% | $20.00 | 650ms | aphrodite override |
| `gpt-5.4-mini` | 1440 | 74.5% | $2.50 | 500ms | nyx override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gemini-3.1-pro` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $60.0000 |
| apollo | fast | `gpt-5-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $1.0000 |
| athena | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $50.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $45.0000 |
| iris | fast | `claude-haiku-4-5` | `claude-opus-4-6` | `claude-sonnet-4-6` | `gemini-3.1-pro` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5` | `claude-opus-4-6` | `claude-sonnet-4-6` | `gemini-3.1-pro` | $7.5000 |
| nyx | fast | `gpt-5.4-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $1.2500 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $22.5000 |
| talos | fast | `gpt-5.4-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $0.7500 |
| themis | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $50.0000 |
| zeus | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3.1-pro` | $50.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-6` | $0.05 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `gemini-3.1-pro` | $0.06 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-6` | $0.10 |
| Fast (apollo×5) | 5 | `claude-haiku-4-5` | $0.01 |
| **TOTAL** | | | **$0.27** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-6` — Excellent (ELO 1549). Top-tier reasoning.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5-mini` (SWE 73.0%, $2.00/1M).
- **Tier 4 (Fast):** `claude-haiku-4-5` — Fast (400ms). Good for research/ops.

---

### copilot-student ($0 (verified students))

**Available models (5):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-opus-4-6` | 1549 | 80.8% | $25.00 | 1200ms | premium tier |
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | iris override |
| `gpt-5.4-mini` | 1440 | 74.5% | $2.50 | 500ms | nyx override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $45.0000 |
| apollo | fast | `gpt-5-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $1.0000 |
| athena | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $50.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $45.0000 |
| iris | fast | `claude-haiku-4-5` | `claude-opus-4-6` | `claude-sonnet-4-6` | `gpt-5.4-mini` | $2.5000 |
| mnemosyne | fast | `claude-haiku-4-5` | `claude-opus-4-6` | `claude-sonnet-4-6` | `gpt-5.4-mini` | $7.5000 |
| nyx | fast | `gpt-5.4-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $1.2500 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $22.5000 |
| talos | fast | `gpt-5.4-mini` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | $0.7500 |
| themis | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $50.0000 |
| zeus | premium | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gpt-5.4-mini` | $50.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-6` | $0.05 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `claude-sonnet-4-6` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-6` | $0.10 |
| Fast (apollo×5) | 5 | `gpt-5-mini` | $0.01 |
| **TOTAL** | | | **$0.25** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-6` — Excellent (ELO 1549). Top-tier reasoning.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5-mini` (SWE 73.0%, $2.00/1M).
- **Tier 4 (Fast):** `gpt-5-mini` — Moderate (450ms). Acceptable.

---

### cursor-hobby ($0)

**Available models (2):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | fast tier |
| `gpt-5-nano` | 1300 | 60.0% | $0.40 | 150ms | free tier |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $6.0000 |
| apollo | fast | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $1.0000 |
| athena | premium | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $4.0000 |
| demeter | coding | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $3.0000 |
| gaia | default | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $4.0000 |
| hephaestus | default | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $6.0000 |
| hermes | coding | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $6.0000 |
| iris | fast | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $1.0000 |
| mnemosyne | fast | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $3.0000 |
| nyx | fast | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $1.0000 |
| prometheus | default | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $3.0000 |
| talos | fast | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $0.6000 |
| themis | premium | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $4.0000 |
| zeus | premium | `gpt-5-mini` | `gpt-5-nano` | `N/A` | `N/A` | $4.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `gpt-5-mini` | $0.00 |
| Coding (hermes) | 1 | `gpt-5-mini` | $0.00 |
| Coding (aphrodite) | 1 | `gpt-5-mini` | $0.01 |
| Coding (demeter) | 1 | `gpt-5-mini` | $0.00 |
| Review (themis) | 2 | `gpt-5-mini` | $0.01 |
| Fast (apollo×5) | 5 | `gpt-5-mini` | $0.01 |
| **TOTAL** | | | **$0.03** |

**Assessment:**

- **Tier 1 (Premium):** `gpt-5-mini` — Moderate (ELO 1420). May struggle with complex orchestration.
- **Tier 2 (Default):** `gpt-5-mini` — Good (SWE-bench 73.0%). Suitable for most work.
- **Tier 3 (Coding):** uses default — Good (SWE-bench 73.0%). Cost: $2.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5-nano` for better cost ($0.40/1M).
- **Tier 4 (Fast):** `gpt-5-mini` — Moderate (450ms). Acceptable.

---

### cursor-pro ($20/mo)

**Available models (6):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-opus-4-7` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | talos override |
| `gemini-3-pro` | 1437 | 77.0% | $12.00 | 600ms | aphrodite override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | apollo override |
| `gpt-5.4-nano` | 1350 | 65.0% | $0.40 | 200ms | nyx override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gemini-3-pro` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $36.0000 |
| apollo | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $1.0000 |
| athena | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3-pro` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $45.0000 |
| iris | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $1.0000 |
| mnemosyne | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $3.0000 |
| nyx | fast | `gpt-5.4-nano` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $0.2000 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $22.5000 |
| talos | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-pro` | $1.5000 |
| themis | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3-pro` | $150.0000 |
| zeus | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3-pro` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `gemini-3-pro` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7` | $0.30 |
| Fast (apollo×5) | 5 | `gpt-5-mini` | $0.01 |
| **TOTAL** | | | **$0.54** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5.4-nano` (SWE 65.0%, $0.40/1M).
- **Tier 4 (Fast):** `gpt-5-mini` — Moderate (450ms). Acceptable.

---

### cursor-ultra ($200/mo)

**Available models (6):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `claude-sonnet-4-6` | 1521 | 78.5% | $15.00 | 800ms | default tier |
| `claude-opus-4-7` | 1498 | 79.5% | $75.00 | 1500ms | premium tier |
| `claude-haiku-4-5` | 1478 | 73.3% | $5.00 | 400ms | talos override |
| `gemini-3-pro` | 1437 | 77.0% | $12.00 | 600ms | aphrodite override |
| `gpt-5-mini` | 1420 | 73.0% | $2.00 | 450ms | apollo override |
| `gpt-5.4-nano` | 1350 | 65.0% | $0.40 | 200ms | nyx override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `gemini-3-pro` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $36.0000 |
| apollo | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $1.0000 |
| athena | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3-pro` | $150.0000 |
| demeter | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $22.5000 |
| gaia | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $30.0000 |
| hephaestus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $45.0000 |
| hermes | coding | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $45.0000 |
| iris | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $1.0000 |
| mnemosyne | fast | `gpt-5-mini` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $3.0000 |
| nyx | fast | `gpt-5.4-nano` | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | $0.2000 |
| prometheus | default | `claude-sonnet-4-6` | `claude-opus-4-7` | `claude-haiku-4-5` | `gemini-3-pro` | $22.5000 |
| talos | fast | `claude-haiku-4-5` | `claude-sonnet-4-6` | `claude-opus-4-7` | `gemini-3-pro` | $1.5000 |
| themis | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3-pro` | $150.0000 |
| zeus | premium | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5` | `gemini-3-pro` | $150.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `claude-opus-4-7` | $0.15 |
| Coding (hermes) | 1 | `claude-sonnet-4-6` | $0.02 |
| Coding (aphrodite) | 1 | `gemini-3-pro` | $0.04 |
| Coding (demeter) | 1 | `claude-sonnet-4-6` | $0.02 |
| Review (themis) | 2 | `claude-opus-4-7` | $0.30 |
| Fast (apollo×5) | 5 | `gpt-5-mini` | $0.01 |
| **TOTAL** | | | **$0.54** |

**Assessment:**

- **Tier 1 (Premium):** `claude-opus-4-7` — Strong (ELO 1498). Good for planning and review.
- **Tier 2 (Default):** `claude-sonnet-4-6` — Excellent (SWE-bench 78.5%). Strong for analysis.
- **Tier 3 (Coding):** uses default — Excellent (SWE-bench 78.5%). But expensive at $15.00/1M.
  💡 **Recommendation:** Override coding agents to `gpt-5.4-nano` (SWE 65.0%, $0.40/1M).
- **Tier 4 (Fast):** `gpt-5-mini` — Moderate (450ms). Acceptable.

---

### opencode-go ($10/mo)

**Available models (6):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `deepseek-v4-pro` | 1502 | 80.6% | $3.48 | 800ms | gaia override |
| `kimi-k2.6` | 1460 | 77.5% | $7.50 | 900ms | premium tier |
| `qwen3.6-plus` | 1447 | 75.0% | $4.00 | 600ms | aphrodite override |
| `deepseek-v4-flash` | 1432 | 79.0% | $0.28 | 350ms | apollo override |
| `kimi-k2.5` | 1430 | 76.0% | $2.50 | 700ms | default tier |
| `minimax-m2.5` | 1410 | 72.0% | $1.17 | 400ms | nyx override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `qwen3.6-plus` | `deepseek-v4-pro` | `kimi-k2.6` | `deepseek-v4-flash` | $12.0000 |
| apollo | fast | `deepseek-v4-flash` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $0.1400 |
| athena | premium | `kimi-k2.6` | `deepseek-v4-pro` | `qwen3.6-plus` | `deepseek-v4-flash` | $15.0000 |
| demeter | coding | `kimi-k2.5` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $3.7500 |
| gaia | default | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | `deepseek-v4-flash` | $6.9600 |
| hephaestus | default | `kimi-k2.5` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $7.5000 |
| hermes | coding | `kimi-k2.5` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $7.5000 |
| iris | fast | `deepseek-v4-flash` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $0.1400 |
| mnemosyne | fast | `deepseek-v4-flash` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $0.4200 |
| nyx | fast | `minimax-m2.5` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $0.5850 |
| prometheus | default | `kimi-k2.5` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $3.7500 |
| talos | fast | `deepseek-v4-flash` | `deepseek-v4-pro` | `kimi-k2.6` | `qwen3.6-plus` | $0.0840 |
| themis | premium | `kimi-k2.6` | `deepseek-v4-pro` | `qwen3.6-plus` | `deepseek-v4-flash` | $15.0000 |
| zeus | premium | `kimi-k2.6` | `deepseek-v4-pro` | `qwen3.6-plus` | `deepseek-v4-flash` | $15.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `kimi-k2.6` | $0.01 |
| Coding (hermes) | 1 | `kimi-k2.5` | $0.00 |
| Coding (aphrodite) | 1 | `qwen3.6-plus` | $0.01 |
| Coding (demeter) | 1 | `kimi-k2.5` | $0.00 |
| Review (themis) | 2 | `kimi-k2.6` | $0.03 |
| Fast (apollo×5) | 5 | `deepseek-v4-flash` | $0.00 |
| **TOTAL** | | | **$0.07** |

**Assessment:**

- **Tier 1 (Premium):** `kimi-k2.6` — Strong (ELO 1460). Good for planning and review.
- **Tier 2 (Default):** `kimi-k2.5` — Good (SWE-bench 76.0%). Suitable for most work.
- **Tier 3 (Coding):** uses default — Good (SWE-bench 76.0%). Cost: $2.50/1M.
  💡 **Recommendation:** Override coding agents to `deepseek-v4-flash` for better cost ($0.28/1M).
- **Tier 4 (Fast):** `deepseek-v4-flash` — Fast (350ms). Good for research/ops.

---

### opencode-zen-free ($0)

**Available models (3):**

| Model | Coding ELO | SWE-bench | Cost ($/1M out) | Latency | Role |
|-------|------------|-----------|-----------------|---------|------|
| `kimi-k2.5` | 1430 | 76.0% | $2.50 | 700ms | premium tier |
| `minimax-m2.5-free` | 1350 | 68.0% | $0.00 | 400ms | gaia override |
| `gpt-5-nano` | 1300 | 60.0% | $0.40 | 150ms | apollo override |

**Agent assignments with fallback chains (per-plan only):**

| Agent | Tier | Primary | Fallback 1 | Fallback 2 | Fallback 3 | Cost/1K calls |
|-------|------|---------|------------|------------|------------|--------------|
| aphrodite | coding | `minimax-m2.5-free` | `kimi-k2.5` | `gpt-5-nano` | `N/A` | $0.0000 |
| apollo | fast | `gpt-5-nano` | `kimi-k2.5` | `minimax-m2.5-free` | `N/A` | $0.2000 |
| athena | premium | `kimi-k2.5` | `minimax-m2.5-free` | `gpt-5-nano` | `N/A` | $5.0000 |
| demeter | coding | `minimax-m2.5-free` | `kimi-k2.5` | `gpt-5-nano` | `N/A` | $0.0000 |
| gaia | default | `minimax-m2.5-free` | `kimi-k2.5` | `gpt-5-nano` | `N/A` | $0.0000 |
| hephaestus | default | `minimax-m2.5-free` | `kimi-k2.5` | `gpt-5-nano` | `N/A` | $0.0000 |
| hermes | coding | `minimax-m2.5-free` | `kimi-k2.5` | `gpt-5-nano` | `N/A` | $0.0000 |
| iris | fast | `gpt-5-nano` | `kimi-k2.5` | `minimax-m2.5-free` | `N/A` | $0.2000 |
| mnemosyne | fast | `gpt-5-nano` | `kimi-k2.5` | `minimax-m2.5-free` | `N/A` | $0.6000 |
| nyx | fast | `gpt-5-nano` | `kimi-k2.5` | `minimax-m2.5-free` | `N/A` | $0.2000 |
| prometheus | default | `minimax-m2.5-free` | `kimi-k2.5` | `gpt-5-nano` | `N/A` | $0.0000 |
| talos | fast | `gpt-5-nano` | `kimi-k2.5` | `minimax-m2.5-free` | `N/A` | $0.1200 |
| themis | premium | `kimi-k2.5` | `minimax-m2.5-free` | `gpt-5-nano` | `N/A` | $5.0000 |
| zeus | premium | `kimi-k2.5` | `minimax-m2.5-free` | `gpt-5-nano` | `N/A` | $5.0000 |

**Cost per 1000 feature development cycles:**

| Component | Calls | Model | Cost |
|-----------|-------|-------|------|
| Planning (zeus) | 1 | `kimi-k2.5` | $0.01 |
| Coding (hermes) | 1 | `minimax-m2.5-free` | $0.00 |
| Coding (aphrodite) | 1 | `minimax-m2.5-free` | $0.00 |
| Coding (demeter) | 1 | `minimax-m2.5-free` | $0.00 |
| Review (themis) | 2 | `kimi-k2.5` | $0.01 |
| Fast (apollo×5) | 5 | `gpt-5-nano` | $0.00 |
| **TOTAL** | | | **$0.02** |

**Assessment:**

- **Tier 1 (Premium):** `kimi-k2.5` — Strong (ELO 1430). Good for planning and review.
- **Tier 2 (Default):** `minimax-m2.5-free` — Moderate (SWE-bench 68.0%). Consider override.
- **Tier 3 (Coding):** uses default — Below optimal (SWE-bench 68.0).
- **Tier 4 (Fast):** `gpt-5-nano` — Fast (150ms). Good for research/ops.

## Plan Comparison Summary

| Plan | Price | Premium (ELO) | Default (SWE) | Fast (latency) | Total/1K cycles |
|------|-------|---------------|---------------|----------------|----------------|
| byok-balanced | API cost | claude-opus-4-7 (1498) | claude-sonnet-4-6 (78.5%) | gemini-3-flash (300ms) | **$0.59** |
| byok-best | API cost (highest) | claude-opus-4-7 (1498) | claude-sonnet-4-6 (78.5%) | claude-haiku-4-5 (400ms) | **$0.60** |
| byok-cheap | API cost (lowest) | gemini-3-pro (1437) | gemini-3-flash (74.0%) | gemini-3-flash (300ms) | **$0.11** |
| claude-max-20x | $200/mo | claude-opus-4-7-20250514 (1498) | claude-sonnet-4-6-20250514 (78.5%) | claude-haiku-4-5-20250514 (400ms) | **$0.60** |
| claude-max-5x | $100/mo | claude-opus-4-7-20250514 (1498) | claude-sonnet-4-6-20250514 (78.5%) | claude-haiku-4-5-20250514 (400ms) | **$0.60** |
| claude-pro | $20/mo | claude-opus-4-6-20250514 (1549) | claude-sonnet-4-6-20250514 (78.5%) | claude-haiku-4-5-20250514 (400ms) | **$0.30** |
| copilot-business | $19/user/mo | claude-opus-4-6 (1549) | claude-sonnet-4-6 (78.5%) | claude-haiku-4-5 (400ms) | **$0.27** |
| copilot-enterprise | $39/user/mo | claude-opus-4-7 (1498) | claude-sonnet-4-6 (78.5%) | claude-haiku-4-5 (400ms) | **$0.57** |
| copilot-free | $0/mo | gpt-5-mini (1420) | gpt-5-mini (73.0%) | gpt-5-mini (450ms) | **$0.11** |
| copilot-pro-plus | $39/mo | claude-opus-4-7 (1498) | claude-sonnet-4-6 (78.5%) | gpt-5-mini (450ms) | **$0.56** |
| copilot-pro | $10/mo | claude-opus-4-6 (1549) | claude-sonnet-4-6 (78.5%) | claude-haiku-4-5 (400ms) | **$0.27** |
| copilot-student | $0 (verified students) | claude-opus-4-6 (1549) | claude-sonnet-4-6 (78.5%) | gpt-5-mini (450ms) | **$0.29** |
| cursor-hobby | $0 | gpt-5-mini (1420) | gpt-5-mini (73.0%) | gpt-5-mini (450ms) | **$0.04** |
| cursor-pro | $20/mo | claude-opus-4-7 (1498) | claude-sonnet-4-6 (78.5%) | gpt-5-mini (450ms) | **$0.54** |
| cursor-ultra | $200/mo | claude-opus-4-7 (1498) | claude-sonnet-4-6 (78.5%) | gpt-5-mini (450ms) | **$0.54** |
| opencode-go | $10/mo | kimi-k2.6 (1460) | kimi-k2.5 (76.0%) | deepseek-v4-flash (350ms) | **$0.07** |
| opencode-zen-free | $0 | kimi-k2.5 (1430) | minimax-m2.5-free (68.0%) | gpt-5-nano (150ms) | **$0.02** |

*Generated by Pantheon Model Routing Deep Analysis*
*Fallback chains use ONLY models available in each plan — no cross-plan mixing*
