import { api } from './api'

// Separate from services/leadService.ts on purpose: these calls never
// carry auth and must stay obviously distinct from the authenticated
// Lead Management API.

export interface PublicBusiness {
  name: string
  slug: string
}

export interface PublicLeadInput {
  name: string
  email?: string
  phone?: string
  notes?: string
}

interface PublicBusinessResponse {
  success: true
  data: { business: PublicBusiness }
}

interface MessageResponse {
  success: true
  message: string
}

export async function fetchPublicBusiness(businessSlug: string): Promise<PublicBusiness> {
  const { data } = await api.get<PublicBusinessResponse>(`/public/business/${businessSlug}`)
  return data.data.business
}

export async function submitPublicLead(businessSlug: string, input: PublicLeadInput): Promise<string> {
  const { data } = await api.post<MessageResponse>(`/public/leads/${businessSlug}`, input)
  return data.message
}
