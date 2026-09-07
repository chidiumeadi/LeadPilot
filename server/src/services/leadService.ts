import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma'
import { AppError } from '../middleware/errorHandler'
import type { CreateLeadInput, LeadListQuery, UpdateLeadInput } from '../validators/leadValidators'

const MANUAL_SOURCE = 'MANUAL'

// Every query in this file is scoped by businessId at the database level —
// never fetch-then-check. This is the tenant-isolation boundary the rest of
// the app (and later phases) depends on.

export async function listLeads(businessId: string, query: LeadListQuery) {
  const { page, limit, status, search } = query

  const where: Prisma.LeadWhereInput = {
    businessId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function createLead(businessId: string, input: CreateLeadInput) {
  return prisma.lead.create({
    data: {
      businessId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      status: input.status,
      notes: input.notes,
      source: MANUAL_SOURCE,
    },
  })
}

export async function getLeadById(businessId: string, id: string) {
  const lead = await prisma.lead.findFirst({ where: { id, businessId } })

  if (!lead) {
    throw new AppError('Lead not found', 404)
  }

  return lead
}

export async function updateLead(businessId: string, id: string, input: UpdateLeadInput) {
  const { count } = await prisma.lead.updateMany({
    where: { id, businessId },
    data: input,
  })

  if (count === 0) {
    throw new AppError('Lead not found', 404)
  }

  return prisma.lead.findUniqueOrThrow({ where: { id } })
}

export async function deleteLead(businessId: string, id: string) {
  const { count } = await prisma.lead.deleteMany({ where: { id, businessId } })

  if (count === 0) {
    throw new AppError('Lead not found', 404)
  }
}
