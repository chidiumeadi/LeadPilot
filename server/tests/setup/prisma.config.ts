import path from 'node:path'

import { defineConfig } from 'prisma/config'

import { MIGRATION_URL_ENV, assertTestDatabaseUrl } from './testEnv'

// Prisma config used ONLY by globalSetup's `prisma migrate deploy --config`.
// Unlike the app's prisma.config.ts it never imports dotenv and never reads
// DATABASE_URL: its URL comes solely from the variable globalSetup sets to
// the already-validated test URL, and is validated again here so this file
// can't be pointed at another database even when invoked by hand.
const url = assertTestDatabaseUrl(process.env[MIGRATION_URL_ENV])

export default defineConfig({
  schema: path.resolve(__dirname, '../../prisma/schema.prisma'),
  datasource: { url },
})
