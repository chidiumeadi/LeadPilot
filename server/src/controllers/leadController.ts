import type { Request, Response } from 'express'

import { getBusinessIdForUser } from '../services/businessService'
import * as leadService from '../services/leadService'
import { validateBody } from '../utils/validate'
import {
  createLeadSchema,
  leadIdParamSchema,
  leadListQuerySchema,
  updateLeadSchema,
} from '../validators/leadValidators'

export async function listLeads(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const query = validateBody(leadListQuerySchema, req.query)
  const result = await leadService.listLeads(businessId, query)
  res.status(200).json({ success: true, data: result })
}

export async function createLead(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const input = validateBody(createLeadSchema, req.body)
  const lead = await leadService.createLead(businessId, input)
  res.status(201).json({ success: true, data: { lead } })
}

export async function getLead(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(leadIdParamSchema, req.params)
  const lead = await leadService.getLeadById(businessId, id)
  res.status(200).json({ success: true, data: { lead } })
}

export async function updateLead(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(leadIdParamSchema, req.params)
  const input = validateBody(updateLeadSchema, req.body)
  const lead = await leadService.updateLead(businessId, id, input)
  res.status(200).json({ success: true, data: { lead } })
}

export async function deleteLead(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(leadIdParamSchema, req.params)
  await leadService.deleteLead(businessId, id)
  res.status(200).json({ success: true, message: 'Lead deleted' })
}
