#!/usr/bin/env python3
"""TODO Enforcer — Idle detection and recovery for Pantheon agents.

Monitors agent tool-call activity and enforces timeouts:
  - Idle > 60s  → log warning
  - Idle > 120s → force continue with task prompt
  - Idle > 300s → auto-save checkpoint and pause

Usage:
  python3 scripts/todo_enforcer.py <task> [--timeout-warn=60] [--timeout-force=120] [--timeout-pause=300]
  python3 scripts/todo_enforcer.py --status          # Show current enforcer state
  python3 scripts/todo_enforcer.py --reset           # Reset idle timer
"""

import argparse
import json
import os
import time
import sys
from pathlib import Path


ENFORCER_DIR = Path(".pantheon/todo-enforcer")
STATE_FILE = ENFORCER_DIR / "state.json"


class TodoEnforcer:
    """Stateful idle monitor for agent sessions."""

    def __init__(
        self,
        task: str,
        timeout_warn: int = 60,
        timeout_force: int = 120,
        timeout_pause: int = 300,
        max_force_continues: int = 3,
    ):
        self.task = task
        self.timeout_warn = timeout_warn
        self.timeout_force = timeout_force
        self.timeout_pause = timeout_pause
        self.max_force_continues = max_force_continues
        self._ensure_dir()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def tick(self) -> dict:
        """Record a tool-call heartbeat (resets idle timer)."""
        state = self._load()
        state["last_tool_call"] = time.time()
        state["task"] = self.task
        state["warnings_sent"] = state.get("warnings_sent", [])
        state["forced_continues"] = state.get("forced_continues", 0)
        state["paused"] = False
        self._save(state)
        return {"status": "ok", "idle": 0.0}

    def check(self) -> dict:
        """Check idle duration and return action if needed."""
        state = self._load()
        if state.get("paused"):
            return {"status": "paused", "action": None}

        last_call = state.get("last_tool_call")
        if last_call is None:
            return {"status": "no_data", "action": None}

        idle = time.time() - last_call
        action = None

        if idle >= self.timeout_pause:
            action = self._build_action("pause", idle)
            state["paused"] = True
            state["stop_reason"] = "timeout_pause"
        elif idle >= self.timeout_force:
            fc_count = state.get("forced_continues", 0)
            if fc_count >= self.max_force_continues:
                action = self._build_action("pause", idle)
                state["paused"] = True
                state["stop_reason"] = "max_force_continues"
            else:
                action = self._build_action("force_continue", idle)
                state["forced_continues"] = fc_count + 1
        elif idle >= self.timeout_warn:
            action = self._build_action("warn", idle)
            if "warn" not in state.get("warnings_sent", []):
                state.setdefault("warnings_sent", []).append("warn")

        self._save(state)
        return {"status": "idle" if idle > 0 else "active", "idle": idle, "action": action}

    def reset(self) -> dict:
        """Reset idle timer and unpause."""
        state = self._load()
        state["last_tool_call"] = time.time()
        state["paused"] = False
        state["warnings_sent"] = []
        state["forced_continues"] = 0
        state["stop_reason"] = None
        self._save(state)
        return {"status": "reset", "idle": 0.0}

    def status(self) -> dict:
        """Return current state without side effects."""
        state = self._load()
        idle = time.time() - state.get("last_tool_call", time.time())
        return {
            "task": state.get("task", self.task),
            "idle": round(idle, 1),
            "paused": state.get("paused", False),
            "forced_continues": state.get("forced_continues", 0),
            "stop_reason": state.get("stop_reason"),
            "timeout_warn": self.timeout_warn,
            "timeout_force": self.timeout_force,
            "timeout_pause": self.timeout_pause,
        }

    def pause(self) -> dict:
        """Pause the enforcer (mark session stopped)."""
        state = self._load()
        state["paused"] = True
        state["stop_reason"] = "manual_pause"
        self._save(state)
        return {"status": "paused"}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_action(self, level: str, idle: float) -> dict:
        prompts = {
            "warn": f"[TODO ENFORCER] Agent idle for {idle:.0f}s. Continuing task: {self.task}",
            "force_continue": f"[TODO ENFORCER] FORCE CONTINUE — Agent idle for {idle:.0f}s. Resume work on: {self.task}",
            "pause": f"[TODO ENFORCER] AUTO-PAUSE — Agent idle for {idle:.0f}s. Session paused due to idle timeout.",
        }
        return {
            "level": level,
            "idle": round(idle, 1),
            "message": prompts[level],
            "checkpoint": level == "pause",
        }

    def _ensure_dir(self) -> None:
        ENFORCER_DIR.mkdir(parents=True, exist_ok=True)

    def _load(self) -> dict:
        if STATE_FILE.exists():
            try:
                return json.loads(STATE_FILE.read_text())
            except (json.JSONDecodeError, OSError):
                pass
        return {
            "task": self.task,
            "last_tool_call": time.time(),
            "paused": False,
            "warnings_sent": [],
            "forced_continues": 0,
            "stop_reason": None,
        }

    def _save(self, state: dict) -> None:
        STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="TODO Enforcer — idle detection and recovery for Pantheon agents."
    )
    parser.add_argument("task", nargs="?", default="", help="Task description for force-continue prompt")
    parser.add_argument("--timeout-warn", type=int, default=60, help="Idle seconds before warning (default: 60)")
    parser.add_argument("--timeout-force", type=int, default=120, help="Idle seconds before force continue (default: 120)")
    parser.add_argument("--timeout-pause", type=int, default=300, help="Idle seconds before auto-pause (default: 300)")
    parser.add_argument("--status", action="store_true", help="Show current enforcer state")
    parser.add_argument("--reset", action="store_true", help="Reset idle timer")
    parser.add_argument("--tick", action="store_true", help="Record a heartbeat (tool call)")
    parser.add_argument("--check", action="store_true", help="Check idle status and return action")
    parser.add_argument("--pause", action="store_true", help="Pause the enforcer")
    args = parser.parse_args()

    enforcer = TodoEnforcer(
        task=args.task or "unknown",
        timeout_warn=args.timeout_warn,
        timeout_force=args.timeout_force,
        timeout_pause=args.timeout_pause,
    )

    if args.status:
        result = enforcer.status()
    elif args.reset:
        result = enforcer.reset()
    elif args.tick:
        result = enforcer.tick()
    elif args.check:
        result = enforcer.check()
    elif args.pause:
        result = enforcer.pause()
    else:
        result = enforcer.check()

    print(json.dumps(result, indent=2, ensure_ascii=False))

    # Exit codes: 0=normal, 1=warn, 2=force, 3=pause
    if isinstance(result, dict) and result.get("action"):
        level = result["action"].get("level")
        if level == "pause":
            sys.exit(3)
        elif level == "force_continue":
            sys.exit(2)
        elif level == "warn":
            sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
