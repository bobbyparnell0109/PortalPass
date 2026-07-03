import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BookMarked,
  CalendarRange,
  Contact,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Sparkles,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/staff', icon: Contact, label: 'Staff' },
  { to: '/admin/attendance', icon: UserRoundCheck, label: 'Attendance' },
  { to: '/admin/timetable', icon: CalendarRange, label: 'Timetable' },
  { to: '/admin/subjects-rooms', icon: BookMarked, label: 'Subjects & rooms' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/settings', icon: Settings, label: 'School settings' },
]

export default function AdminLayout() {
  const { logout, session } = useApp()
  const navigate = useNavigate()
  // Sidebar is a drawer below lg; always visible from lg up
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 font-black">
          <Sparkles className="h-5 w-5 text-emerald-500" /> PortalPass
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            ADMIN
          </span>
        </span>
      </header>

      {/* Backdrop for the mobile drawer */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-slate-950 text-slate-300 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5 font-black text-white">
          <Sparkles className="h-5 w-5 text-emerald-400" /> PortalPass
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            ADMIN
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
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

      <main className="min-w-0 flex-1 p-4 pt-20 lg:ml-60 lg:p-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
