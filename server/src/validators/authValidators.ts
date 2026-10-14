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

// Settings — Account Profile + Notification Preferences. All optional so
// the same endpoint can save just a name change, just a preference toggle,
// or both — confirmPassword-style matching isn't relevant here since
// there's no password field on this schema.
export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200).optional(),
    email,
    inAppNotificationsEnabled: z.boolean().optional(),
    browserNotificationsEnabled: z.boolean().optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })

// Settings — Security. confirmPassword is intentionally not part of this
// schema: it's validated client-side only (same pattern as
// ResetPasswordPage), since the server only ever needs the one new value.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
