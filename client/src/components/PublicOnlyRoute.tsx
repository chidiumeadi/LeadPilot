import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

// Keeps an already-authenticated user from landing back on /login or
// /register.
export default function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
