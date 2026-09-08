import type { Request, Response } from 'express'

import { getBusinessIdForUser } from '../services/businessService'
import * as followUpService from '../services/followUpService'
import { validateBody } from '../utils/validate'
import {
  createFollowUpSchema,
  followUpIdParamSchema,
  followUpListQuerySchema,
  updateFollowUpSchema,
} from '../validators/followUpValidators'

export async function listFollowUps(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const query = validateBody(followUpListQuerySchema, req.query)
  const result = await followUpService.listFollowUps(businessId, query)
  res.status(200).json({ success: true, data: result })
}

export async function createFollowUp(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const input = validateBody(createFollowUpSchema, req.body)
  const followUp = await followUpService.createFollowUp(businessId, input)
  res.status(201).json({ success: true, data: { followUp } })
}

export async function getFollowUp(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(followUpIdParamSchema, req.params)
  const followUp = await followUpService.getFollowUpById(businessId, id)
  res.status(200).json({ success: true, data: { followUp } })
}

export async function updateFollowUp(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(followUpIdParamSchema, req.params)
  const input = validateBody(updateFollowUpSchema, req.body)
  const followUp = await followUpService.updateFollowUp(businessId, id, input)
  res.status(200).json({ success: true, data: { followUp } })
}

export async function completeFollowUp(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(followUpIdParamSchema, req.params)
  const followUp = await followUpService.completeFollowUp(businessId, id)
  res.status(200).json({ success: true, data: { followUp } })
}

export async function cancelFollowUp(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(followUpIdParamSchema, req.params)
  const followUp = await followUpService.cancelFollowUp(businessId, id)
  res.status(200).json({ success: true, data: { followUp } })
}

export async function deleteFollowUp(req: Request, res: Response) {
  const businessId = await getBusinessIdForUser(req.userId!)
  const { id } = validateBody(followUpIdParamSchema, req.params)
  await followUpService.deleteFollowUp(businessId, id)
  res.status(200).json({ success: true, message: 'Follow-up deleted' })
}
