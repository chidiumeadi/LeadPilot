import type { Request, Response } from 'express'

import { getBusinessIdForUser } from '../services/businessService'
import * as notificationService from '../services/notificationService'
import { validateBody } from '../utils/validate'
import { notificationIdParamSchema, notificationListQuerySchema } from '../validators/notificationValidators'

export async function listNotifications(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const query = validateBody(notificationListQuerySchema, req.query)
  const result = await notificationService.listNotifications(businessId, query)
  res.status(200).json({ success: true, data: result })
}

export async function getUnreadCount(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const count = await notificationService.getUnreadCount(businessId)
  res.status(200).json({ success: true, data: { count } })
}

export async function markRead(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(notificationIdParamSchema, req.params)
  const notification = await notificationService.markNotificationRead(businessId, id)
  res.status(200).json({ success: true, data: { notification } })
}

export async function markAllRead(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  await notificationService.markAllNotificationsRead(businessId)
  res.status(200).json({ success: true, message: 'All notifications marked as read' })
}
