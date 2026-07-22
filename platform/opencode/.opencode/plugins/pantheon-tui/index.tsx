/** @jsxImportSource @opentui/solid */

import type {
	TuiPlugin,
	TuiPluginApi,
	TuiPluginModule,
} from "@opencode-ai/plugin/tui";
import { createMemo, createResource, createSignal, For, Show } from "solid-js";

// ── Static Data ──────────────────────────────────────────────────────────────

async function readPantheonVersion(api: TuiPluginApi): Promise<string> {
  try {
    const wt = ((api.state as any).path?.worktree ?? "") as string
    const fp = wt ? `${wt}/package.json` : "package.json"
    const r = await api.client.file.read({ query: { path: fp } })
    const c = typeof r.content === "string" ? r.content : String(r.content ?? "")
    const m = c.match(/"version":\s*"([^"]+)"/)
    if (m?.[1]) return m[1]
  } catch {}
  try {
    const p = (api as any).client?.process;
    if (typeof p?.exec === "function") {
      const r = await p.exec({ command: "git", args: ["describe", "--tags", "--always"] });
      const t = (r.stdout ?? r.output ?? "").trim().replace(/^v/, "");
      if (t) return t;
    }
  } catch {}
  return "4.0.0"
}

const COMMANDS = [
  { n: "/pantheon", d: "Council" }, { n: "/pantheon-status", d: "Status" },
  { n: "/pantheon-audit", d: "Audit v2" }, { n: "/pantheon-cancel", d: "Cancel" },
  { n: "/pantheon-deepwork", d: "Deep work" }, { n: "/pantheon-focus", d: "Focus" },
  { n: "/pantheon-optimize", d: "Optimize" }, { n: "/pantheon-sketch", d: "Sketch" },
  { n: "/pantheon-install", d: "Install" }, { n: "/pantheon-update", d: "Update" },
  { n: "/pantheon-remember", d: "Remember" }, { n: "/pantheon-search", d: "Search" },
  { n: "/pantheon-consolidate", d: "Consolidate" }, { n: "/pantheon-forget", d: "Forget" },
];

// ── View ─────────────────────────────────────────────────────────────────────
function View(props: { api: TuiPluginApi; sessionID: string; version: string }) {
  const [showDeep, setShowDeep] = createSignal(true);
  const [showAgents, setShowAgents] = createSignal(false);
  const [showCmd, setShowCmd] = createSignal(false);
  const theme = () => props.api.theme.current;
  const branch = createMemo(() => props.api.state.vcs?.branch ? `⎇ ${props.api.state.vcs.branch}` : null);

  // Read active deepwork sessions via file.read
  const [deepworks] = createResource(async () => {
    try {
      const wt = ((props.api.state as any).path?.worktree ?? "") as string || ".";
      // Try to list deepwork dir via reading a marker file
      const slugs = ["v4.0-sprint3-themis", "tui-plugin-enhance", "agent-mcp-integration", "autonomous-agent-factory", "legacy-cleanup", "pantheon-docs-v2", "release-localization", "v3.16-structure-and-lcm"];
      const active: { slug: string; hasPlan: boolean; hasReview: boolean }[] = [];
      for (const slug of slugs) {
        try {
          const plan = await props.api.client.file.read({ query: { path: `${wt}/.pantheon/deepwork/${slug}/PLAN.md` } });
          const hasPlan = typeof plan.content === "string" && plan.content.length > 0;
          let hasReview = false;
          try {
            const rev = await props.api.client.file.read({ query: { path: `${wt}/.pantheon/deepwork/${slug}/REVIEW.md` } });
            hasReview = typeof rev.content === "string" && rev.content.length > 0;
          } catch {}
          if (hasPlan) active.push({ slug, hasPlan, hasReview });
        } catch {}
      }
      return active.length > 0 ? active : null;
    } catch { return null; }
  });

  return (
    <box flexDirection="column" width="100%">
      <text fg={theme().accent} attributes={{ bold: true }}>⚡ Pantheon · {props.version}</text>
      <Show when={branch()}>{(b) => <box marginTop={1}><text fg={theme().textMuted}>{b()}</text></box>}</Show>

      {/* ══ Deepwork / Memory ══ */}
      <box marginTop={1} onMouseDown={() => setShowDeep((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>{showDeep() ? "▼" : "▶"} Memory</text>
      </box>
      <Show when={showDeep()}>
        <Show when={deepworks()}
          fallback={<box marginLeft={1}><text fg={theme().textMuted}>⏳ loading...</text></box>}
        >
          {(dws) => (
            <box marginLeft={1} flexDirection="column">
              <For each={dws()}>
                {(dw) => (
                  <box>
                    <text fg={dw.hasReview ? "green" : theme().textMuted}>📁 {dw.slug}</text>
                    <text fg={theme().textMuted}>{dw.hasReview ? " ✅" : ""}</text>
                  </box>
                )}
              </For>
            </box>
          )}
        </Show>
      </Show>

      {/* ══ Agents ══ */}
      <box marginTop={1} onMouseDown={() => setShowAgents((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>{showAgents() ? "▼" : "▶"} Agents (14)</text>
      </box>
      <Show when={showAgents()}>
        <box marginLeft={1} flexDirection="column">
          <text fg={theme().textMuted}>zeus, athena, apollo, hermes</text>
          <text fg={theme().textMuted}>aphrodite, demeter, themis</text>
          <text fg={theme().textMuted}>prometheus, hephaestus, nyx</text>
          <text fg={theme().textMuted}>gaia, iris, mnemosyne, talos</text>
        </box>
      </Show>

      {/* ══ Commands ══ */}
      <box marginTop={1} onMouseDown={() => setShowCmd((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>{showCmd() ? "▼" : "▶"} Commands ({COMMANDS.length})</text>
      </box>
      <Show when={showCmd()}>
        <For each={COMMANDS}>
          {(cmd) => (
            <box marginLeft={1} onMouseDown={(e) => {
              e.stopPropagation();
              props.api.ui?.toast?.({ title: "Cmd", message: `Type ${cmd.n}` });
            }}>
              <text fg={theme().textMuted}>{cmd.n} — {cmd.d}</text>
            </box>
          )}
        </For>
      </Show>
    </box>
  );
}

// ── Plugin ───────────────────────────────────────────────────────────────────
const tui: TuiPlugin = async (api, _o, _m) => {
  const version = await readPantheonVersion(api);
  api.slots.register({
    order: 900,
    slots: {
      sidebar_content(_ctx, p) {
        return <View api={api} sessionID={p.session_id} version={version} />;
      },
    },
  });
};

export default { id: "pantheon.tui", tui };
