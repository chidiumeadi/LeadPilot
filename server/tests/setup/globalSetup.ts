import { execFileSync } from 'node:child_process'
import path from 'node:path'

import { assertTestDatabaseUrl, buildMigrationEnv, loadTestEnv, verifyConnectedTestDatabase } from './testEnv'

const SERVER_ROOT = path.resolve(__dirname, '../..')
const MIGRATION_CONFIG_PATH = path.resolve(__dirname, 'prisma.config.ts')

// Runs once per `vitest run`, before any test file: brings the test
// database's schema up to date with the committed migrations. Uses
// `migrate deploy` (apply pending migrations only) — never `migrate dev` or
// `migrate reset`, which can prompt, generate migrations or drop data.
export default async function globalSetup() {
  loadTestEnv()
  const databaseUrl = assertTestDatabaseUrl(process.env.DATABASE_URL)

  // Ask the server itself before migrating — the URL check alone can't
  // prove where a connection actually lands. Imported only now, after the
  // env is loaded and validated.
  const { prisma } = await import('../../src/config/prisma')
  try {
    await verifyConnectedTestDatabase(prisma)
  } finally {
    await prisma.$disconnect()
  }

  execFileSync('npx', ['prisma', 'migrate', 'deploy', '--config', MIGRATION_CONFIG_PATH], {
    cwd: SERVER_ROOT,
    env: buildMigrationEnv(databaseUrl),
    stdio: 'pipe',
  })
}
