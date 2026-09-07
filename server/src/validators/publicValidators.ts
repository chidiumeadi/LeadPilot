import { z } from 'zod'

// Deliberately separate from validators/leadValidators.ts rather than
// reused: this schema defines what an anonymous customer may submit, which
// must never grow to include status/source/business ownership fields even
// if the authenticated Lead validator changes later.
const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value)

const name = z.string().trim().min(1, 'Name is required').max(200)
const email = z.preprocess(
  emptyToUndefined,
  z.string().trim().toLowerCase().email('Invalid email address').max(200).optional(),
)
const phone = z.preprocess(emptyToUndefined, z.string().trim().max(30, 'Phone number is too long').optional())
const notes = z.preprocess(emptyToUndefined, z.string().trim().max(2000, 'Message is too long').optional())

export const publicSlugParamSchema = z.object({
  businessSlug: z.string().trim().min(1, 'Invalid link').max(200),
})

export const createPublicLeadSchema = z
  .object({
    name,
    email,
    phone,
    notes,
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Provide a phone number or an email address',
    path: ['phone'],
  })

export type CreatePublicLeadInput = z.infer<typeof createPublicLeadSchema>
