import { env } from '../config/env'
import { processDueFollowUps } from './followUpNotificationJob'

let intervalHandle: ReturnType<typeof setInterval> | null = null

async function runSafely(): Promise<void> {
  try {
    await processDueFollowUps()
  } catch (err) {
    // A scheduler error must never crash Express — log and move on. This is
    // the outermost safety net; processDueFollowUps already isolates
    // per-follow-up failures internally.
    // eslint-disable-next-line no-console
    console.error('[follow-up-job] Unexpected scheduler error:', err instanceof Error ? err.message : err)
  }
}

export function startFollowUpScheduler(): void {
  if (intervalHandle) return // already started

  // eslint-disable-next-line no-console
  console.log(`[follow-up-job] Scheduler started (interval: ${env.followUpJobIntervalMs}ms)`)

  void runSafely() // run once immediately rather than waiting a full interval after startup
  intervalHandle = setInterval(runSafely, env.followUpJobIntervalMs)
  intervalHandle.unref?.()
}

export function stopFollowUpScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
