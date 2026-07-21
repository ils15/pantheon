# noqa: N999
"""Tests for checkpoint session manager (RED → GREEN → REFACTOR).

Tests cover:
- Path resolution (get_slug_dir)
- Checkpoint discovery (get_checkpoints)
- Session init (cmd_init)
- Checkpoint save (cmd_save)
- Status reporting (cmd_status)
- Resume from latest (cmd_resume)
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Fixtures & helpers
# ---------------------------------------------------------------------------
# Import the module under test from its hyphenated file via importlib
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path

import pytest


def _get_module():
    """Load and cache the checkpoint_session module."""
    if _get_module.cache is not None:
        return _get_module.cache
    path = (
        Path(__file__).resolve().parent.parent
        / ".pantheon"
        / "code-mode"
        / "checkpoint_session.py"
    )
    if not path.exists():
        # Fallback: try hyphenated name
        path = (
            Path(__file__).resolve().parent.parent
            / ".pantheon"
            / "code-mode"
            / "checkpoint-session.py"
        )
    spec = importlib.util.spec_from_file_location("checkpoint_session", str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    _get_module.cache = mod
    return mod


_get_module.cache = None


@pytest.fixture
def mod():
    """Return the checkpoint_session module."""
    return _get_module()


@pytest.fixture
def tmp_slug(request: pytest.FixtureRequest) -> tuple[Path, str]:
    """Create a temp directory to serve as .pantheon/deepwork for a test slug.

    Returns ``(deepwork_root, slug)``.
    """
    tmp = tempfile.mkdtemp(prefix="checkpoint_test_")
    slug = f"test-{request.node.name}"
    deepwork_root = Path(tmp)
    slug_dir = deepwork_root / slug
    slug_dir.mkdir(parents=True)
    yield (deepwork_root, slug)
    # cleanup
    shutil.rmtree(tmp, ignore_errors=True)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestGetSlugDir:
    def test_returns_path_under_deepdir(self, mod):
        """get_slug_dir returns ``.pantheon/deepwork/<slug>``."""
        d = mod.get_slug_dir("my-task")
        assert str(d).endswith(".pantheon/deepwork/my-task")

    def test_uses_global_deepdir(self, mod):
        """Uses the DEEPDIR module constant as base."""
        d = mod.get_slug_dir("x")
        assert mod.DEEPDIR in d.parents


class TestGetCheckpoints:
    def test_empty_when_no_files(self, mod, tmp_slug):
        deepwork_root, slug = tmp_slug
        slug_dir = deepwork_root / slug
        assert mod.get_checkpoints(slug_dir) == []

    def test_returns_sorted_checkpoints(self, mod, tmp_slug):
        deepwork_root, slug = tmp_slug
        slug_dir = deepwork_root / slug
        (slug_dir / "checkpoint-2.json").write_text('{"n":2}')
        (slug_dir / "checkpoint-1.json").write_text('{"n":1}')
        (slug_dir / "checkpoint-3.json").write_text('{"n":3}')
        cps = mod.get_checkpoints(slug_dir)
        assert [n for n, _ in cps] == [1, 2, 3]

    def test_ignores_non_matching_files(self, mod, tmp_slug):
        deepwork_root, slug = tmp_slug
        slug_dir = deepwork_root / slug
        (slug_dir / "checkpoint-1.json").write_text("{}")
        (slug_dir / "not-a-checkpoint.json").write_text("{}")
        (slug_dir / "checkpoint-abc.json").write_text("{}")  # non-numeric
        cps = mod.get_checkpoints(slug_dir)
        assert len(cps) == 1
        assert cps[0][0] == 1

    def test_ignores_dotfiles(self, mod, tmp_slug):
        deepwork_root, slug = tmp_slug
        slug_dir = deepwork_root / slug
        (slug_dir / "checkpoint-1.json").write_text("{}")
        (slug_dir / ".checkpoint-2.json").write_text("{}")  # dotfile
        cps = mod.get_checkpoints(slug_dir)
        assert len(cps) == 1


class TestCmdInit:
    def test_creates_session_json(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        session_file = deepwork_root / slug / "session.json"
        assert session_file.exists()
        data = json.loads(session_file.read_text())
        assert data["task_id"] == slug
        assert data["status"] == "in_progress"
        assert data["mode"] == "deepwork"

    def test_creates_heartbeat_json(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        hb_file = deepwork_root / slug / "heartbeat.json"
        assert hb_file.exists()
        data = json.loads(hb_file.read_text())
        assert data["slug"] == slug
        assert data["status"] == "alive"

    def test_session_has_correct_fields(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        data = json.loads((deepwork_root / slug / "session.json").read_text())
        assert "start_time" in data
        assert "last_activity" in data
        assert "gate_history" in data
        assert data["stop_reason"] is None
        assert data["stopped_at"] is None

    def test_heartbeat_has_turn_count_and_phase(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        data = json.loads((deepwork_root / slug / "heartbeat.json").read_text())
        assert data["turn_count"] == 0
        assert data["current_phase"] == 0


class TestCmdSave:
    def test_creates_checkpoint_file(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        mod.cmd_save(slug)
        checkpoints = mod.get_checkpoints(deepwork_root / slug)
        assert len(checkpoints) == 1

    def test_checkpoint_has_required_fields(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        mod.cmd_save(slug)
        cp = json.loads((deepwork_root / slug / "checkpoint-1.json").read_text())
        assert "slug" in cp
        assert "phase" in cp
        assert "turn_count" in cp
        assert "timestamp" in cp
        assert "version" in cp
        assert cp["version"] == 2  # noqa: PLR2004

    def test_auto_increments_checkpoint_number(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        mod.cmd_save(slug)
        mod.cmd_save(slug)
        mod.cmd_save(slug)
        checkpoints = mod.get_checkpoints(deepwork_root / slug)
        assert [n for n, _ in checkpoints] == [1, 2, 3]

    def test_updates_heartbeat_on_save(self, mod, tmp_slug, monkeypatch):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        mod.cmd_save(slug)
        hb = json.loads((deepwork_root / slug / "heartbeat.json").read_text())
        assert hb["status"] == "alive"
        assert hb["turn_count"] > 0


class TestCmdStatus:
    def test_reports_no_session(self, mod, tmp_slug, monkeypatch, capsys):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_status(slug)
        captured = capsys.readouterr()
        assert "No session.json found" in captured.out

    def test_reports_session_info(self, mod, tmp_slug, monkeypatch, capsys):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        mod.cmd_save(slug)
        mod.cmd_status(slug)
        captured = capsys.readouterr()
        assert slug in captured.out
        assert "in_progress" in captured.out or "Status:" in captured.out


class TestCmdResume:
    def test_resume_no_checkpoints(self, mod, tmp_slug, monkeypatch, capsys):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_resume(slug)
        captured = capsys.readouterr()
        assert "No checkpoints found" in captured.out

    def test_resume_latest_checkpoint(self, mod, tmp_slug, monkeypatch, capsys):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.cmd_init(slug)
        capsys.readouterr()  # flush init output
        mod.cmd_save(slug)
        capsys.readouterr()  # flush first save output
        mod.cmd_save(slug)
        capsys.readouterr()  # flush second save output
        mod.cmd_resume(slug)
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["slug"] == slug
        assert data["turn_count"] == 2  # second save  # noqa: PLR2004


class TestCLI:
    def test_unknown_command(self, mod, capsys):
        with pytest.raises(SystemExit):
            mod.main(["bogus", "test-slug"])

    def test_init_via_cli(self, mod, tmp_slug, monkeypatch, capsys):
        deepwork_root, slug = tmp_slug
        monkeypatch.setattr(mod, "DEEPDIR", deepwork_root)
        mod.main(["init", slug])
        captured = capsys.readouterr()
        assert "Session initialized" in captured.out
        assert (deepwork_root / slug / "session.json").exists()
