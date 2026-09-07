import { Router } from 'express'

import * as businessController from '../controllers/businessController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, businessController.getBusiness)
router.patch('/', authenticate, businessController.updateBusiness)

export default router
