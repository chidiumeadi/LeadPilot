import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import DeleteLeadDialog from '../../components/leads/DeleteLeadDialog'
import StatusBadge from '../../components/leads/StatusBadge'
import * as leadService from '../../services/leadService'
import type { Lead } from '../../types/lead'

interface DetailRowProps {
  label: string
  value: string
  multiline?: boolean
}

function DetailRow({ label, value, multiline }: DetailRowProps) {
  return (
    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

export default function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    leadService
      .fetchLead(id)
      .then((data) => {
        if (cancelled) return
        setLead(data)
        setLoadState('ready')
      })
      .catch(() => {
        if (cancelled) return
        setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await leadService.deleteLead(id)
      navigate('/leads', { replace: true })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loadState === 'loading') {
    return <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
  }

  if (loadState === 'error' || !lead) {
    return <p className="py-12 text-center text-sm text-red-600">This lead could not be found.</p>
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{lead.name}</h2>
          <div className="mt-2">
            <StatusBadge status={lead.status} />
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Link
            to={`/leads/${lead.id}/edit`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        <DetailRow label="Email" value={lead.email || '—'} />
        <DetailRow label="Phone" value={lead.phone || '—'} />
        <DetailRow label="Source" value={lead.source} />
        <DetailRow label="Notes" value={lead.notes || '—'} multiline />
        <DetailRow label="Created" value={new Date(lead.createdAt).toLocaleString()} />
        <DetailRow label="Last updated" value={new Date(lead.updatedAt).toLocaleString()} />
      </dl>

      {showDeleteDialog && (
        <DeleteLeadDialog
          leadName={lead.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
