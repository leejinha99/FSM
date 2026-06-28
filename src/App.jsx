import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import Login from './pages/Login.jsx'
import TechCalendar from './pages/TechCalendar.jsx'
import TechStock from './pages/TechStock.jsx'
import TechAS from './pages/TechAS.jsx'
import VisitRegister from './pages/VisitRegister.jsx'
import VisitEdit from './pages/VisitEdit.jsx'
import TechLayout from './pages/TechLayout.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminSchools from './pages/admin/AdminSchools.jsx'
import AdminTechs from './pages/admin/AdminTechs.jsx'
import AdminVisits from './pages/admin/AdminVisits.jsx'
import AdminAS from './pages/admin/AdminAS.jsx'
import AdminTechSchedule from './pages/admin/AdminTechSchedule.jsx'
import AdminStock from './pages/admin/AdminStock.jsx'

function RequireAuth({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole && user.role !== '관리자') {
    return <Navigate to="/" replace />
  }
  return children
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === '관리자') return <Navigate to="/admin" replace />
  return <Navigate to="/calendar" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* 기사 화면 - TechLayout으로 감싸기 */}
            <Route element={<RequireAuth><TechLayout /></RequireAuth>}>
              <Route path="/calendar" element={<TechCalendar />} />
              <Route path="/stock" element={<TechStock />} />
              <Route path="/as" element={<TechAS />} />
            </Route>
            <Route path="/visit/new" element={<RequireAuth><VisitRegister /></RequireAuth>} />
            <Route path="/visit/edit/:visitId" element={<RequireAuth><VisitEdit /></RequireAuth>} />

            {/* 관리자 화면 */}
            <Route
              path="/admin"
              element={<RequireAuth requiredRole="관리자"><AdminLayout /></RequireAuth>}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="schools" element={<AdminSchools />} />
              <Route path="techs" element={<AdminTechs />} />
              <Route path="visits" element={<AdminVisits />} />
              <Route path="as" element={<AdminAS />} />
              <Route path="tech-schedule" element={<AdminTechSchedule />} />
              <Route path="stock" element={<AdminStock />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  )
}
