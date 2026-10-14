import type { Request, Response } from 'express'

import { AUTH_COOKIE_NAME, authCookieOptions } from '../config/cookies'
import * as authService from '../services/authService'
import { validateBody } from '../utils/validate'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateAccountSchema,
} from '../validators/authValidators'

export async function register(req: Request, res: Response) {
  const input = validateBody(registerSchema, req.body)
  const { user, token } = await authService.registerUser(input)

  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions)
  res.status(201).json({ success: true, data: { user } })
}

export async function login(req: Request, res: Response) {
  const input = validateBody(loginSchema, req.body)
  const { user, token } = await authService.loginUser(input)

  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions)
  res.status(200).json({ success: true, data: { user } })
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions)
  res.status(200).json({ success: true, message: 'Logged out' })
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.userId!)
  res.status(200).json({ success: true, data: { user } })
}

export async function forgotPassword(req: Request, res: Response) {
  const input = validateBody(forgotPasswordSchema, req.body)
  await authService.requestPasswordReset(input)

  res.status(200).json({
    success: true,
    message: 'If an account exists for this email, password reset instructions have been sent.',
  })
}

export async function resetPassword(req: Request, res: Response) {
  const input = validateBody(resetPasswordSchema, req.body)
  await authService.resetPassword(input)

  res.status(200).json({ success: true, message: 'Password has been reset. You can now log in.' })
}

export async function updateAccount(req: Request, res: Response) {
  const input = validateBody(updateAccountSchema, req.body)
  const user = await authService.updateAccount(req.userId!, input)
  res.status(200).json({ success: true, data: { user } })
}

export async function changePassword(req: Request, res: Response) {
  const input = validateBody(changePasswordSchema, req.body)
  await authService.changePassword(req.userId!, input)
  res.status(200).json({ success: true, message: 'Password changed successfully.' })
}
