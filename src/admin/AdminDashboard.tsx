import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  Megaphone,
  TrendingUp,
  UserRoundCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import {
  fetchAllStudents,
  fetchAnnouncements,
  fetchEvents,
  fetchStaff,
  useQuery,
} from '@/lib/api'
import {
  allStudents as mockStudents,
  announcements as mockAnnouncements,
  events as mockEvents,
  staff as mockStaff,
} from '@/lib/mockData'

export default function AdminDashboard() {
  const { data: allStudents } = useQuery(fetchAllStudents, mockStudents)
  const { data: announcements } = useQuery(fetchAnnouncements, mockAnnouncements)
  const { data: events } = useQuery(fetchEvents, mockEvents)
  const { data: staff } = useQuery(fetchStaff, mockStaff)
  const active = allStudents.filter((s) => s.status === 'active')
  const avgAttendance =
    Math.round((active.reduce((sum, s) => sum + s.attendancePct, 0) / Math.max(1, active.length)) * 10) / 10
  const lowBalances = active.filter((s) => s.lunchBalance < 5).length
  const belowThreshold = active.filter((s) => s.attendancePct < 95)

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Good morning 👋</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}Springwood High School
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/attendance">
            <Button variant="soft" size="sm">
              <UserRoundCheck className="h-4 w-4" /> Mark attendance
            </Button>
          </Link>
          <Link to="/admin/announcements">
            <Button size="sm">
              <Megaphone className="h-4 w-4" /> New announcement
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric icon={<Users className="h-5 w-5" />} label="Active students" value={String(active.length)} sub={`${allStudents.length - active.length} archived`} />
        <Metric icon={<TrendingUp className="h-5 w-5" />} label="Attendance today" value={`${avgAttendance}%`} sub={`${belowThreshold.length} below 95% target`} />
        <Metric icon={<Wallet className="h-5 w-5" />} label="Low lunch balances" value={String(lowBalances)} sub="below £5 threshold" />
        <Metric icon={<Megaphone className="h-5 w-5" />} label="Live announcements" value={String(announcements.length)} sub={`${announcements.filter((a) => a.pinned).length} pinned`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="mb-3 font-bold">Attendance watchlist</h2>
          {belowThreshold.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everyone is above the 95% target 🎉</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Form</th>
                  <th className="pb-2">Attendance</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {belowThreshold.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-semibold">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{s.form}</td>
                    <td className="py-2.5">
                      <Badge variant={s.attendancePct < 90 ? 'red' : 'amber'}>{s.attendancePct}%</Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <Button variant="ghost" size="sm">
                        <AlertCircle className="h-4 w-4" /> Notify parent
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <CalendarDays className="h-4 w-4 text-accent" /> Upcoming
          </h2>
          <div className="space-y-2">
            {events.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-2.5 text-sm">
                <p className="font-semibold">{e.title}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-bold">Staff on site</h2>
        <div className="flex flex-wrap gap-2">
          {staff.map((t) => (
            <Badge key={t.id} variant={t.onSite ? 'green' : 'neutral'}>
              {t.name} · {t.onSite ? 'on site' : 'off site'}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
        {icon}
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  )
}
