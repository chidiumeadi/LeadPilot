import { leadStatusLabels, leadStatusStyles } from '../../config/leadStatus'
import type { LeadStatus } from '../../config/leadStatus'

export default function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${leadStatusStyles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {leadStatusLabels[status]}
    </span>
  )
}
