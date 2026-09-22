import type { FollowUpType, LeadActivityType, LeadStatus } from '@prisma/client'

import { prisma } from '../config/prisma'

// Centralizes both writing a LeadActivity row and deciding what its
// `description` sentence says. Every place that creates an activity
// (leadService, followUpService, publicService, the follow-up notification
// job) calls logActivity() with a type + a description built by one of the
// describe* helpers below — so "what does a STATUS_CHANGED activity say"
// has exactly one answer in the whole codebase, not one per caller.

export async function logActivity(params: {
  businessId: string
  leadId: string
  type: LeadActivityType
  description: string
}) {
  return prisma.leadActivity.create({ data: params })
}

export async function listLeadActivities(businessId: string, leadId: string) {
  // No pagination — this is a lightweight per-lead history, expected to
  // stay small (dozens, not thousands, of rows per lead for an MVP).
  return prisma.leadActivity.findMany({
    where: { businessId, leadId },
    orderBy: { createdAt: 'desc' },
  })
}

// Same "the type word IS 'follow-up'" special case Phase 6's
// buildNotificationCopy already had to handle — OTHER has no distinct noun
// of its own, so "OTHER follow-up" would read as "follow-up follow-up".
const FOLLOW_UP_TYPE_PHRASES: Record<FollowUpType, string> = {
  CALL: 'call follow-up',
  EMAIL: 'email follow-up',
  SMS: 'SMS follow-up',
  WHATSAPP: 'WhatsApp follow-up',
  OTHER: 'follow-up',
}

export function describeLeadCreated(source: string): string {
  return source === 'PUBLIC_FORM' ? 'Lead submitted through the public capture form' : 'Lead created'
}

export function describeStatusChange(from: LeadStatus, to: LeadStatus): string {
  if (to === 'CONVERTED') return 'Lead converted'
  if (to === 'LOST') return 'Lead marked as lost'
  return `Status changed from ${from} to ${to}`
}

function capitalize(text: string): string {
  return text[0]!.toUpperCase() + text.slice(1)
}

export function describeFollowUpCreated(type: FollowUpType): string {
  return capitalize(`${FOLLOW_UP_TYPE_PHRASES[type]} scheduled`)
}

export function describeFollowUpCompleted(type: FollowUpType): string {
  return capitalize(`${FOLLOW_UP_TYPE_PHRASES[type]} completed`)
}

export function describeFollowUpCancelled(type: FollowUpType): string {
  return capitalize(`${FOLLOW_UP_TYPE_PHRASES[type]} cancelled`)
}

export function describeFollowUpNotificationSent(type: FollowUpType): string {
  return `Reminder sent: ${FOLLOW_UP_TYPE_PHRASES[type]} is due`
}
