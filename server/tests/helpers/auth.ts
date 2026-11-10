import request from 'supertest'

import { app } from './app'

let accountCounter = 0

export const TEST_PASSWORD = 'password123'

export interface TestAccount {
  // A supertest agent that keeps the auth cookie between requests, i.e. a
  // logged-in browser session for this account.
  agent: ReturnType<typeof request.agent>
  user: { id: string; name: string; email: string }
  businessId: string
  businessSlug: string
}

// Registers a real account through POST /api/auth/register, so every test
// that uses it also exercises the real auth path (hashing, cookie, JWT).
export async function createTestAccount(label = 'Test'): Promise<TestAccount> {
  accountCounter += 1
  const unique = `${Date.now()}-${accountCounter}`
  const agent = request.agent(app)

  const res = await agent.post('/api/auth/register').send({
    name: `${label} User`,
    email: `${label.toLowerCase().replace(/\s+/g, '-')}-${unique}@example.com`,
    password: TEST_PASSWORD,
    businessName: `${label} Business ${unique}`,
  })

  if (res.status !== 201) {
    throw new Error(`createTestAccount failed (${res.status}): ${JSON.stringify(res.body)}`)
  }

  const { user } = res.body.data
  return { agent, user, businessId: user.business.id, businessSlug: user.business.slug }
}
