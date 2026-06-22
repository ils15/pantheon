/**
 * Pantheon TUI Plugin — Main Entry
 *
 * Minimal Plugin entry point for OpenCode plugin system.
 * The TUI sidebar is registered via the "./tui" export subpath.
 */
import type { Plugin } from "@opencode-ai/plugin";

const PantheonTuiPlugin: Plugin = async () => {
  return {
    name: "pantheon-tui-plugin",

    config: async (opencodeConfig: Record<string, unknown>) => {
      // Set default_agent if not already configured
      if (!(opencodeConfig as { default_agent?: string }).default_agent) {
        (opencodeConfig as { default_agent?: string }).default_agent = "zeus";
      }
    },
  };
};

export default PantheonTuiPlugin;
