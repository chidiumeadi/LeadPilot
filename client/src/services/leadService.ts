import type { LeadStatus } from '../config/leadStatus'
import type { Lead, LeadListResult } from '../types/lead'
import { api } from './api'

export interface LeadListParams {
  page?: number
  limit?: number
  status?: LeadStatus
  search?: string
}

export interface LeadInput {
  name: string
  email?: string
  phone?: string
  status?: LeadStatus
  notes?: string
}

interface LeadResponse {
  success: true
  data: { lead: Lead }
}

interface LeadListResponse {
  success: true
  data: LeadListResult
}

export async function fetchLeads(params: LeadListParams): Promise<LeadListResult> {
  const { data } = await api.get<LeadListResponse>('/leads', { params })
  return data.data
}

export async function fetchLead(id: string): Promise<Lead> {
  const { data } = await api.get<LeadResponse>(`/leads/${id}`)
  return data.data.lead
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const { data } = await api.post<LeadResponse>('/leads', input)
  return data.data.lead
}

export async function updateLead(id: string, input: Partial<LeadInput>): Promise<Lead> {
  const { data } = await api.patch<LeadResponse>(`/leads/${id}`, input)
  return data.data.lead
}

export async function deleteLead(id: string): Promise<void> {
  await api.delete(`/leads/${id}`)
}
