import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { corsOptions } from './config/cors'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import businessRoutes from './routes/business'
import healthRoutes from './routes/health'
import leadRoutes from './routes/leads'

const app = express()

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/business', businessRoutes)
app.use('/api/leads', leadRoutes)
// Later phases mount /api/follow-ups, /api/notifications, etc. here.

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`LeadPilot API listening on ${env.serverUrl} (${env.nodeEnv})`)
})

export default app
