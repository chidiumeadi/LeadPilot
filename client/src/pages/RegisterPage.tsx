import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import AuthCard from '../components/AuthCard'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().trim().min(1, 'Business name is required'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null)
    try {
      await registerUser(values)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    }
  }

  return (
    <AuthCard title="Create your account">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Your name" registration={register('name')} error={errors.name?.message} autoComplete="name" />
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
          autoComplete="new-password"
        />
        <p className="-mt-3 mb-4 text-xs text-gray-400">At least 8 characters.</p>
        <FormField
          label="Business name"
          registration={register('businessName')}
          error={errors.businessName?.message}
          autoComplete="organization"
        />

        {submitError && <p className="mb-4 text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-gray-900 underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}
