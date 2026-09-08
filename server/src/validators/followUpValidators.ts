import { z } from 'zod'

export const FOLLOW_UP_TYPES = ['CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'OTHER'] as const
export const followUpTypeEnum = z.enum(FOLLOW_UP_TYPES)

export const FOLLOW_UP_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'] as const
export const followUpStatusEnum = z.enum(FOLLOW_UP_STATUSES)

const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value)

const notes = z.preprocess(emptyToUndefined, z.string().trim().max(2000, 'Notes are too long').optional())

// z.coerce.date() rejects unparseable input (invalid Date -> ZodError)
// automatically. The client sends a full ISO datetime (see FollowUpForm's
// datetime-local -> Date -> toISOString conversion) so this is stored as a
// real timestamp, never a formatted string.
const scheduledAt = z.coerce.date({ error: 'Invalid date/time' })

// Deliberately excludes status/completedAt/businessId — creation always
// starts PENDING and those fields are server-controlled everywhere.
export const createFollowUpSchema = z.object({
  leadId: z.string().uuid('Invalid lead id'),
  type: followUpTypeEnum,
  scheduledAt,
  notes,
})

// Status changes go through dedicated complete/cancel transitions, not a
// generic PATCH — see followUpService. This schema only ever touches the
// plain descriptive fields.
export const updateFollowUpSchema = z
  .object({
    type: followUpTypeEnum.optional(),
    scheduledAt: scheduledAt.optional(),
    notes,
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  })

export const followUpListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: followUpStatusEnum.optional(),
  leadId: z.string().uuid('Invalid lead id').optional(),
  // Derived views used by the dashboard/lead-details widgets. When present,
  // this takes precedence over `status` (see followUpService.listFollowUps).
  when: z.enum(['upcoming', 'overdue']).optional(),
})

export const followUpIdParamSchema = z.object({
  id: z.string().uuid('Invalid follow-up id'),
})

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>
export type FollowUpListQuery = z.infer<typeof followUpListQuerySchema>
