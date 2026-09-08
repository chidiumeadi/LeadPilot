import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma'
import { AppError } from '../middleware/errorHandler'
import * as leadService from './leadService'
import type { CreateFollowUpInput, FollowUpListQuery, UpdateFollowUpInput } from '../validators/followUpValidators'

// Every query here is scoped by businessId at the database level, same
// tenant-isolation boundary established in leadService. Creation
// additionally verifies the target lead belongs to the business via
// leadService.getLeadById, which is itself businessId-scoped — never
// fetch-then-check without that scope.

const followUpInclude = {
  lead: { select: { id: true, name: true } },
} satisfies Prisma.FollowUpInclude

export async function listFollowUps(businessId: string, query: FollowUpListQuery) {
  const { page, limit, status, leadId, when } = query

  const where: Prisma.FollowUpWhereInput = {
    businessId,
    ...(leadId && { leadId }),
  }

  if (when === 'upcoming') {
    where.status = 'PENDING'
    where.scheduledAt = { gte: new Date() }
  } else if (when === 'overdue') {
    where.status = 'PENDING'
    where.scheduledAt = { lt: new Date() }
  } else if (status) {
    where.status = status
  }

  const [items, total] = await Promise.all([
    prisma.followUp.findMany({
      where,
      include: followUpInclude,
      orderBy: { scheduledAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.followUp.count({ where }),
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

export async function createFollowUp(businessId: string, input: CreateFollowUpInput) {
  // Throws 404 if the lead doesn't exist or belongs to another business —
  // this is the "Lead.businessId === authenticatedUser.businessId" check.
  await leadService.getLeadById(businessId, input.leadId)

  return prisma.followUp.create({
    data: {
      businessId,
      leadId: input.leadId,
      type: input.type,
      scheduledAt: input.scheduledAt,
      notes: input.notes,
      status: 'PENDING',
    },
    include: followUpInclude,
  })
}

export async function getFollowUpById(businessId: string, id: string) {
  const followUp = await prisma.followUp.findFirst({
    where: { id, businessId },
    include: followUpInclude,
  })

  if (!followUp) {
    throw new AppError('Follow-up not found', 404)
  }

  return followUp
}

export async function updateFollowUp(businessId: string, id: string, input: UpdateFollowUpInput) {
  const { count } = await prisma.followUp.updateMany({
    where: { id, businessId },
    data: input,
  })

  if (count === 0) {
    throw new AppError('Follow-up not found', 404)
  }

  return prisma.followUp.findUniqueOrThrow({ where: { id }, include: followUpInclude })
}

const INVALID_TRANSITION_MESSAGE = 'Only pending follow-ups can be updated this way'

export async function completeFollowUp(businessId: string, id: string) {
  const followUp = await getFollowUpById(businessId, id)

  if (followUp.status !== 'PENDING') {
    throw new AppError(INVALID_TRANSITION_MESSAGE, 400)
  }

  const { count } = await prisma.followUp.updateMany({
    where: { id, businessId, status: 'PENDING' },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })

  if (count === 0) {
    throw new AppError(INVALID_TRANSITION_MESSAGE, 400)
  }

  return prisma.followUp.findUniqueOrThrow({ where: { id }, include: followUpInclude })
}

export async function cancelFollowUp(businessId: string, id: string) {
  const followUp = await getFollowUpById(businessId, id)

  if (followUp.status !== 'PENDING') {
    throw new AppError(INVALID_TRANSITION_MESSAGE, 400)
  }

  const { count } = await prisma.followUp.updateMany({
    where: { id, businessId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  })

  if (count === 0) {
    throw new AppError(INVALID_TRANSITION_MESSAGE, 400)
  }

  return prisma.followUp.findUniqueOrThrow({ where: { id }, include: followUpInclude })
}

export async function deleteFollowUp(businessId: string, id: string) {
  const { count } = await prisma.followUp.deleteMany({ where: { id, businessId } })

  if (count === 0) {
    throw new AppError('Follow-up not found', 404)
  }
}
