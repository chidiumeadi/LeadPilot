import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null)
    try {
      await login(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Invalid email or password'))
    }
  }

  return (
    <AuthCard title="Log in">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Email"
          type="email"
          registration={register('email')}
          error={errors.email?.message}
          autoComplete="email"
        />
        <FormField
          label="Password"
          type="password"
          registration={register('password')}
          error={errors.password?.message}
          autoComplete="current-password"
        />

        {submitError && <p className="mb-4 text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <Link to="/register" className="font-medium text-gray-900 underline">
          Create account
        </Link>
        <Link to="/forgot-password" className="font-medium text-gray-900 underline">
          Forgot password?
        </Link>
      </div>
    </AuthCard>
  )
}
