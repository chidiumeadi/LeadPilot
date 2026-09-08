import { AlertTriangle, CheckCircle2, Clock, TrendingUp, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import BreakdownList from './BreakdownList'
import DateRangeSelector from './DateRangeSelector'
import LeadTrendChart from './LeadTrendChart'
import StatCard from './StatCard'
import StatCardSkeleton from './StatCardSkeleton'
import { leadStatusLabels } from '../../config/leadStatus'
import * as analyticsService from '../../services/analyticsService'
import type { AnalyticsRange, DashboardAnalytics } from '../../types/analytics'
import { getApiErrorMessage } from '../../utils/apiError'

const DEFAULT_RANGE: AnalyticsRange = '30d'

function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

export default function AnalyticsOverview() {
  const [range, setRange] = useState<AnalyticsRange>(DEFAULT_RANGE)
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const loadAnalytics = async (forRange: AnalyticsRange) => {
    setLoadState('loading')
    try {
      const result = await analyticsService.fetchDashboardAnalytics(forRange)
      setAnalytics(result)
      setLoadState('ready')
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Unable to load dashboard analytics.'))
      setLoadState('error')
    }
  }

  useEffect(() => {
    loadAnalytics(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-gray-900">Analytics</h3>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {loadState === 'error' && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
          <p className="text-sm text-red-700">Unable to load dashboard analytics.</p>
          <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={() => loadAnalytics(range)}
            className="mt-3 text-sm font-medium text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {loadState === 'loading' && (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      )}

      {loadState === 'ready' && analytics && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard title="Total Leads" value={analytics.summary.totalLeads} icon={Users} />
            <StatCard title="New Leads" value={analytics.summary.newLeads} icon={UserPlus} />
            <StatCard
              title="Converted"
              value={analytics.summary.convertedLeads}
              supportingLabel={`${formatPercent(analytics.summary.conversionRate)} conversion rate`}
              icon={CheckCircle2}
            />
            <StatCard
              title="Pending Follow-Ups"
              value={analytics.followUps.pending}
              supportingLabel={
                analytics.followUps.overdue > 0 ? `${analytics.followUps.overdue} overdue` : undefined
              }
              icon={Clock}
            />
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <h4 className="text-sm font-medium text-gray-900">Lead Trend</h4>
            </div>
            <div className="mt-4">
              <LeadTrendChart points={analytics.leadTrend} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-medium text-gray-900">Lead Status</h4>
              <div className="mt-4">
                <BreakdownList
                  items={analytics.leadsByStatus.map((s) => ({
                    key: s.status,
                    label: leadStatusLabels[s.status],
                    count: s.count,
                  }))}
                  emptyLabel="No leads in this period yet."
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-medium text-gray-900">Lead Sources</h4>
              <div className="mt-4">
                <BreakdownList
                  items={analytics.leadsBySource.map((s) => ({ key: s.source, label: s.label, count: s.count }))}
                  emptyLabel="No leads in this period yet."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <h4 className="text-sm font-medium text-gray-900">Follow-Ups</h4>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{analytics.followUps.pending}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Overdue</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{analytics.followUps.overdue}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{analytics.followUps.completed}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{analytics.followUps.cancelled}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
