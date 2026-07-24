/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiSlotContext, TuiSlotPlugin } from '@opencode-ai/plugin/tui'
import type { JSX } from '@opentui/solid'
import { createMemo, createSignal, Show, For } from 'solid-js'

const AGENTS = [
  'zeus', 'athena', 'apollo', 'hermes', 'aphrodite',
  'demeter', 'themis', 'prometheus', 'hephaestus',
  'nyx', 'gaia', 'iris', 'mnemosyne', 'talos',
] as const

const CMDS = [
  '/pantheon', '/pantheon-status', '/pantheon-audit',
  '/pantheon-bg', '/pantheon-deepwork', '/pantheon-focus',
  '/pantheon-optimize', '/pantheon-doc',
  '/pantheon-remember', '/pantheon-search', '/pantheon-forget',
  '/pantheon-consolidate', '/pantheon-todo', '/pantheon-hash',
] as const

function PantheonPanel(props: { api: TuiPluginApi; version: string }): JSX.Element {
  const [showSub, setShowSub] = createSignal(false)
  const [showCmd, setShowCmd] = createSignal(false)
  const [showAg, setShowAg] = createSignal(false)
  const [showCfg, setShowCfg] = createSignal(false)
  const [showMem, setShowMem] = createSignal(false)

  const branch = createMemo(() => {
    const b = props.api.state.vcs?.branch
    return b ? `\u2387 ${b}` : null
  })

  const mem = (props.api.state as any).memory
  const cfg = props.api.state.config

  return (
    <box flexDirection="column" width="100%">
      <text fg={props.api.theme.current.accent} attributes={{ bold: true }}>
        Pantheon v{props.version}
      </text>

      <Show when={branch()}>
        {(b) => <box marginTop={1}><text fg={props.api.theme.current.textMuted}>{b()}</text></box>}
      </Show>

      {/* Sessions — total historico (API nao distingue ativas) */}
      <box marginTop={0} onMouseDown={() => setShowSub((x) => !x)}>
        <text fg={props.api.theme.current.text} attributes={{ bold: true }}>
          {showSub() ? '\u25bc ' : '\u25b6 '}Sessions
        </text>
        <text fg={props.api.theme.current.textMuted}>
          ({(props.api.state as any).session?.count?.() ?? '?'} total)
        </text>
      </box>

      {/* Commands */}
      <box marginTop={0} onMouseDown={() => setShowCmd((x) => !x)}>
        <text fg={props.api.theme.current.text} attributes={{ bold: true }}>
          {showCmd() ? '\u25bc ' : '\u25b6 '}Commands
        </text>
        <text fg={props.api.theme.current.textMuted}> ({CMDS.length})</text>
      </box>
      <Show when={showCmd()}>
        <box marginLeft={1} flexDirection="column">
          <For each={CMDS}>
            {(cmd) => <text fg={props.api.theme.current.textMuted}>{'\u00b7'} {cmd}</text>}
          </For>
        </box>
      </Show>

      {/* Agents */}
      <box marginTop={0} onMouseDown={() => setShowAg((x) => !x)}>
        <text fg={props.api.theme.current.text} attributes={{ bold: true }}>
          {showAg() ? '\u25bc ' : '\u25b6 '}Agents
        </text>
        <text fg={props.api.theme.current.textMuted}> ({AGENTS.length})</text>
      </box>
      <Show when={showAg()}>
        <box marginLeft={1} flexDirection="column">
          <For each={AGENTS}>
            {(a) => <text fg={props.api.theme.current.textMuted}>{'\u00b7'} {a}</text>}
          </For>
        </box>
      </Show>

      {/* Config */}
      <box marginTop={0} onMouseDown={() => setShowCfg((x) => !x)}>
        <text fg={props.api.theme.current.text} attributes={{ bold: true }}>
          {showCfg() ? '\u25bc ' : '\u25b6 '}Config
        </text>
      </box>
      <Show when={showCfg()}>
        <box marginLeft={1} flexDirection="column">
          <text fg={props.api.theme.current.textMuted}>
            MCPs: {cfg?.mcp ? Object.keys(cfg.mcp).length : 0}
          </text>
          <text fg={props.api.theme.current.textMuted}>
            Compaction: {cfg?.compaction?.auto ? 'ON' : 'OFF'}
          </text>
        </box>
      </Show>

      {/* Memory */}
      <box marginTop={0} onMouseDown={() => setShowMem((x) => !x)}>
        <text fg={props.api.theme.current.text} attributes={{ bold: true }}>
          {showMem() ? '\u25bc ' : '\u25b6 '}Memory
        </text>
      </box>
      <Show when={showMem()}>
        <box marginLeft={1}>
          <text fg={props.api.theme.current.textMuted}>
            {mem?.entries > 0 ? `Entries: ${mem.entries}` : '(no data)'}
          </text>
        </box>
      </Show>
    </box>
  )
}

function createSlot(api: TuiPluginApi, version: string): TuiSlotPlugin {
  return {
    order: 900,
    slots: {
      sidebar_content(_ctx: TuiSlotContext, _input: { session_id: string }): JSX.Element {
        return <PantheonPanel api={api} version={version} />
      },
    },
  }
}

const tui: TuiPlugin = async (api: TuiPluginApi) => {
  // Read version ONCE at startup (sincrono, evitando Promise)
  let version = '5.0.0'
  try {
    const wt = api.state.path?.worktree ?? ''
    const fp = wt ? `${wt}/package.json` : 'package.json'
    const r = await api.client.file.read({ query: { path: fp } })
    const m = String(r?.content ?? '').match(/"version":\s*"([^"]+)"/)
    if (m?.[1]) version = m[1]
  } catch { /* fallback */ }

  api.slots.register(createSlot(api, version))
}

export default { id: 'pantheon.tui', tui } as TuiPluginModule & { id: string }
