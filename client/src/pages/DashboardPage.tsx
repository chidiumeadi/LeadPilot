import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

// Phase 1: a minimal shell that proves authenticated routing works.
// Dashboard statistics and lead management belong to later phases.
export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-gray-900">LeadPilot</span>
        <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-gray-900">
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
        <p className="mt-2 text-gray-500">{user?.business.name}</p>
      </main>
    </div>
  )
}
