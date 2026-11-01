import { Link } from 'react-router-dom'

import FollowUpStatusBadge from './FollowUpStatusBadge'
import { followUpTypeLabels } from '../../config/followUp'
import type { FollowUp } from '../../types/followUp'

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

interface FollowUpItemProps {
  followUp: FollowUp
  emphasis?: 'overdue'
  // The lead details page already knows which lead it's showing; the
  // standalone Follow-ups page lists every lead's follow-ups, so it needs
  // the lead name and a link back to that lead.
  showLead?: boolean
  busy?: boolean
  // Each action is optional — omitting one hides its button, so callers
  // decide which actions apply to a given follow-up (e.g. none of the
  // edit/complete/cancel actions for history items, which the server
  // rejects anyway).
  onEdit?: (followUp: FollowUp) => void
  onComplete?: (id: string) => void
  onCancel?: (id: string) => void
  onDelete?: (followUp: FollowUp) => void
}

export default function FollowUpItem({
  followUp,
  emphasis,
  showLead,
  busy,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
}: FollowUpItemProps) {
  const hasActions = Boolean(onEdit || onComplete || onCancel || onDelete)

  return (
    <li className={`rounded-lg border p-3 ${emphasis === 'overdue' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {showLead && (
            <Link
              to={`/leads/${followUp.lead.id}`}
              className="block truncate text-sm font-semibold text-gray-900 hover:underline"
            >
              {followUp.lead.name}
            </Link>
          )}
          <p className={`text-sm ${showLead ? 'text-gray-700' : 'font-medium text-gray-900'}`}>
            {followUpTypeLabels[followUp.type]} — {formatScheduled(followUp.scheduledAt)}
          </p>
          {followUp.completedAt && (
            <p className="mt-0.5 text-xs text-gray-500">Completed {formatScheduled(followUp.completedAt)}</p>
          )}
          {followUp.notes && <p className="mt-1 text-sm whitespace-pre-wrap text-gray-500">{followUp.notes}</p>}
        </div>
        <FollowUpStatusBadge status={followUp.status} />
      </div>

      {hasActions && (
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(followUp)}
              disabled={busy}
              className="font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Edit
            </button>
          )}
          {onComplete && (
            <button
              type="button"
              onClick={() => onComplete(followUp.id)}
              disabled={busy}
              className="font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
            >
              Mark complete
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={() => onCancel(followUp.id)}
              disabled={busy}
              className="font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={() => onDelete(followUp)} className="font-medium text-red-600 hover:text-red-700">
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  )
}
