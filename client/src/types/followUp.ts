import type { FollowUpStatus, FollowUpType } from '../config/followUp'
import type { PaginationMeta } from './lead'

export interface FollowUp {
  id: string
  leadId: string
  lead: { id: string; name: string }
  type: FollowUpType
  status: FollowUpStatus
  // ISO datetime string. Displayed in the viewer's local timezone
  // (new Date(...).toLocaleString()) — see FollowUpForm for the create/edit
  // side of this same local-time convention.
  scheduledAt: string
  notes: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FollowUpListResult {
  items: FollowUp[]
  pagination: PaginationMeta
}
