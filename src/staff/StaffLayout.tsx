import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, CalendarCheck, LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'

const tabs = [
  { to: '/staff', icon: CalendarCheck, label: 'Today', end: true },
  { to: '/staff/homework', icon: BookOpen, label: 'Homework' },
  { to: '/staff/grades', icon: BarChart3, label: 'Grades' },
]

export default function StaffLayout() {
  const { logout, session, school } = useApp()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-black">
            <Sparkles className="h-5 w-5 text-amber-500" /> PortalPass
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              TEACHER
            </span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session?.name} · {school.name}
            </span>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-4 pb-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                  isActive ? 'bg-accent-soft text-accent' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
