import type { PaginationMeta } from './lead'

export type NotificationType = 'FOLLOW_UP_DUE'

export interface Notification {
  id: string
  followUpId: string | null
  leadId: string | null
  lead: { id: string; name: string } | null
  type: NotificationType
  title: string
  message: string
  readAt: string | null
  createdAt: string
}

export interface NotificationListResult {
  items: Notification[]
  pagination: PaginationMeta
}
