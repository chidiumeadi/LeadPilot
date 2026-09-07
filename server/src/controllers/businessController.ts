import type { Request, Response } from 'express'

import * as businessService from '../services/businessService'
import { validateBody } from '../utils/validate'
import { updateBusinessSchema } from '../validators/businessValidators'

export async function getBusiness(req: Request, res: Response) {
  const business = await businessService.getBusinessForUser(req.userId!)
  res.status(200).json({ success: true, data: { business } })
}

export async function updateBusiness(req: Request, res: Response) {
  const input = validateBody(updateBusinessSchema, req.body)
  const business = await businessService.updateBusinessForUser(req.userId!, input)
  res.status(200).json({ success: true, data: { business } })
}
