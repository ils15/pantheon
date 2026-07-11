# Migrating Memory Bank to `.pantheon/`

> **Date:** 2026-07-11
> **Applies to:** Pantheon projects using `docs/memory-bank/` for project memory.

## Why `.pantheon/`?

Pantheon now standardizes all **local, generated, and ephemeral** artifacts under `.pantheon/`:

```
.pantheon/           ← Fully local (gitignored)
├── memory-bank/     ← Project memory (ADRs, tasks, progress, context)
├── deepwork/        ← Deepwork plans and checkpoints
├── code-mode/       ← Orchestration scripts
├── .tmp/            ← Ephemeral artifacts (PLAN, IMPL, REVIEW)
└── tasks/           ← Task system

docs/                ← Versioned user documentation only
├── (installation guides, architecture, platform docs)
```

### Benefits

| Before | After |
|--------|-------|
| Memory bank versioned in git | Memory bank local (`.gitignore`) |
| Cluttered `docs/` with internal + user docs | Clean `docs/` with only user-facing docs |
| No separation between generated/permanent | Clear split: `.pantheon/` = local, `docs/` = permanent |
| `.gitignore` scattered entries | Single `.pantheon/` ignore rule |
| Bleeding internal context into PRs | Memory stays local, only relevant code is committed |

## Migration Steps

### Step 1: Move memory bank

```bash
mv docs/memory-bank .pantheon/memory-bank
```

### Step 2: Update `.gitignore`

Add at the end of `.gitignore`:

```gitignore
# Pantheon local data
.pantheon/
```

Remove any old entries that are now covered:

```gitignore
# Remove these lines if they exist:
.pantheon/deepwork/
docs/memory-bank/.tmp/
docs/memory-bank/.vectordb/
```

### Step 3: Remove from git tracking

```bash
git rm -r --cached docs/memory-bank/
```

This removes the files from tracking **without deleting them** (they're now at `.pantheon/memory-bank/`).

### Step 4: Update scripts and references

Search and replace `docs/memory-bank/` → `.pantheon/memory-bank/` across your codebase:

```bash
# Python scripts
sed -i 's|docs/memory-bank/|.pantheon/memory-bank/|g' scripts/**/*.py

# Shell scripts
sed -i 's|docs/memory-bank/|.pantheon/memory-bank/|g' scripts/**/*.sh

# Markdown docs
sed -i 's|docs/memory-bank/|.pantheon/memory-bank/|g' docs/*.md
```

> ⚠️ Update all: agent files, instructions, skills, commands, routing, and any config that references the old path.

### Step 5: (Optional) Purge from git history

If you want to fully remove `docs/memory-bank/` from your git history:

```bash
# Backup first!
git bundle create /tmp/repo-backup-$(date +%Y%m%d).bundle --all

# Remove from all commits
git filter-repo --path docs/memory-bank/ --invert-paths --force

# Re-add remote and force push
git remote add origin <your-remote-url>
git push origin --force --all
```

> 🚨 **Warning:** This rewrites history. Coordinate with your team. All open PRs will need to be recreated.

### Step 6: Commit

```bash
git add -A
git commit -m "refactor: move memory-bank to .pantheon/ as local data"
```

## Complete `.pantheon/` Structure Reference

```
.pantheon/
├── memory-bank/          ← Project memory (local)
│   ├── 00-project.md
│   ├── 01-active-context.md
│   ├── 02-progress-log.md
│   ├── _notes/           ← ADRs and decisions
│   ├── _tasks/           ← Task records
│   ├── _xref/            ← Cross-references
│   └── .vectordb/        ← ChromaDB cache (gitignored)
├── deepwork/             ← Deepwork plans
├── code-mode/            ← Orchestration scripts (versioned separately in scripts/)
├── .tmp/                 ← Ephemeral artifacts (PLAN, IMPL, REVIEW)
├── learnings/            ← Session learnings
└── tasks/                ← Task system
```

## FAQ

### Will my memory bank be lost?
**No.** All files are preserved — they move from `docs/memory-bank/` to `.pantheon/memory-bank/`. Nothing is deleted.

### Can I still version my memory bank?
If you prefer to keep it in git, keep `docs/memory-bank/` as-is. The `.pantheon/` convention is the recommended standard but not enforced.

### Does this affect platform templates?
**No.** Platform templates (`platform/*/`) keep `docs/memory-bank/` as reference — they are for external projects that may choose their own convention.

### What about other people on my team?
Since `.pantheon/` is gitignored, each developer gets their own local copy. The memory bank is not shared via git — use explicit handoffs for cross-team context.
