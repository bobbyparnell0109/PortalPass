import { NavLink, Outlet } from 'react-router-dom'
import { Home, CalendarDays, LayoutGrid, MessageCircle, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { NotificationDot } from '@/components/ui'

const tabs = [
  { to: '/app', icon: Home, label: 'Home', end: true },
  { to: '/app/timetable', icon: CalendarDays, label: 'Timetable' },
  { to: '/app/hub', icon: LayoutGrid, label: 'Hub' },
  { to: '/app/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/app/account', icon: UserCircle, label: 'Me' },
]

export default function StudentLayout() {
  const { unreadMessages } = useApp()
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <span className="relative">
                <t.icon className="h-6 w-6" />
                {t.label === 'Messages' && <NotificationDot count={unreadMessages} />}
              </span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
