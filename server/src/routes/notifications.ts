import { Router } from 'express'

import * as notificationController from '../controllers/notificationController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', notificationController.listNotifications)
router.get('/unread-count', notificationController.getUnreadCount)
router.patch('/read-all', notificationController.markAllRead)
router.patch('/:id/read', notificationController.markRead)

export default router
