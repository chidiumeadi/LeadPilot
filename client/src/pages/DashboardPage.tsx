import { Bell, Calendar, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/dashboard/EmptyState'
import { useAuth } from '../context/AuthContext'

const quickLinks = [
  {
    label: 'Leads',
    path: '/leads',
    icon: Users,
    description: 'Capture and manage leads from every channel in one place.',
  },
  {
    label: 'Follow-ups',
    path: '/follow-ups',
    icon: Calendar,
    description: 'Stay on top of every follow-up so no lead gets forgotten.',
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    description: 'Get notified the moment something needs your attention.',
  },
]

// Phase 2: dashboard shell only. Real lead/follow-up data and statistics
// are wired up in later phases.
export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Welcome, {user?.name}</h2>
      <p className="mt-1 text-sm text-gray-500">{user?.business.name}</p>
      <p className="mt-4 max-w-2xl text-sm text-gray-500">
        LeadPilot will help {user?.business.name} capture, organize, and follow up on leads from every
        channel so no potential customer gets forgotten. The sections below will come to life over the
        next phases.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <item.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">{item.label}</h3>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <EmptyState
          title="No activity yet"
          description="Once you start capturing leads, recent activity will show up here."
        />
      </div>
    </div>
  )
}
