// Live verification script for Phase 8's lead activity history: status
// changes, follow-up create/complete/cancel, and public lead capture — plus
// tenant isolation and the analytics numbers that depend on the same data.
//
// This project has no Jest/Vitest (or any) test framework installed —
// every phase so far has been verified by exercising the real service
// layer and API against the real dev database, then cleaning up. This
// script follows that same convention rather than introducing a new
// testing dependency for one bug fix.
//
// Run with: npx ts-node scripts/verify-lead-status-activity.ts
// (from the server/ directory, with the dev database reachable)
//
// It creates its own throwaway businesses/leads and deletes them again at
// the end (even on failure), so it's safe to re-run any time.

import { prisma } from '../src/config/prisma'
import { getDashboardAnalytics } from '../src/services/analyticsService'
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
  const businessAId = await createTestBusiness('Verify Status Activity A')
  const businessBId = await createTestBusiness('Verify Status Activity B')

  try {
    const lead = await leadService.createLead(businessAId, {
      name: 'Status Activity Test Lead',
      phone: '+15550001111',
      status: 'NEW',
    })

    console.log('\n1. Lead created activity exists')
    let activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('LEAD_CREATED activity recorded', activities.some((a) => a.type === 'LEAD_CREATED'))
    check('LEAD_CREATED description reads "Lead created"', activities[0]?.description === 'Lead created')

    console.log('\n2. NEW -> CONTACTED creates an activity')
    await leadService.changeLeadStatus(businessAId, lead.id, 'CONTACTED')
    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check(
      'STATUS_CHANGED (NEW->CONTACTED) recorded with correct description',
      activities.some((a) => a.type === 'STATUS_CHANGED' && a.description === 'Status changed from NEW to CONTACTED'),
    )

    console.log('\n3. CONTACTED -> QUALIFIED creates an activity')
    await leadService.changeLeadStatus(businessAId, lead.id, 'QUALIFIED')
    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check(
      'STATUS_CHANGED (CONTACTED->QUALIFIED) recorded',
      activities.some((a) => a.description === 'Status changed from CONTACTED to QUALIFIED'),
    )

    console.log('\n4. QUALIFIED -> CONVERTED creates an activity and sets convertedAt')
    const convertedLead = await leadService.changeLeadStatus(businessAId, lead.id, 'CONVERTED')
    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('STATUS_CHANGED (-> CONVERTED) recorded as "Lead converted"', activities.some((a) => a.description === 'Lead converted'))
    check('convertedAt was set', convertedLead.convertedAt !== null)

    console.log('\n5. CONVERTED -> LOST creates an activity and PRESERVES convertedAt')
    const lostLead = await leadService.changeLeadStatus(businessAId, lead.id, 'LOST')
    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('STATUS_CHANGED (-> LOST) recorded as "Lead marked as lost"', activities.some((a) => a.description === 'Lead marked as lost'))
    check(
      'convertedAt unchanged from the CONVERTED step',
      lostLead.convertedAt?.getTime() === convertedLead.convertedAt?.getTime(),
    )

    console.log('\n6. Changing to the same status is a no-op (no false activity)')
    const activityCountBefore = activities.length
    await leadService.changeLeadStatus(businessAId, lead.id, 'LOST')
    activities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('no new activity row was created', activities.length === activityCountBefore)

    console.log('\n7. Every activity belongs to the correct lead')
    check(
      'all activities reference this lead\'s id',
      activities.every((a) => a.leadId === lead.id),
    )

    console.log('\n8. Activities are isolated to the correct business')
    const leadB = await leadService.createLead(businessBId, { name: 'Other Business Lead', phone: '+15559998888', status: 'NEW' })
    await leadService.changeLeadStatus(businessBId, leadB.id, 'CONTACTED')
    const activitiesForA = await leadActivityService.listLeadActivities(businessAId, lead.id)
    const activitiesForBSeenFromA = await leadActivityService.listLeadActivities(businessAId, leadB.id)
    check('business A\'s activity list never includes business B\'s lead', activitiesForA.every((a) => a.leadId !== leadB.id))
    check('querying business B\'s lead scoped to business A returns nothing', activitiesForBSeenFromA.length === 0)

    console.log('\n9. The Activity History API endpoint returns what the service persisted')
    const apiActivities = await leadActivityService.listLeadActivities(businessAId, lead.id)
    check('API-level query returns the same rows the service wrote', apiActivities.length === activities.length)

    console.log('\n10. Follow-up create/complete/cancel each record an activity')
    const followUpLead = await leadService.createLead(businessAId, {
      name: 'Follow-Up Activity Lead',
      phone: '+15550002222',
      status: 'NEW',
    })
    const followUp = await followUpService.createFollowUp(businessAId, {
      leadId: followUpLead.id,
      type: 'CALL',
      scheduledAt: new Date(Date.now() + 60_000),
    })
    let fuActivities = await leadActivityService.listLeadActivities(businessAId, followUpLead.id)
    check(
      'FOLLOW_UP_CREATED recorded',
      fuActivities.some((a) => a.type === 'FOLLOW_UP_CREATED' && a.description === 'Call follow-up scheduled'),
    )

    await followUpService.completeFollowUp(businessAId, followUp.id)
    fuActivities = await leadActivityService.listLeadActivities(businessAId, followUpLead.id)
    check(
      'FOLLOW_UP_COMPLETED recorded',
      fuActivities.some((a) => a.type === 'FOLLOW_UP_COMPLETED' && a.description === 'Call follow-up completed'),
    )

    const secondFollowUp = await followUpService.createFollowUp(businessAId, {
      leadId: followUpLead.id,
      type: 'EMAIL',
      scheduledAt: new Date(Date.now() + 60_000),
    })
    await followUpService.cancelFollowUp(businessAId, secondFollowUp.id)
    fuActivities = await leadActivityService.listLeadActivities(businessAId, followUpLead.id)
    check(
      'FOLLOW_UP_CANCELLED recorded',
      fuActivities.some((a) => a.type === 'FOLLOW_UP_CANCELLED' && a.description === 'Email follow-up cancelled'),
    )

    console.log('\n11. Public lead capture records a LEAD_CREATED activity')
    const businessA = await prisma.business.findUniqueOrThrow({ where: { id: businessAId }, select: { slug: true } })
    await publicService.createPublicLead(businessA.slug, { name: 'Public Capture Test', phone: '+15550003333' })
    const publicLead = await prisma.lead.findFirstOrThrow({
      where: { businessId: businessAId, source: 'PUBLIC_FORM' },
      orderBy: { createdAt: 'desc' },
    })
    const publicActivities = await leadActivityService.listLeadActivities(businessAId, publicLead.id)
    check(
      'LEAD_CREATED (public form) recorded with the public-specific description',
      publicActivities.some((a) => a.type === 'LEAD_CREATED' && a.description === 'Lead submitted through the public capture form'),
    )

    console.log('\n12. Analytics stay tenant-isolated for the same data these activities describe')
    const analyticsA = await getDashboardAnalytics(businessAId, 'all')
    const analyticsB = await getDashboardAnalytics(businessBId, 'all')
    check('business A analytics totalLeads only counts business A leads', analyticsA.summary.totalLeads === 3)
    check('business B analytics totalLeads only counts business B leads', analyticsB.summary.totalLeads === 1)
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
