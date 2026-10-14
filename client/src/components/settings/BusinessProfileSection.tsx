import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormField from '../FormField'
import { useAuth } from '../../context/AuthContext'
import * as businessService from '../../services/businessService'
import type { Business } from '../../types/auth'
import { getApiErrorMessage } from '../../utils/apiError'

// Every field here is a plain string in the form (react-hook-form needs a
// defined string, not string|null) — '' round-trips to/from null for the
// API at the two boundaries (toFormValues / toNullable), the same pattern
// LeadForm uses for its optional fields.
const businessProfileSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required').max(200),
  category: z.string().trim().max(200),
  phone: z.string().trim().max(50),
  location: z.string().trim().max(200),
  logoUrl: z.union([z.string().trim().url('Must be a valid URL'), z.literal('')]),
})

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>

function toFormValues(business: Business): BusinessProfileFormValues {
  return {
    name: business.name,
    category: business.category ?? '',
    phone: business.phone ?? '',
    location: business.location ?? '',
    logoUrl: business.logoUrl ?? '',
  }
}

function toNullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

interface BusinessProfileSectionProps {
  business: Business
}

export default function BusinessProfileSection({ business }: BusinessProfileSectionProps) {
  const { updateBusiness } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: toFormValues(business),
  })

  const onSubmit = async (values: BusinessProfileFormValues) => {
    setServerError(null)
    setSaved(false)
    try {
      const updated = await businessService.updateBusiness({
        name: values.name,
        category: toNullable(values.category),
        phone: toNullable(values.phone),
        location: toNullable(values.location),
        logoUrl: toNullable(values.logoUrl),
      })
      updateBusiness(updated)
      reset(toFormValues(updated))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setServerError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-900">Business Profile</h3>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4">
        <FormField label="Business name" registration={register('name')} error={errors.name?.message} />
        <FormField label="Category" registration={register('category')} error={errors.category?.message} />
        <FormField label="Phone" registration={register('phone')} error={errors.phone?.message} />
        <FormField label="Location" registration={register('location')} error={errors.location?.message} />
        <FormField
          label="Logo URL"
          registration={register('logoUrl')}
          error={errors.logoUrl?.message}
        />
        <p className="-mt-3 mb-4 text-xs text-gray-400">
          A link to an already-hosted image. LeadPilot doesn't host image uploads yet.
        </p>

        <div className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Public capture page slug: <span className="font-medium text-gray-700">{business.slug}</span> (not
          editable — changing it would break any links you've already shared)
        </div>

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
