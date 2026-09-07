import { Router } from 'express'

import * as leadController from '../controllers/leadController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', leadController.listLeads)
router.post('/', leadController.createLead)
router.get('/:id', leadController.getLead)
router.patch('/:id', leadController.updateLead)
router.delete('/:id', leadController.deleteLead)

export default router
