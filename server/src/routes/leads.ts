import { Router } from 'express'

import * as communicationController from '../controllers/communicationController'
import * as leadController from '../controllers/leadController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', leadController.listLeads)
router.post('/', leadController.createLead)
router.get('/:id', leadController.getLead)
router.patch('/:id', leadController.updateLead)
router.patch('/:id/status', leadController.changeLeadStatus)
router.get('/:id/activities', leadController.listLeadActivities)
router.post('/:id/communications', communicationController.logCommunication)
router.delete('/:id', leadController.deleteLead)

export default router
