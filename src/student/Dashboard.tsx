import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Flame,
  MapPin,
  MessageCircle,
  TrendingUp,
  Utensils,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { cn, formatCurrency, greeting } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { fetchEvents, fetchMyLessons, fetchMyStudent, useQuery } from '@/lib/api'
import { currentStudent, events as mockEvents, timetable as mockTimetable } from '@/lib/mockData'

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export default function Dashboard() {
  const now = useNow()
  const { homework, unreadMessages } = useApp()
  const { data: me } = useQuery(fetchMyStudent, currentStudent)
  const { data: timetable } = useQuery(fetchMyLessons, mockTimetable)
  const { data: events } = useQuery(fetchEvents, mockEvents)
  const g = greeting(now)

  // Mon=0 … Fri=4; weekend shows Monday's lessons as "next week"
  const jsDay = now.getDay()
  const weekday = jsDay === 0 || jsDay === 6 ? 0 : jsDay - 1
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const nextLesson = useMemo(() => {
    const today = timetable
      .filter((l) => l.day === weekday && minutesOfDay(l.end) > nowMins)
      .sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))
    return today[0] ?? null
  }, [timetable, weekday, nowMins])

  const inProgress = nextLesson && minutesOfDay(nextLesson.start) <= nowMins
  const minsUntil = nextLesson ? minutesOfDay(nextLesson.start) - nowMins : 0

  const dueToday = homework.filter(
    (h) => h.status !== 'completed' && h.dueDate === now.toISOString().slice(0, 10),
  ).length
  const pendingHomework = homework.filter((h) => h.status !== 'completed').length

  const balance = me.lunchBalance
  const balanceVariant = balance < 2 ? 'red' : balance < 5 ? 'amber' : 'green'

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Greeting */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {g.text} {g.emoji}
          </p>
          <h1 className="text-2xl font-black tracking-tight">
            {me.firstName}
          </h1>
        </div>
        <Link
          to="/app/account"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-2xl transition-transform hover:scale-105"
        >
          {me.avatarEmoji}
        </Link>
      </header>

      {/* Streak */}
      <Card className="flex items-center gap-3 border-0 bg-gradient-to-r from-orange-500 to-amber-400 p-4 text-white shadow-lg shadow-orange-500/20">
        <Flame className="h-8 w-8" />
        <div className="flex-1">
          <p className="font-bold">{me.streakDays}-day streak!</p>
          <p className="text-sm text-white/80">Perfect attendance this week 🎉</p>
        </div>
      </Card>

      {/* Next lesson hero card */}
      <section>
        <SectionTitle title={inProgress ? 'Happening now' : 'Up next'} to="/app/timetable" />
        {nextLesson ? (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div
              className="p-5 text-white"
              style={{
                background: `linear-gradient(135deg, hsl(${nextLesson.color}), hsl(${nextLesson.color} / 0.75))`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-black">{nextLesson.subject}</p>
                  <p className="text-white/85">{nextLesson.teacher}</p>
                </div>
                <Badge className="bg-white/20 text-white">
                  {inProgress ? 'In progress' : minsUntil <= 5 ? `${minsUntil} min — go now!` : `in ${minsUntil} min`}
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {nextLesson.room} · {nextLesson.building}
                </span>
                <span>
                  {nextLesson.start}–{nextLesson.end}
                </span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 text-center">
            <p className="text-lg font-bold">School's done for today 🎉</p>
            <p className="text-sm text-muted-foreground">Enjoy your evening!</p>
          </Card>
        )}
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          to="/app/homework"
          icon={<BookOpen className="h-5 w-5" />}
          label="Homework"
          value={dueToday > 0 ? `${dueToday} due today` : `${pendingHomework} pending`}
          tone={dueToday > 0 ? 'amber' : 'accent'}
        />
        <StatCard
          to="/app/messages"
          icon={<MessageCircle className="h-5 w-5" />}
          label="Messages"
          value={unreadMessages > 0 ? `${unreadMessages} unread` : 'All read'}
          tone={unreadMessages > 0 ? 'red' : 'accent'}
        />
        <StatCard
          to="/app/lunch"
          icon={<Utensils className="h-5 w-5" />}
          label="Lunch balance"
          value={formatCurrency(balance)}
          tone={balanceVariant === 'green' ? 'accent' : balanceVariant}
        />
        <StatCard
          to="/app/attendance"
          icon={<TrendingUp className="h-5 w-5" />}
          label="Attendance"
          value={`${me.attendancePct}%`}
          tone="accent"
        />
      </div>

      {/* Upcoming events carousel */}
      <section>
        <SectionTitle title="Coming up" to="/app/announcements" />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {events.map((e) => (
            <Card key={e.id} className="min-w-[180px] shrink-0 p-4">
              <Badge
                variant={
                  e.category === 'exam' ? 'red' : e.category === 'holiday' ? 'green' : 'blue'
                }
              >
                {e.category}
              </Badge>
              <p className="mt-2 text-sm font-bold leading-snug">{e.title}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(e.date).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/app/grades">
          <Button variant="soft" className="w-full">
            Check grades <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/app/timetable">
          <Button variant="soft" className="w-full">
            Full timetable <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function SectionTitle({ title, to }: { title: string; to: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="font-bold">{title}</h2>
      <Link to={to} className="text-sm font-semibold text-accent">
        See all
      </Link>
    </div>
  )
}

function StatCard({
  to,
  icon,
  label,
  value,
  tone,
}: {
  to: string
  icon: React.ReactNode
  label: string
  value: string
  tone: 'accent' | 'amber' | 'red'
}) {
  return (
    <Link to={to}>
      <Card className="p-4 transition-transform hover:scale-[1.02] active:scale-[0.98]">
        <div
          className={cn(
            'mb-2 flex h-9 w-9 items-center justify-center rounded-xl',
            tone === 'accent' && 'bg-accent-soft text-accent',
            tone === 'amber' && 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
            tone === 'red' && 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
          )}
        >
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-bold">{value}</p>
      </Card>
    </Link>
  )
}
