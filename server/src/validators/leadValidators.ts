import { z } from 'zod'

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const
export const leadStatusEnum = z.enum(LEAD_STATUSES)

const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value)

const name = z.string().trim().min(1, 'Name is required').max(200)
const email = z.preprocess(
  emptyToUndefined,
  z.string().trim().toLowerCase().email('Invalid email address').max(200).optional(),
)
const phone = z.preprocess(emptyToUndefined, z.string().trim().max(30, 'Phone number is too long').optional())
const notes = z.preprocess(emptyToUndefined, z.string().trim().max(2000, 'Notes are too long').optional())

export const createLeadSchema = z
  .object({
    name,
    email,
    phone,
    status: leadStatusEnum.optional().default('NEW'),
    notes,
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Provide a phone number or an email address',
    path: ['phone'],
  })

export const updateLeadSchema = z
  .object({
    name: name.optional(),
    email,
    phone,
    status: leadStatusEnum.optional(),
    notes,
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  })

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: leadStatusEnum.optional(),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
})

export const leadIdParamSchema = z.object({
  id: z.string().uuid('Invalid lead id'),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadListQuery = z.infer<typeof leadListQuerySchema>
