import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma'
import { AppError } from '../middleware/errorHandler'
import type { CreatePublicLeadInput } from '../validators/publicValidators'

// Public submissions always get this fixed source and status — never
// client-supplied. The Lead.source column is a plain string (not a DB
// enum) specifically so this value fits without a migration.
const PUBLIC_FORM_SOURCE = 'PUBLIC_FORM'

// Deliberately minimal — only what the public form needs to render. This
// must stay a strict subset of businessService's businessPublicSelect
// (which itself is already scoped to the authenticated owner).
const publicBusinessSelect = {
  name: true,
  slug: true,
} satisfies Prisma.BusinessSelect

const NOT_FOUND_MESSAGE = 'This page is no longer available.'

export async function getPublicBusinessBySlug(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: publicBusinessSelect,
  })

  if (!business) {
    throw new AppError(NOT_FOUND_MESSAGE, 404)
  }

  return business
}

export async function createPublicLead(slug: string, input: CreatePublicLeadInput) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!business) {
    throw new AppError(NOT_FOUND_MESSAGE, 404)
  }

  await prisma.lead.create({
    data: {
      businessId: business.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
      source: PUBLIC_FORM_SOURCE,
      status: 'NEW',
    },
  })
}
