import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { corsOptions } from './config/cors'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import businessRoutes from './routes/business'
import followUpRoutes from './routes/followUps'
import healthRoutes from './routes/health'
import leadRoutes from './routes/leads'
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
// Later phases mount /api/notifications, etc. here.

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`LeadPilot API listening on ${env.serverUrl} (${env.nodeEnv})`)
})

export default app
