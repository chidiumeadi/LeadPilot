import { Bell, Calendar, LayoutDashboard, Settings, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

// Main product areas. Only Dashboard is a real page in Phase 2 — the rest
// are placeholders until their respective phases land.
export const primaryNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Follow-ups', path: '/follow-ups', icon: Calendar },
  { label: 'Notifications', path: '/notifications', icon: Bell },
]

export const secondaryNavItems: NavItem[] = [{ label: 'Settings', path: '/settings', icon: Settings }]

export const allNavItems: NavItem[] = [...primaryNavItems, ...secondaryNavItems]
