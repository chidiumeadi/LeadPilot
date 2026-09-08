import type { Request, Response } from 'express'

import { getBusinessIdForUser } from '../services/businessService'
import * as analyticsService from '../services/analyticsService'
import { validateBody } from '../utils/validate'
import { analyticsQuerySchema } from '../validators/analyticsValidators'

export async function getDashboardAnalytics(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { range } = validateBody(analyticsQuerySchema, req.query)
  const data = await analyticsService.getDashboardAnalytics(businessId, range)
  res.status(200).json({ success: true, data })
}
