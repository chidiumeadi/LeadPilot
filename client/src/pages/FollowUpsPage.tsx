import { AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import EmptyState from '../components/dashboard/EmptyState'
import FollowUpFormDialog from '../components/followUps/FollowUpFormDialog'
import type { FollowUpSubmitValues } from '../components/followUps/FollowUpForm'
import FollowUpItem from '../components/followUps/FollowUpItem'
import Pagination from '../components/Pagination'
import * as followUpService from '../services/followUpService'
import type { FollowUpListParams } from '../services/followUpService'
import type { FollowUp } from '../types/followUp'
import type { PaginationMeta } from '../types/lead'
import { getApiErrorMessage } from '../utils/apiError'

const DEFAULT_LIMIT = 20

type View = 'upcoming' | 'overdue' | 'completed'

interface ViewConfig {
  label: string
  params: Pick<FollowUpListParams, 'when' | 'status'>
  icon: LucideIcon
  emptyTitle: string
  emptyDescription: string
}

// Each view maps onto the existing GET /follow-ups filters — no new API.
// Upcoming/overdue are both PENDING (split by scheduledAt on the server);
// cancelled follow-ups intentionally have no view of their own here and
// remain visible in each lead's follow-up history.
const VIEWS: Record<View, ViewConfig> = {
  upcoming: {
    label: 'Upcoming',
    params: { when: 'upcoming' },
    icon: CalendarClock,
    emptyTitle: 'No upcoming follow-ups',
    emptyDescription: "Follow-ups you schedule from a lead's page will show up here.",
  },
  overdue: {
    label: 'Overdue',
    params: { when: 'overdue' },
    icon: AlertTriangle,
    emptyTitle: 'Nothing overdue',
    emptyDescription: "You're all caught up — no follow-ups are past their scheduled time.",
  },
  completed: {
    label: 'Completed',
    params: { status: 'COMPLETED' },
    icon: CheckCircle2,
    emptyTitle: 'No completed follow-ups yet',
    emptyDescription: 'Follow-ups you mark complete will show up here.',
  },
}

const VIEW_ORDER: View[] = ['upcoming', 'overdue', 'completed']

function parseView(value: string | null): View {
  return value === 'overdue' || value === 'completed' ? value : 'upcoming'
}

export default function FollowUpsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // View and page live in the URL (same as LeadsListPage/NotificationsPage)
  // so a refresh or back-navigation from a lead lands on the same list.
  const view = parseView(searchParams.get('view'))
  const rawPage = Number(searchParams.get('page') ?? '1')
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1
  const config = VIEWS[view]
  const isPendingView = view !== 'completed'

  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 })
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [editTarget, setEditTarget] = useState<FollowUp | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Switching tabs quickly can leave an older request in flight; only the
  // latest one is allowed to write state, so a slow Overdue response can't
  // land on top of the Completed tab.
  const latestRequest = useRef(0)

  const load = async () => {
    const requestId = ++latestRequest.current
    setLoadState('loading')
    try {
      const result = await followUpService.fetchFollowUps({ ...config.params, page, limit: DEFAULT_LIMIT })
      if (requestId !== latestRequest.current) return
      // Completing/cancelling the last item on a later page would otherwise
      // leave the user on an empty page past the end.
      if (result.items.length === 0 && page > 1 && result.pagination.totalPages > 0) {
        handlePageChange(result.pagination.totalPages)
        return
      }
      setFollowUps(result.items)
      setPagination(result.pagination)
      setLoadState('ready')
    } catch (err) {
      if (requestId !== latestRequest.current) return
      setErrorMessage(getApiErrorMessage(err, 'Could not load follow-ups.'))
      setLoadState('error')
    }
  }

  useEffect(() => {
    setActionError(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, page])

  const handleViewChange = (nextView: View) => {
    const next = new URLSearchParams(searchParams)
    next.set('view', nextView)
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  function handlePageChange(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next, { replace: true })
  }

  const openEdit = (followUp: FollowUp) => {
    setFormError(null)
    setEditTarget(followUp)
  }

  const handleEdit = async (values: FollowUpSubmitValues) => {
    if (!editTarget) return
    setFormError(null)
    try {
      await followUpService.updateFollowUp(editTarget.id, values)
      setEditTarget(null)
      // Rescheduling can move an item between Upcoming and Overdue, so
      // refetch rather than patching the row in place.
      await load()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    }
  }

  const runAction = async (id: string, action: (id: string) => Promise<FollowUp>) => {
    setActionError(null)
    setBusyId(id)
    try {
      await action(id)
      await load()
    } catch (err) {
      setActionError(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Follow-ups</h2>
        <div className="inline-flex self-start rounded-md border border-gray-300 bg-white p-0.5 sm:self-auto">
          {VIEW_ORDER.map((key) => {
            const Icon = VIEWS[key].icon
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleViewChange(key)}
                aria-pressed={view === key}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium ${
                  view === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {VIEWS[key].label}
              </button>
            )
          })}
        </div>
      </div>

      {actionError && <p className="mt-4 text-sm text-red-600">{actionError}</p>}

      <div className="mt-6">
        {loadState === 'loading' && <p className="py-12 text-center text-sm text-gray-400">Loading follow-ups…</p>}

        {loadState === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button type="button" onClick={load} className="mt-3 text-sm font-medium text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {loadState === 'ready' && followUps.length === 0 && (
          <EmptyState title={config.emptyTitle} description={config.emptyDescription} icon={config.icon} />
        )}

        {loadState === 'ready' && followUps.length > 0 && (
          <>
            <ul className="space-y-2">
              {followUps.map((followUp) => (
                <FollowUpItem
                  key={followUp.id}
                  followUp={followUp}
                  showLead
                  emphasis={view === 'overdue' ? 'overdue' : undefined}
                  busy={busyId === followUp.id}
                  // Only pending follow-ups can be edited, completed or
                  // cancelled — the server enforces this too (400).
                  onEdit={isPendingView ? openEdit : undefined}
                  onComplete={isPendingView ? (id) => runAction(id, followUpService.completeFollowUp) : undefined}
                  onCancel={isPendingView ? (id) => runAction(id, followUpService.cancelFollowUp) : undefined}
                />
              ))}
            </ul>

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>

      {editTarget && (
        <FollowUpFormDialog
          followUp={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          serverError={formError}
        />
      )}
    </div>
  )
}
