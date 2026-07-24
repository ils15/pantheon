import type { PluginConfig } from "opencode";

export default {
  name: "pantheon",
  version: "5.0.0",
  description: "Pantheon multi-agent orchestration platform",

  hooks: {
    config: async (config: PluginConfig) => {
      config.agentsPath = config.agentsPath ?? [];
      config.agentsPath.push(new URL("./agents", import.meta.url).pathname);

      config.skillsPaths = config.skillsPaths ?? [];
      config.skillsPaths.push(new URL("./skills", import.meta.url).pathname);

      return config;
    },
  },
} satisfies PluginConfig;
