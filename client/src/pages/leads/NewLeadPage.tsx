import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LeadForm from '../../components/leads/LeadForm'
import type { LeadSubmitValues } from '../../components/leads/LeadForm'
import * as leadService from '../../services/leadService'
import { getApiErrorMessage } from '../../utils/apiError'

export default function NewLeadPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const handleSubmit = async (values: LeadSubmitValues) => {
    setServerError(null)
    try {
      const lead = await leadService.createLead(values)
      navigate(`/leads/${lead.id}`, { replace: true })
    } catch (err) {
      setServerError(getApiErrorMessage(err))
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Add lead</h2>
      <div className="mt-6">
        <LeadForm onSubmit={handleSubmit} submitLabel="Create lead" serverError={serverError} />
      </div>
    </div>
  )
}
