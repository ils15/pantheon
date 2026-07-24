/**
 * pantheon-notify — Desktop notifications for Pantheon agent events.
 *
 * Fires best-effort cross-platform notifications on:
 *   - session.created  → "Pantheon session started"
 *   - session.idle     → "Pantheon session completed"
 *   - session.error    → "Pantheon session error: <message>"
 *   - tool.execute.after (if tool === "task") → "Agent <task> completed"
 *
 * Uses Bun's `$` shell API to invoke the platform-native notification command.
 * Catches all errors silently so a failed notify never crashes the host.
 */

const LINUX_CMD = (msg) => ['notify-send', 'Pantheon', msg]
const MACOS_CMD = (msg) => [
  'osascript',
  '-e',
  `display notification ${JSON.stringify(msg)} with title "Pantheon"`,
]
const WINDOWS_CMD = (msg) => [
  'powershell',
  '-c',
  `New-BurntToastNotification -Text 'Pantheon', ${JSON.stringify(msg)}`,
]

/**
 * Try each platform notification command in order; swallow all errors.
 * This is deliberately sequential so we don't spam the OS with parallel
 * child processes for a single notification.
 */
async function tryNotify($, message) {
  const candidates = [LINUX_CMD(message), MACOS_CMD(message), WINDOWS_CMD(message)]
  for (const args of candidates) {
    try {
      await $`${args}`
      // first success is enough
      return
    } catch {
      // platform mismatch or missing binary — try next
    }
  }
}

/**
 * Extract a human-readable label from the task name passed to an agent
 * delegation.  Falls back to "unknown task" on missing data.
 */
function taskLabel(ctx) {
  const name = ctx?.arguments?.task ?? ctx?.arguments?.name
  return name ? String(name) : 'unknown task'
}

/**
 * Extract a short error label from a session.error event payload.
 */
function errorMessage(event) {
  const err = event?.payload ?? event?.error ?? event?.data
  if (!err) return 'unknown error'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (err.message) return err.message
  return String(err)
}

/** Named export consumed by the opencode plugin runtime. */
export const NotifyPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    event: async ({ event }) => {
      try {
        const { type, ctx, payload } = event

        switch (type) {
          case 'session.created':
            await tryNotify($, 'Pantheon session started')
            break

          case 'session.idle':
            await tryNotify($, 'Pantheon session completed')
            break

          case 'session.error':
            await tryNotify($, `Pantheon session error: ${errorMessage(event)}`)
            break

          case 'tool.execute.after':
            if (ctx?.tool === 'task') {
              await tryNotify($, `Agent ${taskLabel(ctx)} completed`)
            }
            break

          default:
            // ignore unhandled event types
            break
        }
      } catch (err) {
        // Structural error in our own handler — log but never throw.
        if (client?.app?.log) {
          client.app.log(`[pantheon-notify] handler error: ${err.message}`)
        }
      }
    },
  }
}
