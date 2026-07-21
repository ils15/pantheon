---
description: "Checkpoint and session persistence standards for auto-continue and long autonomous sessions"
name: "Checkpoint & Session Persistence Standards"
applyTo: ".pantheon/deepwork/**"
---

# Checkpoint & Session Persistence Standards

Structured file‑based persistence for session checkpoints, heartbeat
tracking, and task state across long autonomous deepwork sessions.

---

## Directory Structure

```
.pantheon/deepwork/<slug>/
├── PLAN.md              # Immutable plan (created at start)
├── STATUS.md            # Human‑readable current state (updated every phase)
├── heartbeat.json       # Lightweight ping (updated every N turns / save)
├── checkpoint-<N>.json  # Full state snapshot (created at phase boundaries)
├── session.json         # Session metadata (created at start, updated on stop)
└── REVIEW.md            # Final Themis review (created at end)
```

---

## File Schemas

### Checkpoint — `checkpoint-<N>.json`

```json
{
  "slug": "string — unique task identifier",
  "phase": "integer — current phase number",
  "turn_count": "integer — total turns elapsed",
  "timestamp": "string — ISO 8601 timestamp of the snapshot",
  "context_hash": "string — first 8 hex chars of SHA‑256(STATUS.md)",
  "version": "integer — schema version (current: 2)"
}
```

| Field          | Type    | Description                                      |
|----------------|---------|--------------------------------------------------|
| `slug`         | string  | Unique task identifier matching the deepwork dir |
| `phase`        | integer | Current phase number                             |
| `turn_count`   | integer | Total turns elapsed since session start          |
| `timestamp`    | string  | ISO 8601 UTC timestamp of the snapshot           |
| `context_hash` | string  | Short content hash of STATUS.md for drift detection |
| `version`      | integer | Schema version for forward compatibility         |

### Heartbeat — `heartbeat.json`

```json
{
  "slug": "string — unique task identifier",
  "last_action": "string — ISO 8601 timestamp of last activity",
  "turn_count": "integer — total turns elapsed",
  "current_phase": "integer — active phase number",
  "status": "string — alive | warning | stalled | paused | completed",
  "next_action": "string — brief description of planned next action"
}
```

| Field          | Type    | Description                                      |
|----------------|---------|--------------------------------------------------|
| `slug`         | string  | Unique task identifier                           |
| `last_action`  | string  | ISO 8601 timestamp of the most recent action     |
| `turn_count`   | integer | Total turns so far                               |
| `current_phase`| integer | Currently active phase number                    |
| `status`       | string  | Agent status: `alive`, `warning`, `stalled`, `paused`, `completed` |
| `next_action`  | string  | Brief description of the next planned action     |

### Session — `session.json`

```json
{
  "task_id": "string — same as slug",
  "mode": "string — manual | autonomous | deepwork",
  "tcv_id": "string | null — Task Continuation Vow ID if any",
  "start_time": "string — ISO 8601 session start",
  "last_activity": "string — ISO 8601 last activity",
  "status": "string — in_progress | paused | completed | failed | archived",
  "gate_history": [
    {
      "gate": "string — 0 | 1 | 2 | 3",
      "verdict": "string — approved | rejected | skipped",
      "timestamp": "string — ISO 8601"
    }
  ],
  "stop_reason": "string | null — completed | interrupted | error | user_stop",
  "stopped_at": "string | null — ISO 8601 timestamp of stop"
}
```

| Field           | Type           | Description                                    |
|-----------------|----------------|------------------------------------------------|
| `task_id`       | string         | Unique task identifier (same as slug)          |
| `mode`          | string         | Session mode: `manual`, `autonomous`, `deepwork` |
| `tcv_id`        | string\|null   | Task Continuation Vow ID if applicable         |
| `start_time`    | string         | ISO 8601 UTC session start                     |
| `last_activity` | string         | ISO 8601 UTC of most recent activity           |
| `status`        | string         | Session lifecycle status                       |
| `gate_history`  | array          | Ordered list of gates passed with verdicts     |
| `stop_reason`   | string\|null   | Why the session stopped (null = still running) |
| `stopped_at`    | string\|null   | When the session stopped (null = still running)|

---

## Persistence Rules

### Heartbeat
- **Update every 5 turns minimum.**
- Contains **no context** — only timestamps and counters.
- Single file, always overwritten (not versioned).
- Use for quick "is this session alive?" checks.

### Checkpoint
- **Save at every phase boundary AND before any delegate dispatch.**
- Numbered sequentially (`checkpoint-1.json`, `checkpoint-2.json`, …).
- Keep **last 10 checkpoints**. Older ones should be archived.
- On resume: read the highest‑numbered checkpoint for full state.

### Session
- **Created at start** (via `init` command).
- **Updated on stop** (status + stop_reason + stopped_at).
- **Read‑only during active session** — agents read, do not write mid‑session.
- Contains gate history for replay / audit.

### STATUS.md
- **Human‑readable** — not consumed programmatically by the checkpoint system.
- **Updated every phase** by the active agent.
- Context hash in the checkpoint is derived from this file.

### PLAN.md
- **Immutable after creation.**
- Changes require a new PLAN version (e.g., `PLAN-v2.md`).
- The original PLAN.md must remain on disk for audit trail.

### Retention & Rollup
| Artifact        | Retention                                          |
|-----------------|----------------------------------------------------|
| checkpoints     | Keep last 10; archive older ones to `.pantheon/deepwork/<slug>/archive/` |
| heartbeats      | Single file, always overwritten                    |
| session.json    | Single file — contains full session lifecycle      |
| PLAN.md         | Immutable — never deleted                          |
| STATUS.md       | Single file, overwritten each phase                |
| REVIEW.md       | Single file, overwritten on re‑review              |

---

## CLI Usage

```bash
# Initialize a new session
python .pantheon/code-mode/checkpoint_session.py init <slug>

# Save a checkpoint + update heartbeat
python .pantheon/code-mode/checkpoint_session.py save <slug>

# Show session status
python .pantheon/code-mode/checkpoint_session.py status <slug>

# Resume from latest checkpoint (outputs JSON)
python .pantheon/code-mode/checkpoint_session.py resume <slug>

# List all checkpoints
python .pantheon/code-mode/checkpoint_session.py list <slug>
```

A shell wrapper is available at `.pantheon/code-mode/checkpoint-session.sh`.

---

## Resume Flow

```
1. Agent starts → reads checkpoint-N.json (highest N)
2. Extracts: phase, turn_count, context_hash
3. Computes SHA‑256 of current STATUS.md
4. Compares hashes → if mismatch, signal "context drift"
5. If match → resume from phase N + 1
6. If no checkpoint → start fresh (phase 0)
```

---

## Comparison with Previous (V1) Format

| Aspect | V1 (auto-continue-checkpoint.sh) | V2 (checkpoint_session.py) |
|--------|----------------------------------|----------------------------|
| Format | Inline JSON in shell heredoc | Structured Python module with tests |
| Schema | Minimal (3 fields) | Full schema with version, context hash, gate history |
| Session | Not tracked | Full session.json with lifecycle |
| Heartbeat | Basic (slug + timestamp + status) | Full with turn_count, phase, next_action |
| Resume | Manual file read | `resume` command outputs JSON |
| Tests | Shell test script | pytest (20 tests) |
| Rollback | None | Atomic write via tmp + replace |
