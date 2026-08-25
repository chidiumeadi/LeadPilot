import type { Request, Response } from 'express'

export function getHealth(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'LeadPilot API is running',
  })
}
