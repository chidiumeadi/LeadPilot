import { followUpStatusLabels, followUpStatusStyles } from '../../config/followUp'
import type { FollowUpStatus } from '../../config/followUp'

export default function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${followUpStatusStyles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {followUpStatusLabels[status]}
    </span>
  )
}
