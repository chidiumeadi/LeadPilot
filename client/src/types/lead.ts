import type { LeadStatus } from '../config/leadStatus'

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string
  status: LeadStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface LeadListResult {
  items: Lead[]
  pagination: PaginationMeta
}
