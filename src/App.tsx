import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from '@/lib/store'
import type { Role } from '@/lib/types'
import Landing from '@/pages/Landing'
import PinLogin from '@/student/PinLogin'
import StudentLayout from '@/student/StudentLayout'
import Dashboard from '@/student/Dashboard'

// Route-level code splitting keeps the initial bundle lean — recharts and
// the admin/parent areas only load when visited.
const Timetable = lazy(() => import('@/student/Timetable'))
const Homework = lazy(() => import('@/student/Homework'))
const Grades = lazy(() => import('@/student/Grades'))
const Attendance = lazy(() => import('@/student/Attendance'))
const Hub = lazy(() => import('@/student/Hub'))
const Messages = lazy(() => import('@/student/Messages'))
const Announcements = lazy(() => import('@/student/Announcements'))
const LunchAccount = lazy(() => import('@/student/LunchAccount'))
const Account = lazy(() => import('@/student/Account'))
const ParentLogin = lazy(() => import('@/parent/ParentLogin'))
const ParentLayout = lazy(() => import('@/parent/ParentLayout'))
const ParentDashboard = lazy(() => import('@/parent/ParentDashboard'))
const TopUp = lazy(() => import('@/parent/TopUp'))
const AdminLogin = lazy(() => import('@/admin/AdminLogin'))
const AdminLayout = lazy(() => import('@/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('@/admin/AdminDashboard'))
const Students = lazy(() => import('@/admin/Students'))
const AttendanceMarking = lazy(() => import('@/admin/AttendanceMarking'))
const AdminAnnouncements = lazy(() => import('@/admin/AdminAnnouncements'))
const TimetableBuilder = lazy(() => import('@/admin/TimetableBuilder'))
const Staff = lazy(() => import('@/admin/Staff'))
const SchoolSettings = lazy(() => import('@/admin/SchoolSettings'))

function RouteFallback() {
  return (
    <div className="space-y-4 p-6">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-32 w-full" />
      <div className="skeleton h-32 w-full" />
    </div>
  )
}

function RequireRole({ role, loginPath, children }: { role: Role; loginPath: string; children: JSX.Element }) {
  const { session } = useApp()
  const location = useLocation()
  if (!session || session.role !== role) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }
  return children
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Student app */}
          <Route path="/login" element={<PinLogin />} />
          <Route
            path="/app"
            element={
              <RequireRole role="student" loginPath="/login">
                <StudentLayout />
              </RequireRole>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="homework" element={<Homework />} />
            <Route path="grades" element={<Grades />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="hub" element={<Hub />} />
            <Route path="messages" element={<Messages />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="lunch" element={<LunchAccount />} />
            <Route path="account" element={<Account />} />
          </Route>

          {/* Parent portal */}
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route
            path="/parent"
            element={
              <RequireRole role="parent" loginPath="/parent/login">
                <ParentLayout />
              </RequireRole>
            }
          >
            <Route index element={<ParentDashboard />} />
            <Route path="topup" element={<TopUp />} />
          </Route>

          {/* Admin system */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin" loginPath="/admin/login">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="attendance" element={<AttendanceMarking />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="timetable" element={<TimetableBuilder />} />
            <Route path="staff" element={<Staff />} />
            <Route path="settings" element={<SchoolSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  )
}
