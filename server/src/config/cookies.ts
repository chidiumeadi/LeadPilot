import type { CookieOptions } from 'express'

import { env } from './env'

export const AUTH_COOKIE_NAME = 'lp_token'

const ONE_HOUR_MS = 60 * 60 * 1000

// Matches the access token's 1-hour expiry. SameSite=lax is appropriate
// because the client and API are served from the same registrable domain
// (different ports in development, e.g. subdomains in production); if a
// future deployment puts them on unrelated domains this will need to move
// to SameSite=None with Secure.
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: ONE_HOUR_MS,
  path: '/',
}
