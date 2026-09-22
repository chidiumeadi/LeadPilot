export type LeadActivityType =
  | 'LEAD_CREATED'
  | 'STATUS_CHANGED'
  | 'FOLLOW_UP_CREATED'
  | 'FOLLOW_UP_COMPLETED'
  | 'FOLLOW_UP_CANCELLED'
  | 'FOLLOW_UP_NOTIFICATION_SENT'

export interface LeadActivity {
  id: string
  leadId: string
  type: LeadActivityType
  description: string
  createdAt: string
}
