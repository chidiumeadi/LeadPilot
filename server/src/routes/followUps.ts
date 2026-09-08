import { Router } from 'express'

import * as followUpController from '../controllers/followUpController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', followUpController.listFollowUps)
router.post('/', followUpController.createFollowUp)
router.get('/:id', followUpController.getFollowUp)
router.patch('/:id', followUpController.updateFollowUp)
router.post('/:id/complete', followUpController.completeFollowUp)
router.post('/:id/cancel', followUpController.cancelFollowUp)
router.delete('/:id', followUpController.deleteFollowUp)

export default router
