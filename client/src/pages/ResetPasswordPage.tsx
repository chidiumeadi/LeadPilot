import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import { resetPasswordRequest } from '../services/authService'
import { getApiErrorMessage } from '../utils/apiError'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await resetPasswordRequest(token, values.password)
      setSuccess(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'This reset link is invalid or has expired.'))
    }
  }

  if (!token) {
    return (
      <AuthCard title="Reset your password">
        <p className="text-sm text-red-600">This reset link is missing or invalid.</p>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/forgot-password" className="font-medium text-gray-900 underline">
            Request a new link
          </Link>
        </p>
      </AuthCard>
    )
  }

  if (success) {
    return (
      <AuthCard title="Password reset">
        <p className="text-sm text-gray-600">Your password has been reset. You can now log in.</p>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-gray-900 underline">
            Go to login
          </Link>
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="New password"
          type="password"
          registration={register('password')}
          error={errors.password?.message}
          autoComplete="new-password"
        />
        <FormField
          label="Confirm password"
          type="password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthCard>
  )
}
