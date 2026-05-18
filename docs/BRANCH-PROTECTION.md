# Branch Protection: `main`

> **Why this matters:** Branch protection prevents force-pushes, requires passing
> CI checks before merge, enforces linear history, and ensures no one (not even
> admins) can bypass the pipeline. Without it, the agent orchestration pipeline
> (Iris → Themis → merge) is just a suggestion, not a guarantee.

---

## Enable Protection via GitHub UI

1. Go to your repo on github.com → **Settings** → **Branches** (sidebar).
2. Click **Add branch protection rule** (or **Add rule**).
3. In **Branch name pattern**, enter: `main`
4. Enable the following checkboxes:

### ✅ Required Settings

| Setting | Checkbox label | Why |
|---|---|---|
| ✅ | **Require a pull request before merging** | All changes go through a PR reviewed by Themis/Iris |
| ✅ | **Require approvals** — set to `1` | At least one reviewer must approve |
| ✅ | **Dismiss stale pull request approvals when new commits are pushed** | Re-review after changes |
| ✅ | **Require status checks to pass before merging** | Block merge if CI fails |
| ✅ | **Require branches to be up to date** | Prevents merge skew |

### 🔍 Required Status Checks

Add these exact check names (they match the Pantheon CI workflows):

- `CI / validate`
- `PR Checks / label-by-title`
- `PR Checks / recommend-version`

> **Tip:** Type each name in the search box and select it. GitHub will auto-suggest
> matching check names once the workflow has run at least once on `main`.

### 🔒 Additional Protections

| Setting | Checkbox label | Value |
|---|---|---|
| ✅ | **Require linear history** | — (on) — Prevents merge commits, keeps history clean |
| ✅ | **Include administrators** | — (on) — Even admins must follow the rules |
| ❌ | **Allow force pushes** | — (off) — Never allow force pushes |
| ❌ | **Allow deletions** | — (off) — Never allow branch deletion |

### 🚀 Apply Rule

Click **Create** (or **Save changes**).

---

## Alternative: `gh` CLI

If you prefer the command line, use the GitHub CLI to apply the same settings:

```bash
gh api repos/:owner/:owner/branches/main/protection \
  --method PUT \
  --field required_status_checks='{
    "strict": true,
    "checks": [
      {"context": "CI / validate"},
      {"context": "PR Checks / label-by-title"},
      {"context": "PR Checks / recommend-version"}
    ]
  }' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  }' \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

> **Note:** Replace `:owner` with your GitHub username or org (`ils15`).
> You need `admin` or `write` permissions on the repo to run this command.

---

## Verification

After enabling protection, verify it's active:

```bash
gh api repos/ils15/pantheon/branches/main/protection --jq '.required_status_checks.contexts'
```

Expected output:
```json
[
  "CI / validate",
  "PR Checks / label-by-title",
  "PR Checks / recommend-version"
]
```

You can also check the GitHub UI: **Settings → Branches → `main` rule** shows
a green "Protection enabled" badge.

---

## How This Enforces the Agent Pipeline

```
                              ┌─────────────────────────────┐
                              │  User pushes to feature/    │
                              │  branch                     │
                              └──────────┬──────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────────┐
                              │  Iris opens Draft PR        │
                              │  → CI / validate runs       │
                              │  → PR Checks / label,       │
                              │    version-recommend        │
                              └──────────┬──────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────────┐
                              │  All status checks pass?    │
                              │  ─── NO ───→ Fix & re-push  │
                              │  ─── YES ───↓               │
                              └──────────┬──────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────────┐
                              │  Themis reviews & approves  │
                              └──────────┬──────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────────┐
                              │  User says "merge"          │
                              │  → Iris merges (squash)     │
                              │  → Linear history preserved │
                              └─────────────────────────────┘
```

Without branch protection, any of these steps can be skipped by a force-push
or a direct commit to `main`. Enable it once and never worry about it again.
