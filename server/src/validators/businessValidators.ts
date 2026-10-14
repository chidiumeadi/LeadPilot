import { z } from 'zod'

export const updateBusinessSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    category: z.string().trim().max(200).nullable().optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    // Validated URL, not a real upload — this project has no file/image
    // upload infrastructure, so building a fake "upload" would misrepresent
    // what actually happens. The frontend sends null (not '') to clear it.
    logoUrl: z.string().trim().max(500).url('Must be a valid URL').nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>
