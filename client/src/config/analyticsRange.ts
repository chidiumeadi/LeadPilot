import type { AnalyticsRange } from '../types/analytics'

export const ANALYTICS_RANGES: readonly AnalyticsRange[] = ['7d', '30d', '90d', 'all']

export const analyticsRangeLabels: Record<AnalyticsRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
}
