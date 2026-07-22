// index.tsx
import { createMemo, createSignal, For, Show } from 'solid-js'

async function readPantheonVersion(api) {
  try {
    const worktree = api.state.path?.worktree ?? ''
    const filePath = worktree ? `${worktree}/package.json` : 'package.json'
    const result = await api.client.file.read({ query: { path: filePath } })
    const content =
      typeof result.content === 'string' ? result.content : String(result.content ?? '')
    const match = content.match(/"version":\s*"([^"]+)"/)
    if (match?.[1]) return match[1]
  } catch {}
  try {
    const proc = api.client?.process
    if (typeof proc?.exec === 'function') {
      const result = await proc.exec({ command: 'git', args: ['describe', '--tags', '--always'] })
      const stdout = result.stdout ?? result.output ?? ''
      const tag = stdout.trim().replace(/^v/, '')
      if (tag) return tag
    }
  } catch {}
  return '4.0.0'
}
var COMMANDS = [
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
]
var AGENTS = [
  { name: 'zeus', tier: 'default', role: 'Orchestrator' },
  { name: 'athena', tier: 'premium', role: 'Strategic planner' },
  { name: 'apollo', tier: 'fast', role: 'Codebase discovery' },
  { name: 'hermes', tier: 'default', role: 'Backend' },
  { name: 'aphrodite', tier: 'default', role: 'Frontend' },
  { name: 'demeter', tier: 'default', role: 'Database' },
  { name: 'themis', tier: 'premium', role: 'Quality & security' },
  { name: 'prometheus', tier: 'default', role: 'Infrastructure' },
  { name: 'hephaestus', tier: 'default', role: 'AI pipelines' },
  { name: 'nyx', tier: 'fast', role: 'Observability' },
  { name: 'gaia', tier: 'fast', role: 'Remote sensing' },
  { name: 'iris', tier: 'fast', role: 'GitHub operations' },
  { name: 'mnemosyne', tier: 'fast', role: 'Memory bank' },
  { name: 'talos', tier: 'fast', role: 'Hotfixes' },
]
function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}
function View(props) {
  const [showCommands, setShowCommands] = createSignal(false)
  const [showAgents, setShowAgents] = createSignal(false)
  const [showConfig, setShowConfig] = createSignal(false)
  const [showMemory, setShowMemory] = createSignal(false)
  const theme = () => props.api.theme.current
  const branch = createMemo(() =>
    props.api.state.vcs?.branch ? `\u2387 ${props.api.state.vcs.branch}` : null,
  )
  const configInfo = createMemo(() => {
    const cfg = props.api.state.config
    if (!cfg) return null
    return {
      plugins: Array.isArray(cfg.plugin) ? cfg.plugin : [],
      mcpCount: cfg.mcp ? Object.keys(cfg.mcp).length : 0,
      autoCompaction: cfg.compaction?.auto === true,
    }
  })
  const memoryInfo = createMemo(() => {
    const mem = props.api.state.memory
    if (mem) {
      const entries = safeNum(mem?.entries) || safeNum(mem?.count)
      return entries > 0 ? { entries } : null
    }
    return null
  })
  return /* @__PURE__ */ React.createElement(
    'box',
    { flexDirection: 'column', width: '100%' },
    /* @__PURE__ */ React.createElement(
      'text',
      { fg: theme().accent, attributes: { bold: true } },
      '\u26A1 Pantheon \xB7 ',
      props.version,
    ),
    /* @__PURE__ */ React.createElement(Show, { when: branch() }, (b) =>
      /* @__PURE__ */ React.createElement(
        'box',
        { marginTop: 1 },
        /* @__PURE__ */ React.createElement('text', { fg: theme().textMuted }, b()),
      ),
    ),
    /* @__PURE__ */ React.createElement(
      'box',
      { marginTop: 0, onMouseDown: () => setShowCommands((x) => !x) },
      /* @__PURE__ */ React.createElement(
        'text',
        { fg: theme().text, attributes: { bold: true } },
        showCommands() ? '\u25BC' : '\u25B6',
        ' Commands',
      ),
      /* @__PURE__ */ React.createElement(
        'text',
        { fg: theme().textMuted },
        ' (',
        COMMANDS.length,
        ')',
      ),
    ),
    /* @__PURE__ */ React.createElement(
      Show,
      { when: showCommands() },
      /* @__PURE__ */ React.createElement(For, { each: COMMANDS }, (cmd) =>
        /* @__PURE__ */ React.createElement(
          'box',
          {
            marginLeft: 1,
            onMouseDown: (e) => {
              e.stopPropagation()
              try {
                const cmdApi = props.api.command
                const cmdName = cmd.name.replace('/', '')
                if (cmdApi?.trigger?.(cmdName)) return
              } catch {}
              props.api.ui?.toast?.({
                title: 'Command',
                message: `Type ${cmd.name} in chat`,
              })
            },
          },
          /* @__PURE__ */ React.createElement(
            'text',
            {
              fg: cmd.name === '/pantheon' ? theme().accent : theme().textMuted,
            },
            cmd.name,
          ),
          /* @__PURE__ */ React.createElement(
            'text',
            { fg: theme().textMuted },
            ' \u2014 ',
            cmd.desc,
          ),
        ),
      ),
    ),
    /* @__PURE__ */ React.createElement(
      'box',
      { marginTop: 0, onMouseDown: () => setShowAgents((x) => !x) },
      /* @__PURE__ */ React.createElement(
        'text',
        { fg: theme().text, attributes: { bold: true } },
        showAgents() ? '\u25BC' : '\u25B6',
        ' Agents',
      ),
      /* @__PURE__ */ React.createElement(
        'text',
        { fg: theme().textMuted },
        ' (',
        AGENTS.length,
        ')',
      ),
    ),
    /* @__PURE__ */ React.createElement(
      Show,
      { when: showAgents() },
      /* @__PURE__ */ React.createElement(For, { each: AGENTS }, (agent) =>
        /* @__PURE__ */ React.createElement(
          'box',
          { marginLeft: 1 },
          /* @__PURE__ */ React.createElement(
            'text',
            {
              fg: agent.tier === 'premium' ? theme().accent : theme().textMuted,
            },
            agent.tier === 'premium' ? '\u2726 ' : '\xB7 ',
            agent.name,
          ),
          /* @__PURE__ */ React.createElement(
            'text',
            { fg: theme().textMuted },
            ' \u2014 ',
            agent.role,
          ),
        ),
      ),
    ),
    /* @__PURE__ */ React.createElement(
      'box',
      { marginTop: 0, onMouseDown: () => setShowConfig((x) => !x) },
      /* @__PURE__ */ React.createElement(
        'text',
        { fg: theme().text, attributes: { bold: true } },
        showConfig() ? '\u25BC' : '\u25B6',
        ' Config',
      ),
    ),
    /* @__PURE__ */ React.createElement(
      Show,
      { when: showConfig() },
      /* @__PURE__ */ React.createElement(
        Show,
        {
          when: configInfo(),
          fallback: /* @__PURE__ */ React.createElement(
            'box',
            { marginLeft: 1 },
            /* @__PURE__ */ React.createElement(
              'text',
              { fg: theme().textMuted },
              '(no config data)',
            ),
          ),
        },
        (cfg) =>
          /* @__PURE__ */ React.createElement(
            'box',
            { marginLeft: 1, flexDirection: 'column' },
            /* @__PURE__ */ React.createElement(
              'text',
              { fg: theme().textMuted },
              'Plugins:',
              ' ',
              cfg().plugins.length > 0 ? cfg().plugins.join(', ') : '(none)',
            ),
            /* @__PURE__ */ React.createElement(
              'text',
              { fg: theme().textMuted },
              'MCP servers configured: ',
              cfg().mcpCount,
            ),
            /* @__PURE__ */ React.createElement(
              'text',
              { fg: theme().textMuted },
              'Auto-compaction: ',
              cfg().autoCompaction ? 'ON' : 'OFF',
            ),
          ),
      ),
    ),
    /* @__PURE__ */ React.createElement(
      'box',
      { marginTop: 0, onMouseDown: () => setShowMemory((x) => !x) },
      /* @__PURE__ */ React.createElement(
        'text',
        { fg: theme().text, attributes: { bold: true } },
        showMemory() ? '\u25BC' : '\u25B6',
        ' Memory',
      ),
    ),
    /* @__PURE__ */ React.createElement(
      Show,
      { when: showMemory() },
      /* @__PURE__ */ React.createElement(
        Show,
        {
          when: memoryInfo(),
          fallback: /* @__PURE__ */ React.createElement(
            'box',
            { marginLeft: 1 },
            /* @__PURE__ */ React.createElement(
              'text',
              { fg: theme().textMuted },
              '(no memory data)',
            ),
          ),
        },
        (mem) =>
          /* @__PURE__ */ React.createElement(
            'box',
            { marginLeft: 1, flexDirection: 'column' },
            /* @__PURE__ */ React.createElement(
              'text',
              { fg: theme().textMuted },
              'Entries: ',
              mem().entries,
            ),
          ),
      ),
    ),
  )
}
var tui = async (api, _options, _meta) => {
  const version = await readPantheonVersion(api)
  api.slots.register({
    order: 900,
    slots: {
      sidebar_content(_ctx, props) {
        return /* @__PURE__ */ React.createElement(View, {
          api,
          sessionID: props.session_id,
          version,
        })
      },
    },
  })
}
var plugin = {
  id: 'pantheon.tui',
  tui,
}
var index_default = plugin

export { index_default as default }
