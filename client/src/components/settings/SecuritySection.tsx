import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormField from '../FormField'
import * as authService from '../../services/authService'
import { getApiErrorMessage } from '../../utils/apiError'

// Same confirm-password-is-client-side-only pattern as ResetPasswordPage —
// the server only ever needs the one new value.
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export default function SecuritySection() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) })

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setServerError(null)
    setSaved(false)
    try {
      await authService.changePasswordRequest(values.currentPassword, values.newPassword)
      reset()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Could not change password.'))
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-900">Security</h3>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4">
        <FormField
          label="Current password"
          type="password"
          registration={register('currentPassword')}
          error={errors.currentPassword?.message}
          autoComplete="current-password"
        />
        <FormField
          label="New password"
          type="password"
          registration={register('newPassword')}
          error={errors.newPassword?.message}
          autoComplete="new-password"
        />
        <p className="-mt-3 mb-4 text-xs text-gray-400">At least 8 characters.</p>
        <FormField
          label="Confirm new password"
          type="password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />

        {serverError && <p className="mb-4 text-sm text-red-600">{serverError}</p>}
        {saved && <p className="mb-4 text-sm text-green-700">Password changed.</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </div>
  )
}
