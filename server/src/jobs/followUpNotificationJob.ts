import type { FollowUpType } from '@prisma/client'

import { prisma } from '../config/prisma'

// Kept free of any Express/timer concerns so it's directly callable from
// the scheduler (jobs/scheduler.ts) AND from a manual/test script — see
// Phase 6 spec section 39 ("callable directly from a test/manual execution
// path", "do NOT create a publicly accessible endpoint").

const BATCH_SIZE = 100

const FOLLOW_UP_TYPE_PHRASES: Record<FollowUpType, string> = {
  CALL: 'call',
  EMAIL: 'email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  OTHER: 'follow-up',
}

function buildNotificationCopy(type: FollowUpType, leadName: string): { title: string; message: string } {
  const message =
    type === 'OTHER'
      ? `Your follow-up with ${leadName} is due.`
      : `Your ${FOLLOW_UP_TYPE_PHRASES[type]} follow-up with ${leadName} is due.`

  return { title: 'Follow-up due', message }
}

export interface ProcessDueFollowUpsResult {
  processed: number
  created: number
  failed: number
}

export async function processDueFollowUps(): Promise<ProcessDueFollowUpsResult> {
  // Eligible: still PENDING, due, and not already notified. Excluding
  // already-notified follow-ups (rather than just filtering by
  // status+scheduledAt) is what lets a later run naturally advance past a
  // full batch — an already-notified due follow-up stays PENDING forever
  // until the owner acts on it, so without this it would occupy the same
  // `take: 100` slot on every run and the rest would never be reached.
  const dueFollowUps = await prisma.followUp.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
      notifications: { none: { type: 'FOLLOW_UP_DUE' } },
    },
    take: BATCH_SIZE,
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      businessId: true,
      type: true,
      lead: { select: { id: true, name: true } },
    },
  })

  let created = 0
  let failed = 0

  for (const followUp of dueFollowUps) {
    try {
      const { title, message } = buildNotificationCopy(followUp.type, followUp.lead.name)

      // skipDuplicates pushes the idempotency check down to the database's
      // (followUpId, type) unique constraint, so this is safe even if the
      // same follow-up is picked up by an overlapping run.
      const result = await prisma.notification.createMany({
        data: [
          {
            businessId: followUp.businessId,
            followUpId: followUp.id,
            leadId: followUp.lead.id,
            type: 'FOLLOW_UP_DUE',
            title,
            message,
          },
        ],
        skipDuplicates: true,
      })

      created += result.count
    } catch (err) {
      failed += 1
      // eslint-disable-next-line no-console
      console.error(
        `[follow-up-job] Failed to process follow-up ${followUp.id}:`,
        err instanceof Error ? err.message : err,
      )
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[follow-up-job] Processed ${dueFollowUps.length} due follow-up(s). Created ${created} notification(s).` +
      (failed > 0 ? ` ${failed} failed.` : ''),
  )

  return { processed: dueFollowUps.length, created, failed }
}
