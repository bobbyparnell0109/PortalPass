import { Link } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  FileText,
  Megaphone,
  ShieldAlert,
  Trophy,
  UserRoundCheck,
  Utensils,
} from 'lucide-react'
import { Card, NotificationDot } from '@/components/ui'
import { useApp } from '@/lib/store'
import { achievements } from '@/lib/mockData'

// The Hub replaces StudentApp's grey module grid: colourful tiles, live
// badges, and achievements — a launcher with personality.

export default function Hub() {
  const { homework } = useApp()
  const pendingHw = homework.filter((h) => h.status !== 'completed').length
  const overdueHw = homework.filter((h) => h.status === 'overdue').length

  const modules = [
    { to: '/app/attendance', icon: UserRoundCheck, label: 'Attendance', gradient: 'from-emerald-500 to-teal-400', badge: 0 },
    { to: '/app/homework', icon: BookOpen, label: 'Homework', gradient: 'from-amber-500 to-orange-400', badge: pendingHw },
    { to: '/app/grades', icon: BarChart3, label: 'Reports', gradient: 'from-violet-500 to-purple-400', badge: 0 },
    { to: '/app/announcements', icon: Megaphone, label: 'News', gradient: 'from-sky-500 to-cyan-400', badge: 2 },
    { to: '/app/lunch', icon: Utensils, label: 'Lunch', gradient: 'from-pink-500 to-rose-400', badge: 0 },
    { to: '/app/timetable', icon: CalendarDays, label: 'Timetable', gradient: 'from-blue-500 to-indigo-400', badge: 0 },
    { to: '/app/announcements', icon: CalendarClock, label: 'Exams', gradient: 'from-red-500 to-rose-500', badge: 1 },
    { to: '/app/announcements', icon: Trophy, label: 'Clubs', gradient: 'from-lime-500 to-green-400', badge: 0 },
    { to: '/app/announcements', icon: ShieldAlert, label: 'Behaviour', gradient: 'from-slate-500 to-slate-400', badge: 0 },
    { to: '/app/announcements', icon: FileText, label: 'Documents', gradient: 'from-fuchsia-500 to-pink-400', badge: 0 },
  ]

  const earned = achievements.filter((a) => a.earned)

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="pt-2">
        <h1 className="text-2xl font-black tracking-tight">Hub</h1>
        <p className="text-sm text-muted-foreground">
          Everything in one place{overdueHw > 0 && ` — ${overdueHw} overdue homework needs you!`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {modules.map((m, i) => (
          <Link key={m.label} to={m.to}>
            <Card
              className="animate-pop-in p-4 transition-transform hover:scale-[1.03] active:scale-[0.97]"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div className="relative mb-3 inline-block">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${m.gradient} text-white shadow-lg`}
                >
                  <m.icon className="h-6 w-6" />
                </div>
                <NotificationDot count={m.badge} />
              </div>
              <p className="font-bold">{m.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-2 font-bold">Achievements</h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {achievements.map((a) => (
            <Card
              key={a.id}
              className={`min-w-[150px] shrink-0 p-4 text-center ${a.earned ? '' : 'opacity-45 grayscale'}`}
            >
              <p className="text-3xl">{a.emoji}</p>
              <p className="mt-1 text-sm font-bold leading-tight">{a.title}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{a.description}</p>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {earned.length} of {achievements.length} unlocked
        </p>
      </section>
    </div>
  )
}
