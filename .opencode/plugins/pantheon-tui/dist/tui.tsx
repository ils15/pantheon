/** @jsxImportSource @opentui/solid */

import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from '@opencode-ai/plugin/tui'
import { createMemo, createSignal, For, Show } from 'solid-js'

// ── Static Data ──────────────────────────────────────────────────────────────

async function readPantheonVersion(api: TuiPluginApi): Promise<string> {
  try {
    const worktree = ((api.state as any).path?.worktree ?? '') as string
    const filePath = worktree ? `${worktree}/package.json` : 'package.json'
    const result = await api.client.file.read({ query: { path: filePath } })
    const content =
      typeof result.content === 'string' ? result.content : String(result.content ?? '')
    const match = content.match(/"version":\s*"([^"]+)"/)
    if (match?.[1]) return match[1]
  } catch {
    /* fall through */
  }

  try {
    const proc = (api as any).client?.process
    if (typeof proc?.exec === 'function') {
      const result = await proc.exec({ command: 'git', args: ['describe', '--tags', '--always'] })
      const stdout = (result.stdout ?? result.output ?? '') as string
      const tag = stdout.trim().replace(/^v/, '')
      if (tag) return tag
    }
  } catch {
    /* fall through */
  }

  return '4.0.0'
}

const COMMANDS = [
  { name: '/pantheon', desc: 'Council synthesis' },
  { name: '/pantheon-status', desc: 'System status' },
  { name: '/pantheon-audit', desc: 'Full audit (v2)' },
  { name: '/pantheon-cancel', desc: 'Cancel task' },
  { name: '/pantheon-deepwork', desc: 'Deep work mode' },
  { name: '/pantheon-focus', desc: 'Focus on scope' },
  { name: '/pantheon-optimize', desc: 'Optimize + archive' },
  { name: '/pantheon-sketch', desc: 'Quick prototype' },
  { name: '/pantheon-install', desc: 'Install agents' },
  { name: '/pantheon-update', desc: 'Create release' },
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function _safeNum(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

// ── View ─────────────────────────────────────────────────────────────────────
function View(props: { api: TuiPluginApi; sessionID: string; version: string }) {
  const [showCommands, setShowCommands] = createSignal(false)
  const [showAgents, setShowAgents] = createSignal(false)
  const [showConfig, setShowConfig] = createSignal(false)
  const [showMcp, setShowMcp] = createSignal(false)
  const [showSession, setShowSession] = createSignal(false)

  const theme = () => props.api.theme.current

  const branch = createMemo(() =>
    props.api.state.vcs?.branch ? `⎇ ${props.api.state.vcs.branch}` : null,
  )

  // MCP server status (from OpenCode state — real-time)
  const mcpServers = createMemo(() => {
    try {
      return (props.api.state as any).mcp?.() ?? []
    } catch {
      return []
    }
  })

  // Config info
  const configInfo = createMemo(() => {
    const cfg = (props.api.state as any).config
    if (!cfg) return null
    return {
      plugins: Array.isArray(cfg.plugin) ? cfg.plugin : [],
      mcpCount: cfg.mcp ? Object.keys(cfg.mcp).length : 0,
      autoCompaction: cfg.compaction?.auto === true,
    }
  })

  // Session tokens estimate
  const sessionTokens = createMemo(() => {
    try {
      const sess = props.api.state.session?.get?.(props.sessionID)
      if (!sess) return null
      const msgs = props.api.state.session?.messages?.(props.sessionID) ?? []
      return { messages: msgs.length, status: sess.status ?? 'unknown' }
    } catch {
      return null
    }
  })

  return (
    <box flexDirection="column" width="100%">
      {/* ══ Header ══ */}
      <text fg={theme().accent} attributes={{ bold: true }}>
        ⚡ Pantheon · {props.version}
      </text>

      {/* ══ Branch ══ */}
      <Show when={branch()}>
        {(b) => (
          <box marginTop={1}>
            <text fg={theme().textMuted}>{b()}</text>
          </box>
        )}
      </Show>

      {/* ══ Agents ══ */}
      <box marginTop={0} onMouseDown={() => setShowAgents((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showAgents() ? '▼' : '▶'} Agents`}
        </text>
        <text fg={theme().textMuted}> ({String(AGENTS.length)})</text>
      </box>

      <Show when={showAgents()}>
        <For each={AGENTS}>
          {(agent) => (
            <box marginLeft={1}>
              <text fg={agent.tier === 'premium' ? theme().accent : theme().textMuted}>
                {agent.tier === 'premium' ? '✦ ' : '· '}
                {agent.name}
              </text>
              <text fg={theme().textMuted}>{` — ${agent.role}`}</text>
            </box>
          )}
        </For>
      </Show>

      {/* ══ MCP Status ══ */}
      <box marginTop={0} onMouseDown={() => setShowMcp((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {showMcp() ? '▼' : '▶'} MCP Status
        </text>
      </box>

      <Show when={showMcp()}>
        <Show
          when={mcpServers().length > 0}
          fallback={
            <box marginLeft={1}>
              <text fg={theme().textMuted}>(no MCP data)</text>
            </box>
          }
        >
          <box marginLeft={1} flexDirection="column">
            <For each={mcpServers()}>
              {(mcp) => (
                <text
                  fg={
                    mcp.status === 'connected'
                      ? 'green'
                      : mcp.status === 'error'
                        ? 'red'
                        : theme().textMuted
                  }
                >
                  {mcp.status === 'connected' ? '✅' : mcp.status === 'error' ? '❌' : '⏳'}{' '}
                  {mcp.name}
                </text>
              )}
            </For>
          </box>
        </Show>
      </Show>

      {/* ══ Session ══ */}
      <box marginTop={0} onMouseDown={() => setShowSession((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {showSession() ? '▼' : '▶'} Session
        </text>
      </box>

      <Show when={showSession()}>
        <Show
          when={sessionTokens()}
          fallback={
            <box marginLeft={1}>
              <text fg={theme().textMuted}>(no session data)</text>
            </box>
          }
        >
          {(s) => (
            <box marginLeft={1} flexDirection="column">
              <text fg={theme().textMuted}>Messages: {s().messages}</text>
              <text fg={theme().textMuted}>Status: {s().status}</text>
            </box>
          )}
        </Show>
      </Show>

      {/* ══ Commands ══ */}
      <box marginTop={0} onMouseDown={() => setShowCommands((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showCommands() ? '▼' : '▶'} Commands`}
        </text>
        <text fg={theme().textMuted}> ({String(COMMANDS.length)})</text>
      </box>

      <Show when={showCommands()}>
        <For each={COMMANDS}>
          {(cmd) => (
            <box
              marginLeft={1}
              onMouseDown={(e) => {
                e.stopPropagation()
                try {
                  const cmdApi = (props.api as any).command
                  const cmdName = cmd.name.replace('/', '')
                  if (cmdApi?.trigger?.(cmdName)) return
                } catch {}
                props.api.ui?.toast?.({ title: 'Command', message: `Type ${cmd.name} in chat` })
              }}
            >
              <text fg={theme().textMuted}>{cmd.name}</text>
              <text fg={theme().textMuted}>{` — ${cmd.desc}`}</text>
            </box>
          )}
        </For>
      </Show>

      {/* ══ Config ══ */}
      <box marginTop={0} onMouseDown={() => setShowConfig((x) => !x)}>
        <text fg={theme().text} attributes={{ bold: true }}>
          {`${showConfig() ? '▼' : '▶'} Config`}
        </text>
      </box>

      <Show when={showConfig()}>
        <Show
          when={configInfo()}
          fallback={
            <box marginLeft={1}>
              <text fg={theme().textMuted}>(no config data)</text>
            </box>
          }
        >
          {(cfg) => (
            <box marginLeft={1} flexDirection="column">
              <text fg={theme().textMuted}>
                Plugins: {cfg().plugins.length > 0 ? cfg().plugins.join(', ') : '(none)'}
              </text>
              <text fg={theme().textMuted}>MCP configured: {String(cfg().mcpCount)}</text>
              <text fg={theme().textMuted}>
                Auto-compaction: {cfg().autoCompaction ? 'ON' : 'OFF'}
              </text>
            </box>
          )}
        </Show>
      </Show>
    </box>
  )
}

// ── Plugin ───────────────────────────────────────────────────────────────────
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

const plugin: TuiPluginModule = {
  id: 'pantheon.tui',
  tui,
}

export default plugin
