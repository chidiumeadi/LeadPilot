import { describe, expect, it } from 'vitest'

import { prisma } from '../src/config/prisma'
import { api } from './helpers/app'
import { createTestAccount } from './helpers/auth'
import { createFollowUp, createLead } from './helpers/factories'
import { resetTestState } from './setup/resetDatabase'

// Checks the test harness itself: the per-test reset, the helpers, and the
// rate-limiter reset. (The database safety checks have their own file,
// testDatabaseSafety.test.ts.) If any of these break, every other suite's
// results are suspect.

describe('run environment', () => {
  it('the suite is connected to leadpilot_test with NODE_ENV=test', async () => {
    const [{ current_database }] = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`
    expect(current_database).toBe('leadpilot_test')
    expect(process.env.NODE_ENV).toBe('test')
  })
})

describe('database reset', () => {
  it('resetTestState empties every table', async () => {
    const account = await createTestAccount('Reset')
    await createFollowUp(account.businessId, (await createLead(account.businessId)).id)

    await resetTestState()

    const counts = await Promise.all([
      prisma.business.count(),
      prisma.user.count(),
      prisma.lead.count(),
      prisma.followUp.count(),
      prisma.leadActivity.count(),
    ])
    expect(counts).toEqual([0, 0, 0, 0, 0])
  })

  // Symmetric pair: each starts by asserting an empty database, then leaves
  // a row behind. Whichever runs second only passes if the beforeEach reset
  // ran in between — so this holds in any execution order, including
  // shuffled, and fails in any order if the hook stops running.
  it.each(['first', 'second'])('test %s starts with an empty database and leaves a row behind', async (label) => {
    expect(await prisma.business.count()).toBe(0)
    await prisma.business.create({ data: { name: `Leftover ${label}`, slug: `leftover-${label}` } })
    expect(await prisma.business.count()).toBe(1)
  })
})

describe('helpers', () => {
  it('createTestAccount returns a logged-in agent', async () => {
    const account = await createTestAccount('Helper')

    const res = await account.agent.get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.data.user.id).toBe(account.user.id)
    expect(res.body.data.user.business.id).toBe(account.businessId)
  })

  it('two accounts get separate businesses and sessions', async () => {
    const a = await createTestAccount('Alpha')
    const b = await createTestAccount('Beta')

    expect(a.businessId).not.toBe(b.businessId)
    expect((await a.agent.get('/api/auth/me')).body.data.user.id).toBe(a.user.id)
    expect((await b.agent.get('/api/auth/me')).body.data.user.id).toBe(b.user.id)
  })

  it('an unauthenticated request is rejected', async () => {
    const res = await api().get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('factories create rows the API can see for the owning business', async () => {
    const account = await createTestAccount('Factory')
    const lead = await createLead(account.businessId, { name: 'Factory Lead' })
    await createFollowUp(account.businessId, lead.id)

    const leadRes = await account.agent.get(`/api/leads/${lead.id}`)
    expect(leadRes.status).toBe(200)
    expect(leadRes.body.data.lead.name).toBe('Factory Lead')

    const followUpsRes = await account.agent.get('/api/follow-ups').query({ leadId: lead.id })
    expect(followUpsRes.body.data.items).toHaveLength(1)
  })
})

describe('rate limiter reset', () => {
  // forgot-password allows 5 requests per 15 minutes per IP. It's the
  // cheapest limiter to exhaust: no bcrypt, and an unknown email writes
  // nothing.
  const forgotPassword = () => api().post('/api/auth/forgot-password').send({ email: 'nobody@example.com' })

  async function expectFreshThenExhaust() {
    for (let i = 0; i < 5; i += 1) {
      expect((await forgotPassword()).status).toBe(200)
    }
    expect((await forgotPassword()).status).toBe(429)
  }

  it('resetTestState clears an exhausted limiter', async () => {
    await expectFreshThenExhaust()
    await resetTestState()
    expect((await forgotPassword()).status).toBe(200)
  })

  // Same symmetric pattern as the database pair: each test needs fresh
  // counters at its start and leaves the limiter exhausted.
  it.each(['first', 'second'])('test %s starts with fresh counters and leaves the limiter exhausted', async () => {
    await expectFreshThenExhaust()
  })
})
