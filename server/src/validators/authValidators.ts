import { z } from 'zod'

const email = z.string().trim().min(1, 'Email is required').toLowerCase().email('Invalid email address')
const password = z.string().min(8, 'Password must be at least 8 characters')

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email,
  password,
  businessName: z.string().trim().min(1, 'Business name is required').max(200),
  category: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  location: z.string().trim().max(200).optional(),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email,
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
