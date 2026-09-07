import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import LoadingScreen from './LoadingScreen'

// UX-level route protection only. The real authorization boundary is the
// backend's `authenticate` middleware — this just avoids flashing
// authenticated screens at signed-out visitors.
export default function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
