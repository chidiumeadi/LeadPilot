import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormField from '../FormField'
import SelectField from '../SelectField'
import TextareaField from '../TextareaField'
import { toDatetimeLocalValue } from '../followUps/FollowUpForm'
import { COMMUNICATION_OUTCOMES, COMMUNICATION_TYPES, communicationOutcomeLabels, communicationTypeLabels } from '../../config/communication'
import type { LogCommunicationInput } from '../../services/leadService'

// Same datetime-local <-> ISO round-trip as FollowUpForm (imported directly
// rather than reimplemented) — occurredAt/scheduledAt are both "pick a
// moment in your own local time, send it as a real UTC instant".
const logCommunicationFormSchema = z.object({
  type: z.enum(COMMUNICATION_TYPES),
  notes: z.string().trim().min(1, 'Notes are required').max(2000, 'Notes are too long'),
  outcome: z.union([z.enum(COMMUNICATION_OUTCOMES), z.literal('')]),
  occurredAt: z
    .string()
    .trim()
    .min(1, 'Date and time are required')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Invalid date/time' }),
  followUpScheduledAt: z.union([
    z.string().trim().refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Invalid date/time' }),
    z.literal(''),
  ]),
})

export type LogCommunicationFormValues = z.infer<typeof logCommunicationFormSchema>

interface LogCommunicationFormProps {
  onSubmit: (values: LogCommunicationInput) => Promise<void>
  onCancel: () => void
  serverError?: string | null
}

export default function LogCommunicationForm({ onSubmit, onCancel, serverError }: LogCommunicationFormProps) {
  // Plain component state rather than a registered form field — whether
  // to show the follow-up date field is a UI concern only, not something
  // that needs to round-trip through react-hook-form's own state.
  const [createFollowUp, setCreateFollowUp] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LogCommunicationFormValues>({
    resolver: zodResolver(logCommunicationFormSchema),
    defaultValues: {
      type: 'CALL',
      notes: '',
      outcome: '',
      occurredAt: toDatetimeLocalValue(new Date().toISOString()),
      followUpScheduledAt: '',
    },
  })

  const handleFormSubmit = (values: LogCommunicationFormValues) => {
    if (createFollowUp && !values.followUpScheduledAt) {
      setError('followUpScheduledAt', { message: 'Follow-up date and time are required' })
      return
    }

    return onSubmit({
      type: values.type,
      notes: values.notes,
      outcome: values.outcome || undefined,
      occurredAt: new Date(values.occurredAt).toISOString(),
      followUp: createFollowUp ? { scheduledAt: new Date(values.followUpScheduledAt).toISOString() } : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <SelectField label="Type" registration={register('type')} error={errors.type?.message}>
        {COMMUNICATION_TYPES.map((type) => (
          <option key={type} value={type}>
            {communicationTypeLabels[type]}
          </option>
        ))}
      </SelectField>

      <FormField
        label="Date & time"
        type="datetime-local"
        registration={register('occurredAt')}
        error={errors.occurredAt?.message}
      />

      <TextareaField label="Notes" registration={register('notes')} error={errors.notes?.message} rows={3} />

      <SelectField label="Outcome (optional)" registration={register('outcome')} error={errors.outcome?.message}>
        <option value="">No outcome</option>
        {COMMUNICATION_OUTCOMES.map((outcome) => (
          <option key={outcome} value={outcome}>
            {communicationOutcomeLabels[outcome]}
          </option>
        ))}
      </SelectField>

      <label className="mb-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={createFollowUp}
          onChange={(event) => setCreateFollowUp(event.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Create follow-up
      </label>

      {createFollowUp && (
        <FormField
          label="Follow-up date & time"
          type="datetime-local"
          registration={register('followUpScheduledAt')}
          error={errors.followUpScheduledAt?.message}
        />
      )}

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
          {isSubmitting ? 'Saving…' : 'Log communication'}
        </button>
      </div>
    </form>
  )
}
