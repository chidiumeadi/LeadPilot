import type { LucideIcon } from 'lucide-react'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: EmptyStateAction
  comingSoon?: boolean
}

export default function EmptyState({ title, description, icon: Icon, action, comingSoon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {comingSoon && (
        <span className="mt-3 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          Coming soon
        </span>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
