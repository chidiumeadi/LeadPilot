import 'dotenv/config'

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// TRUST_PROXY is the number of reverse-proxy hops in front of the API (e.g.
// 1 on Render). Unset means "no proxy" — Express then ignores
// X-Forwarded-For, which is right for local development. Only a hop count
// is accepted, never "true" or subnet lists: trusting every hop would let
// any client spoof its IP (and so its rate-limit bucket) via the header.
export function parseTrustProxy(raw: string | undefined): number | false {
  if (raw === undefined || raw.trim() === '') return false
  if (!/^\d+$/.test(raw.trim())) {
    throw new Error(`TRUST_PROXY must be a whole number of proxy hops (got "${raw}")`)
  }
  const hops = Number(raw.trim())
  return hops === 0 ? false : hops
}

// Hosting platforms like Render expose the service's public URL here, so a
// single-service deploy doesn't need CLIENT_URL/SERVER_URL set by hand.
const platformUrl = process.env.RENDER_EXTERNAL_URL

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  clientUrl: requireEnv('CLIENT_URL', platformUrl ?? 'http://localhost:3000'),
  serverUrl: requireEnv('SERVER_URL', platformUrl ?? 'http://localhost:5000'),
  // How often the follow-up-due scheduler checks the database. 1 minute is
  // a reasonable MVP default — a follow-up scheduled for 10:00 may be
  // processed anywhere in 10:00–10:01 depending on this interval.
  followUpJobIntervalMs: Number(process.env.FOLLOW_UP_JOB_INTERVAL_MS ?? 60000),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  // Path to the built React app (client/dist). When set, the API also
  // serves the frontend from the same origin — used for single-service
  // deploys. Unset in local development, where Vite serves the client.
  clientDistDir: process.env.CLIENT_DIST_DIR || undefined,
}
