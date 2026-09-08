import { Bell, Calendar, Settings } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AuthenticatedLayout from './components/dashboard/AuthenticatedLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import { AuthProvider } from './context/AuthContext'
import DashboardPage from './pages/DashboardPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import EditLeadPage from './pages/leads/EditLeadPage'
import LeadDetailsPage from './pages/leads/LeadDetailsPage'
import LeadsListPage from './pages/leads/LeadsListPage'
import NewLeadPage from './pages/leads/NewLeadPage'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'
import PublicLeadCapturePage from './pages/public/PublicLeadCapturePage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Phase 2 established the dashboard shell (layout, navigation, placeholders).
// Phase 3 added real Lead Management under /leads.
// Phase 4 adds the public, unauthenticated lead-capture page at /lead/:businessSlug.
// Follow-ups and notifications are built in later phases.
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
          <Route path="/lead/:businessSlug" element={<PublicLeadCapturePage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsListPage />} />
              <Route path="/leads/new" element={<NewLeadPage />} />
              <Route path="/leads/:id" element={<LeadDetailsPage />} />
              <Route path="/leads/:id/edit" element={<EditLeadPage />} />
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
