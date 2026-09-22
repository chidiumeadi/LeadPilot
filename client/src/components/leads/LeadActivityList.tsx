import {
  Bell,
  Calendar,
  CheckCircle2,
  type LucideIcon,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  StickyNote,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import EmptyState from '../dashboard/EmptyState'
import { communicationOutcomeLabels } from '../../config/communication'
import * as leadService from '../../services/leadService'
import type { LeadActivity, LeadActivityType } from '../../types/leadActivity'
import { getApiErrorMessage } from '../../utils/apiError'

interface LeadActivityListProps {
  leadId: string
  // Bumped by the parent (LeadDetailsPage) whenever something that
  // produces an activity happens elsewhere on the page — a status change,
  // a follow-up create/complete/cancel, a logged communication. This
  // component only fetches once per leadId otherwise, so without this
  // signal a genuinely new activity row exists in the database but never
  // gets refetched into view until the whole page is reloaded.
  refreshKey?: number
}

const ACTIVITY_ICONS: Record<LeadActivityType, LucideIcon> = {
  LEAD_CREATED: UserPlus,
  STATUS_CHANGED: RefreshCw,
  FOLLOW_UP_CREATED: Calendar,
  FOLLOW_UP_COMPLETED: CheckCircle2,
  FOLLOW_UP_CANCELLED: XCircle,
  FOLLOW_UP_NOTIFICATION_SENT: Bell,
  COMMUNICATION_LOGGED: MessageSquare, // fallback if communicationType is ever missing
}

// Communications get a type-specific icon (call vs. email vs. a plain
// note reads differently at a glance) instead of one generic icon for
// every COMMUNICATION_LOGGED row.
const COMMUNICATION_ICONS: Record<string, LucideIcon> = {
  CALL: Phone,
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: MessageCircle,
  NOTE: StickyNote,
}

function iconFor(activity: LeadActivity): LucideIcon {
  if (activity.type === 'COMMUNICATION_LOGGED' && activity.communicationType) {
    return COMMUNICATION_ICONS[activity.communicationType] ?? ACTIVITY_ICONS.COMMUNICATION_LOGGED
  }
  return ACTIVITY_ICONS[activity.type]
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// A simple bucketing for the filter tabs (spec §8) — kept as a plain
// client-side filter over the already-fetched list rather than a new API
// query param, since the list is small by design (see leadActivityService
// on the backend). Conversions (STATUS_CHANGED rows whose description
// happens to say "Lead converted") are intentionally folded into "Status"
// rather than a separate "Conversion" filter: splitting them out would
// need either a dedicated activity type or matching on description text,
// and neither is a real architectural necessity for this list.
type ActivityFilter = 'ALL' | 'STATUS' | 'FOLLOW_UP' | 'COMMUNICATION'

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'STATUS', label: 'Status' },
  { key: 'FOLLOW_UP', label: 'Follow-Ups' },
  { key: 'COMMUNICATION', label: 'Communication' },
]

function matchesFilter(activity: LeadActivity, filter: ActivityFilter): boolean {
  if (filter === 'ALL') return true
  if (filter === 'STATUS') return activity.type === 'LEAD_CREATED' || activity.type === 'STATUS_CHANGED'
  if (filter === 'FOLLOW_UP') return activity.type.startsWith('FOLLOW_UP_')
  return activity.type === 'COMMUNICATION_LOGGED'
}

// Read-only feed — no create/edit/delete here, so this is simpler than
// FollowUpSection: just load once and render, same loading/error/empty
// states as the rest of the app.
export default function LeadActivityList({ leadId, refreshKey }: LeadActivityListProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [filter, setFilter] = useState<ActivityFilter>('ALL')

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
  }, [leadId, refreshKey])

  const visibleActivities = activities.filter((activity) => matchesFilter(activity, filter))

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-gray-900">Activity History</h3>
        {activities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

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

        {loadState === 'ready' && activities.length > 0 && visibleActivities.length === 0 && (
          <EmptyState title="No matching activity" description="Try a different filter." />
        )}

        {loadState === 'ready' && visibleActivities.length > 0 && (
          <ul className="space-y-2">
            {visibleActivities.map((activity) => {
              const Icon = iconFor(activity)
              return (
                <li key={activity.id} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      {activity.communicationOutcome && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {communicationOutcomeLabels[activity.communicationOutcome]}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{formatWhen(activity.occurredAt ?? activity.createdAt)}</p>
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
