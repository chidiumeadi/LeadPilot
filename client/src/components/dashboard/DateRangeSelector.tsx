import { ANALYTICS_RANGES, analyticsRangeLabels } from '../../config/analyticsRange'
import type { AnalyticsRange } from '../../types/analytics'

interface DateRangeSelectorProps {
  value: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
}

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="inline-flex flex-wrap gap-1 rounded-md border border-gray-200 bg-white p-1"
    >
      {ANALYTICS_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          aria-pressed={value === range}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            value === range ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {analyticsRangeLabels[range]}
        </button>
      ))}
    </div>
  )
}
