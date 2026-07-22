/** @jsxImportSource @opentui/solid */

import type {
	TuiPlugin,
	TuiPluginApi,
	TuiPluginModule,
} from "@opencode-ai/plugin/tui";
import { createMemo, createResource, createSignal, For, Show } from "solid-js";

// ── Version ──────────────────────────────────────────────────────────────────

async function readVersion(api: TuiPluginApi): Promise<string> {
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

// ── Deepwork Status ──────────────────────────────────────────────────────────

type DeepworkEntry = { slug: string; status: "complete" | "active" | "paused"; age?: string };

async function readDeepworks(api: TuiPluginApi): Promise<DeepworkEntry[]> {
  const wt = ((api.state as any).path?.worktree ?? "") as string || "."
  const slugs = ["v4.0-sprint3-themis", "tui-plugin-enhance", "agent-mcp-integration",
    "autonomous-agent-factory", "legacy-cleanup", "pantheon-docs-v2",
    "release-localization", "v3.16-structure-and-lcm"]
  const result: DeepworkEntry[] = []
  for (const slug of slugs) {
    try {
      await api.client.file.read({ query: { path: `${wt}/.pantheon/deepwork/${slug}/PLAN.md` } })
      let status: DeepworkEntry["status"] = "active"
      try {
        const rev = await api.client.file.read({ query: { path: `${wt}/.pantheon/deepwork/${slug}/REVIEW.md` } })
        const content = typeof rev.content === "string" ? rev.content : ""
        if (content.toLowerCase().includes("approved")) status = "complete"
      } catch {}
      try {
        const hb = await api.client.file.read({ query: { path: `${wt}/.pantheon/deepwork/${slug}/heartbeat.json` } })
        const hbc = typeof hb.content === "string" ? hb.content : ""
        if (hbc.includes('"status": "paused"') || hbc.includes('"status":"paused"')) status = "paused"
      } catch {}
      result.push({ slug, status })
    } catch {}
  }
  return result
}

// ── Recent Activity (memory recall) ──────────────────────────────────────────

type ActivityEntry = { key: string; summary: string; time: string };

async function readActivity(api: TuiPluginApi): Promise<ActivityEntry[]> {
  try {
    const wt = ((api.state as any).path?.worktree ?? "") as string || "."
    const log = await api.client.file.read({ query: { path: `${wt}/.pantheon/memory-bank/02-progress-log.md` } })
    const content = typeof log.content === "string" ? log.content : ""
    const lines = content.split("\n").filter(l => l.startsWith("- ") || l.startsWith("##"))
    const entries: ActivityEntry[] = []
    for (const line of lines.slice(-8)) {
      if (line.startsWith("## ")) continue
      entries.push({ key: line.slice(0, 40), summary: line.slice(0, 60), time: "" })
    }
    return entries.length > 0 ? entries : [{ key: "(empty)", summary: "No recent activity", time: "" }]
  } catch {
    return [{ key: "(no log)", summary: "No progress log found", time: "" }]
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

const COMMANDS = [
  { n: "/pantheon", d: "Council" }, { n: "/pantheon-status", d: "Status" },
  { n: "/pantheon-audit", d: "Audit v2" }, { n: "/pantheon-cancel", d: "Cancel" },
  { n: "/pantheon-deepwork", d: "Deep work" }, { n: "/pantheon-focus", d: "Focus" },
  { n: "/pantheon-optimize", d: "Optimize" }, { n: "/pantheon-sketch", d: "Sketch" },
  { n: "/pantheon-install", d: "Install" }, { n: "/pantheon-update", d: "Update" },
  { n: "/pantheon-remember", d: "Remember" }, { n: "/pantheon-search", d: "Search" },
  { n: "/pantheon-consolidate", d: "Merge" }, { n: "/pantheon-forget", d: "Compress" },
];

const AGENTS = [
  { n: "zeus", t: "d", r: "Orchestrator" }, { n: "athena", t: "p", r: "Planner" },
  { n: "apollo", t: "f", r: "Discovery" }, { n: "hermes", t: "d", r: "Backend" },
  { n: "aphrodite", t: "d", r: "Frontend" }, { n: "demeter", t: "d", r: "Database" },
  { n: "themis", t: "p", r: "Quality" }, { n: "prometheus", t: "d", r: "Infra" },
  { n: "hephaestus", t: "d", r: "AI pipelines" }, { n: "nyx", t: "f", r: "Observability" },
  { n: "gaia", t: "f", r: "Remote sensing" }, { n: "iris", t: "f", r: "GitHub ops" },
  { n: "mnemosyne", t: "f", r: "Memory bank" }, { n: "talos", t: "f", r: "Hotfixes" },
];

// ── View ─────────────────────────────────────────────────────────────────────

function View(props: { api: TuiPluginApi; sessionID: string; version: string }) {
  const [sDeep, setSDeep] = createSignal(true);
  const [sAct, setSAct] = createSignal(false);
  const [sAgent, setSAgent] = createSignal(false);
  const [sCmd, setSCmd] = createSignal(false);
  const theme = () => props.api.theme.current;
  const branch = createMemo(() => props.api.state.vcs?.branch ? `⎇ ${props.api.state.vcs.branch}` : null);

  const [dws] = createResource(() => readDeepworks(props.api));
  const [act] = createResource(() => readActivity(props.api));

  const statusIcon = (s: string) => s === "complete" ? "✅" : s === "paused" ? "⏸️" : "⏳";

  return (
    <box flexDirection="column" width="100%">
      <text fg={theme().accent} attributes={{ bold: true }}>⚡ Pantheon · {props.version}</text>
      <Show when={branch()}>{(b) => <box marginTop={1}><text fg={theme().textMuted}>{b()}</text></box>}</Show>

      {/* ══ Deepwork ══ */}
      <box marginTop={1} onMouseDown={() => setSDeep((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>{sDeep() ? "▼" : "▶"} Memory</text>
      </box>
      <Show when={sDeep()}>
        <Show when={dws()} fallback={<box marginLeft={1}><text fg={theme().textMuted}>⏳</text></box>}>
          {(list) => (
            <box marginLeft={1} flexDirection="column">
              <Show when={list().length > 0}
                fallback={<text fg={theme().textMuted}>  (no active deepwork)</text>}>
                <For each={list()}>
                  {(dw) => <text fg={dw.status === "complete" ? "green" : theme().textMuted}>
                    {statusIcon(dw.status)} {dw.slug}
                  </text>}
                </For>
              </Show>
            </box>
          )}
        </Show>
      </Show>

      {/* ══ Activity ══ */}
      <box marginTop={0} onMouseDown={() => setSAct((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>{sAct() ? "▼" : "▶"} Activity</text>
      </box>
      <Show when={sAct()}>
        <Show when={act()} fallback={<box marginLeft={1}><text fg={theme().textMuted}>⏳</text></box>}>
          {(list) => (
            <box marginLeft={1} flexDirection="column">
              <For each={list()}>
                {(e) => <text fg={theme().textMuted}>  {e.summary}</text>}
              </For>
            </box>
          )}
        </Show>
      </Show>

      {/* ══ Agents ══ */}
      <box marginTop={0} onMouseDown={() => setSAgent((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>{sAgent() ? "▼" : "▶"} Agents ({AGENTS.length})</text>
      </box>
      <Show when={sAgent()}>
        <box marginLeft={1} flexDirection="column">
          <For each={AGENTS}>
            {(a) => <text fg={a.t === "p" ? theme().accent : theme().textMuted}>
              {a.t === "p" ? "✦" : "·"} {a.n} — {a.r}
            </text>}
          </For>
        </box>
      </Show>

      {/* ══ Commands ══ */}
      <box marginTop={0} onMouseDown={() => setSCmd((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>{sCmd() ? "▼" : "▶"} Commands ({COMMANDS.length})</text>
      </box>
      <Show when={sCmd()}>
        <For each={COMMANDS}>
          {(c) => <box marginLeft={1} onMouseDown={(e) => {
            e.stopPropagation();
            props.api.ui?.toast?.({ title: "Cmd", message: `Type ${c.n}` });
          }}>
            <text fg={theme().textMuted}>{c.n} — {c.d}</text>
          </box>}
        </For>
      </Show>
    </box>
  );
}

// ── Plugin ───────────────────────────────────────────────────────────────────

const tui: TuiPlugin = async (api, _o, _m) => {
  const version = await readVersion(api);

  // Register sidebar
  api.slots.register({
    order: 900,
    slots: {
      sidebar_content(_ctx, p) {
        return <View api={api} sessionID={p.session_id} version={version} />;
      },
    },
  });

  // Listen for session events → toast notifications
  api.event.on("session.status", (ev: any) => {
    const s = ev?.data?.status;
    if (s === "completed" || s === "error") {
      const msg = s === "completed" ? "✅ Session completed" : "❌ Session error";
      props?.api?.ui?.toast?.({ title: "Pantheon", message: msg, variant: s === "completed" ? "success" : "error" });
    }
  });

  // Listen for message completions → show subagent done toast
  api.event.on("message.updated", (ev: any) => {
    try {
      const parts = ev?.data?.parts ?? [];
      for (const part of parts) {
        if (part.type === "subagent" && part.status === "completed") {
          const name = part.agent ?? "subagent";
          api.ui?.toast?.({ title: "Agent Done", message: `${name} completed task`, variant: "info" });
        }
      }
    } catch {}
  });
};

// Fix: the event handlers reference api, not props
// Let me fix the closure
const tuiFixed: TuiPlugin = async (api, _o, _m) => {
  const version = await readVersion(api);

  api.slots.register({
    order: 900,
    slots: {
      sidebar_content(_ctx, p) {
        return <View api={api} sessionID={p.session_id} version={version} />;
      },
    },
  });

  api.event.on("session.status", (ev: any) => {
    const s = ev?.data?.status;
    if (s === "completed" || s === "error") {
      const msg = s === "completed" ? "Session completed" : "Session error";
      api.ui?.toast?.({ title: "Pantheon", message: msg, variant: s === "completed" ? "success" : "error" });
    }
  });

  api.event.on("message.updated", (ev: any) => {
    try {
      const parts = ev?.data?.parts ?? [];
      for (const part of parts) {
        if (part.type === "subagent" && part.status === "completed") {
          api.ui?.toast?.({ title: "Agent Done", message: `${part.agent ?? "subagent"} completed`, variant: "info" });
        }
      }
    } catch {}
  });
};

export default { id: "pantheon.tui", tui: tuiFixed };
