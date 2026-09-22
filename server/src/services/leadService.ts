import type { LeadStatus, Prisma } from '@prisma/client'

import { prisma } from '../config/prisma'
import { AppError } from '../middleware/errorHandler'
import * as leadActivityService from './leadActivityService'
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
  const lead = await prisma.lead.create({
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

  await leadActivityService.logActivity({
    businessId,
    leadId: lead.id,
    type: 'LEAD_CREATED',
    description: leadActivityService.describeLeadCreated(MANUAL_SOURCE),
  })

  return lead
}

export async function getLeadById(businessId: string, id: string) {
  const lead = await prisma.lead.findFirst({ where: { id, businessId } })

  if (!lead) {
    throw new AppError('Lead not found', 404)
  }

  return lead
}

// The generic edit form (EditLeadPage) can change `status` alongside the
// other fields, same as it always could — this just also records that
// change as an activity, the same way the dedicated changeLeadStatus()
// below does, so the activity history is complete regardless of which UI
// path a status change came from.
export async function updateLead(businessId: string, id: string, input: UpdateLeadInput) {
  const existing = await getLeadById(businessId, id)

  const { count } = await prisma.lead.updateMany({
    where: { id, businessId },
    data: {
      ...input,
      ...(input.status === 'CONVERTED' && !existing.convertedAt ? { convertedAt: new Date() } : {}),
    },
  })

  if (count === 0) {
    throw new AppError('Lead not found', 404)
  }

  if (input.status && input.status !== existing.status) {
    await leadActivityService.logActivity({
      businessId,
      leadId: id,
      type: 'STATUS_CHANGED',
      description: leadActivityService.describeStatusChange(existing.status, input.status),
    })
  }

  return prisma.lead.findUniqueOrThrow({ where: { id } })
}

// Dedicated status-change endpoint (Phase 8 Pipeline UI, PATCH
// /api/leads/:id/status) — a focused alternative to the generic updateLead
// above for the common "just move this lead to the next stage" action.
export async function changeLeadStatus(businessId: string, id: string, status: LeadStatus) {
  const existing = await getLeadById(businessId, id)

  if (existing.status === status) {
    return existing
  }

  const { count } = await prisma.lead.updateMany({
    where: { id, businessId },
    data: {
      status,
      ...(status === 'CONVERTED' && !existing.convertedAt ? { convertedAt: new Date() } : {}),
    },
  })

  if (count === 0) {
    throw new AppError('Lead not found', 404)
  }

  await leadActivityService.logActivity({
    businessId,
    leadId: id,
    type: 'STATUS_CHANGED',
    description: leadActivityService.describeStatusChange(existing.status, status),
  })

  return prisma.lead.findUniqueOrThrow({ where: { id } })
}

export async function deleteLead(businessId: string, id: string) {
  const { count } = await prisma.lead.deleteMany({ where: { id, businessId } })

  if (count === 0) {
    throw new AppError('Lead not found', 404)
  }
}
