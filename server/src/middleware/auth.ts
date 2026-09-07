import type { NextFunction, Request, Response } from 'express'

import { AUTH_COOKIE_NAME } from '../config/cookies'
import { verifyAccessToken } from '../services/tokenService'
import { AppError } from './errorHandler'

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME]

  if (!token || typeof token !== 'string') {
    return next(new AppError('Unauthorized', 401))
  }

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
    next()
  } catch {
    next(new AppError('Unauthorized', 401))
  }
}
