import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma'
import { AppError } from '../middleware/errorHandler'
import type { NotificationListQuery } from '../validators/notificationValidators'

// Every query here is scoped by businessId at the database level, same
// tenant-isolation boundary established in leadService/followUpService.

const notificationInclude = {
  lead: { select: { id: true, name: true } },
} satisfies Prisma.NotificationInclude

export async function listNotifications(businessId: string, query: NotificationListQuery) {
  const { page, limit, unread } = query

  const where: Prisma.NotificationWhereInput = {
    businessId,
    ...(unread === 'true' && { readAt: null }),
    ...(unread === 'false' && { readAt: { not: null } }),
  }

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: notificationInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
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

export async function getUnreadCount(businessId: string): Promise<number> {
  return prisma.notification.count({ where: { businessId, readAt: null } })
}

// Marking an already-read notification read again is a harmless no-op
// (unlike a Follow-Up status transition, there's no invalid-transition
// error here) — the `readAt: null` guard on the update just means a
// second call doesn't overwrite an earlier read timestamp.
export async function markNotificationRead(businessId: string, id: string) {
  const existing = await prisma.notification.findFirst({ where: { id, businessId }, select: { id: true } })

  if (!existing) {
    throw new AppError('Notification not found', 404)
  }

  await prisma.notification.updateMany({
    where: { id, businessId, readAt: null },
    data: { readAt: new Date() },
  })

  return prisma.notification.findUniqueOrThrow({ where: { id }, include: notificationInclude })
}

export async function markAllNotificationsRead(businessId: string): Promise<number> {
  const { count } = await prisma.notification.updateMany({
    where: { businessId, readAt: null },
    data: { readAt: new Date() },
  })

  return count
}
