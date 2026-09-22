// Live verification script for Phase 9: communication logging, follow-up
// integration, tenant isolation, analytics, and a regression pass over
// Phase 8 behavior. Same convention as
// verify-lead-status-activity.ts — this project has no test framework, so
// this exercises the real service layer against the real dev database and
// cleans up after itself.
//
// Run with: npx ts-node scripts/verify-communication.ts

import { prisma } from '../src/config/prisma'
import { getDashboardAnalytics } from '../src/services/analyticsService'
import * as communicationService from '../src/services/communicationService'
import * as followUpService from '../src/services/followUpService'
import * as leadActivityService from '../src/services/leadActivityService'
import * as leadService from '../src/services/leadService'
import * as publicService from '../src/services/publicService'

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

async function main() {
  const businessAId = await createTestBusiness('Verify Communication A')
  const businessBId = await createTestBusiness('Verify Communication B')

  try {
    const lead = await leadService.createLead(businessAId, {
      name: 'Communication Test Lead',
      phone: '+15550004444',
      status: 'NEW',
    })

    console.log('\n--- Communication ---')

    console.log('1. Log CALL communication')
    const callResult = await communicationService.logCommunication(businessAId, lead.id, {
      type: 'CALL',
      notes: 'Spoke with customer about pricing.',
    })
    check('CALL activity created with correct type/description', callResult.activity.communicationType === 'CALL' && callResult.activity.description === 'Spoke with customer about pricing.')

    console.log('2. Log EMAIL communication')
    const emailResult = await communicationService.logCommunication(businessAId, lead.id, {
      type: 'EMAIL',
      notes: 'Sent product information.',
    })
    check('EMAIL activity created', emailResult.activity.communicationType === 'EMAIL')

    console.log('3. Log SMS communication')
    const smsResult = await communicationService.logCommunication(businessAId, lead.id, {
      type: 'SMS',
      notes: 'Texted a reminder about the demo.',
    })
    check('SMS activity created', smsResult.activity.communicationType === 'SMS')

    console.log('4. Log WHATSAPP communication')
    const whatsappResult = await communicationService.logCommunication(businessAId, lead.id, {
      type: 'WHATSAPP',
      notes: 'Customer requested additional information.',
    })
    check('WHATSAPP activity created', whatsappResult.activity.communicationType === 'WHATSAPP')

    console.log('5. Log NOTE')
    const noteResult = await communicationService.logCommunication(businessAId, lead.id, {
      type: 'NOTE',
      notes: 'Customer is interested in the premium package.',
      outcome: 'INTERESTED',
    })
    check('NOTE activity created with outcome', noteResult.activity.communicationType === 'NOTE' && noteResult.activity.communicationOutcome === 'INTERESTED')

    console.log('6. All 5 communications appear in Activity History')
    let activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    const loggedTypes = activities.filter((a) => a.type === 'COMMUNICATION_LOGGED').map((a) => a.communicationType)
    check(
      'all 5 communication types present',
      ['CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'NOTE'].every((t) => loggedTypes.includes(t as never)),
    )

    console.log('7. Communication persists after retrieval (re-fetch)')
    const refetched = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('re-fetched list matches (same count)', refetched.length === activities.length)
    check(
      'the CALL entry survives a fresh query with its fields intact',
      refetched.some((a) => a.id === callResult.activity.id && a.description === 'Spoke with customer about pricing.'),
    )

    console.log('\n--- Follow-Up integration ---')

    console.log('8. Create follow-up from communication')
    const withFollowUp = await communicationService.logCommunication(businessAId, lead.id, {
      type: 'CALL',
      notes: 'Needs a follow-up call next week.',
      outcome: 'NEEDS_FOLLOW_UP',
      followUp: { scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })
    check('follow-up was created', withFollowUp.followUp !== null)
    check('follow-up type mirrors communication type (CALL)', withFollowUp.followUp?.type === 'CALL')
    check('follow-up notes carry the communication notes forward', withFollowUp.followUp?.notes === 'Needs a follow-up call next week.')

    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    const commActivityCount = activities.filter((a) => a.id === withFollowUp.activity.id).length
    const followUpCreatedCount = activities.filter((a) => a.type === 'FOLLOW_UP_CREATED').length
    check('exactly one COMMUNICATION_LOGGED row for this call (no duplicate)', commActivityCount === 1)
    check('exactly one FOLLOW_UP_CREATED row exists (not duplicated by communicationService)', followUpCreatedCount === 1)

    console.log('9. Complete the follow-up')
    await followUpService.completeFollowUp(businessAId, withFollowUp.followUp!.id)
    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('FOLLOW_UP_COMPLETED activity recorded', activities.some((a) => a.type === 'FOLLOW_UP_COMPLETED'))

    console.log('10. Cancel a follow-up (fresh one, since the above is now completed)')
    const secondFollowUp = await communicationService.logCommunication(businessAId, lead.id, {
      type: 'EMAIL',
      notes: 'Will follow up by email.',
      followUp: { scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    })
    await followUpService.cancelFollowUp(businessAId, secondFollowUp.followUp!.id)
    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('FOLLOW_UP_CANCELLED activity recorded', activities.some((a) => a.type === 'FOLLOW_UP_CANCELLED'))

    console.log('\n--- Security ---')

    const leadB = await leadService.createLead(businessBId, { name: 'Business B Lead', phone: '+15559990000', status: 'NEW' })
    await communicationService.logCommunication(businessBId, leadB.id, { type: 'CALL', notes: 'B-only communication.' })

    console.log('11. Business A cannot access Business B communications')
    const activitiesForBSeenFromA = await leadActivityService.listLeadActivities(businessAId, leadB.id)
    check('scoping a query to business A for B\'s lead returns nothing', activitiesForBSeenFromA.length === 0)

    console.log('12. Business A cannot create communication on Business B\'s lead')
    let crossTenantWriteBlocked = false
    try {
      await communicationService.logCommunication(businessAId, leadB.id, { type: 'CALL', notes: 'attempted cross-tenant write' })
    } catch {
      crossTenantWriteBlocked = true
    }
    check('logCommunication rejects a lead belonging to another business', crossTenantWriteBlocked)

    console.log('13. Business A cannot access Business B\'s follow-ups')
    const followUpsForA = await followUpService.listFollowUps(businessAId, { page: 1, limit: 100 })
    check(
      'A\'s follow-up list never includes B\'s lead',
      followUpsForA.items.every((f) => f.leadId !== leadB.id),
    )

    console.log('\n--- Analytics ---')

    const analyticsA = await getDashboardAnalytics(businessAId, 'all')
    const analyticsB = await getDashboardAnalytics(businessBId, 'all')

    console.log('14. Communication metrics are tenant-isolated')
    check('business A sees its own 7 communications (5 + 2 with follow-ups)', analyticsA.communications.total === 7)
    check('business B sees only its own 1 communication', analyticsB.communications.total === 1)
    const aCallCount = analyticsA.communications.byType.find((c) => c.type === 'CALL')?.count
    check('business A CALL count reflects only A\'s calls (2: the plain CALL + withFollowUp)', aCallCount === 2)

    console.log('15. Follow-up metrics remain tenant-isolated')
    check('business A pending follow-ups count is correct', analyticsA.followUps.pending === 0)
    check('business B analytics do not see A\'s follow-up activity', analyticsB.followUps.completed === 0 && analyticsB.followUps.cancelled === 0)

    console.log('\n--- Regression (Phase 0-8 behavior) ---')

    console.log('16. Existing lead CRUD still works')
    const updated = await leadService.updateLead(businessAId, lead.id, { notes: 'regression check' })
    check('lead update still works', updated.notes === 'regression check')
    const fetched = await leadService.getLeadById(businessAId, lead.id)
    check('lead read still works', fetched.id === lead.id)

    console.log('17. Existing status changes still work')
    const afterStatus = await leadService.changeLeadStatus(businessAId, lead.id, 'CONTACTED')
    check('status change still works', afterStatus.status === 'CONTACTED')

    console.log('18. Conversion tracking still works')
    const converted = await leadService.changeLeadStatus(businessAId, lead.id, 'CONVERTED')
    check('convertedAt still gets set', converted.convertedAt !== null)

    console.log('19. Public lead capture still works')
    const businessA = await prisma.business.findUniqueOrThrow({ where: { id: businessAId }, select: { slug: true } })
    await publicService.createPublicLead(businessA.slug, { name: 'Public Regression Lead', phone: '+15551239999' })
    const publicLead = await prisma.lead.findFirstOrThrow({ where: { businessId: businessAId, source: 'PUBLIC_FORM' } })
    check('public lead created with correct source/status', publicLead.source === 'PUBLIC_FORM' && publicLead.status === 'NEW')
    const publicLeadActivities = await leadActivityService.listLeadActivities(businessAId, publicLead.id)
    check('public lead capture still logs LEAD_CREATED', publicLeadActivities.some((a) => a.type === 'LEAD_CREATED'))

    console.log('20. Existing analytics (status/source breakdown) still work')
    const finalAnalyticsA = await getDashboardAnalytics(businessAId, 'all')
    check('leadsByStatus still has all 5 statuses represented', finalAnalyticsA.leadsByStatus.length === 5)
    check('leadsBySource includes PUBLIC_FORM after the capture above', finalAnalyticsA.leadsBySource.some((s) => s.source === 'PUBLIC_FORM'))
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
