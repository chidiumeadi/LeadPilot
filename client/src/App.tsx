import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AuthenticatedLayout from './components/dashboard/AuthenticatedLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import DashboardPage from './pages/DashboardPage'
import FollowUpsPage from './pages/FollowUpsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import EditLeadPage from './pages/leads/EditLeadPage'
import LeadDetailsPage from './pages/leads/LeadDetailsPage'
import LeadsListPage from './pages/leads/LeadsListPage'
import NewLeadPage from './pages/leads/NewLeadPage'
import LoginPage from './pages/LoginPage'
import NotificationsPage from './pages/NotificationsPage'
import PublicLeadCapturePage from './pages/public/PublicLeadCapturePage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SettingsPage from './pages/SettingsPage'

// Phase 2 established the dashboard shell (layout, navigation, placeholders).
// Phase 3 added real Lead Management under /leads.
// Phase 4 adds the public, unauthenticated lead-capture page at /lead/:businessSlug.
// Phase 5 added the Follow-Up System (embedded in LeadDetailsPage).
// Phase 6 adds real Notifications.
// Phase 10 adds real Settings (business/account profile, password, notification prefs).
// Phase 11a replaces the last placeholder with a standalone Follow-ups page.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
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
                <Route path="/follow-ups" element={<FollowUpsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
