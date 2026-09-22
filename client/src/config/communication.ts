export const COMMUNICATION_TYPES = ['CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'NOTE'] as const

export type CommunicationType = (typeof COMMUNICATION_TYPES)[number]

export const communicationTypeLabels: Record<CommunicationType, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  NOTE: 'Note',
}

export const COMMUNICATION_OUTCOMES = [
  'CONNECTED',
  'NO_ANSWER',
  'INTERESTED',
  'NOT_INTERESTED',
  'NEEDS_FOLLOW_UP',
  'OTHER',
] as const

export type CommunicationOutcome = (typeof COMMUNICATION_OUTCOMES)[number]

export const communicationOutcomeLabels: Record<CommunicationOutcome, string> = {
  CONNECTED: 'Connected',
  NO_ANSWER: 'No answer',
  INTERESTED: 'Interested',
  NOT_INTERESTED: 'Not interested',
  NEEDS_FOLLOW_UP: 'Needs follow-up',
  OTHER: 'Other',
}
