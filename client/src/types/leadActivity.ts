import type { CommunicationOutcome, CommunicationType } from '../config/communication'

export type LeadActivityType =
  | 'LEAD_CREATED'
  | 'STATUS_CHANGED'
  | 'FOLLOW_UP_CREATED'
  | 'FOLLOW_UP_COMPLETED'
  | 'FOLLOW_UP_CANCELLED'
  | 'FOLLOW_UP_NOTIFICATION_SENT'
  | 'COMMUNICATION_LOGGED'

export interface LeadActivity {
  id: string
  leadId: string
  type: LeadActivityType
  description: string
  // Only set when type is COMMUNICATION_LOGGED — null for every other
  // activity type (see LeadActivity in schema.prisma).
  communicationType: CommunicationType | null
  communicationOutcome: CommunicationOutcome | null
  occurredAt: string | null
  createdAt: string
}
