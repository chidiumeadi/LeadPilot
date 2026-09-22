import { z } from 'zod'

import { followUpTypeEnum } from './followUpValidators'

export const COMMUNICATION_TYPES = ['CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'NOTE'] as const
export const communicationTypeEnum = z.enum(COMMUNICATION_TYPES)

export const COMMUNICATION_OUTCOMES = [
  'CONNECTED',
  'NO_ANSWER',
  'INTERESTED',
  'NOT_INTERESTED',
  'NEEDS_FOLLOW_UP',
  'OTHER',
] as const
export const communicationOutcomeEnum = z.enum(COMMUNICATION_OUTCOMES)

// A communication log's whole point is recording what was said/done, so —
// unlike FollowUp.notes, which is optional context — notes are required
// here.
const notes = z.string().trim().min(1, 'Notes are required').max(2000, 'Notes are too long')

// z.coerce.date() rejects unparseable input automatically (see the same
// pattern in followUpValidators.ts for scheduledAt).
const occurredAt = z.coerce.date({ error: 'Invalid date/time' }).optional()

// Optional nested object: present only when the "create a follow-up"
// checkbox was checked on the Log Communication form. followUpTypeEnum is
// reused from followUpValidators — creating the follow-up itself goes
// through the existing followUpService.createFollowUp, not a reimplementation.
export const logCommunicationSchema = z.object({
  type: communicationTypeEnum,
  notes,
  outcome: communicationOutcomeEnum.optional(),
  occurredAt,
  followUp: z
    .object({
      scheduledAt: z.coerce.date({ error: 'Invalid date/time' }),
      type: followUpTypeEnum.optional(),
    })
    .optional(),
})

export type LogCommunicationInput = z.infer<typeof logCommunicationSchema>
