"""Debug script to understand test_forget_by_id failure."""
import asyncio
import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, "tests")
sys.path.insert(0, "scripts")

import importlib

MODULE_PATH = "scripts.memory_mcp_server"


async def debug():
    with tempfile.TemporaryDirectory(prefix="pantheon_test_") as tmpdir:
        with patch.object(Path, "home", return_value=Path(tmpdir)):
            mod = importlib.import_module(MODULE_PATH)
            test_dir = Path(tmpdir) / ".pantheon" / "memory"
            mod._set_memory_dir(str(test_dir))
            importlib.reload(mod)
            server = mod.mcp

            # Populate DB like prior tests
            r1 = await server.call_tool(
                "memory_store", {"value": "test basic"}
            )
            print("store1 result type:", type(r1))
            content_blocks, meta = r1
            print("store1 content_blocks:", content_blocks)
            print("store1 meta:", meta)
            if content_blocks:
                b = content_blocks[0]
                t = b.text if hasattr(b, "text") else (b.content if hasattr(b, "content") else str(b))
                print("store1 text:", repr(t))

            r2 = await server.call_tool(
                "memory_store",
                {
                    "value": "User prefers dark mode.",
                    "namespace": "settings",
                    "key": "pref_dark_mode",
                    "metadata": '{"importance": 0.9}',
                },
            )
            print("\nstore2:")
            content_blocks2, _ = r2
            if content_blocks2:
                b = content_blocks2[0]
                t = b.text if hasattr(b, "text") else (b.content if hasattr(b, "content") else str(b))
                print("store2 text:", repr(t))

            # Simulate reset_state
            mod._reset_test_state()
            importlib.reload(mod)
            server = mod.mcp

            # Now test forget_by_id
            r3 = await server.call_tool(
                "memory_store",
                {"value": "Entry to forget.", "key": "forget_me"},
            )
            print("\nstore3 (after reset):")
            content_blocks3, _ = r3
            if content_blocks3:
                b = content_blocks3[0]
                t = b.text if hasattr(b, "text") else (b.content if hasattr(b, "content") else str(b))
                print("store3 text:", repr(t))
                data = json.loads(t)
                print("store3 parsed:", data)
                print("store3 keys:", data.keys())


asyncio.run(debug())
