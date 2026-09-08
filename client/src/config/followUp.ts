export const FOLLOW_UP_TYPES = ['CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'OTHER'] as const

export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number]

export const followUpTypeLabels: Record<FollowUpType, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  OTHER: 'Other',
}

export const FOLLOW_UP_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'] as const

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number]

export const followUpStatusLabels: Record<FollowUpStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

// Color is a secondary signal only — the text label is what actually
// communicates status; see FollowUpStatusBadge.
export const followUpStatusStyles: Record<FollowUpStatus, string> = {
  PENDING: 'bg-blue-50 text-blue-700 ring-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 ring-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 ring-gray-200',
}
