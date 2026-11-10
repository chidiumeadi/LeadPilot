import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { corsOptions } from './config/cors'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import analyticsRoutes from './routes/analytics'
import authRoutes from './routes/auth'
import businessRoutes from './routes/business'
import followUpRoutes from './routes/followUps'
import healthRoutes from './routes/health'
import leadRoutes from './routes/leads'
import notificationRoutes from './routes/notifications'
import publicRoutes from './routes/public'

// Builds the Express app without listening or starting the scheduler, so
// tests can import it (via supertest) with no open port or background job.
// server.ts is the only place that actually runs the API.
export function createApp() {
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

  return app
}
