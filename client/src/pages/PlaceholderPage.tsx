import type { LucideIcon } from 'lucide-react'

import EmptyState from '../components/dashboard/EmptyState'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

// Reusable stand-in for sections that exist in navigation but are built in
// a later phase (Leads, Follow-ups, Notifications, Settings). Deliberately
// does not resemble a finished feature.
export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="mt-6">
        <EmptyState title={title} description={description} icon={icon} comingSoon />
      </div>
    </div>
  )
}
