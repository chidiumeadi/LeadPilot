import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import { forgotPasswordRequest } from '../services/authService'
import { getApiErrorMessage } from '../utils/apiError'

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setMessage(null)
    try {
      const responseMessage = await forgotPasswordRequest(values.email)
      setMessage(responseMessage)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <AuthCard title="Reset your password">
      {message ? (
        <p className="text-sm text-gray-600">{message}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <p className="mb-4 text-sm text-gray-500">
            Enter the email associated with your account and we&rsquo;ll send you a link to reset your password.
          </p>
          <FormField
            label="Email"
            type="email"
            registration={register('email')}
            error={errors.email?.message}
            autoComplete="email"
          />

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-gray-900 underline">
          Back to login
        </Link>
      </p>
    </AuthCard>
  )
}
