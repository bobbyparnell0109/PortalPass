import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarRange,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Sparkles,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/attendance', icon: UserRoundCheck, label: 'Attendance' },
  { to: '/admin/timetable', icon: CalendarRange, label: 'Timetable' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
]

export default function AdminLayout() {
  const { logout, session } = useApp()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2 px-5 py-5 font-black text-white">
          <Sparkles className="h-5 w-5 text-emerald-400" /> PortalPass
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            ADMIN
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-emerald-500/15 text-emerald-400' : 'hover:bg-white/5 hover:text-white',
                )
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs text-slate-500">{session?.name}</p>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
