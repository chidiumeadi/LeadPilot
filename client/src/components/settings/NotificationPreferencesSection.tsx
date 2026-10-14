import { useState } from 'react'

import ToggleField from './ToggleField'
import { useAuth } from '../../context/AuthContext'
import * as authService from '../../services/authService'
import type { AuthUser } from '../../types/auth'
import { getApiErrorMessage } from '../../utils/apiError'

const browserNotificationsSupported = typeof window !== 'undefined' && 'Notification' in window

interface NotificationPreferencesSectionProps {
  user: AuthUser
}

// Toggles save immediately (no separate "Save" button) — the same instant-
// save pattern LeadStatusControl used in Phase 8 for a single control that
// isn't part of a larger form.
export default function NotificationPreferencesSection({ user }: NotificationPreferencesSectionProps) {
  const { updateUser } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleInAppToggle = async (checked: boolean) => {
    setErrorMessage(null)
    setIsSaving(true)
    try {
      const updated = await authService.updateAccountRequest({ inAppNotificationsEnabled: checked })
      updateUser(updated)
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleBrowserToggle = async (checked: boolean) => {
    setErrorMessage(null)

    if (!checked) {
      setIsSaving(true)
      try {
        const updated = await authService.updateAccountRequest({ browserNotificationsEnabled: false })
        updateUser(updated)
      } catch (err) {
        setErrorMessage(getApiErrorMessage(err))
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Turning it on requires the browser's own permission — never claim
    // this is enabled if the browser didn't actually agree.
    if (!browserNotificationsSupported) {
      setErrorMessage('Your browser does not support notifications.')
      return
    }

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission !== 'granted') {
      setErrorMessage('Browser notifications were blocked. Allow them in your browser settings to turn this on.')
      return
    }

    setIsSaving(true)
    try {
      const updated = await authService.updateAccountRequest({ browserNotificationsEnabled: true })
      updateUser(updated)
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium text-gray-900">Notification Preferences</h3>
      <p className="mt-1 text-xs text-gray-500">
        These control how you're notified about follow-ups that are due — they don't affect whether LeadPilot
        tracks and schedules those reminders in the background.
      </p>

      <div className="mt-2 divide-y divide-gray-100">
        <ToggleField
          label="In-app notifications"
          description="Show the unread badge and bell icon in the dashboard header."
          checked={user.inAppNotificationsEnabled}
          onChange={handleInAppToggle}
          disabled={isSaving}
        />
        <ToggleField
          label="Browser notifications"
          description={
            browserNotificationsSupported
              ? 'Show a system notification when a new reminder arrives.'
              : 'Not supported in this browser.'
          }
          checked={user.browserNotificationsEnabled}
          onChange={handleBrowserToggle}
          disabled={isSaving || !browserNotificationsSupported}
        />
      </div>

      {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    </div>
  )
}
