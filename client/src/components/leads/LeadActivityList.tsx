import { Bell, Calendar, CheckCircle2, type LucideIcon, RefreshCw, UserPlus, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import EmptyState from '../dashboard/EmptyState'
import * as leadService from '../../services/leadService'
import type { LeadActivity, LeadActivityType } from '../../types/leadActivity'
import { getApiErrorMessage } from '../../utils/apiError'

interface LeadActivityListProps {
  leadId: string
}

const ACTIVITY_ICONS: Record<LeadActivityType, LucideIcon> = {
  LEAD_CREATED: UserPlus,
  STATUS_CHANGED: RefreshCw,
  FOLLOW_UP_CREATED: Calendar,
  FOLLOW_UP_COMPLETED: CheckCircle2,
  FOLLOW_UP_CANCELLED: XCircle,
  FOLLOW_UP_NOTIFICATION_SENT: Bell,
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// Read-only feed — no create/edit/delete here, so this is simpler than
// FollowUpSection: just load once and render, same loading/error/empty
// states as the rest of the app.
export default function LeadActivityList({ leadId }: LeadActivityListProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const load = async () => {
    setLoadState('loading')
    try {
      const result = await leadService.fetchLeadActivities(leadId)
      setActivities(result)
      setLoadState('ready')
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Could not load activity history.'))
      setLoadState('error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-gray-900">Activity History</h3>

      <div className="mt-4">
        {loadState === 'loading' && <p className="py-6 text-center text-sm text-gray-400">Loading activity…</p>}

        {loadState === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-6 text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button type="button" onClick={load} className="mt-2 text-sm font-medium text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {loadState === 'ready' && activities.length === 0 && (
          <EmptyState title="No activity yet" description="Actions taken on this lead will show up here." />
        )}

        {loadState === 'ready' && activities.length > 0 && (
          <ul className="space-y-2">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type]
              return (
                <li key={activity.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{formatWhen(activity.createdAt)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
