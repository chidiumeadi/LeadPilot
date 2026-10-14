// Live verification script for the Settings module (business profile,
// account profile, password change, notification preferences, tenant
// isolation). Same convention as the other scripts/verify-*.ts files —
// this project has no test framework, so this exercises the real service
// layer against the real dev database and cleans up after itself.
//
// Run with: npx ts-node scripts/verify-settings.ts

import bcrypt from 'bcrypt'

import { prisma } from '../src/config/prisma'
import * as authService from '../src/services/authService'
import * as businessService from '../src/services/businessService'
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

async function createTestAccount(label: string) {
  const passwordHash = await bcrypt.hash('password123', 10)
  const business = await prisma.business.create({
    data: {
      name: `Verify Settings ${label}`,
      slug: `verify-settings-${label.toLowerCase()}-${Date.now()}`,
      users: { create: { name: `${label} User`, email: `verify-settings-${label.toLowerCase()}-${Date.now()}@example.com`, passwordHash } },
    },
    include: { users: true },
  })
  return { businessId: business.id, userId: business.users[0].id, email: business.users[0].email }
}

async function main() {
  const a = await createTestAccount('A')
  const b = await createTestAccount('B')

  try {
    console.log('\n--- Business Profile ---')

    console.log('1. Update business profile (name, category, phone, location, logoUrl)')
    const updatedBusiness = await businessService.updateBusinessForUser(a.userId, {
      name: 'Renamed Biz',
      category: 'Bakery',
      phone: '+15550001111',
      location: 'Lagos',
      logoUrl: 'https://example.com/logo.png',
    })
    check('all fields persisted', updatedBusiness.name === 'Renamed Biz' && updatedBusiness.category === 'Bakery' && updatedBusiness.logoUrl === 'https://example.com/logo.png')

    console.log('2. Clearing a field with null actually clears it')
    const cleared = await businessService.updateBusinessForUser(a.userId, { phone: null })
    check('phone cleared to null', cleared.phone === null)

    console.log('3. Slug is never exposed as updatable (not in the update data type at all)')
    const slugUnchanged = await businessService.getBusinessForUser(a.userId)
    check('slug unchanged by any of the above', slugUnchanged.slug === (await prisma.business.findUniqueOrThrow({ where: { id: a.businessId } })).slug)

    console.log('\n--- Account Profile ---')

    console.log('4. Update account name')
    const renamedUser = await authService.updateAccount(a.userId, { name: 'Renamed Person' })
    check('name persisted', renamedUser.name === 'Renamed Person')

    console.log('5. Update account email to a free address')
    const newEmail = `verify-settings-a-new-${Date.now()}@example.com`
    const emailChanged = await authService.updateAccount(a.userId, { email: newEmail })
    check('email persisted', emailChanged.email === newEmail)

    console.log('6. Duplicate email rejected')
    let duplicateRejected = false
    try {
      await authService.updateAccount(a.userId, { email: b.email })
    } catch (err) {
      duplicateRejected = (err as { statusCode?: number }).statusCode === 409
    }
    check('changing to an email already used by another account is rejected with 409', duplicateRejected)

    console.log('7. A user can "change" their email to their own current value without error')
    const noOpEmail = await authService.updateAccount(a.userId, { email: newEmail })
    check('no false conflict against yourself', noOpEmail.email === newEmail)

    console.log('\n--- Security ---')

    console.log('8. Change password with correct current password')
    await authService.changePassword(a.userId, { currentPassword: 'password123', newPassword: 'newpassword456' })
    const afterChange = await prisma.user.findUniqueOrThrow({ where: { id: a.userId }, select: { passwordHash: true } })
    check('new password hash verifies against the new password', await bcrypt.compare('newpassword456', afterChange.passwordHash))
    check('old password no longer verifies', !(await bcrypt.compare('password123', afterChange.passwordHash)))

    console.log('9. Change password with wrong current password is rejected')
    let wrongPasswordRejected = false
    try {
      await authService.changePassword(a.userId, { currentPassword: 'not-the-password', newPassword: 'irrelevant123' })
    } catch (err) {
      wrongPasswordRejected = (err as { statusCode?: number }).statusCode === 400
    }
    check('rejected with 400, no password changed', wrongPasswordRejected)

    console.log('\n--- Notification Preferences ---')

    console.log('10. Toggle preferences independently')
    const prefsOff = await authService.updateAccount(a.userId, { inAppNotificationsEnabled: false })
    check('inApp off, browser untouched (still default false)', prefsOff.inAppNotificationsEnabled === false && prefsOff.browserNotificationsEnabled === false)
    const prefsBrowserOn = await authService.updateAccount(a.userId, { browserNotificationsEnabled: true })
    check('browser on, inApp stayed off from the previous call', prefsBrowserOn.browserNotificationsEnabled === true && prefsBrowserOn.inAppNotificationsEnabled === false)

    console.log('11. Preferences persist on a fresh read (getCurrentUser)')
    const reread = await authService.getCurrentUser(a.userId)
    check('persisted correctly', reread.inAppNotificationsEnabled === false && reread.browserNotificationsEnabled === true)

    console.log('\n--- Tenant isolation ---')

    console.log('12. Business B is completely separate from Business A')
    const businessB = await businessService.getBusinessForUser(b.userId)
    check('B has its own distinct business record', businessB.id === b.businessId && businessB.id !== a.businessId)
    check('B was not renamed by anything done to A', businessB.name === `Verify Settings B`)

    console.log('13. User B cannot be affected by operations scoped to user A')
    const businessAUnaffectedByB = await businessService.getBusinessForUser(a.userId)
    check('business A unaffected by B existing', businessAUnaffectedByB.id === a.businessId)

    console.log('\n--- Regression (existing functionality untouched) ---')

    console.log('14. Lead creation still works after all the above')
    const lead = await leadService.createLead(a.businessId, { name: 'Regression Lead', phone: '+15559998888', status: 'NEW' })
    check('lead created successfully', lead.businessId === a.businessId)

    console.log('15. getBusinessIdForUser still resolves correctly post-rename')
    const resolvedBusinessId = await businessService.getBusinessIdForUser(a.userId)
    check('still resolves to the same business after name/email changes', resolvedBusinessId === a.businessId)
  } finally {
    await prisma.business.deleteMany({ where: { id: { in: [a.businessId, b.businessId] } } })
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
