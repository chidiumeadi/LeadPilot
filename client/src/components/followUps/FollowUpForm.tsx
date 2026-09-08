import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormField from '../FormField'
import SelectField from '../SelectField'
import TextareaField from '../TextareaField'
import { FOLLOW_UP_TYPES, followUpTypeLabels } from '../../config/followUp'
import type { FollowUpType } from '../../config/followUp'

// datetime-local inputs work in the browser's local timezone with no
// offset info. new Date(localString) correctly interprets that as local
// time, and .toISOString() converts it to the equivalent UTC instant for
// the API — so a value picked in the business owner's timezone round-trips
// correctly as long as it's read back in that same timezone. LeadPilot
// does not yet support multi-timezone team collaboration; that is out of
// scope for Phase 5.
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const followUpFormSchema = z.object({
  type: z.enum(FOLLOW_UP_TYPES),
  scheduledAt: z
    .string()
    .trim()
    .min(1, 'Date and time are required')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Invalid date/time' }),
  notes: z.union([z.string().trim().max(2000, 'Notes are too long'), z.literal('')]),
})

export type FollowUpFormValues = z.infer<typeof followUpFormSchema>

export interface FollowUpSubmitValues {
  type: FollowUpType
  scheduledAt: string
  notes?: string
}

interface FollowUpFormProps {
  defaultValues?: Partial<FollowUpFormValues>
  onSubmit: (values: FollowUpSubmitValues) => Promise<void>
  onCancel: () => void
  submitLabel: string
  serverError?: string | null
}

export default function FollowUpForm({ defaultValues, onSubmit, onCancel, submitLabel, serverError }: FollowUpFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: { type: 'CALL', scheduledAt: '', notes: '', ...defaultValues },
  })

  const handleFormSubmit = (values: FollowUpFormValues) =>
    onSubmit({
      type: values.type,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      notes: values.notes || undefined,
    })

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <SelectField label="Type" registration={register('type')} error={errors.type?.message}>
        {FOLLOW_UP_TYPES.map((type) => (
          <option key={type} value={type}>
            {followUpTypeLabels[type]}
          </option>
        ))}
      </SelectField>
      <FormField
        label="Date & time"
        type="datetime-local"
        registration={register('scheduledAt')}
        error={errors.scheduledAt?.message}
      />
      <TextareaField label="Notes" registration={register('notes')} error={errors.notes?.message} rows={3} />

      {serverError && <p className="mb-4 text-sm text-red-600">{serverError}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
