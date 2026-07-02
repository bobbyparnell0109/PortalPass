import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { attendance, currentStudent } from '@/lib/mockData'

export default function Attendance() {
  const lates = attendance.filter((a) => a.status === 'late')
  const absences = attendance.filter((a) => a.status === 'absent')
  const pct = currentStudent.attendancePct
  const good = pct >= 95

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="pt-2">
        <h1 className="text-2xl font-black tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">This term</p>
      </header>

      <Card
        className={cn(
          'border-0 p-5 text-white shadow-lg',
          good
            ? 'bg-gradient-to-br from-emerald-500 to-teal-400 shadow-emerald-500/25'
            : 'bg-gradient-to-br from-amber-500 to-orange-400 shadow-amber-500/25',
        )}
      >
        <p className="text-sm text-white/80">Attendance this term</p>
        <p className="text-5xl font-black">{pct}%</p>
        <p className="mt-1 text-sm text-white/85">
          {good ? 'Above the 95% target — brilliant! 🌟' : 'Below the 95% target — let’s get it back up 💪'}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-amber-500">{lates.length}</p>
          <p className="text-sm text-muted-foreground">Lates</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-black text-red-500">{absences.length}</p>
          <p className="text-sm text-muted-foreground">Absences</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-bold">June – July</h2>
        <div className="grid grid-cols-5 gap-1.5">
          {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
            <p key={i} className="text-center text-xs font-bold text-muted-foreground">
              {d}
            </p>
          ))}
          {attendance.map((r) => (
            <div
              key={r.date}
              title={`${r.date}: ${r.status}${r.reason ? ` — ${r.reason}` : ''}`}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-xs font-bold',
                r.status === 'present' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                r.status === 'late' && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                r.status === 'absent' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
              )}
            >
              {new Date(r.date).getDate()}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-400" /> Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-400" /> Late
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-400" /> Absent
          </span>
        </div>
      </Card>

      {(lates.length > 0 || absences.length > 0) && (
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Log</h2>
          <div className="space-y-2">
            {[...absences, ...lates]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((r) => (
                <div key={r.date} className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
                  <div>
                    <p className="font-semibold">
                      {new Date(r.date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.reason ?? (r.status === 'late' ? 'No reason recorded' : 'Unauthorised')}
                    </p>
                  </div>
                  <Badge variant={r.status === 'late' ? 'amber' : 'red'}>
                    {r.status === 'late' ? `${r.minutesLate ?? '?'} min late` : 'Absent'}
                  </Badge>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
