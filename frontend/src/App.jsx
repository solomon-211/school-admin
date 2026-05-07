import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute        from './components/ProtectedRoute'
import LoginPage             from './pages/LoginPage'
import ForgotPasswordPage    from './pages/ForgotPasswordPage'
import ResetPasswordPage     from './pages/ResetPasswordPage'
import DashboardPage         from './pages/DashboardPage'
import DevicesPage           from './pages/DevicesPage'
import StudentsPage          from './pages/StudentsPage'
import ClassesPage           from './pages/ClassesPage'
import TeachersPage          from './pages/TeachersPage'
import FeesPage              from './pages/FeesPage'
import TermsPage             from './pages/TermsPage'
import FeeSchedulesPage      from './pages/FeeSchedulesPage'
import LinkingRequestsPage   from './pages/LinkingRequestsPage'
import BulkAttendancePage    from './pages/BulkAttendancePage'
import PromotePage           from './pages/PromotePage'

export default function App() {
  return (
    <Routes>
      {/* Public routes — no authentication required */}
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Shared routes — accessible to admins and teachers */}
      <Route path="/dashboard"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/students"        element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/classes"         element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
      <Route path="/bulk-attendance" element={<ProtectedRoute><BulkAttendancePage /></ProtectedRoute>} />

      {/* Admin-only routes */}
      <Route path="/devices"         element={<ProtectedRoute roles={['admin']}><DevicesPage /></ProtectedRoute>} />
      <Route path="/teachers"        element={<ProtectedRoute roles={['admin']}><TeachersPage /></ProtectedRoute>} />
      <Route path="/fees"            element={<ProtectedRoute roles={['admin']}><FeesPage /></ProtectedRoute>} />
      <Route path="/fee-schedules"   element={<ProtectedRoute roles={['admin']}><FeeSchedulesPage /></ProtectedRoute>} />
      <Route path="/terms"           element={<ProtectedRoute roles={['admin']}><TermsPage /></ProtectedRoute>} />
      <Route path="/linking"         element={<ProtectedRoute roles={['admin']}><LinkingRequestsPage /></ProtectedRoute>} />
      <Route path="/promote"         element={<ProtectedRoute roles={['admin']}><PromotePage /></ProtectedRoute>} />

      {/* Fallback — redirect unknown paths to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
