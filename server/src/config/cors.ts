import type { CorsOptions } from 'cors'

import { env } from './env'

// Only the configured client origin is allowed. In production this
// should be the deployed frontend URL (set via CLIENT_URL), never a
// wildcard.
export const corsOptions: CorsOptions = {
  origin: env.clientUrl,
  credentials: true,
}
