import type { Request, Response } from 'express'

import * as publicService from '../services/publicService'
import { validateBody } from '../utils/validate'
import { createPublicLeadSchema, publicSlugParamSchema } from '../validators/publicValidators'

// Neither handler uses the `authenticate` middleware — these are the
// application's only genuinely public, unauthenticated endpoints.

export async function getPublicBusiness(req: Request, res: Response) {
  const { businessSlug } = validateBody(publicSlugParamSchema, req.params)
  const business = await publicService.getPublicBusinessBySlug(businessSlug)
  res.status(200).json({ success: true, data: { business } })
}

export async function createPublicLead(req: Request, res: Response) {
  const { businessSlug } = validateBody(publicSlugParamSchema, req.params)
  const input = validateBody(createPublicLeadSchema, req.body)
  await publicService.createPublicLead(businessSlug, input)
  res.status(201).json({
    success: true,
    message: 'Your message has been sent successfully.',
  })
}
