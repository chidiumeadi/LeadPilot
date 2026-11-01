// Live verification script for Phase 11a: the standalone Follow-ups page's
// list views (upcoming / overdue / completed), the edit lock on completed
// and cancelled follow-ups, and the scheduler re-notifying a follow-up
// after it's rescheduled. Same convention as the other scripts/verify-*.ts
// files — this project has no test framework yet, so this exercises the
// real service layer and scheduler job against the real dev database and
// cleans up after itself.
//
// Run with: npx ts-node scripts/verify-follow-ups.ts
// (from the server/ directory, with the dev database reachable)
//
// Note: processDueFollowUps() is the real scheduler job, so a run also
// notifies any other due follow-ups already in the dev database — exactly
// what the running dev server's scheduler would do on its next tick.

import { processDueFollowUps } from '../src/jobs/followUpNotificationJob'
import { prisma } from '../src/config/prisma'
import { AppError } from '../src/middleware/errorHandler'
import * as followUpService from '../src/services/followUpService'
import * as leadService from '../src/services/leadService'

let passed = 0
let failed = 0

function check(label: string, condition: boolean) {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${label}`)
  }
}

async function createTestBusiness(name: string) {
  const business = await prisma.business.create({
    data: { name, slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` },
  })
  return business.id
}

async function expectStatus(promise: Promise<unknown>, statusCode: number) {
  try {
    await promise
    return false
  } catch (err) {
    return err instanceof AppError && err.statusCode === statusCode
  }
}

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000)

function dueNotificationsFor(followUpId: string) {
  return prisma.notification.findMany({ where: { followUpId, type: 'FOLLOW_UP_DUE' } })
}

async function main() {
  const businessAId = await createTestBusiness('Verify Follow Ups A')
  const businessBId = await createTestBusiness('Verify Follow Ups B')

  try {
    const lead = await leadService.createLead(businessAId, { name: 'Follow-Up Page Lead', phone: '+15550002222', status: 'NEW' })
    const leadB = await leadService.createLead(businessBId, { name: 'Other Business Lead', phone: '+15550003333', status: 'NEW' })

    const overdue = await followUpService.createFollowUp(businessAId, { leadId: lead.id, type: 'CALL', scheduledAt: minutesFromNow(-60) })
    const upcoming = await followUpService.createFollowUp(businessAId, { leadId: lead.id, type: 'EMAIL', scheduledAt: minutesFromNow(60) })
    const completedFirst = await followUpService.createFollowUp(businessAId, { leadId: lead.id, type: 'SMS', scheduledAt: minutesFromNow(-120) })
    const completedSecond = await followUpService.createFollowUp(businessAId, { leadId: lead.id, type: 'WHATSAPP', scheduledAt: minutesFromNow(120) })
    const cancelled = await followUpService.createFollowUp(businessAId, { leadId: lead.id, type: 'OTHER', scheduledAt: minutesFromNow(30) })
    const otherBusiness = await followUpService.createFollowUp(businessBId, { leadId: leadB.id, type: 'CALL', scheduledAt: minutesFromNow(-60) })

    await followUpService.completeFollowUp(businessAId, completedFirst.id)
    // Guarantee a distinct, later completedAt for the ordering check.
    await new Promise((resolve) => setTimeout(resolve, 20))
    await followUpService.completeFollowUp(businessAId, completedSecond.id)
    await followUpService.cancelFollowUp(businessAId, cancelled.id)

    const ids = (result: { items: { id: string }[] }) => result.items.map((f) => f.id)
    const listQuery = { page: 1, limit: 100 } as const

    console.log('\n--- Follow-ups page views ---')

    console.log('1. Upcoming view: pending follow-ups scheduled in the future only')
    const upcomingList = await followUpService.listFollowUps(businessAId, { ...listQuery, when: 'upcoming' })
    check('contains exactly the upcoming follow-up', JSON.stringify(ids(upcomingList)) === JSON.stringify([upcoming.id]))

    console.log('2. Overdue view: pending follow-ups past their time only')
    const overdueList = await followUpService.listFollowUps(businessAId, { ...listQuery, when: 'overdue' })
    check('contains exactly the overdue follow-up', JSON.stringify(ids(overdueList)) === JSON.stringify([overdue.id]))

    console.log('3. Completed view: completed only, most recently completed first')
    const completedList = await followUpService.listFollowUps(businessAId, { ...listQuery, status: 'COMPLETED' })
    check(
      'ordered by completedAt desc (second completion first)',
      JSON.stringify(ids(completedList)) === JSON.stringify([completedSecond.id, completedFirst.id]),
    )
    check('cancelled follow-up appears in none of the three views', ![...ids(upcomingList), ...ids(overdueList), ...ids(completedList)].includes(cancelled.id))

    console.log('4. Every item carries its lead (id + name) for the lead link')
    check('lead id and name included', overdueList.items[0]?.lead.id === lead.id && overdueList.items[0]?.lead.name === 'Follow-Up Page Lead')

    console.log('5. Pagination meta reflects the filtered view')
    const pagedCompleted = await followUpService.listFollowUps(businessAId, { page: 1, limit: 1, status: 'COMPLETED' })
    check('total 2, totalPages 2 with limit 1', pagedCompleted.pagination.total === 2 && pagedCompleted.pagination.totalPages === 2)

    console.log('6. Tenant isolation: business B sees none of business A\'s follow-ups')
    const bOverdue = await followUpService.listFollowUps(businessBId, { ...listQuery, when: 'overdue' })
    check('business B overdue view only has its own follow-up', JSON.stringify(ids(bOverdue)) === JSON.stringify([otherBusiness.id]))

    console.log('\n--- Edit lock on completed/cancelled follow-ups ---')

    console.log('7. Editing a completed follow-up is rejected with 400')
    check(
      'reschedule of completed follow-up rejected',
      await expectStatus(followUpService.updateFollowUp(businessAId, completedFirst.id, { scheduledAt: minutesFromNow(240) }), 400),
    )
    check(
      'notes edit of completed follow-up rejected',
      await expectStatus(followUpService.updateFollowUp(businessAId, completedFirst.id, { notes: 'changed' }), 400),
    )

    console.log('8. Editing a cancelled follow-up is rejected with 400')
    check(
      'reschedule of cancelled follow-up rejected',
      await expectStatus(followUpService.updateFollowUp(businessAId, cancelled.id, { scheduledAt: minutesFromNow(240) }), 400),
    )

    console.log('9. Rejected edits left the rows untouched')
    const completedAfter = await prisma.followUp.findUniqueOrThrow({ where: { id: completedFirst.id } })
    const cancelledAfter = await prisma.followUp.findUniqueOrThrow({ where: { id: cancelled.id } })
    check(
      'completed follow-up scheduledAt/notes/status unchanged',
      completedAfter.scheduledAt.getTime() === completedFirst.scheduledAt.getTime() &&
        completedAfter.notes === null &&
        completedAfter.status === 'COMPLETED',
    )
    check('cancelled follow-up scheduledAt unchanged', cancelledAfter.scheduledAt.getTime() === cancelled.scheduledAt.getTime())

    console.log('10. Pending follow-ups can still be edited')
    const editedUpcoming = await followUpService.updateFollowUp(businessAId, upcoming.id, { notes: 'Bring the quote' })
    check('notes saved on pending follow-up', editedUpcoming.notes === 'Bring the quote')

    console.log('11. Cross-tenant edit still returns 404, not 400')
    check(
      'business B cannot edit business A follow-up',
      await expectStatus(followUpService.updateFollowUp(businessBId, upcoming.id, { notes: 'hijack' }), 404),
    )

    console.log('\n--- Scheduler re-notifies rescheduled follow-ups ---')

    console.log('12. First due notification is created once')
    await processDueFollowUps()
    await processDueFollowUps()
    const firstNotifications = await dueNotificationsFor(overdue.id)
    check('exactly one FOLLOW_UP_DUE notification after two runs', firstNotifications.length === 1)
    const firstNotificationId = firstNotifications[0]?.id

    console.log('13. Editing only notes does not trigger another reminder')
    await followUpService.updateFollowUp(businessAId, overdue.id, { notes: 'Left a voicemail' })
    await processDueFollowUps()
    const afterNotesEdit = await dueNotificationsFor(overdue.id)
    check('still exactly the same single notification', afterNotesEdit.length === 1 && afterNotesEdit[0]?.id === firstNotificationId)

    console.log('14. Re-saving the same scheduledAt is not treated as a reschedule')
    const current = await prisma.followUp.findUniqueOrThrow({ where: { id: overdue.id } })
    await followUpService.updateFollowUp(businessAId, overdue.id, { scheduledAt: current.scheduledAt })
    const afterSameTime = await dueNotificationsFor(overdue.id)
    check('original notification still attached', afterSameTime.length === 1 && afterSameTime[0]?.id === firstNotificationId)

    console.log('15. Rescheduling to the future detaches the old reminder but does not notify early')
    await followUpService.updateFollowUp(businessAId, overdue.id, { scheduledAt: minutesFromNow(60) })
    await processDueFollowUps()
    check('no notification attached while the new time is still in the future', (await dueNotificationsFor(overdue.id)).length === 0)
    const detached = await prisma.notification.findUniqueOrThrow({ where: { id: firstNotificationId! } })
    check('old notification kept in the inbox, still linked to its lead', detached.followUpId === null && detached.leadId === lead.id)

    console.log('16. Once the new time is due, a new reminder is created (the bug fix)')
    // Simulate the clock passing the new time without waiting an hour.
    await prisma.followUp.update({ where: { id: overdue.id }, data: { scheduledAt: minutesFromNow(-1) } })
    await processDueFollowUps()
    await processDueFollowUps()
    const secondNotifications = await dueNotificationsFor(overdue.id)
    check('exactly one new FOLLOW_UP_DUE notification', secondNotifications.length === 1 && secondNotifications[0]?.id !== firstNotificationId)
    const leadNotifications = await prisma.notification.count({ where: { businessId: businessAId, leadId: lead.id, type: 'FOLLOW_UP_DUE' } })
    check('owner now has both reminders for this lead (old + new)', leadNotifications === 2)

    console.log('17. Rescheduling straight to a past time re-notifies on the next run')
    await followUpService.updateFollowUp(businessAId, overdue.id, { scheduledAt: minutesFromNow(-5) })
    await processDueFollowUps()
    check('a third reminder is created', (await dueNotificationsFor(overdue.id)).length === 1)
    check(
      'three reminders in total for this lead',
      (await prisma.notification.count({ where: { businessId: businessAId, leadId: lead.id, type: 'FOLLOW_UP_DUE' } })) === 3,
    )

    console.log('18. Completed follow-ups are never re-notified')
    await followUpService.completeFollowUp(businessAId, overdue.id)
    await processDueFollowUps()
    check(
      'no new reminder after completion',
      (await prisma.notification.count({ where: { businessId: businessAId, leadId: lead.id, type: 'FOLLOW_UP_DUE' } })) === 3,
    )

    console.log('19. Rescheduling never touches another business\'s notifications')
    const bNotifications = await prisma.notification.findMany({ where: { businessId: businessBId, type: 'FOLLOW_UP_DUE' } })
    check('business B notification still attached to its own follow-up', bNotifications.length === 1 && bNotifications[0]?.followUpId === otherBusiness.id)
  } finally {
    await prisma.business.deleteMany({ where: { id: { in: [businessAId, businessBId] } } })
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
