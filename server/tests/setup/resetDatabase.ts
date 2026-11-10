import { prisma } from '../../src/config/prisma'
import { resetRateLimiters } from '../../src/middleware/rateLimit'
import { type RawQueryClient, verifyConnectedTestDatabase } from './testEnv'

export interface ResetClient extends RawQueryClient {
  $executeRawUnsafe(query: string): Promise<number>
}

const APPLICATION_TABLES_SQL = `
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
`

// Runs on ONE connection: verify that connection's database and server
// address, then truncate through that same connection. Any failure — a
// rejected check, a query error, an unexpected result shape — throws before
// TRUNCATE is reached.
export async function resetOnConnection(client: ResetClient): Promise<void> {
  await verifyConnectedTestDatabase(client)

  const tables = await client.$queryRawUnsafe(APPLICATION_TABLES_SQL)
  if (
    !Array.isArray(tables) ||
    !tables.every((row) => typeof row?.tablename === 'string' && /^[a-z0-9_]+$/.test(row.tablename))
  ) {
    throw new Error('[test-db] Unexpected table list — refusing to truncate.')
  }
  if (tables.length === 0) return

  const tableList = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ')
  await client.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`)
}

// The interactive transaction pins verification and TRUNCATE to the same
// pooled connection, so the connection that was checked is the one that
// truncates.
export async function resetDatabase(): Promise<void> {
  await prisma.$transaction((tx) => resetOnConnection(tx))
}

// What runs before every test (see database.ts).
export async function resetTestState(): Promise<void> {
  await resetDatabase()
  await resetRateLimiters()
}
