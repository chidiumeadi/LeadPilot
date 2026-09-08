import 'dotenv/config'

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  clientUrl: requireEnv('CLIENT_URL', 'http://localhost:3000'),
  serverUrl: requireEnv('SERVER_URL', 'http://localhost:5000'),
  // How often the follow-up-due scheduler checks the database. 1 minute is
  // a reasonable MVP default — a follow-up scheduled for 10:00 may be
  // processed anywhere in 10:00–10:01 depending on this interval.
  followUpJobIntervalMs: Number(process.env.FOLLOW_UP_JOB_INTERVAL_MS ?? 60000),
}
