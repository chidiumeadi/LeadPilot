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
}
