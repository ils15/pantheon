import type { Plugin } from "@opencode-ai/plugin";

/**
 * Pantheon Hooks Plugin
 *
 * Bridges Claude Code shell hooks into OpenCode by mapping hook scripts
 * to the OpenCode plugin event system. All scripts live in scripts/hooks/.
 *
 * Hook mapping:
 *   PreToolUse (Bash|Edit|Write)       → validate-talos-scope.sh
 *   PreToolUse (Edit|Write)            → scan-secrets.sh
 *   PreToolUse (Bash)                  → validate-tool-safety.sh
 *   PreToolUse (Task)                  → on-subagent-delegation-start.sh
 *   PostToolUse (Edit|Write|Bash)      → format-multi-language.sh
 *   PostToolUse (Edit|Write|Bash)      → log-session-start.sh
 *   PostToolUse (Task)                 → on-subagent-delegation-stop.sh
 *   Stop (session idle/compacted)      → validate-post-conditions.sh
 */
export const PantheonHooks: Plugin = async ({ client, directory, $ }) => {
  const hookDir = `${directory}/scripts/hooks`;

  async function runHook(script: string, timeoutMs: number) {
    try {
      const result = await $`bash ${hookDir}/${script}`
        .quiet()
        .nothrow()
        .timeout(timeoutMs);

      if (result.exitCode !== 0) {
        await client.app.log({
          body: {
            service: "pantheon-hooks",
            level: "warn",
            message: `Hook ${script} exited with code ${result.exitCode}`,
            extra: { script, exitCode: result.exitCode },
          },
        });
      }
    } catch (err) {
      // Log but never block tool execution
      await client.app.log({
        body: {
          service: "pantheon-hooks",
          level: "error",
          message: `Hook ${script} failed: ${err}`,
          extra: { script },
        },
      });
    }
  }

  return {
    "tool.execute.before": async (input, _output) => {
      const tool = input.tool;

      const hooksToRun: Array<{ script: string; timeout: number }> = [];

      if (["bash", "edit", "write"].includes(tool)) {
        hooksToRun.push({ script: "validate-talos-scope.sh", timeout: 30_000 });
      }
      if (["edit", "write"].includes(tool)) {
        hooksToRun.push({ script: "scan-secrets.sh", timeout: 30_000 });
      }
      if (tool === "bash") {
        hooksToRun.push({ script: "validate-tool-safety.sh", timeout: 30_000 });
      }
      if (tool === "task") {
        hooksToRun.push({
          script: "on-subagent-delegation-start.sh",
          timeout: 30_000,
        });
      }

      await Promise.all(
        hooksToRun.map((h) => runHook(h.script, h.timeout)),
      );
    },

    "tool.execute.after": async (input, _output) => {
      const tool = input.tool;

      if (["edit", "write", "bash"].includes(tool)) {
        await Promise.all([
          runHook("format-multi-language.sh", 60_000),
          runHook("log-session-start.sh", 5_000),
        ]);
      }
      if (tool === "task") {
        await runHook("on-subagent-delegation-stop.sh", 5_000);
      }
    },

    event: async ({ event }) => {
      if (["session.idle", "session.compacted"].includes(event.type)) {
        await runHook("validate-post-conditions.sh", 30_000);
      }
    },
  };
};
