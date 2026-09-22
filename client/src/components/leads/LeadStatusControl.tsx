import { useState } from 'react'

import { LEAD_STATUSES, leadStatusLabels } from '../../config/leadStatus'
import type { LeadStatus } from '../../config/leadStatus'
import * as leadService from '../../services/leadService'
import { getApiErrorMessage } from '../../utils/apiError'

interface LeadStatusControlProps {
  leadId: string
  status: LeadStatus
  onChanged: (status: LeadStatus) => void
}

// A focused "move this lead to the next stage" control — calls the
// dedicated PATCH /api/leads/:id/status endpoint (Phase 8), separate from
// the full edit form which can still change status too (EditLeadPage).
export default function LeadStatusControl({ leadId, status, onChanged }: LeadStatusControlProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value as LeadStatus
    if (nextStatus === status) return

    setErrorMessage('')
    setIsSaving(true)
    try {
      const updated = await leadService.changeLeadStatus(leadId, nextStatus)
      onChanged(updated.status)
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Could not change status.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <label htmlFor="lead-status-select" className="sr-only">
        Change lead status
      </label>
      <select
        id="lead-status-select"
        value={status}
        onChange={handleChange}
        disabled={isSaving}
        className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {leadStatusLabels[s]}
          </option>
        ))}
      </select>
      {errorMessage && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
    </div>
  )
}
