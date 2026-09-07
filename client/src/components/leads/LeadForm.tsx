import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormField from '../FormField'
import SelectField from '../SelectField'
import TextareaField from '../TextareaField'
import { LEAD_STATUSES, leadStatusLabels } from '../../config/leadStatus'
import type { LeadStatus } from '../../config/leadStatus'

// Every field is a plain string (react-hook-form's native register() type) —
// an empty string means "not provided". This is converted to `undefined`
// for optional fields at the form boundary (handleFormSubmit below) rather
// than inside the zod schema, so the schema's input/output types stay
// identical and don't fight zodResolver's generic inference.
const leadFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    email: z.union([z.string().trim().toLowerCase().email('Invalid email address').max(200), z.literal('')]),
    phone: z.union([z.string().trim().max(30, 'Phone number is too long'), z.literal('')]),
    status: z.enum(LEAD_STATUSES),
    notes: z.union([z.string().trim().max(2000, 'Notes are too long'), z.literal('')]),
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Provide a phone number or an email address',
    path: ['phone'],
  })

export type LeadFormValues = z.infer<typeof leadFormSchema>

// The payload handed to the parent's onSubmit: optional fields become
// `undefined` instead of `''`, matching what leadService/the API expect.
export interface LeadSubmitValues {
  name: string
  email?: string
  phone?: string
  status: LeadStatus
  notes?: string
}

interface LeadFormProps {
  defaultValues?: Partial<LeadFormValues>
  onSubmit: (values: LeadSubmitValues) => Promise<void>
  submitLabel: string
  serverError?: string | null
}

export default function LeadForm({ defaultValues, onSubmit, submitLabel, serverError }: LeadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { status: 'NEW', ...defaultValues },
  })

  const handleFormSubmit = (values: LeadFormValues) =>
    onSubmit({
      name: values.name,
      status: values.status,
      email: values.email || undefined,
      phone: values.phone || undefined,
      notes: values.notes || undefined,
    })

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="max-w-xl">
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
      <SelectField label="Status" registration={register('status')} error={errors.status?.message}>
        {LEAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {leadStatusLabels[status]}
          </option>
        ))}
      </SelectField>
      <TextareaField label="Notes" registration={register('notes')} error={errors.notes?.message} rows={4} />

      {serverError && <p className="mb-4 text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
