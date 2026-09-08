import { Bell, Calendar, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/dashboard/EmptyState'
import { useAuth } from '../context/AuthContext'
import * as followUpService from '../services/followUpService'
import type { FollowUp } from '../types/followUp'
import { followUpTypeLabels } from '../config/followUp'

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

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// Small glance widget only — a handful of soonest-due items, fetched with
// server-side filtering (when=upcoming). This is not the Phase 7 analytics
// dashboard: no charts, no counts beyond what's rendered, no client-side
// filtering of a large dataset.
function UpcomingFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    followUpService
      .fetchFollowUps({ when: 'upcoming', limit: 5 })
      .then((result) => {
        if (cancelled) return
        setFollowUps(result.items)
        setLoadState('ready')
      })
      .catch(() => {
        if (cancelled) return
        setLoadState('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loadState === 'loading') {
    return <p className="py-6 text-center text-sm text-gray-400">Loading…</p>
  }

  if (loadState === 'error') {
    return <p className="py-6 text-center text-sm text-red-600">Could not load upcoming follow-ups.</p>
  }

  if (followUps.length === 0) {
    return (
      <EmptyState
        title="No upcoming follow-ups"
        description="Follow-ups you schedule from a lead's page will show up here."
      />
    )
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {followUps.map((followUp) => (
        <li key={followUp.id}>
          <Link to={`/leads/${followUp.leadId}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {followUpTypeLabels[followUp.type]} — {followUp.lead.name}
              </p>
              <p className="text-xs text-gray-500">{formatScheduled(followUp.scheduledAt)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// Phase 2 established the shell; Phase 5 adds a small upcoming-follow-ups
// glance section. Real dashboard statistics/analytics are a later phase.
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
        <h3 className="text-sm font-medium text-gray-900">Upcoming follow-ups</h3>
        <div className="mt-3">
          <UpcomingFollowUps />
        </div>
      </div>
    </div>
  )
}
