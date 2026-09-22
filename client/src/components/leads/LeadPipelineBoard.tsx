import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { LEAD_STATUSES, leadStatusLabels } from '../../config/leadStatus'
import * as leadService from '../../services/leadService'
import type { Lead } from '../../types/lead'

// How many leads to show per column before pointing the owner at the full
// filtered list instead. Keeps each column a quick glance, not a second
// full lead list rendered five times over.
const LEADS_PER_COLUMN = 10

interface PipelineColumn {
  status: (typeof LEAD_STATUSES)[number]
  leads: Lead[]
  total: number
}

// Reuses the existing GET /api/leads?status=X&limit=N endpoint — one call
// per status, run in parallel — rather than adding a new backend endpoint
// just to group leads that the list API can already filter by status.
export default function LeadPipelineBoard() {
  const [columns, setColumns] = useState<PipelineColumn[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')

    Promise.all(
      LEAD_STATUSES.map((status) =>
        leadService.fetchLeads({ status, limit: LEADS_PER_COLUMN }).then((result) => ({
          status,
          leads: result.items,
          total: result.pagination.total,
        })),
      ),
    )
      .then((results) => {
        if (cancelled) return
        setColumns(results)
        setLoadState('ready')
      })
      .catch(() => {
        if (cancelled) return
        setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loadState === 'loading') {
    return <p className="py-12 text-center text-sm text-gray-400">Loading pipeline…</p>
  }

  if (loadState === 'error') {
    return <p className="py-12 text-center text-sm text-red-600">Could not load the pipeline.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {columns.map((column) => (
        <div key={column.status} className="rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <h3 className="text-sm font-semibold text-gray-900">{leadStatusLabels[column.status]}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
              {column.total}
            </span>
          </div>

          <div className="space-y-2 p-2">
            {column.leads.length === 0 && <p className="px-2 py-3 text-center text-xs text-gray-400">No leads</p>}

            {column.leads.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="block rounded-md border border-gray-200 bg-white p-2.5 hover:border-gray-300 hover:bg-gray-50"
              >
                <p className="truncate text-sm font-medium text-gray-900">{lead.name}</p>
                <p className="truncate text-xs text-gray-500">{lead.email || lead.phone || 'No contact info'}</p>
              </Link>
            ))}

            {column.total > LEADS_PER_COLUMN && (
              <Link
                to={`/leads?status=${column.status}`}
                className="block px-2 py-1 text-center text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                View all {column.total}
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
