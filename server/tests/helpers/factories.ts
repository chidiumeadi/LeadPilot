import type { FollowUp, Lead, Prisma } from '@prisma/client'

import { prisma } from '../../src/config/prisma'

// Direct-to-database fixtures for setting up state quickly. They bypass the
// service layer on purpose (no activity rows, no validation) — tests that
// are *about* creating leads/follow-ups should go through the API instead.

let leadCounter = 0

export async function createLead(
  businessId: string,
  overrides: Partial<Omit<Prisma.LeadUncheckedCreateInput, 'businessId'>> = {},
): Promise<Lead> {
  leadCounter += 1
  return prisma.lead.create({
    data: {
      businessId,
      name: `Test Lead ${leadCounter}`,
      phone: '+15550000000',
      ...overrides,
    },
  })
}

export async function createFollowUp(
  businessId: string,
  leadId: string,
  overrides: Partial<Omit<Prisma.FollowUpUncheckedCreateInput, 'businessId' | 'leadId'>> = {},
): Promise<FollowUp> {
  return prisma.followUp.create({
    data: {
      businessId,
      leadId,
      type: 'CALL',
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
      ...overrides,
    },
  })
}
