import { Router } from 'express'

import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  resetPasswordRateLimiter,
} from '../middleware/rateLimit'

const router = Router()

router.post('/register', registerRateLimiter, authController.register)
router.post('/login', loginRateLimiter, authController.login)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword)
router.post('/reset-password', resetPasswordRateLimiter, authController.resetPassword)

export default router
