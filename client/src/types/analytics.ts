import type { LeadStatus } from '../config/leadStatus'

export type AnalyticsRange = '7d' | '30d' | '90d' | 'all'

export interface AnalyticsSummary {
  totalLeads: number
  newLeads: number
  convertedLeads: number
  // Fraction 0–1 (of newLeads, within the selected range) — not a percentage.
  conversionRate: number
}

export interface LeadStatusCount {
  status: LeadStatus
  count: number
}

export interface LeadSourceCount {
  source: string
  label: string
  count: number
}

export interface LeadTrendPoint {
  date: string
  count: number
}

export interface FollowUpSummary {
  pending: number
  overdue: number
  completed: number
  cancelled: number
}

export interface DashboardAnalytics {
  range: AnalyticsRange
  summary: AnalyticsSummary
  leadsByStatus: LeadStatusCount[]
  leadsBySource: LeadSourceCount[]
  leadTrend: LeadTrendPoint[]
  followUps: FollowUpSummary
}
