import type { FollowUpStatus, FollowUpType } from '../config/followUp'
import type { FollowUp, FollowUpListResult } from '../types/followUp'
import { api } from './api'

export interface FollowUpListParams {
  page?: number
  limit?: number
  status?: FollowUpStatus
  leadId?: string
  when?: 'upcoming' | 'overdue'
}

export interface FollowUpInput {
  leadId: string
  type: FollowUpType
  // ISO datetime string.
  scheduledAt: string
  notes?: string
}

export interface UpdateFollowUpInput {
  type?: FollowUpType
  scheduledAt?: string
  notes?: string
}

interface FollowUpResponse {
  success: true
  data: { followUp: FollowUp }
}

interface FollowUpListResponse {
  success: true
  data: FollowUpListResult
}

export async function fetchFollowUps(params: FollowUpListParams): Promise<FollowUpListResult> {
  const { data } = await api.get<FollowUpListResponse>('/follow-ups', { params })
  return data.data
}

export async function createFollowUp(input: FollowUpInput): Promise<FollowUp> {
  const { data } = await api.post<FollowUpResponse>('/follow-ups', input)
  return data.data.followUp
}

export async function updateFollowUp(id: string, input: UpdateFollowUpInput): Promise<FollowUp> {
  const { data } = await api.patch<FollowUpResponse>(`/follow-ups/${id}`, input)
  return data.data.followUp
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const { data } = await api.post<FollowUpResponse>(`/follow-ups/${id}/complete`)
  return data.data.followUp
}

export async function cancelFollowUp(id: string): Promise<FollowUp> {
  const { data } = await api.post<FollowUpResponse>(`/follow-ups/${id}/cancel`)
  return data.data.followUp
}

export async function deleteFollowUp(id: string): Promise<void> {
  await api.delete(`/follow-ups/${id}`)
}
