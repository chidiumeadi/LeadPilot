import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

import FormField from '../../components/FormField'
import LoadingScreen from '../../components/LoadingScreen'
import TextareaField from '../../components/TextareaField'
import * as publicLeadService from '../../services/publicLeadService'
import type { PublicBusiness } from '../../services/publicLeadService'
import { getApiErrorMessage } from '../../utils/apiError'

const publicLeadFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    email: z.union([z.string().trim().toLowerCase().email('Invalid email address').max(200), z.literal('')]),
    phone: z.union([z.string().trim().max(30, 'Phone number is too long'), z.literal('')]),
    notes: z.union([z.string().trim().max(2000, 'Message is too long'), z.literal('')]),
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Provide a phone number or an email address',
    path: ['phone'],
  })

type PublicLeadFormValues = z.infer<typeof publicLeadFormSchema>

type PageState = 'loading' | 'ready' | 'not-found' | 'error'

function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm">{children}</div>
        <p className="mt-6 text-center text-xs text-gray-400">Powered by LeadPilot</p>
      </div>
    </div>
  )
}

export default function PublicLeadCapturePage() {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [business, setBusiness] = useState<PublicBusiness | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessSlug) return

    let cancelled = false

    publicLeadService
      .fetchPublicBusiness(businessSlug)
      .then((data) => {
        if (cancelled) return
        setBusiness(data)
        setPageState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        if (isAxiosError(err) && err.response?.status === 404) {
          setPageState('not-found')
        } else {
          setPageState('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [businessSlug])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PublicLeadFormValues>({ resolver: zodResolver(publicLeadFormSchema) })

  const onSubmit = async (values: PublicLeadFormValues) => {
    if (!businessSlug) return
    setSubmitError(null)
    try {
      await publicLeadService.submitPublicLead(businessSlug, {
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        notes: values.notes || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err))
    }
  }

  if (!businessSlug || pageState === 'not-found') {
    return (
      <PublicPageShell>
        <p className="text-center text-sm text-gray-600">This page is no longer available.</p>
      </PublicPageShell>
    )
  }

  if (pageState === 'loading') {
    return <LoadingScreen />
  }

  if (pageState === 'error') {
    return (
      <PublicPageShell>
        <p className="text-center text-sm text-red-600">Something went wrong. Please try again.</p>
      </PublicPageShell>
    )
  }

  if (submitted) {
    return (
      <PublicPageShell>
        <h1 className="text-lg font-semibold text-gray-900">Thanks!</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your message has been sent successfully. {business?.name} will be in touch with you.
        </p>
      </PublicPageShell>
    )
  }

  return (
    <PublicPageShell>
      <h1 className="text-lg font-semibold text-gray-900">{business?.name}</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">Get in touch</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Name" registration={register('name')} error={errors.name?.message} autoComplete="name" />
        <FormField
          label="Email"
          type="email"
          registration={register('email')}
          error={errors.email?.message}
          autoComplete="email"
        />
        <FormField
          label="Phone"
          type="tel"
          registration={register('phone')}
          error={errors.phone?.message}
          autoComplete="tel"
        />
        <p className="-mt-3 mb-4 text-xs text-gray-400">Email or phone is required.</p>
        <TextareaField label="Message" registration={register('notes')} error={errors.notes?.message} rows={4} />

        {submitError && <p className="mb-4 text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </PublicPageShell>
  )
}
