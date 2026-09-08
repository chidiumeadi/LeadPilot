import { z } from 'zod'

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  unread: z.enum(['true', 'false']).optional(),
})

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification id'),
})

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>
