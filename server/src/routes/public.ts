import { Router } from 'express'

import * as publicController from '../controllers/publicController'
import { publicLeadRateLimiter } from '../middleware/rateLimit'

const router = Router()

// No `authenticate` here — these routes must work for anonymous
// customers. Kept in a dedicated router so that stays obvious and this
// never accidentally gets mounted alongside the protected /api/leads router.
router.get('/business/:businessSlug', publicController.getPublicBusiness)
router.post('/leads/:businessSlug', publicLeadRateLimiter, publicController.createPublicLead)

export default router
