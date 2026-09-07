import { createHash, randomBytes } from 'node:crypto'

import jwt from 'jsonwebtoken'

import { env } from '../config/env'

const ACCESS_TOKEN_EXPIRY = '1h'

export interface AccessTokenPayload {
  sub: string
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload
}

// Reset tokens: a random value is sent to the user; only its SHA-256 hash is
// ever persisted, so a database read never exposes a usable token.
export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashResetToken(rawToken)
  return { rawToken, tokenHash }
}

export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}
