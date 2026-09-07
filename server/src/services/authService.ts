import bcrypt from 'bcrypt'

import { prisma } from '../config/prisma'
import { env } from '../config/env'
import { AppError } from '../middleware/errorHandler'
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from '../validators/authValidators'
import { businessPublicSelect, generateUniqueSlug } from './businessService'
import { generateResetToken, hashResetToken, signAccessToken } from './tokenService'

const BCRYPT_SALT_ROUNDS = 10
const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000

export const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  business: { select: businessPublicSelect },
} as const

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError('An account with this email already exists', 409)
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS)

  const user = await prisma.$transaction(async (tx) => {
    const slug = await generateUniqueSlug(tx, input.businessName)

    return tx.business.create({
      data: {
        name: input.businessName,
        slug,
        category: input.category,
        phone: input.phone,
        location: input.location,
        users: {
          create: {
            name: input.name,
            email: input.email,
            passwordHash,
          },
        },
      },
      select: {
        users: { select: userPublicSelect },
      },
    })
  })

  const createdUser = user.users[0]
  const token = signAccessToken(createdUser.id)

  return { user: createdUser, token }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...userPublicSelect, passwordHash: true },
  })

  const genericError = new AppError('Invalid email or password', 401)

  if (!user) {
    throw genericError
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)
  if (!passwordMatches) {
    throw genericError
  }

  const token = signAccessToken(user.id)
  const { passwordHash: _passwordHash, ...safeUser } = user

  return { user: safeUser, token }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userPublicSelect,
  })

  if (!user) {
    throw new AppError('Unauthorized', 401)
  }

  return user
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })

  if (user) {
    const { rawToken, tokenHash } = generateResetToken()

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      },
    })

    if (env.nodeEnv !== 'production') {
      const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`
      // Development-only convenience: no email provider is configured yet,
      // so the reset link is logged instead of sent. Never do this in
      // production — see the guard above.
      // eslint-disable-next-line no-console
      console.log(`[dev] Password reset link for ${input.email}: ${resetUrl}`)
    }
  }

  // Always return the same response whether or not the account exists, so
  // this endpoint cannot be used to enumerate registered emails.
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashResetToken(input.token)

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  })

  const invalidError = new AppError('Invalid or expired reset link', 400)

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw invalidError
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ])
}
