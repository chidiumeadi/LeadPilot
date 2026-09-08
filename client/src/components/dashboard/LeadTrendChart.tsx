import EmptyState from './EmptyState'
import type { LeadTrendPoint } from '../../types/analytics'

interface LeadTrendChartProps {
  points: LeadTrendPoint[]
}

// A bucket key is either 'YYYY-MM-DD' (day/week start) or 'YYYY-MM' (month).
// Parsed and formatted as UTC so the label always matches the date the
// backend actually bucketed by, regardless of the viewer's own timezone.
function formatBucketLabel(key: string): string {
  if (key.length === 7) {
    const [year, month] = key.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// A compact form of the same date, for the narrow x-axis tick labels —
// "Aug 10" truncates unreadably once there are 20+ daily buckets, but
// "8/10" always fits.
function formatAxisTick(key: string): string {
  if (key.length === 7) {
    const [year, month] = key.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
      month: 'short',
      timeZone: 'UTC',
    })
  }
  const [, month, day] = key.split('-').map(Number)
  return `${month}/${day}`
}

export default function LeadTrendChart({ points }: LeadTrendChartProps) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No lead activity yet."
        description="Leads will appear here once customers start submitting inquiries."
      />
    )
  }

  const max = Math.max(1, ...points.map((p) => p.count))
  // Cap the number of visible x-axis labels so they never crowd together,
  // regardless of how many buckets the range produced (e.g. 30 daily bars).
  const labelEvery = Math.max(1, Math.ceil(points.length / 8))

  return (
    <div>
      <div className="flex h-40 gap-1 border-b border-gray-200">
        {points.map((point) => (
          <div
            key={point.date}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${formatBucketLabel(point.date)}: ${point.count} lead${point.count === 1 ? '' : 's'}`}
          >
            <div
              className="mx-auto w-full rounded-t bg-gray-900 transition-colors group-hover:bg-gray-700"
              style={{ height: point.count > 0 ? `${(point.count / max) * 100}%` : '2px' }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {points.map((point, i) => (
          <div key={point.date} className="flex-1 text-center text-[10px] whitespace-nowrap text-gray-400">
            {i % labelEvery === 0 ? formatAxisTick(point.date) : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
