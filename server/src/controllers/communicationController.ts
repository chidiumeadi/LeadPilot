import type { Request, Response } from 'express'

import { getBusinessIdForUser } from '../services/businessService'
import * as communicationService from '../services/communicationService'
import { validateBody } from '../utils/validate'
import { logCommunicationSchema } from '../validators/communicationValidators'
import { leadIdParamSchema } from '../validators/leadValidators'

export async function logCommunication(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(leadIdParamSchema, req.params)
  const input = validateBody(logCommunicationSchema, req.body)
  const result = await communicationService.logCommunication(businessId, id, input)
  res.status(201).json({ success: true, data: result })
}
