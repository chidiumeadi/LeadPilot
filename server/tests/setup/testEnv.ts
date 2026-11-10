import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'

// Single source of truth for "which database may tests touch". Two
// independent layers, both of which must pass before anything destructive
// (migrate deploy, TRUNCATE) runs:
//
//   1. assertTestDatabaseUrl — the configured URL: a loopback host, port
//      5432, the exact database name "leadpilot_test", and only allowlisted
//      query parameters (pg and Prisma both let query parameters such as
//      ?host= silently override the host written in the URL).
//   2. verifyConnectedTestDatabase — the *live* connection, asked directly:
//      current_database() must be "leadpilot_test" and inet_server_addr()
//      must be a Unix socket or loopback address.
//
// This is a local development harness only: there is deliberately no
// opt-in for remote hosts, other ports or other database names.

export const TEST_ENV_PATH = path.resolve(__dirname, '../../.env.test')

export const TEST_DATABASE_NAME = 'leadpilot_test'
const TEST_DATABASE_PORT = '5432'
const ALLOWED_PROTOCOLS = new Set(['postgresql:', 'postgres:'])
// URL.hostname keeps the brackets around IPv6 literals.
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])
// What inet_server_addr() may report: NULL (Unix socket) or one of these.
const LOOPBACK_SERVER_ADDRESSES = new Set(['127.0.0.1', '::1'])

// Strict allowlist: parameter name (exact, case-sensitive) -> allowed values.
// Our .env.test only needs schema=public. Anything else — host, hostaddr,
// port, database, dbname, db, service, options, sslmode, a different casing
// such as HOST or Schema — is rejected rather than enumerated as a blacklist.
const ALLOWED_QUERY_PARAMS: Readonly<Record<string, ReadonlySet<string>>> = {
  schema: new Set(['public']),
}

export function isTestDatabaseName(name: string): boolean {
  return name === TEST_DATABASE_NAME
}

function refuse(reason: string): never {
  throw new Error(`[test-db] ${reason} — refusing to run tests.`)
}

export function assertTestDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) refuse('DATABASE_URL is not set')

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    refuse('DATABASE_URL is not a valid URL')
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) refuse(`Unsupported protocol "${url.protocol}"`)
  if (url.hash) refuse('DATABASE_URL must not contain a #fragment')

  // An empty host would make the driver fall back to defaults/environment
  // (e.g. PGHOST), so it must be explicit and local.
  if (!url.hostname) refuse('DATABASE_URL must name its host explicitly')
  if (!LOCAL_HOSTNAMES.has(url.hostname)) refuse(`Non-local database host "${url.hostname}"`)

  // Explicit, not defaulted: a missing port would fall back to driver
  // defaults/environment (e.g. PGPORT) instead of the one we checked.
  if (url.port !== TEST_DATABASE_PORT) {
    refuse(`Database port must be ${TEST_DATABASE_PORT} (got "${url.port || 'none'}")`)
  }

  const seenParams = new Set<string>()
  for (const [name, value] of url.searchParams) {
    const normalized = name.toLowerCase()
    if (seenParams.has(normalized)) refuse(`Duplicate query parameter "${name}"`)
    seenParams.add(normalized)

    const allowedValues = Object.prototype.hasOwnProperty.call(ALLOWED_QUERY_PARAMS, name)
      ? ALLOWED_QUERY_PARAMS[name]
      : undefined
    if (!allowedValues) refuse(`Query parameter "${name}" is not allowed in a test DATABASE_URL`)
    if (!allowedValues.has(value)) refuse(`Query parameter "${name}=${value}" is not allowed`)
  }

  let databaseName: string
  try {
    databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''))
  } catch {
    refuse('DATABASE_URL has a malformed database name')
  }
  if (!isTestDatabaseName(databaseName)) {
    refuse(`Database "${databaseName}" is not a test database (must be exactly "${TEST_DATABASE_NAME}")`)
  }

  return rawUrl
}

// Minimal client shape so the live check works with Prisma's client, its
// transaction client, or a fake in tests.
export interface RawQueryClient {
  $queryRawUnsafe(query: string): Promise<unknown>
}

const CONNECTION_IDENTITY_SQL =
  'SELECT current_database() AS database, host(inet_server_addr()) AS server_address'

// Fails closed: anything other than exactly one row with the database name
// "leadpilot_test" and a NULL (Unix socket) or loopback server address throws.
export function assertConnectedTestDatabase(rows: unknown): { database: string; serverAddress: string | null } {
  if (!Array.isArray(rows) || rows.length !== 1 || typeof rows[0] !== 'object' || rows[0] === null) {
    throw new Error('[test-db] Could not verify the connected database (unexpected result) — refusing.')
  }

  const { database, server_address: serverAddress } = rows[0] as Record<string, unknown>

  if (typeof database !== 'string' || !isTestDatabaseName(database)) {
    throw new Error(`[test-db] Connected database "${String(database)}" is not a test database — refusing.`)
  }
  if (serverAddress !== null && (typeof serverAddress !== 'string' || !LOOPBACK_SERVER_ADDRESSES.has(serverAddress))) {
    throw new Error(`[test-db] Connected server address "${String(serverAddress)}" is not local — refusing.`)
  }

  return { database, serverAddress }
}

export async function verifyConnectedTestDatabase(client: RawQueryClient) {
  return assertConnectedTestDatabase(await client.$queryRawUnsafe(CONNECTION_IDENTITY_SQL))
}

// libpq-style PG* variables (PGHOST, PGPORT, PGDATABASE, PGSERVICE, ...)
// can supply connection defaults; tests never rely on them.
function removePgEnvironment(env: NodeJS.ProcessEnv): void {
  for (const key of Object.keys(env)) {
    if (/^PG/i.test(key)) delete env[key]
  }
}

// Loads server/.env.test, overriding anything already in the environment
// (e.g. a DATABASE_URL exported in the shell), and points dotenv/config —
// which src/config/env.ts and prisma.config.ts import — at the same file,
// so the development .env is never read during a test run.
export function loadTestEnv(): void {
  if (!fs.existsSync(TEST_ENV_PATH)) {
    throw new Error(`[test-db] Missing ${TEST_ENV_PATH}. Copy .env.test.example to .env.test first.`)
  }

  const parsed = dotenv.parse(fs.readFileSync(TEST_ENV_PATH))
  removePgEnvironment(process.env)
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value
  }
  process.env.DOTENV_CONFIG_PATH = TEST_ENV_PATH
  process.env.NODE_ENV = 'test'

  assertTestDatabaseUrl(process.env.DATABASE_URL)
}

// The only variable tests/setup/prisma.config.ts reads its URL from.
export const MIGRATION_URL_ENV = 'LEADPILOT_TEST_MIGRATION_URL'

// Environment for the `prisma migrate deploy` child process: the validated
// URL under a dedicated name, and nothing else that could point Prisma at a
// different database (no DATABASE_URL, no DOTENV_CONFIG_PATH, no PG*).
export function buildMigrationEnv(validatedUrl: string, baseEnv: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...baseEnv }
  removePgEnvironment(env)
  delete env.DATABASE_URL
  delete env.DOTENV_CONFIG_PATH
  env[MIGRATION_URL_ENV] = assertTestDatabaseUrl(validatedUrl)
  return env
}
