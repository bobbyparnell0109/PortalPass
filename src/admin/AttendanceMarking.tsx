import { useState } from 'react'
import { Check, Save } from 'lucide-react'
import { Badge, Button, Card, SegmentedControl } from '@/components/ui'
import { cn } from '@/lib/utils'
import { allStudents } from '@/lib/mockData'

type Mark = 'present' | 'absent' | 'late'

export default function AttendanceMarking() {
  const [form, setForm] = useState('10RW')
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [saved, setSaved] = useState(false)

  const forms = [...new Set(allStudents.filter((s) => s.status === 'active').map((s) => s.form))].sort()
  const students = allStudents.filter((s) => s.status === 'active' && s.form === form)

  const setMark = (id: string, m: Mark) => {
    setMarks((prev) => ({ ...prev, [id]: m }))
    setSaved(false)
  }

  const markAllPresent = () => {
    setMarks(Object.fromEntries(students.map((s) => [s.id, 'present' as Mark])))
    setSaved(false)
  }

  const save = () => {
    // Demo: production writes rows to attendance_records via Supabase and
    // triggers parent notifications for absences.
    setSaved(true)
  }

  const markedCount = students.filter((s) => marks[s.id]).length

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Mark attendance</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · AM registration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" onClick={markAllPresent}>
            <Check className="h-4 w-4" /> All present
          </Button>
          <Button size="sm" onClick={save} disabled={markedCount === 0}>
            <Save className="h-4 w-4" /> Save register
          </Button>
        </div>
      </header>

      {saved && (
        <Card className="animate-pop-in border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✅ Register saved. Parents of absent students will be notified automatically.
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {forms.map((f) => (
          <button
            key={f}
            onClick={() => {
              setForm(f)
              setMarks({})
              setSaved(false)
            }}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-bold transition-all',
              f === form
                ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
        <Badge variant="neutral" className="ml-auto">
          {markedCount}/{students.length} marked
        </Badge>
      </div>

      <Card className="divide-y divide-border/60">
        {students.map((s) => (
          <div key={s.id} className="flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-xl">
              {s.avatarEmoji}
            </span>
            <div className="flex-1">
              <p className="font-semibold">
                {s.firstName} {s.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{s.form} · Year {s.yearGroup}</p>
            </div>
            <SegmentedControl<Mark>
              className="w-64"
              options={[
                { label: 'Present', value: 'present' },
                { label: 'Late', value: 'late' },
                { label: 'Absent', value: 'absent' },
              ]}
              value={marks[s.id] ?? ('' as Mark)}
              onChange={(m) => setMark(s.id, m)}
            />
          </div>
        ))}
        {students.length === 0 && (
          <p className="p-8 text-center text-muted-foreground">No active students in this form</p>
        )}
      </Card>
    </div>
  )
}
