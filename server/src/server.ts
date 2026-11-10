import { createApp } from './app'
import { env } from './config/env'
import { startFollowUpScheduler, stopFollowUpScheduler } from './jobs/scheduler'

const app = createApp()

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`LeadPilot API listening on ${env.serverUrl} (${env.nodeEnv})`)
  startFollowUpScheduler()
})

// The scheduler is the first thing in this app that needs explicit cleanup
// (an interval timer) — everything else exits fine when the process does.
function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`[server] Received ${signal}, shutting down gracefully...`)
  stopFollowUpScheduler()
  server.close(() => process.exit(0))
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
