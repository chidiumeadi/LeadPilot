import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { corsOptions } from './config/cors'
import { env } from './config/env'
import { startFollowUpScheduler, stopFollowUpScheduler } from './jobs/scheduler'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import analyticsRoutes from './routes/analytics'
import authRoutes from './routes/auth'
import businessRoutes from './routes/business'
import followUpRoutes from './routes/followUps'
import healthRoutes from './routes/health'
import leadRoutes from './routes/leads'
import notificationRoutes from './routes/notifications'
import publicRoutes from './routes/public'

const app = express()

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/business', businessRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/follow-ups', followUpRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

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

export default app
