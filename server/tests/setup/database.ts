import { afterAll, beforeEach } from 'vitest'

import { prisma } from '../../src/config/prisma'
import { resetTestState } from './resetDatabase'

// Second setupFile (after env.ts): every test starts with an empty, verified
// test database and fresh rate-limit counters.
beforeEach(async () => {
  await resetTestState()
})

afterAll(async () => {
  await prisma.$disconnect()
})
