import { Bell, Calendar, Settings, Users } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AuthenticatedLayout from './components/dashboard/AuthenticatedLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import { AuthProvider } from './context/AuthContext'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Phase 2: authenticated dashboard shell (layout, navigation, placeholders).
// Lead management, follow-ups, and notifications are built in later phases.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/leads"
                element={
                  <PlaceholderPage
                    title="Leads"
                    description="Lead management is coming in the next phase."
                    icon={Users}
                  />
                }
              />
              <Route
                path="/follow-ups"
                element={
                  <PlaceholderPage
                    title="Follow-ups"
                    description="Follow-up automation will be available in a later phase."
                    icon={Calendar}
                  />
                }
              />
              <Route
                path="/notifications"
                element={
                  <PlaceholderPage
                    title="Notifications"
                    description="Notifications will be available in a later phase."
                    icon={Bell}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <PlaceholderPage
                    title="Settings"
                    description="Settings will be available in a later phase."
                    icon={Settings}
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
