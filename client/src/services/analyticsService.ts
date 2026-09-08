import type { AnalyticsRange, DashboardAnalytics } from '../types/analytics'
import { api } from './api'

interface DashboardAnalyticsResponse {
  success: true
  data: DashboardAnalytics
}

export async function fetchDashboardAnalytics(range: AnalyticsRange): Promise<DashboardAnalytics> {
  const { data } = await api.get<DashboardAnalyticsResponse>('/analytics/dashboard', { params: { range } })
  return data.data
}
