import { Monitor } from 'lucide-react'

import AccountOverview from '../components/settings/AccountOverview'
import AccountProfileSection from '../components/settings/AccountProfileSection'
import BusinessProfileSection from '../components/settings/BusinessProfileSection'
import NotificationPreferencesSection from '../components/settings/NotificationPreferencesSection'
import SecuritySection from '../components/settings/SecuritySection'
import { useAuth } from '../context/AuthContext'

// No theme infrastructure exists anywhere in this app yet (no dark:
// variants, no theme context) — retrofitting real theme switching would
// touch dozens of existing components and risks destabilizing all of
// them, so per the spec's own fallback instruction this is documented as
// a follow-up rather than a nonfunctional toggle.
function AppearanceSection() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <Monitor className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <h3 className="text-sm font-medium text-gray-900">Appearance</h3>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Theme switching isn't available yet — LeadPilot doesn't have dark-mode styling built for the rest of the
        dashboard, so adding a toggle here without it would just be nonfunctional. This is tracked as a follow-up
        task.
      </p>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900">Settings</h2>

      <div className="mt-6 space-y-6">
        <AccountOverview user={user} />
        <BusinessProfileSection business={user.business} />
        <AccountProfileSection user={user} />
        <SecuritySection />
        <NotificationPreferencesSection user={user} />
        <AppearanceSection />
      </div>
    </div>
  )
}
