import type { Prisma, PrismaClient } from '@prisma/client'

import { prisma } from '../config/prisma'
import { AppError } from '../middleware/errorHandler'
import { slugify } from '../utils/slugify'

export const businessPublicSelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  phone: true,
  location: true,
  logoUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BusinessSelect

// Derives a unique, URL-safe slug from the business name. Runs against the
// given transaction client so it stays consistent with the in-flight
// registration transaction.
export async function generateUniqueSlug(
  tx: Prisma.TransactionClient | PrismaClient,
  businessName: string,
): Promise<string> {
  const base = slugify(businessName)
  let candidate = base
  let suffix = 2

  while (await tx.business.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  return candidate
}

export async function getBusinessIdForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessId: true },
  })

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  return user.businessId
}

export async function getBusinessForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { business: { select: businessPublicSelect } },
  })

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  return user.business
}

export async function updateBusinessForUser(
  userId: string,
  data: { name?: string; category?: string | null; phone?: string | null; location?: string | null },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessId: true },
  })

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  return prisma.business.update({
    where: { id: user.businessId },
    data,
    select: businessPublicSelect,
  })
}
