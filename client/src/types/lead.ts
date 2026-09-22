import type { LeadStatus } from '../config/leadStatus'

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string
  status: LeadStatus
  notes: string | null
  // Set once, the first time this lead's status became CONVERTED. Stays
  // set even if the lead later moves to a different status.
  convertedAt: string | null
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
