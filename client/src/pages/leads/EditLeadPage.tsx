import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import LeadForm from '../../components/leads/LeadForm'
import type { LeadSubmitValues } from '../../components/leads/LeadForm'
import * as leadService from '../../services/leadService'
import type { Lead } from '../../types/lead'
import { getApiErrorMessage } from '../../utils/apiError'

export default function EditLeadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [serverError, setServerError] = useState<string | null>(null)

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

  const handleSubmit = async (values: LeadSubmitValues) => {
    if (!id) return
    setServerError(null)
    try {
      await leadService.updateLead(id, values)
      navigate(`/leads/${id}`, { replace: true })
    } catch (err) {
      setServerError(getApiErrorMessage(err))
    }
  }

  if (loadState === 'loading') {
    return <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
  }

  if (loadState === 'error' || !lead) {
    return <p className="py-12 text-center text-sm text-red-600">This lead could not be found.</p>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Edit lead</h2>
      <div className="mt-6">
        <LeadForm
          defaultValues={{
            name: lead.name,
            email: lead.email ?? '',
            phone: lead.phone ?? '',
            status: lead.status,
            notes: lead.notes ?? '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          serverError={serverError}
        />
      </div>
    </div>
  )
}
