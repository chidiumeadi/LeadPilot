import type { CommunicationType, FollowUpType } from '@prisma/client'

import * as followUpService from './followUpService'
import * as leadActivityService from './leadActivityService'
import * as leadService from './leadService'
import type { LogCommunicationInput } from '../validators/communicationValidators'

// A logged communication isn't a scheduled action, so it doesn't map 1:1
// onto FollowUpType (which has OTHER, not NOTE) — CALL/EMAIL/SMS/WHATSAPP
// carry straight across, and a NOTE's follow-up (if one is created) is
// filed as OTHER since "note" isn't a contact channel.
const COMMUNICATION_TO_FOLLOW_UP_TYPE: Record<CommunicationType, FollowUpType> = {
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
  NOTE: 'OTHER',
}

// Records that a communication happened with a lead (Phase 9). Reuses the
// existing LeadActivity table (see schema.prisma) rather than a parallel
// history model, and — when the caller also asks for a follow-up — reuses
// followUpService.createFollowUp() as-is so its own FOLLOW_UP_CREATED
// activity isn't duplicated here.
export async function logCommunication(businessId: string, leadId: string, input: LogCommunicationInput) {
  // getLeadById is businessId-scoped and 404s if the lead doesn't exist or
  // belongs to another business — the same ownership check every other
  // lead-scoped write in this codebase starts with.
  await leadService.getLeadById(businessId, leadId)

  const activity = await leadActivityService.logActivity({
    businessId,
    leadId,
    type: 'COMMUNICATION_LOGGED',
    // The user's own note text *is* the description here — there's no
    // machine-generated sentence to build, unlike STATUS_CHANGED etc.
    // Type/outcome are kept in their own structured columns instead of
    // being folded into this string, so the UI can render them as an
    // icon + badge rather than parsing text.
    description: input.notes,
    communicationType: input.type,
    communicationOutcome: input.outcome,
    occurredAt: input.occurredAt ?? new Date(),
  })

  let followUp = null
  if (input.followUp) {
    followUp = await followUpService.createFollowUp(businessId, {
      leadId,
      type: input.followUp.type ?? COMMUNICATION_TO_FOLLOW_UP_TYPE[input.type],
      scheduledAt: input.followUp.scheduledAt,
      // Carries the communication's own notes forward so the follow-up
      // has context without the user retyping it.
      notes: input.notes,
    })
  }

  return { activity, followUp }
}
