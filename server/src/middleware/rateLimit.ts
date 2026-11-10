import rateLimit, { MemoryStore } from 'express-rate-limit'

// Rate limits for authentication endpoints. Windows/limits are deliberately
// generous enough not to get in the way of normal local development and
// manual testing, while still bounding brute-force / enumeration attempts.
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

const rateLimitedResponse = {
  success: false,
  message: 'Too many requests. Please try again later.',
}

// Each limiter gets its own explicit in-memory store (same behaviour as the
// library default) so the counters can be cleared — see resetRateLimiters.
const stores: MemoryStore[] = []

function makeLimiter(max: number) {
  const store = new MemoryStore()
  stores.push(store)

  return rateLimit({
    windowMs: FIFTEEN_MINUTES_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitedResponse,
    store,
  })
}

// Test-only: the limiters are module-level, so every test file shares
// their counters. The test setup calls this between tests so one test's
// logins/registrations can't push the next one over a limit. Never called
// from application code.
export async function resetRateLimiters(): Promise<void> {
  await Promise.all(stores.map((store) => store.resetAll()))
}

// 20 attempts / 15 min per IP.
export const loginRateLimiter = makeLimiter(20)

// 10 registrations / 15 min per IP.
export const registerRateLimiter = makeLimiter(10)

// 5 requests / 15 min per IP — stricter, since this endpoint sends email
// and is the most attractive target for abuse.
export const forgotPasswordRateLimiter = makeLimiter(5)

// 10 attempts / 15 min per IP.
export const resetPasswordRateLimiter = makeLimiter(10)

// 10 attempts / 15 min per IP — authenticated, but still a sensitive
// action worth bounding against brute-forcing the current password.
export const changePasswordRateLimiter = makeLimiter(10)

// 5 submissions / 15 min per IP — this endpoint is unauthenticated and
// public, so it's the most exposed target for spam/abuse in the app.
export const publicLeadRateLimiter = makeLimiter(5)
