import { useState } from 'react'
import { Check, MapPin, Save } from 'lucide-react'
import { Badge, Button, Card, SegmentedControl } from '@/components/ui'
import {
  fetchMyTeachingLessons,
  fetchStudentsByForm,
  markAttendance,
  useQuery,
} from '@/lib/api'
import type { Student } from '@/lib/types'

type Mark = 'present' | 'absent' | 'late'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function StaffToday() {
  const { data: lessons } = useQuery(fetchMyTeachingLessons, [])
  const jsDay = new Date().getDay()
  const today = jsDay === 0 || jsDay === 6 ? 0 : jsDay - 1

  const [registerFor, setRegisterFor] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingClass, setLoadingClass] = useState(false)

  const todays = lessons
    .filter((l) => l.day === today)
    .sort((a, b) => a.start.localeCompare(b.start))

  const openRegister = async (classGroup: string) => {
    setRegisterFor(classGroup)
    setSaved(false)
    setMarks({})
    setLoadingClass(true)
    const list = await fetchStudentsByForm(classGroup)
    setStudents(list)
    setLoadingClass(false)
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    await markAttendance(
      Object.entries(marks).map(([studentId, status]) => ({ studentId, status })),
    )
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-black tracking-tight">
          {DAYS[today]}'s lessons
        </h1>
        <p className="text-sm text-muted-foreground">
          {todays.length === 0
            ? 'Nothing timetabled today'
            : `${todays.length} lessons — tap one to take the register`}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {todays.map((l) => (
          <button key={l.id} onClick={() => openRegister(l.classGroup ?? '')} className="text-left">
            <Card
              className={`overflow-hidden p-0 transition-transform hover:scale-[1.01] ${
                registerFor === l.classGroup ? 'ring-2 ring-accent' : ''
              }`}
            >
              <div className="flex">
                <div className="w-1.5 shrink-0" style={{ background: `hsl(${l.color})` }} />
                <div className="flex flex-1 items-center gap-3 p-4">
                  <div className="w-14 text-center">
                    <p className="text-sm font-black">{l.start}</p>
                    <p className="text-xs text-muted-foreground">{l.end}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{l.subject} · {l.classGroup}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {l.room} · {l.building}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </button>
        ))}
        {todays.length === 0 && lessons.length > 0 && (
          <Card className="p-6 text-center text-muted-foreground sm:col-span-2">
            Free day — {lessons.length} lessons on other days this week
          </Card>
        )}
        {lessons.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground sm:col-span-2">
            No lessons assigned to you yet — timetables are set by the office
          </Card>
        )}
      </div>

      {registerFor && (
        <Card className="animate-pop-in p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">Register — {registerFor}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="soft"
                size="sm"
                onClick={() => {
                  setMarks(Object.fromEntries(students.map((s) => [s.id, 'present' as Mark])))
                  setSaved(false)
                }}
              >
                <Check className="h-4 w-4" /> All present
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={saving || Object.keys(marks).length === 0}
              >
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
          {saved && (
            <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              ✅ Register saved
            </p>
          )}
          {loadingClass ? (
            <div className="skeleton h-24 w-full" />
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students on roll in {registerFor}
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {students.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-lg">
                    {s.avatarEmoji}
                  </span>
                  <p className="min-w-32 flex-1 font-semibold">
                    {s.firstName} {s.lastName}
                  </p>
                  <SegmentedControl<Mark>
                    className="w-full sm:w-64"
                    options={[
                      { label: 'Present', value: 'present' },
                      { label: 'Late', value: 'late' },
                      { label: 'Absent', value: 'absent' },
                    ]}
                    value={marks[s.id] ?? ('' as Mark)}
                    onChange={(m) => {
                      setMarks((prev) => ({ ...prev, [s.id]: m }))
                      setSaved(false)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <Badge variant="neutral" className="mt-3">
            {Object.keys(marks).length}/{students.length} marked
          </Badge>
        </Card>
      )}
    </div>
  )
}
