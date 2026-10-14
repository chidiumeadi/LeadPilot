import type { Business } from '../types/auth'
import { api } from './api'

export interface UpdateBusinessPayload {
  name?: string
  category?: string | null
  phone?: string | null
  location?: string | null
  logoUrl?: string | null
}

interface BusinessResponse {
  success: true
  data: { business: Business }
}

export async function fetchBusiness(): Promise<Business> {
  const { data } = await api.get<BusinessResponse>('/business')
  return data.data.business
}

export async function updateBusiness(payload: UpdateBusinessPayload): Promise<Business> {
  const { data } = await api.patch<BusinessResponse>('/business', payload)
  return data.data.business
}
