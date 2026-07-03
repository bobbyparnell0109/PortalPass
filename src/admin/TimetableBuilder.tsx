import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Download, Plus, Trash2, Upload, X } from 'lucide-react'
import { Badge, Button, Card, Progress as ProgressBar } from '@/components/ui'
import { parseCsv } from '@/lib/csv'
import {
  createLesson,
  deleteLesson,
  fetchLessons,
  fetchRooms,
  fetchStaff,
  fetchSubjects,
  importTimetable,
  useQuery,
  type ImportRowResult,
} from '@/lib/api'
import { timetable as mockTimetable, staff as mockStaff } from '@/lib/mockData'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [
  { label: 'P1', start: '08:50', end: '09:50' },
  { label: 'P2', start: '09:55', end: '10:55' },
  { label: 'P3', start: '11:15', end: '12:15' },
  { label: 'P4', start: '13:10', end: '14:10' },
  { label: 'P5', start: '14:15', end: '15:15' },
]

// Matches TimeTabler/Edval-style exports: one row per scheduled lesson.
const TT_TEMPLATE =
  'class,day,start,end,subject,teacher_email,room,building\n' +
  '9TB,Mon,08:50,09:50,Maths,okafor@springwood.sch.uk,M12,Main\n' +
  '9TB,Mon,09:55,10:55,English,reid@springwood.sch.uk,E4,East Wing\n'

const DAY_LOOKUP: Record<string, number> = {
  mon: 0, monday: 0, '0': 0, '1': 0,
  tue: 1, tuesday: 1, tues: 1,
  wed: 2, wednesday: 2,
  thu: 3, thursday: 3, thurs: 3,
  fri: 4, friday: 4,
}
function parseDay(raw: string): number | null {
  const key = raw.trim().toLowerCase()
  if (/^[0-4]$/.test(key)) return Number(key)
  return DAY_LOOKUP[key] ?? null
}

export default function TimetableBuilder() {
  const { data: timetable, refetch } = useQuery(fetchLessons, mockTimetable)
  const { data: subjects } = useQuery(fetchSubjects, [])
  const { data: rooms } = useQuery(fetchRooms, [])
  const { data: staff } = useQuery(fetchStaff, mockStaff)

  const classGroups = useMemo(() => {
    const groups = [...new Set(timetable.map((l) => l.classGroup ?? '10RW'))].sort()
    return groups.length ? groups : ['10RW']
  }, [timetable])
  const [group, setGroup] = useState<string>('10RW')
  const [newGroup, setNewGroup] = useState('')

  const [selected, setSelected] = useState<string | null>(null)
  // Slot being filled: day + period index
  const [slot, setSlot] = useState<{ day: number; period: number } | null>(null)
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // CSV import (the TimeTabler/Edval-style route schools actually use)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 })
  const [importResults, setImportResults] = useState<ImportRowResult[] | null>(null)
  const [importError, setImportError] = useState('')

  const onCsvChosen = async (file: File) => {
    setImportError('')
    setImportResults(null)
    const { rows } = parseCsv(await file.text())
    const parsedRows = []
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const day = parseDay(r.day ?? '')
      if (day === null || !r.class || !r.subject || !r.teacher_email || !r.start || !r.end || !r.room) {
        setImportError(`Row ${i + 2}: needs class, day (Mon–Fri), start, end, subject, teacher_email, room`)
        return
      }
      parsedRows.push({
        classGroup: r.class.toUpperCase(),
        day,
        start: r.start,
        end: r.end,
        subject: r.subject,
        teacherEmail: r.teacher_email,
        room: r.room,
        building: r.building ?? '',
      })
    }
    if (parsedRows.length === 0) {
      setImportError('No rows found in that file')
      return
    }
    setImporting(true)
    setImportProgress({ done: 0, total: parsedRows.length })
    const results = await importTimetable(parsedRows, (done, total) =>
      setImportProgress({ done, total }),
    )
    setImporting(false)
    setImportResults(results)
    refetch()
  }

  const groupLessons = useMemo(
    () => timetable.filter((l) => (l.classGroup ?? '10RW') === group),
    [timetable, group],
  )

  // Clash detection across the whole school: same teacher or room, same slot
  const clashes = useMemo(() => {
    const bySlot = new Map<string, typeof timetable>()
    for (const l of timetable) {
      const key = `${l.day}-${l.start}`
      bySlot.set(key, [...(bySlot.get(key) ?? []), l])
    }
    const flagged = new Set<string>()
    for (const lessons of bySlot.values()) {
      for (let i = 0; i < lessons.length; i++) {
        for (let j = i + 1; j < lessons.length; j++) {
          if (lessons[i].teacher === lessons[j].teacher || lessons[i].room === lessons[j].room) {
            flagged.add(lessons[i].id)
            flagged.add(lessons[j].id)
          }
        }
      }
    }
    return flagged
  }, [timetable])

  const grid = useMemo(() => {
    const m = new Map<string, (typeof timetable)[number]>()
    for (const l of groupLessons) m.set(`${l.day}-${l.start}`, l)
    return m
  }, [groupLessons])

  const sel = groupLessons.find((l) => l.id === selected)

  const openSlot = (day: number, period: number) => {
    setSlot({ day, period })
    setSelected(null)
    setError('')
    if (!subjectId && subjects[0]) setSubjectId(subjects[0].id)
    if (!teacherId && staff[0]) setTeacherId(staff[0].id)
    if (!roomId && rooms[0]) setRoomId(rooms[0].id)
  }

  const addLesson = async () => {
    if (!slot || busy) return
    setBusy(true)
    setError('')
    const p = PERIODS[slot.period]
    const result = await createLesson({
      subjectId,
      teacherId,
      roomId,
      classGroup: group,
      day: slot.day,
      start: p.start,
      end: p.end,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSlot(null)
    refetch()
  }

  const removeLesson = async (id: string) => {
    if (busy) return
    setBusy(true)
    const result = await deleteLesson(id)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSelected(null)
    refetch()
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Timetable builder</h1>
          <p className="text-sm text-muted-foreground">
            Tap a free slot to schedule a lesson · tap a lesson to inspect or remove it
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {clashes.size > 0 ? (
            <Badge variant="red">
              <AlertTriangle className="h-3 w-3" /> {clashes.size} clashing lessons
            </Badge>
          ) : (
            <Badge variant="green">No clashes detected</Badge>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onCsvChosen(f)
              e.target.value = ''
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(TT_TEMPLATE)}`}
            download="portalpass-timetable-template.csv"
          >
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" /> Template
            </Button>
          </a>
        </div>
      </header>

      <p className="text-xs text-muted-foreground">
        Schools typically build the timetable in a solver like TimeTabler or Edval
        and import the export here — one row per lesson. Unknown subjects and
        rooms are created automatically; teachers are matched by email.
      </p>

      {importing && (
        <Card className="p-5">
          <h2 className="font-bold">Importing lessons… {importProgress.done} of {importProgress.total}</h2>
          <ProgressBar value={(importProgress.done / Math.max(1, importProgress.total)) * 100} className="mt-3" />
        </Card>
      )}
      {importError && (
        <Card className="border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {importError}
        </Card>
      )}
      {importResults && (
        <Card className="animate-fade-up p-5">
          <h2 className="font-bold">
            Import finished — {importResults.filter((r) => !r.error).length} lessons added,{' '}
            {importResults.filter((r) => r.error).length} skipped
          </h2>
          {importResults.some((r) => r.error) && (
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {importResults.filter((r) => r.error).map((r) => (
                <div key={r.row} className="rounded-lg bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Row {r.row}: {r.label} — {r.error}
                </div>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setImportResults(null)}>
            Dismiss
          </Button>
        </Card>
      )}

      {/* Class group tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {classGroups.map((g) => (
          <button
            key={g}
            onClick={() => { setGroup(g); setSlot(null); setSelected(null) }}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              g === group
                ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {g}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <input
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value.toUpperCase())}
            placeholder="New class…"
            className="h-9 w-28 rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <Button
            variant="soft"
            size="sm"
            disabled={!newGroup.trim()}
            onClick={() => {
              setGroup(newGroup.trim())
              setNewGroup('')
              setSlot(null)
              setSelected(null)
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto p-4">
        <table className="w-full min-w-[720px] border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="w-16" />
              {DAYS.map((d) => (
                <th key={d} className="pb-1 text-sm font-bold text-muted-foreground">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p, pi) => (
              <tr key={p.label}>
                <td className="text-center">
                  <p className="text-sm font-black">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground">{p.start}</p>
                </td>
                {DAYS.map((_, day) => {
                  const l = grid.get(`${day}-${p.start}`)
                  if (!l)
                    return (
                      <td key={day}>
                        <button
                          onClick={() => openSlot(day, pi)}
                          className={`flex h-16 w-full items-center justify-center rounded-xl border-2 border-dashed text-xs transition-colors ${
                            slot?.day === day && slot?.period === pi
                              ? 'border-accent bg-accent-soft text-accent'
                              : 'border-border text-muted-foreground hover:border-accent/50 hover:text-accent'
                          }`}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add
                        </button>
                      </td>
                    )
                  return (
                    <td key={day}>
                      <button
                        onClick={() => { setSelected(l.id === selected ? null : l.id); setSlot(null) }}
                        className={`h-16 w-full rounded-xl p-2 text-left text-white transition-all hover:scale-[1.03] ${
                          selected === l.id ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
                        } ${clashes.has(l.id) ? 'ring-2 ring-red-500' : ''}`}
                        style={{ background: `hsl(${l.color})` }}
                      >
                        <p className="truncate text-xs font-bold">{l.subject}</p>
                        <p className="truncate text-[10px] text-white/80">
                          {l.teacher} · {l.room}
                        </p>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Slot assignment panel */}
      {slot && (
        <Card className="animate-pop-in p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">
              New lesson — {DAYS[slot.day]} {PERIODS[slot.period].label} ({PERIODS[slot.period].start}–{PERIODS[slot.period].end}) · {group}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setSlot(null)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {staff.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} · {r.building}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
          <Button className="mt-4" onClick={addLesson} disabled={busy || !subjectId || !teacherId || !roomId}>
            {busy ? 'Scheduling…' : 'Schedule lesson'}
          </Button>
        </Card>
      )}

      {/* Selected lesson panel */}
      {sel && (
        <Card className="animate-pop-in p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black">{sel.subject}</h2>
              <p className="text-sm text-muted-foreground">
                {DAYS[sel.day]} {sel.start}–{sel.end} · {group}
              </p>
            </div>
            <Badge variant="accent">{sel.room} · {sel.building}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Teacher</p>
              <p className="font-semibold">{sel.teacher}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Room</p>
              <p className="font-semibold">{sel.room}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Building</p>
              <p className="font-semibold">{sel.building}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class</p>
              <p className="font-semibold">{group}</p>
            </div>
          </div>
          {clashes.has(sel.id) && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-red-500">
              <AlertTriangle className="h-4 w-4" /> This teacher or room is double-booked in this slot
            </p>
          )}
          {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
          <Button variant="danger" className="mt-4" onClick={() => removeLesson(sel.id)} disabled={busy}>
            <Trash2 className="h-4 w-4" /> {busy ? 'Removing…' : 'Remove lesson'}
          </Button>
        </Card>
      )}
    </div>
  )
}
