import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthPage } from '@/pages/AuthPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { VerifyPage } from '@/pages/admin/VerifyPage'
import { BridgePage } from '@/pages/admin/BridgePage'
import { BridgeManagementPage } from '@/pages/admin/BridgeManagementPage'
import { AdminRequestsPage, PatientRequestsPage } from '@/pages/admin/RequestsPage'
import { DonorDashboard } from '@/pages/donor/DonorDashboard'
import { DonorProfilePage } from '@/pages/donor/DonorProfilePage'
import { EligibilityPage } from '@/pages/donor/EligibilityPage'
import { SchedulePage } from '@/pages/donor/SchedulePage'
import { PatientDashboard } from '@/pages/patient/PatientDashboard'
import { PatientProfilePage } from '@/pages/patient/PatientProfilePage'
import { PatientPlanPage } from '@/pages/patient/PatientPlanPage'
import { BridgeInfoPage } from '@/pages/patient/BridgeInfoPage'
import { AppointmentsPage } from '@/pages/hospital/AppointmentsPage'
import { ChatbotPage } from '@/pages/ChatbotPage'
import { getDefaultRoute } from '@/lib/auth'
import type { UserRole } from '@/types'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { auth, role } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  if (roles && role && !roles.includes(role)) return <Navigate to={getDefaultRoute(role)} replace />
  return <>{children}</>
}

function DashboardRouter() {
  const { role } = useAuth()
  switch (role) {
    case 'admin': return <AdminDashboard />
    case 'donor': return <DonorDashboard />
    case 'patient': return <PatientDashboard />
    default: return <Navigate to="/appointments" replace />
  }
}

function RequestsRouter() {
  const { role } = useAuth()
  if (role === 'admin') return <AdminRequestsPage />
  if (role === 'patient') return <PatientRequestsPage />
  return <Navigate to="/dashboard" replace />
}

function ProfileRouter() {
  const { role } = useAuth()
  if (role === 'donor') return <DonorProfilePage />
  if (role === 'patient') return <PatientProfilePage />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  const { auth } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={auth ? <Navigate to={getDefaultRoute(auth.role)} replace /> : <AuthPage mode="login" />} />
      <Route path="/register" element={auth ? <Navigate to={getDefaultRoute(auth.role)} replace /> : <AuthPage mode="register" />} />

      <Route element={auth ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/verify" element={<ProtectedRoute roles={['admin']}><VerifyPage /></ProtectedRoute>} />
        <Route path="/bridges" element={<ProtectedRoute roles={['admin']}><BridgePage /></ProtectedRoute>} />
        <Route path="/bridge-management" element={<ProtectedRoute roles={['admin']}><BridgeManagementPage /></ProtectedRoute>} />
        <Route path="/requests" element={<RequestsRouter />} />
        <Route path="/profile" element={<ProfileRouter />} />
        <Route path="/plan" element={<ProtectedRoute roles={['patient']}><PatientPlanPage /></ProtectedRoute>} />
        <Route path="/eligibility" element={<ProtectedRoute roles={['donor']}><EligibilityPage /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute roles={['donor']}><SchedulePage /></ProtectedRoute>} />
        <Route path="/bridge" element={<ProtectedRoute roles={['patient']}><BridgeInfoPage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute roles={['hospital_coordinator', 'admin']}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/chatbot" element={<ChatbotPage />} />
      </Route>

      <Route path="*" element={<Navigate to={auth ? getDefaultRoute(auth.role) : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
