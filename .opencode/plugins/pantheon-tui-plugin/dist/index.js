// index.ts
var PantheonTuiPlugin = async () => {
  return {
    name: "pantheon-tui-plugin",
    config: async (opencodeConfig) => {
      if (!opencodeConfig.default_agent) {
        opencodeConfig.default_agent = "zeus";
      }
    }
  };
};
var pantheon_tui_plugin_default = PantheonTuiPlugin;
export {
  pantheon_tui_plugin_default as default
};
