import type { Notification, NotificationListResult } from '../types/notification'
import { api } from './api'

export interface NotificationListParams {
  page?: number
  limit?: number
  unread?: boolean
}

interface NotificationListResponse {
  success: true
  data: NotificationListResult
}

interface NotificationResponse {
  success: true
  data: { notification: Notification }
}

interface UnreadCountResponse {
  success: true
  data: { count: number }
}

export async function fetchNotifications(params: NotificationListParams): Promise<NotificationListResult> {
  const { data } = await api.get<NotificationListResponse>('/notifications', {
    params: {
      page: params.page,
      limit: params.limit,
      unread: params.unread === undefined ? undefined : String(params.unread),
    },
  })
  return data.data
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count')
  return data.data.count
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await api.patch<NotificationResponse>(`/notifications/${id}/read`)
  return data.data.notification
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}
