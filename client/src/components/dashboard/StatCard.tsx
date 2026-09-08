import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  supportingLabel?: string
  icon?: LucideIcon
}

export default function StatCard({ title, value, supportingLabel, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      {supportingLabel && <p className="mt-1 text-xs text-gray-500">{supportingLabel}</p>}
    </div>
  )
}
