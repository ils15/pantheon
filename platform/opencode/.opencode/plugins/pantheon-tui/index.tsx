// biome-ignore-all lint/suspicious/noExplicitAny: necessary for TuiPluginApi dynamic state access
// biome-ignore-all lint/a11y/noStaticElementInteractions: TUI elements, not DOM
/** @jsxImportSource @opentui/solid */

import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from '@opencode-ai/plugin/tui'
import { createMemo, createSignal, createResource, For, Show } from 'solid-js'

async function readPantheonVersion(api: TuiPluginApi): Promise<string> {
  try {
    const worktree = ((api.state as any).path?.worktree ?? '') as string
    const filePath = worktree ? `${worktree}/package.json` : 'package.json'
    const result = await api.client.file.read({ query: { path: filePath } })
    const content = typeof result.content === 'string' ? result.content : String(result.content ?? '')
    const match = content.match(/"version":\s*"([^"]+)"/)
    if (match?.[1]) return match[1]
  } catch { /* fall through */ }

  try {
    const proc = (api as any).client?.process
    if (typeof proc?.exec === 'function') {
      const result = await proc.exec({ command: 'git', args: ['describe', '--tags', '--always'] })
      const stdout = (result.stdout ?? result.output ?? '') as string
      const tag = stdout.trim().replace(/^v/, '')
      if (tag) return tag
    }
  } catch { /* fall through */ }

  return '5.0.0'
}

const COMMANDS = [
  { name: '/pantheon', desc: 'Council synthesis' },
  { name: '/pantheon-status', desc: 'System status' },
  { name: '/pantheon-audit', desc: 'Full audit' },
  { name: '/pantheon-bg', desc: 'List background tasks' },
  { name: '/pantheon-cancel', desc: 'Cancel task' },
  { name: '/pantheon-deepwork', desc: 'Deep work mode' },
  { name: '/pantheon-focus', desc: 'Focus on scope' },
  { name: '/pantheon-remember', desc: 'Memory store/recall' },
  { name: '/pantheon-search', desc: 'Memory search' },
  { name: '/pantheon-consolidate', desc: 'Merge memories' },
  { name: '/pantheon-forget', desc: 'Compress memories' },
] as const

const AGENTS = [
  { name: 'zeus', tier: 'default' as const, role: 'Orchestrator' },
  { name: 'athena', tier: 'premium' as const, role: 'Strategic planner' },
  { name: 'apollo', tier: 'fast' as const, role: 'Codebase discovery' },
  { name: 'hermes', tier: 'default' as const, role: 'Backend' },
  { name: 'aphrodite', tier: 'default' as const, role: 'Frontend' },
  { name: 'demeter', tier: 'default' as const, role: 'Database' },
  { name: 'themis', tier: 'premium' as const, role: 'Quality & security' },
  { name: 'prometheus', tier: 'default' as const, role: 'Infrastructure' },
  { name: 'hephaestus', tier: 'default' as const, role: 'AI pipelines' },
  { name: 'nyx', tier: 'fast' as const, role: 'Observability' },
  { name: 'gaia', tier: 'fast' as const, role: 'Remote sensing' },
  { name: 'iris', tier: 'fast' as const, role: 'GitHub operations' },
  { name: 'mnemosyne', tier: 'fast' as const, role: 'Memory bank' },
  { name: 'talos', tier: 'fast' as const, role: 'Hotfixes' },
] as const

function safeNum(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function View(props: { api: TuiPluginApi; sessionID: string; version: string }) {
  const [showCommands, setShowCommands] = createSignal(false)
  const [showAgents, setShowAgents] = createSignal(false)
  const [showConfig, setShowConfig] = createSignal(false)
  const [showMemory, setShowMemory] = createSignal(false)
  const [showSubagents, setShowSubagents] = createSignal(false)

  const theme = () => props.api.theme.current

  const branch = createMemo(() =>
    props.api.state.vcs?.branch ? `\u2387 ${props.api.state.vcs.branch}` : null,
  )

  const configInfo = createMemo(() => {
    const cfg = (props.api.state as any).config
    if (!cfg) return null
    return {
      plugins: Array.isArray(cfg.plugin) ? cfg.plugin : [],
      mcpCount: cfg.mcp ? Object.keys(cfg.mcp).length : 0,
      autoCompaction: cfg.compaction?.auto === true,
    }
  })

  const memoryInfo = createMemo(() => {
    const mem = (props.api.state as any).memory
    if (mem) {
      const entries = safeNum(mem?.entries) || safeNum(mem?.count)
      return entries > 0 ? { entries } : null
    }
    return null
  })

  const [subagents] = createResource(
    () => showSubagents(),
    async () => {
      try {
        const proc = (props.api as any).client?.process
        if (typeof proc?.exec !== 'function') return null
        const result = await proc.exec({
          command: 'opencode',
          args: ['session', 'list', '--format', 'json'],
          timeoutMs: 5000,
        })
        const stdout = (result.stdout ?? result.output ?? '') as string
        const sessions = JSON.parse(stdout)
        if (!Array.isArray(sessions)) return null
        return sessions
          .filter((s: any) => s.id !== props.sessionID)
          .sort((a: any, b: any) => (b.updated ?? 0) - (a.updated ?? 0))
          .slice(0, 10)
      } catch { return null }
    },
  )

  return (
    <box flexDirection="column" width="100%">
      {/* Header */}
      <text fg={theme().accent} attributes={{ bold: true }}>
        {`Pantheon v${props.version}`}
      </text>

      <Show when={branch()}>
        {(b) => (<box marginTop={1}><text fg={theme().textMuted}>{b()}</text></box>)}
      </Show>

      {/* Subagents */}
      <box marginTop={0} onMouseDown={() => setShowSubagents((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showSubagents() ? '\u25bc' : '\u25b6'} Subagents`}
        </text>
        <text fg={theme().textMuted}>{` (${String(props.api.state.session.count())})`}</text>
      </box>

      <Show when={showSubagents()}>
        <Show when={subagents()} fallback={<box marginLeft={1}><text fg={theme().textMuted}>{`sessions: ${String(props.api.state.session.count())}`}</text></box>}>
          {(sessions) => (
            <Show when={sessions().length > 0} fallback={<box marginLeft={1}><text fg={theme().textMuted}>(idle)</text></box>}>
              <box marginLeft={1} flexDirection="column">
                <For each={sessions().slice(0, 5)}>
                  {(s: any) => (
                    <text fg={theme().textMuted}>{`${s.id.slice(0, 8)}... ${s.title?.slice(0, 30) ?? ''}`}</text>
                  )}
                </For>
              </box>
            </Show>
          )}
        </Show>
      </Show>

      {/* Commands */}
      <box marginTop={0} onMouseDown={() => setShowCommands((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showCommands() ? '\u25bc' : '\u25b6'} Commands`}
        </text>
        <text fg={theme().textMuted}>{` (${String(COMMANDS.length)})`}</text>
      </box>

      <Show when={showCommands()}>
        <For each={COMMANDS}>
          {(cmd) => (
            <box marginLeft={1} onMouseDown={(e) => {
              e.stopPropagation()
              try {
                const cmdApi = (props.api as any).command
                const cmdName = cmd.name.replace('/', '')
                if (cmdApi?.trigger?.(cmdName)) return
              } catch {}
              props.api.ui?.toast?.({ title: 'Command', message: `Type ${cmd.name} in chat` })
            }}>
              <text fg={cmd.name === '/pantheon' ? theme().accent : theme().textMuted}>{cmd.name}</text>
              <text fg={theme().textMuted}>{` — ${cmd.desc}`}</text>
            </box>
          )}
        </For>
      </Show>

      {/* Agents */}
      <box marginTop={0} onMouseDown={() => setShowAgents((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showAgents() ? '\u25bc' : '\u25b6'} Agents`}
        </text>
        <text fg={theme().textMuted}>{` (${String(AGENTS.length)})`}</text>
      </box>

      <Show when={showAgents()}>
        <For each={AGENTS}>
          {(agent) => (
            <box marginLeft={1}>
              <text fg={agent.tier === 'premium' ? theme().accent : theme().textMuted}>
                {`${agent.tier === 'premium' ? '\u2726 ' : '\u00b7 '}${agent.name}`}
              </text>
              <text fg={theme().textMuted}>{` — ${agent.role}`}</text>
            </box>
          )}
        </For>
      </Show>

      {/* Config */}
      <box marginTop={0} onMouseDown={() => setShowConfig((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showConfig() ? '\u25bc' : '\u25b6'} Config`}
        </text>
      </box>

      <Show when={showConfig()}>
        <Show when={configInfo()} fallback={<box marginLeft={1}><text fg={theme().textMuted}>(no config data)</text></box>}>
          {(cfg) => (
            <box marginLeft={1} flexDirection="column">
              <text fg={theme().textMuted}>{`MCP servers: ${String(cfg().mcpCount)}`}</text>
              <text fg={theme().textMuted}>{`Auto-compaction: ${cfg().autoCompaction ? 'ON' : 'OFF'}`}</text>
            </box>
          )}
        </Show>
      </Show>

      {/* Memory */}
      <box marginTop={0} onMouseDown={() => setShowMemory((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showMemory() ? '\u25bc' : '\u25b6'} Memory`}
        </text>
      </box>

      <Show when={showMemory()}>
        <Show when={memoryInfo()} fallback={<box marginLeft={1}><text fg={theme().textMuted}>(no data)</text></box>}>
          {(mem) => (<box marginLeft={1}><text fg={theme().textMuted}>{`Entries: ${String(mem().entries)}`}</text></box>)}
        </Show>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api, _options, _meta) => {
  const version = await readPantheonVersion(api)
  api.slots.register({
    order: 900,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} sessionID={props.session_id} version={version} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: 'pantheon.tui',
  tui,
}

export default plugin
