"""RED/GREEN/REFACTOR test for execute_code_script arg forwarding (Task 1).

Verifies that CLI args passed to execute_code_script are forwarded to the
underlying subprocess (so scripts like compress-inline.py that require
`mode` + `--text` args actually receive them instead of argparse exiting 2).
"""

from __future__ import annotations

from pathlib import Path

import pytest

MODULE_PATH = "scripts.code_mode_server"
ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT / ".pantheon" / "code-mode"

# A tiny script that echoes its forwarded argv so the test can assert the
# args actually reached the subprocess.
ECHO_SCRIPT = (
    "#!/usr/bin/env python3\nimport sys\nprint('ARGV:' + ' '.join(sys.argv[1:]))\n"
)


@pytest.fixture
def echo_script():
    """Create a temp echo script in the code-mode dir; remove it after."""
    script_path = SCRIPTS_DIR / "echo_args_test.py"
    script_path.write_text(ECHO_SCRIPT, encoding="utf-8")
    script_path.chmod(0o755)
    try:
        yield script_path.name
    finally:
        script_path.unlink(missing_ok=True)


class TestExecuteCodeScriptArgs:
    """Args supplied to execute_code_script must reach the subprocess."""

    async def test_args_forwarded_to_subprocess(self, echo_script) -> None:
        """Forwarded args should appear in the script's echoed argv output."""
        import importlib

        mod = importlib.import_module(MODULE_PATH)
        result = await mod.execute_code_script(echo_script, ["alpha", "beta"])
        assert "ARGV:alpha beta" in result
        assert "exit code: 0" in result

    async def test_no_args_still_works(self, echo_script) -> None:
        """Calling without args should still execute and echo an empty argv."""
        import importlib

        mod = importlib.import_module(MODULE_PATH)
        result = await mod.execute_code_script(echo_script, [])
        assert "ARGV:" in result
        assert "exit code: 0" in result
