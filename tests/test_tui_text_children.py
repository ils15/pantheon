from pathlib import Path

PLUGIN_FILES = (
    Path("src/plugins/tui/src/index.tsx"),
    Path("src/plugins/tui/dist/tui.tsx"),
    Path("platform/opencode/.opencode/plugins/pantheon-tui/index.tsx"),
    Path(".opencode/plugins/pantheon-tui/index.tsx"),
)


def test_tui_numeric_text_children_are_stringified() -> None:
    """OpenTUI text nodes reject numbers, so renderer-boundary values stay strings."""
    forbidden_children = (
        "{props.api.state.session.count()}",
        "{CMDS.length}",
        "{COMMANDS.length}",
        "{AGENTS.length}",
        "{cfg().mcpCount}",
        "{mem().entries}",
    )

    for plugin_file in PLUGIN_FILES:
        content = plugin_file.read_text()
        for child in forbidden_children:
            assert child not in content, f"numeric OpenTUI child remains in {plugin_file}: {child}"
