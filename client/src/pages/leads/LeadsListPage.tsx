import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import EmptyState from '../../components/dashboard/EmptyState'
import DeleteLeadDialog from '../../components/leads/DeleteLeadDialog'
import Pagination from '../../components/leads/Pagination'
import StatusBadge from '../../components/leads/StatusBadge'
import { LEAD_STATUSES, leadStatusLabels } from '../../config/leadStatus'
import type { LeadStatus } from '../../config/leadStatus'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import * as leadService from '../../services/leadService'
import type { Lead, PaginationMeta } from '../../types/lead'
import { getApiErrorMessage } from '../../utils/apiError'

const DEFAULT_LIMIT = 20

function isLeadStatus(value: string | null): value is LeadStatus {
  return value !== null && (LEAD_STATUSES as readonly string[]).includes(value)
}

export default function LeadsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawPage = Number(searchParams.get('page') ?? '1')
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1
  const rawStatus = searchParams.get('status')
  const statusFilter = isLeadStatus(rawStatus) ? rawStatus : ''
  const committedSearch = searchParams.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(committedSearch)
  const debouncedSearch = useDebouncedValue(searchInput, 400)

  const [leads, setLeads] = useState<Lead[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 })
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [leadPendingDelete, setLeadPendingDelete] = useState<Lead | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Push the debounced search text into the URL (and reset to page 1) once
  // typing settles, rather than firing a request on every keystroke.
  useEffect(() => {
    if (debouncedSearch === committedSearch) return
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) next.set('search', debouncedSearch)
    else next.delete('search')
    next.set('page', '1')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const loadLeads = async () => {
    setLoadState('loading')
    try {
      const result = await leadService.fetchLeads({
        page,
        limit: DEFAULT_LIMIT,
        status: statusFilter || undefined,
        search: committedSearch || undefined,
      })
      setLeads(result.items)
      setPagination(result.pagination)
      setLoadState('ready')
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Could not load leads.'))
      setLoadState('error')
    }
  }

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, committedSearch])

  const handleStatusChange = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('status', value)
    else next.delete('status')
    next.set('page', '1')
    setSearchParams(next, { replace: true })
  }

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next, { replace: true })
  }

  const handleDeleteConfirm = async () => {
    if (!leadPendingDelete) return
    setIsDeleting(true)
    try {
      await leadService.deleteLead(leadPendingDelete.id)
      setLeadPendingDelete(null)
      await loadLeads()
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Could not delete lead.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const hasActiveFilters = Boolean(statusFilter || committedSearch)
  const isEmpty = loadState === 'ready' && leads.length === 0

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Leads</h2>
        <Link
          to="/leads/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add lead
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <label htmlFor="lead-search" className="sr-only">
            Search leads
          </label>
          <input
            id="lead-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email, or phone"
            className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-9 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <label htmlFor="lead-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="lead-status-filter"
          value={statusFilter}
          onChange={(event) => handleStatusChange(event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {leadStatusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {loadState === 'loading' && <p className="py-12 text-center text-sm text-gray-400">Loading leads…</p>}

        {loadState === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button type="button" onClick={loadLeads} className="mt-3 text-sm font-medium text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {isEmpty && !hasActiveFilters && (
          <EmptyState
            title="No leads yet"
            description="Add your first lead to start managing your customer pipeline."
            action={{ label: 'Add lead', onClick: () => navigate('/leads/new') }}
          />
        )}

        {isEmpty && hasActiveFilters && (
          <EmptyState
            title="No leads match your search"
            description="Try a different search term, or clear the status filter."
          />
        )}

        {loadState === 'ready' && leads.length > 0 && (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500">
                      Contact
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500">
                      Source
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500">
                      Created
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-4 py-3">
                        <Link to={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:underline">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{lead.email || lead.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{lead.source}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <Link to={`/leads/${lead.id}/edit`} className="text-gray-500 hover:text-gray-900">
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setLeadPendingDelete(lead)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {leads.map((lead) => (
                <li key={lead.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:underline">
                      {lead.name}
                    </Link>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{lead.email || lead.phone || 'No contact info'}</p>
                  <p className="mt-1 text-xs text-gray-400">Added {new Date(lead.createdAt).toLocaleDateString()}</p>
                  <div className="mt-3 flex gap-4 text-sm">
                    <Link to={`/leads/${lead.id}/edit`} className="font-medium text-gray-600">
                      Edit
                    </Link>
                    <button type="button" onClick={() => setLeadPendingDelete(lead)} className="font-medium text-red-600">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>

      {leadPendingDelete && (
        <DeleteLeadDialog
          leadName={leadPendingDelete.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setLeadPendingDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
