import type { Prisma } from '@prisma/client'

import { prisma } from '../config/prisma'
import type { AnalyticsRange } from '../validators/analyticsValidators'
import { COMMUNICATION_TYPES } from '../validators/communicationValidators'

// --- Date semantics (Phase 7) -----------------------------------------
//
// Lead acquisition ("New Leads", status/source breakdowns, the trend) is
// always measured by Lead.createdAt — never updatedAt, since editing a
// lead must not make it look newly acquired.
//
// "Converted Leads" uses a cohort interpretation: of the leads CREATED in
// the selected range, how many currently have status = CONVERTED. The
// Lead model only stores current status, not a history of transitions, so
// this is the most honest metric the data model can support (see AGENTS/
// Phase 7 spec §9) — it is not "conversions that happened during this
// period", since we don't know when a lead's status last changed.
//
// Follow-up "pending"/"overdue"/"cancelled" are current, real-time queue
// states and are NOT scoped by the selected date range — an overdue
// follow-up from last month is still overdue today regardless of which
// range the owner is viewing. "Completed" is the one follow-up metric that
// respects the selected range, scoped by completedAt (the model does
// record when a follow-up was completed); there is no cancelledAt, so
// cancelled stays an all-time count.
//
// All boundaries/bucketing are computed in UTC from database timestamps,
// never the browser's timezone, to avoid silently mixing the two (Phase 7
// spec §20). The frontend renders the returned date-bucket labels as-is.

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  PUBLIC_FORM: 'Public Form',
}

function formatSourceLabel(source: string): string {
  return (
    SOURCE_LABELS[source] ??
    source
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((word) => word[0]!.toUpperCase() + word.slice(1))
      .join(' ')
  )
}

type Bucket = 'day' | 'week' | 'month'

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

// Monday-start ISO week, in UTC.
function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date)
  const dow = day.getUTCDay() // 0 = Sunday .. 6 = Saturday
  const diffToMonday = (dow + 6) % 7
  day.setUTCDate(day.getUTCDate() - diffToMonday)
  return day
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function truncateToBucket(date: Date, bucket: Bucket): Date {
  if (bucket === 'day') return startOfUtcDay(date)
  if (bucket === 'week') return startOfUtcWeek(date)
  return startOfUtcMonth(date)
}

function stepBucket(date: Date, bucket: Bucket): Date {
  const next = new Date(date)
  if (bucket === 'day') next.setUTCDate(next.getUTCDate() + 1)
  else if (bucket === 'week') next.setUTCDate(next.getUTCDate() + 7)
  else next.setUTCMonth(next.getUTCMonth() + 1)
  return next
}

function bucketLabel(date: Date, bucket: Bucket): string {
  const iso = date.toISOString()
  return bucket === 'month' ? iso.slice(0, 7) : iso.slice(0, 10)
}

// Resolves the [start, bucket] pair for a range. `null` start means "all
// time" — the caller falls back to the business's own createdAt so the
// zero-filled trend still has a sensible first bucket.
function resolveRange(range: AnalyticsRange, now: Date): { start: Date | null; bucket: Bucket } {
  const today = startOfUtcDay(now)

  switch (range) {
    case '7d': {
      const start = new Date(today)
      start.setUTCDate(start.getUTCDate() - 6)
      return { start, bucket: 'day' }
    }
    case '30d': {
      const start = new Date(today)
      start.setUTCDate(start.getUTCDate() - 29)
      return { start, bucket: 'day' }
    }
    case '90d': {
      const start = new Date(today)
      start.setUTCDate(start.getUTCDate() - 89)
      return { start: startOfUtcWeek(start), bucket: 'week' }
    }
    case 'all':
      return { start: null, bucket: 'month' }
  }
}

// A cap purely defensive against a pathological date range — normal usage
// never approaches it (90d weekly is ~13 points, "all" monthly is bounded
// by the business's real age).
const MAX_TREND_POINTS = 400

function buildTrend(rows: { createdAt: Date }[], bucket: Bucket, start: Date, end: Date) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = bucketLabel(truncateToBucket(row.createdAt, bucket), bucket)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const points: { date: string; count: number }[] = []
  let cursor = truncateToBucket(start, bucket)
  const endBucket = truncateToBucket(end, bucket)
  let guard = 0

  while (cursor.getTime() <= endBucket.getTime() && guard < MAX_TREND_POINTS) {
    const key = bucketLabel(cursor, bucket)
    points.push({ date: key, count: counts.get(key) ?? 0 })
    cursor = stepBucket(cursor, bucket)
    guard += 1
  }

  return points
}

export async function getDashboardAnalytics(businessId: string, range: AnalyticsRange) {
  const now = new Date()
  const { start, bucket } = resolveRange(range, now)

  // Phase 8 fix (Phase 7 audit finding): always bound the upper edge at
  // `now`, not just the lower edge at `start`. Without this, a lead whose
  // createdAt is somehow in the future (only reachable via direct DB
  // access — the app itself always writes createdAt: now()) would count
  // toward newLeads/leadsByStatus/leadsBySource but fall outside the
  // trend's bucket walk (which stops at `now`), making leadTrend's total
  // silently disagree with newLeads. Bounding every range-scoped query to
  // the same [start, now] window keeps them mathematically consistent by
  // construction, for any data, not just well-formed data.
  const createdAtFilter: Prisma.DateTimeFilter = start ? { gte: start, lte: now } : { lte: now }
  const rangeWhere: Prisma.LeadWhereInput = {
    businessId,
    createdAt: createdAtFilter,
  }

  const [
    business,
    totalLeads,
    statusGroups,
    sourceGroups,
    trendRows,
    pendingFollowUps,
    overdueFollowUps,
    completedFollowUps,
    cancelledFollowUps,
    communicationGroups,
  ] = await Promise.all([
      // Only needed to anchor the "all time" trend's first bucket.
      range === 'all' ? prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { createdAt: true } }) : null,
      prisma.lead.count({ where: { businessId } }),
      prisma.lead.groupBy({ by: ['status'], where: rangeWhere, _count: { _all: true } }),
      prisma.lead.groupBy({ by: ['source'], where: rangeWhere, _count: { _all: true } }),
      prisma.lead.findMany({ where: rangeWhere, select: { createdAt: true } }),
      prisma.followUp.count({ where: { businessId, status: 'PENDING' } }),
      prisma.followUp.count({ where: { businessId, status: 'PENDING', scheduledAt: { lt: now } } }),
      prisma.followUp.count({
        where: { businessId, status: 'COMPLETED', completedAt: createdAtFilter },
      }),
      prisma.followUp.count({ where: { businessId, status: 'CANCELLED' } }),
      // Phase 9: communications share the same [start, now] scoping as
      // leads/completed follow-ups — occurredAt is always set for
      // COMMUNICATION_LOGGED rows (see communicationService.logCommunication),
      // so filtering by it here is safe.
      prisma.leadActivity.groupBy({
        by: ['communicationType'],
        where: { businessId, type: 'COMMUNICATION_LOGGED', occurredAt: createdAtFilter },
        _count: { _all: true },
      }),
    ])

  const statusCounts = new Map(statusGroups.map((g) => [g.status, g._count._all]))
  const leadsByStatus = LEAD_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 }))

  const newLeads = statusGroups.reduce((sum, g) => sum + g._count._all, 0)
  const convertedLeads = statusCounts.get('CONVERTED') ?? 0
  const conversionRate = newLeads > 0 ? convertedLeads / newLeads : 0

  const leadsBySource = sourceGroups
    .map((g) => ({ source: g.source, label: formatSourceLabel(g.source), count: g._count._all }))
    .sort((a, b) => b.count - a.count)

  // communicationType is only ever null for activity types other than
  // COMMUNICATION_LOGGED, and this query already filters to that type —
  // so every group here genuinely has one, but Prisma's generated type
  // still marks the column nullable. `?? 0` on the lookup below is what
  // actually matters for correctness (a type with zero logged this
  // period); this filter just satisfies the nullable column type.
  const communicationCounts = new Map(
    communicationGroups
      .filter((g) => g.communicationType !== null)
      .map((g) => [g.communicationType!, g._count._all]),
  )
  const communicationsByType = COMMUNICATION_TYPES.map((type) => ({ type, count: communicationCounts.get(type) ?? 0 }))
  const totalCommunications = communicationsByType.reduce((sum, c) => sum + c.count, 0)

  // For "all", anchor the trend to the earliest real data point rather than
  // assuming business.createdAt covers every lead — that assumption always
  // holds for genuinely-created leads (a lead can't predate its own
  // business), but anchoring off the actual minimum keeps the trend
  // mathematically guaranteed to sum to newLeads regardless.
  let trendStart = start
  if (!trendStart) {
    const earliestRow = trendRows.reduce<Date | null>(
      (earliest, row) => (!earliest || row.createdAt < earliest ? row.createdAt : earliest),
      null,
    )
    const anchor = business?.createdAt ?? now
    trendStart = earliestRow && earliestRow < anchor ? earliestRow : anchor
  }
  const leadTrend = buildTrend(trendRows, bucket, trendStart, now)

  return {
    range,
    summary: {
      totalLeads,
      newLeads,
      convertedLeads,
      conversionRate,
    },
    leadsByStatus,
    leadsBySource,
    leadTrend,
    followUps: {
      pending: pendingFollowUps,
      overdue: overdueFollowUps,
      completed: completedFollowUps,
      cancelled: cancelledFollowUps,
    },
    communications: {
      total: totalCommunications,
      byType: communicationsByType,
    },
  }
}
