import { afterEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../src/config/prisma'
import { type ResetClient, resetOnConnection } from './setup/resetDatabase'
import {
  MIGRATION_URL_ENV,
  assertConnectedTestDatabase,
  assertTestDatabaseUrl,
  buildMigrationEnv,
  verifyConnectedTestDatabase,
} from './setup/testEnv'

// Every test here is deterministic: URL checks are pure, and the
// connection checks use fake clients except where they deliberately ask the
// real test database who it is.

const VALID_URL = 'postgresql://apple@localhost:5432/leadpilot_test?schema=public'
const BASE = 'postgresql://apple@localhost:5432/leadpilot_test'

describe('assertTestDatabaseUrl — accepted configurations', () => {
  it('accepts the exact shape used by .env.test', () => {
    expect(assertTestDatabaseUrl(VALID_URL)).toBe(VALID_URL)
  })

  it('accepts no query string, 127.0.0.1, [::1] and the postgres: scheme', () => {
    expect(() => assertTestDatabaseUrl(BASE)).not.toThrow()
    expect(() => assertTestDatabaseUrl('postgresql://apple@127.0.0.1:5432/leadpilot_test')).not.toThrow()
    expect(() => assertTestDatabaseUrl('postgresql://apple@[::1]:5432/leadpilot_test')).not.toThrow()
    expect(() => assertTestDatabaseUrl('postgres://apple@localhost:5432/leadpilot_test')).not.toThrow()
  })

  it('accepts the URL actually loaded from .env.test for this run', () => {
    expect(() => assertTestDatabaseUrl(process.env.DATABASE_URL)).not.toThrow()
  })
})

describe('assertTestDatabaseUrl — database name (exactly leadpilot_test)', () => {
  it.each([
    ['the development database', 'postgresql://apple@localhost:5432/leadpilot_dev?schema=public'],
    ['another project\'s test database', 'postgresql://apple@localhost:5432/another_project_test'],
    ['a longer name ending in _test', 'postgresql://apple@localhost:5432/x_leadpilot_test'],
    ['a name extending leadpilot_test', 'postgresql://apple@localhost:5432/leadpilot_test2'],
    ['a name with a suffix after _test', 'postgresql://apple@localhost:5432/leadpilot_test_old'],
    ['a different casing', 'postgresql://apple@localhost:5432/LEADPILOT_TEST'],
    ['a name merely starting with test', 'postgresql://apple@localhost:5432/test_leadpilot'],
    ['a bare _test', 'postgresql://apple@localhost:5432/_test'],
    ['no database at all', 'postgresql://apple@localhost:5432/'],
    ['a path with extra segments', 'postgresql://apple@localhost:5432/leadpilot_dev/x_test'],
    ['an encoded slash', 'postgresql://apple@localhost:5432/leadpilot_dev%2Fx_test'],
  ])('rejects %s', (_label, url) => {
    expect(() => assertTestDatabaseUrl(url)).toThrow(/test database|malformed/)
  })
})

describe('assertTestDatabaseUrl — host', () => {
  it('rejects a remote host even with the right database name', () => {
    expect(() => assertTestDatabaseUrl('postgresql://u:p@db.example.com:5432/leadpilot_test')).toThrow(/Non-local/)
  })

  it('has no remote-host opt-in: TEST_DB_ALLOW_REMOTE_HOST=true changes nothing', () => {
    const original = process.env.TEST_DB_ALLOW_REMOTE_HOST
    process.env.TEST_DB_ALLOW_REMOTE_HOST = 'true'
    try {
      expect(() => assertTestDatabaseUrl('postgresql://u:p@db.example.com:5432/leadpilot_test')).toThrow(/Non-local/)
    } finally {
      if (original === undefined) delete process.env.TEST_DB_ALLOW_REMOTE_HOST
      else process.env.TEST_DB_ALLOW_REMOTE_HOST = original
    }
  })

  it('rejects an empty host (driver would fall back to PGHOST/defaults)', () => {
    expect(() => assertTestDatabaseUrl('postgresql:///leadpilot_test')).toThrow(/host explicitly/)
    // Credentials with no host don't even parse as a URL — still refused.
    expect(() => assertTestDatabaseUrl('postgresql://apple@/leadpilot_test')).toThrow(/not a valid URL/)
  })

  it('rejects other schemes, including pg\'s socket: form', () => {
    expect(() => assertTestDatabaseUrl('socket://db.example.com/var/run?db=leadpilot_test')).toThrow(/protocol/)
    expect(() => assertTestDatabaseUrl('mysql://apple@localhost/leadpilot_test')).toThrow(/protocol/)
  })

  it('rejects a #fragment, a missing URL and a malformed URL', () => {
    expect(() => assertTestDatabaseUrl(`${VALID_URL}#x`)).toThrow(/fragment/)
    expect(() => assertTestDatabaseUrl(undefined)).toThrow(/not set/)
    expect(() => assertTestDatabaseUrl('not a url')).toThrow(/not a valid URL/)
  })
})

describe('assertTestDatabaseUrl — port (exactly 5432)', () => {
  it('accepts the configured port 5432 on every local host form', () => {
    expect(() => assertTestDatabaseUrl('postgresql://apple@localhost:5432/leadpilot_test')).not.toThrow()
    expect(() => assertTestDatabaseUrl('postgresql://apple@127.0.0.1:5432/leadpilot_test')).not.toThrow()
    expect(() => assertTestDatabaseUrl('postgresql://apple@[::1]:5432/leadpilot_test')).not.toThrow()
  })

  it.each(['5433', '6543', '15432', '1'])('rejects port %s', (port) => {
    expect(() => assertTestDatabaseUrl(`postgresql://apple@localhost:${port}/leadpilot_test?schema=public`)).toThrow(
      /port must be 5432/,
    )
  })

  it('rejects a URL with no explicit port (driver would fall back to PGPORT/defaults)', () => {
    expect(() => assertTestDatabaseUrl('postgresql://apple@localhost/leadpilot_test')).toThrow(/port must be 5432/)
  })
})

describe('assertTestDatabaseUrl — connection-target query parameters', () => {
  it('rejects ?host= (the original bypass)', () => {
    expect(() => assertTestDatabaseUrl(`${BASE}?host=db.example.com`)).toThrow(/"host" is not allowed/)
    expect(() => assertTestDatabaseUrl(`${VALID_URL}&host=db.example.com`)).toThrow(/"host" is not allowed/)
  })

  it('rejects ?port=', () => {
    expect(() => assertTestDatabaseUrl(`${BASE}?port=6543`)).toThrow(/"port" is not allowed/)
  })

  it.each(['hostaddr', 'database', 'dbname', 'db', 'service', 'servicefile', 'options', 'sslmode', 'user'])(
    'rejects ?%s=',
    (param) => {
      expect(() => assertTestDatabaseUrl(`${BASE}?${param}=x`)).toThrow(new RegExp(`"${param}" is not allowed`))
    },
  )

  it('rejects a parameter with no value', () => {
    expect(() => assertTestDatabaseUrl(`${BASE}?host`)).toThrow(/"host" is not allowed/)
  })

  it('rejects percent-encoded parameter names', () => {
    expect(() => assertTestDatabaseUrl(`${BASE}?%68ost=db.example.com`)).toThrow(/"host" is not allowed/)
  })

  it.each(['HOST', 'Host', 'hOsT', 'PORT', 'DbName', 'Schema', 'SCHEMA'])('rejects mixed-case %s', (param) => {
    expect(() => assertTestDatabaseUrl(`${BASE}?${param}=x`)).toThrow(/is not allowed/)
  })

  it('rejects duplicate parameters, including case variants', () => {
    expect(() => assertTestDatabaseUrl(`${BASE}?schema=public&schema=public`)).toThrow(/Duplicate/)
    expect(() => assertTestDatabaseUrl(`${BASE}?schema=public&SCHEMA=public`)).toThrow(/Duplicate/)
  })

  it('rejects a schema other than public, and values smuggling extra parameters', () => {
    expect(() => assertTestDatabaseUrl(`${BASE}?schema=other`)).toThrow(/"schema=other"/)
    expect(() => assertTestDatabaseUrl(`${BASE}?schema=public;host=db.example.com`)).toThrow(/is not allowed/)
  })
})

describe('assertConnectedTestDatabase — the live connection result', () => {
  it('accepts leadpilot_test over a Unix socket or loopback', () => {
    expect(assertConnectedTestDatabase([{ database: 'leadpilot_test', server_address: null }])).toEqual({
      database: 'leadpilot_test',
      serverAddress: null,
    })
    expect(() => assertConnectedTestDatabase([{ database: 'leadpilot_test', server_address: '127.0.0.1' }])).not.toThrow()
    expect(() => assertConnectedTestDatabase([{ database: 'leadpilot_test', server_address: '::1' }])).not.toThrow()
  })

  it.each(['10.0.0.5', '192.168.1.20', '203.0.113.7', '::ffff:10.0.0.5', '127.0.0.2', '0.0.0.0', ''])(
    'rejects non-loopback server address %j',
    (address) => {
      expect(() => assertConnectedTestDatabase([{ database: 'leadpilot_test', server_address: address }])).toThrow(
        /not local/,
      )
    },
  )

  it.each(['leadpilot_dev', 'another_project_test', 'leadpilot_test2', 'LEADPILOT_TEST'])(
    'rejects a connected database named %s',
    (database) => {
      expect(() => assertConnectedTestDatabase([{ database, server_address: null }])).toThrow(/not a test database/)
    },
  )

  it.each([
    ['no rows', []],
    ['two rows', [{ database: 'leadpilot_test', server_address: null }, { database: 'x_test', server_address: null }]],
    ['a non-array', { database: 'leadpilot_test', server_address: null }],
    ['a null row', [null]],
    ['a missing address field', [{ database: 'leadpilot_test' }]],
    ['a non-string database', [{ database: 42, server_address: null }]],
    ['undefined', undefined],
  ])('fails closed on %s', (_label, rows) => {
    expect(() => assertConnectedTestDatabase(rows)).toThrow(/refusing/)
  })

  it('the real connection for this run passes (leadpilot_test, socket or loopback)', async () => {
    const identity = await verifyConnectedTestDatabase(prisma)
    expect(identity.database).toBe('leadpilot_test')
    expect([null, '127.0.0.1', '::1']).toContain(identity.serverAddress)
  })
})

describe('resetOnConnection — never truncates unless verification passes', () => {
  function fakeClient(identityRows: unknown, options: { identityError?: Error } = {}) {
    const executed: string[] = []
    const client: ResetClient = {
      $queryRawUnsafe: vi.fn(async (sql: string) => {
        if (sql.includes('current_database')) {
          if (options.identityError) throw options.identityError
          return identityRows
        }
        return [{ tablename: 'leads' }, { tablename: 'users' }]
      }),
      $executeRawUnsafe: vi.fn(async (sql: string) => {
        executed.push(sql)
        return 0
      }),
    }
    return { client, executed }
  }

  it('does not truncate on a non-loopback server address', async () => {
    const { client, executed } = fakeClient([{ database: 'leadpilot_test', server_address: '10.0.0.5' }])
    await expect(resetOnConnection(client)).rejects.toThrow(/not local/)
    expect(executed).toEqual([])
  })

  it('does not truncate on a non-test database name', async () => {
    const { client, executed } = fakeClient([{ database: 'leadpilot_dev', server_address: null }])
    await expect(resetOnConnection(client)).rejects.toThrow(/not a test database/)
    expect(executed).toEqual([])
  })

  it('does not truncate when the identity query itself fails', async () => {
    const { client, executed } = fakeClient(null, { identityError: new Error('connection lost') })
    await expect(resetOnConnection(client)).rejects.toThrow(/connection lost/)
    expect(executed).toEqual([])
  })

  it('does not truncate on an unexpected identity result', async () => {
    const { client, executed } = fakeClient([])
    await expect(resetOnConnection(client)).rejects.toThrow(/refusing/)
    expect(executed).toEqual([])
  })

  it('does not truncate on an unexpected table list', async () => {
    const executed: string[] = []
    const client: ResetClient = {
      $queryRawUnsafe: async (sql: string) =>
        sql.includes('current_database')
          ? [{ database: 'leadpilot_test', server_address: null }]
          : [{ tablename: 'leads"; DROP DATABASE x; --' }],
      $executeRawUnsafe: async (sql: string) => {
        executed.push(sql)
        return 0
      },
    }
    await expect(resetOnConnection(client)).rejects.toThrow(/Unexpected table list/)
    expect(executed).toEqual([])
  })

  it('truncates exactly the listed public tables once verification passes', async () => {
    const { client, executed } = fakeClient([{ database: 'leadpilot_test', server_address: '127.0.0.1' }])
    await resetOnConnection(client)
    expect(executed).toEqual(['TRUNCATE TABLE "public"."leads", "public"."users" RESTART IDENTITY CASCADE'])
  })
})

describe('migration step', () => {
  const originalMigrationUrl = process.env[MIGRATION_URL_ENV]

  afterEach(() => {
    if (originalMigrationUrl === undefined) delete process.env[MIGRATION_URL_ENV]
    else process.env[MIGRATION_URL_ENV] = originalMigrationUrl
    vi.resetModules()
  })

  it('the migration env carries only the validated URL — no DATABASE_URL, DOTENV_CONFIG_PATH or PG* overrides', () => {
    const env = buildMigrationEnv(VALID_URL, {
      PATH: '/usr/bin',
      DATABASE_URL: 'postgresql://apple@localhost:5432/leadpilot_dev',
      DOTENV_CONFIG_PATH: '/elsewhere/.env',
      PGHOST: 'db.example.com',
      PGPORT: '6543',
      PGDATABASE: 'leadpilot_dev',
      PGSERVICE: 'prod',
      pghostaddr: '10.0.0.5',
    })

    expect(env).toEqual({ PATH: '/usr/bin', [MIGRATION_URL_ENV]: VALID_URL })
  })

  it('refuses to build a migration env for an unvalidated URL', () => {
    expect(() => buildMigrationEnv('postgresql://apple@localhost:5432/leadpilot_dev')).toThrow(/not a test database/)
    expect(() => buildMigrationEnv(`${BASE}?host=db.example.com`)).toThrow(/"host" is not allowed/)
  })

  it('the migration Prisma config uses the dedicated variable, never DATABASE_URL', async () => {
    process.env[MIGRATION_URL_ENV] = VALID_URL
    const { default: config } = await import('./setup/prisma.config')
    expect(config.datasource?.url).toBe(VALID_URL)
  })

  it('the migration Prisma config refuses a non-test URL', async () => {
    process.env[MIGRATION_URL_ENV] = 'postgresql://apple@localhost:5432/leadpilot_dev'
    await expect(import('./setup/prisma.config')).rejects.toThrow(/not a test database/)
  })

  it('the migration Prisma config refuses to load with no URL at all', async () => {
    delete process.env[MIGRATION_URL_ENV]
    await expect(import('./setup/prisma.config')).rejects.toThrow(/not set/)
  })
})
