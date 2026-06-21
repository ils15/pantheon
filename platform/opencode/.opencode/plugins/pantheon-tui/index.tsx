/** @jsxImportSource @opentui/solid */
import { createMemo, createSignal, Show, For } from "solid-js"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"

// ── Static Data ──────────────────────────────────────────────────────────────
const PYTHON_VERSION = "3.12.3"
const PANTHEON_VERSION = "3.14.0"

const COMMANDS = [
  { name: "/pantheon", desc: "Council synthesis" },
  { name: "/pantheon-status", desc: "System status" },
  { name: "/audit", desc: "Full audit" },
  { name: "/cancel", desc: "Cancel task" },
  { name: "/deepwork", desc: "Deep work mode" },
  { name: "/focus", desc: "Focus on scope" },
  { name: "/forge", desc: "Forge ahead" },
  { name: "/metamorphosis", desc: "Code migration" },
  { name: "/mirrordeps", desc: "Mirror dependencies" },
  { name: "/optimize", desc: "Optimize code" },
  { name: "/ping", desc: "Health check" },
  { name: "/praxis", desc: "Practice mode" },
  { name: "/reflect", desc: "Reflect on state" },
  { name: "/sketch", desc: "Quick prototype" },
  { name: "/stop-continuation", desc: "Stop auto-continue" },
  { name: "/subtask", desc: "Lightweight task" },
] as const

// ── Agent Registry ───────────────────────────────────────────────────────────
const AGENTS = [
  { name: "zeus", tier: "default" as const, role: "Orchestrator" },
  { name: "athena", tier: "premium" as const, role: "Strategic planner" },
  { name: "apollo", tier: "fast" as const, role: "Codebase discovery" },
  { name: "hermes", tier: "default" as const, role: "Backend" },
  { name: "aphrodite", tier: "default" as const, role: "Frontend" },
  { name: "demeter", tier: "default" as const, role: "Database" },
  { name: "themis", tier: "premium" as const, role: "Quality & security" },
  { name: "prometheus", tier: "default" as const, role: "Infrastructure" },
  { name: "hephaestus", tier: "default" as const, role: "AI pipelines" },
  { name: "nyx", tier: "fast" as const, role: "Observability" },
  { name: "gaia", tier: "fast" as const, role: "Remote sensing" },
  { name: "iris", tier: "fast" as const, role: "GitHub operations" },
  { name: "mnemosyne", tier: "fast" as const, role: "Memory bank" },
  { name: "talos", tier: "fast" as const, role: "Hotfixes" },
] as const

const BAR_WIDTH = 20

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(v)))
}

function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

function msgTokens(m: any): number {
  return safeNum(m?.tokens?.input) + safeNum(m?.tokens?.output) +
    safeNum(m?.tokens?.reasoning) + safeNum(m?.tokens?.cache?.read) +
    safeNum(m?.tokens?.cache?.write)
}

function buildBar(pct: number) {
  const c = Math.max(0, Math.min(100, pct))
  const f = Math.max(0, Math.min(BAR_WIDTH, Math.round((c / 100) * BAR_WIDTH)))
  return { bar: "█".repeat(f) + "░".repeat(BAR_WIDTH - f), clamped: c }
}

// ── Compress handler ─────────────────────────────────────────────────────────
function handleCompress(api: TuiPluginApi) {
  try {
    const cmdApi = (api as any).command
    if (cmdApi?.trigger) {
      cmdApi.trigger("compact")
    } else {
      api.ui?.toast?.({
        title: "Compression",
        message: "Auto-compaction enabled; manual trigger unavailable in this version",
      })
    }
  } catch {
    api.ui?.toast?.({ title: "Compression", message: "Manual compress unavailable" })
  }
}

// ── View ─────────────────────────────────────────────────────────────────────
function View(props: { api: TuiPluginApi; sessionID: string }) {
  const [showAgents, setShowAgents] = createSignal(false)
  const [showCommands, setShowCommands] = createSignal(false)

  const theme = () => props.api.theme.current
  const branch = createMemo(() =>
    props.api.state.vcs?.branch ? `⎇ ${props.api.state.vcs.branch}` : null,
  )
  const sCount = createMemo(() => props.api.state.session.count())

  // Session context usage (from last assistant message)
  const usage = createMemo(() => {
    const msgs = props.api.state.session.messages(props.sessionID) as any[]
    if (!msgs?.length) return null
    const last = [...msgs].reverse().find((m) => {
      const role = m?.role ?? m?.info?.role
      return role === "assistant" && safeNum(m?.tokens?.output) > 0
    })
    if (!last) return null
    const tokens = msgTokens(last)
    const pid = last?.providerID ?? last?.info?.providerID
    const mid = last?.modelID ?? last?.info?.modelID
    const model =
      pid && mid
        ? (props.api.state.provider as any[])?.find((p: any) => p.id === pid)
            ?.models?.[mid]
        : null
    const cw = safeNum(model?.limit?.context)
    return {
      tokens,
      contextWindow: cw,
      percent: cw > 0 ? Math.round((tokens / cw) * 100) : 0,
    }
  })

  // Session cost
  const cost = createMemo(() => {
    const ss = (props.api.state as any)?.session
    const fromState = safeNum(ss?.get?.(props.sessionID)?.cost)
    if (fromState > 0) return fromState
    const msgs = props.api.state.session.messages(props.sessionID) as any[]
    return (msgs ?? [])
      .filter((m) => (m?.role ?? m?.info?.role) === "assistant")
      .reduce((s, m) => s + safeNum(m?.cost), 0)
  })

  // Build bar only when there is real data
  const bar = createMemo(() => {
    const u = usage()
    if (!u || u.contextWindow === 0) return null
    const b = buildBar(u.percent)
    const color =
      u.percent >= 90
        ? theme().error
        : u.percent >= 70
          ? theme().warning
          : theme().accent
    return {
      bar: b.bar,
      pct: b.clamped,
      tokens: u.tokens,
      window: u.contextWindow,
      color,
    }
  })

  return (
    <box flexDirection="column" width="100%">
      {/* ══ Header ══ */}
      <box flexDirection="row" justifyContent="space-between" alignItems="center">
        <text fg={theme().accent} attributes={{ bold: true }}>
          ⚡ Pantheon
        </text>
        <text fg={theme().textMuted}>
          {" "}{PANTHEON_VERSION} · Python {PYTHON_VERSION}
        </text>
      </box>

      {/* ══ Branch (conditional) ══ */}
      <Show when={branch()}>
        {(b) => (
          <box marginTop={1}>
            <text fg={theme().textMuted}>{b()}</text>
          </box>
        )}
      </Show>

      {/* ══ Context Progress (real data) ══ */}
      <Show when={bar()}>
        {(b) => (
          <box marginTop={1} flexDirection="column">
            <text fg={theme().text} attributes={{ bold: true }}>
              Context
            </text>
            <box flexDirection="row" gap={1}>
              <text fg={b().color}>{b().bar}</text>
              <text fg={b().color}>{b().pct}%</text>
            </box>
            <text fg={theme().textMuted}>
              {fmt(b().tokens)} / {fmt(b().window)} / ${cost().toFixed(2)}
            </text>
          </box>
        )}
      </Show>

      {/* ══ Compress Button ══ */}
      <box
        marginTop={1}
        onMouseDown={() => handleCompress(props.api)}
      >
        <text fg={theme().textMuted}>[Compress]</text>
      </box>

      {/* ══ Commands (collapsible) ══ */}
      <box
        marginTop={1}
        onMouseDown={() => setShowCommands((x) => !x)}
      >
        <text fg={theme().text}>{showCommands() ? "▼" : "▶"}</text>
        <text fg={theme().text} attributes={{ bold: true }}>
          {" "}Commands
        </text>
        <text fg={theme().textMuted}> ({COMMANDS.length})</text>
      </box>

      <Show when={showCommands()}>
        <For each={COMMANDS}>
          {(cmd) => (
            <box marginLeft={1}>
              <text
                fg={
                  cmd.name === "/pantheon"
                    ? theme().accent
                    : theme().textMuted
                }
              >
                {cmd.name}
              </text>
              <text fg={theme().textMuted}> — {cmd.desc}</text>
            </box>
          )}
        </For>
      </Show>

      {/* ══ Agents (collapsible) ══ */}
      <box
        marginTop={1}
        onMouseDown={() => setShowAgents((x) => !x)}
      >
        <text fg={theme().text}>{showAgents() ? "▼" : "▶"}</text>
        <text fg={theme().text} attributes={{ bold: true }}>
          {" "}Agents
        </text>
        <text fg={theme().textMuted}> ({AGENTS.length})</text>
      </box>

      <Show when={showAgents()}>
        <For each={AGENTS}>
          {(agent) => (
            <box marginLeft={1}>
              <text
                fg={
                  agent.tier === "premium"
                    ? theme().accent
                    : theme().textMuted
                }
              >
                {agent.tier === "premium" ? "✦ " : "· "}
                {agent.name}
              </text>
              <text fg={theme().textMuted}> — {agent.role}</text>
            </box>
          )}
        </For>
      </Show>

      {/* ══ Sessions ══ */}
      <box marginTop={1}>
        <text fg={theme().text} attributes={{ bold: true }}>
          Sessions
        </text>
        <text fg={theme().textMuted}> {sCount()}</text>
      </box>

    </box>
  )
}

// ── Plugin ───────────────────────────────────────────────────────────────────
const tui: TuiPlugin = async (api, _options, _meta) => {
  api.slots.register({
    order: 900,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} sessionID={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "pantheon.tui",
  tui,
}

export default plugin
