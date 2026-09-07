import { Bell, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  title: string
  onOpenMobileNav: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export default function Header({ title, onOpenMobileNav }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <h1 className="flex-1 truncate text-base font-semibold text-gray-900">{title}</h1>

      <button
        type="button"
        disabled
        aria-label="Notifications (coming soon)"
        className="rounded-md p-2 text-gray-400 disabled:cursor-not-allowed"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
      </button>

      {user && (
        <div className="hidden items-center gap-2 sm:flex">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white"
            aria-hidden="true"
          >
            {getInitials(user.name)}
          </div>
          <div className="max-w-[10rem] leading-tight">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.business.name}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:px-3"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </header>
  )
}
