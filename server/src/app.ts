import cors from 'cors'
import express from 'express'

import { corsOptions } from './config/cors'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import healthRoutes from './routes/health'

const app = express()

app.use(cors(corsOptions))
app.use(express.json())

// Phase 0: only the health route exists.
// Later phases mount /api/auth, /api/business, /api/leads, etc. here.
app.use('/api', healthRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`LeadPilot API listening on ${env.serverUrl} (${env.nodeEnv})`)
})

export default app
