import type { CommunicationOutcome, CommunicationType } from '../config/communication'
import type { FollowUpType } from '../config/followUp'
import type { LeadStatus } from '../config/leadStatus'
import type { FollowUp } from '../types/followUp'
import type { Lead, LeadListResult } from '../types/lead'
import type { LeadActivity } from '../types/leadActivity'
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

export async function changeLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  const { data } = await api.patch<LeadResponse>(`/leads/${id}/status`, { status })
  return data.data.lead
}

interface LeadActivityListResponse {
  success: true
  data: { activities: LeadActivity[] }
}

export async function fetchLeadActivities(id: string): Promise<LeadActivity[]> {
  const { data } = await api.get<LeadActivityListResponse>(`/leads/${id}/activities`)
  return data.data.activities
}

export interface LogCommunicationInput {
  type: CommunicationType
  notes: string
  outcome?: CommunicationOutcome
  occurredAt?: string
  followUp?: {
    scheduledAt: string
    type?: FollowUpType
  }
}

interface LogCommunicationResponse {
  success: true
  data: { activity: LeadActivity; followUp: FollowUp | null }
}

export async function logCommunication(
  leadId: string,
  input: LogCommunicationInput,
): Promise<{ activity: LeadActivity; followUp: FollowUp | null }> {
  const { data } = await api.post<LogCommunicationResponse>(`/leads/${leadId}/communications`, input)
  return data.data
}
