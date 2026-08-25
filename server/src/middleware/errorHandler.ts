import type { NextFunction, Request, Response } from 'express'

// Basic typed error that routes/services can throw to control the
// HTTP status code returned to the client. Later phases (auth,
// validation, etc.) can extend this as needed.
export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

// Express recognizes this as an error-handling middleware because it
// takes four arguments. Keep it last in the middleware chain.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const isAppError = err instanceof AppError
  const statusCode = isAppError ? err.statusCode : 500
  const message = isAppError ? err.message : 'Something went wrong. Please try again.'

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message,
  })
}
