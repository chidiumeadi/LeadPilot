import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { env } from './env'

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined
}

const adapter = new PrismaPg({ connectionString: env.databaseUrl })

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV === 'development') {
  global.__prisma__ = prisma
}