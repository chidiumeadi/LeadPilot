import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormField from '../FormField'
import { useAuth } from '../../context/AuthContext'
import * as authService from '../../services/authService'
import type { AuthUser } from '../../types/auth'
import { getApiErrorMessage } from '../../utils/apiError'

const accountProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
})

type AccountProfileFormValues = z.infer<typeof accountProfileSchema>

interface AccountProfileSectionProps {
  user: AuthUser
}

export default function AccountProfileSection({ user }: AccountProfileSectionProps) {
  const { updateUser } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AccountProfileFormValues>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues: { name: user.name, email: user.email },
  })

  const onSubmit = async (values: AccountProfileFormValues) => {
    setServerError(null)
    setSaved(false)
    try {
      const updated = await authService.updateAccountRequest(values)
      updateUser(updated)
      reset({ name: updated.name, email: updated.email })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setServerError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-900">Account Profile</h3>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4">
        <FormField label="Full name" registration={register('name')} error={errors.name?.message} autoComplete="name" />
        <FormField
          label="Email address"
          type="email"
          registration={register('email')}
          error={errors.email?.message}
          autoComplete="email"
        />

        {serverError && <p className="mb-4 text-sm text-red-600">{serverError}</p>}
        {saved && <p className="mb-4 text-sm text-green-700">Saved.</p>}

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
