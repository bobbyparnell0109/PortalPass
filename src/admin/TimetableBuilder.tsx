import { useMemo, useState } from 'react'
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import {
  createLesson,
  deleteLesson,
  fetchLessons,
  fetchRooms,
  fetchStaff,
  fetchSubjects,
  useQuery,
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
        {clashes.size > 0 ? (
          <Badge variant="red">
            <AlertTriangle className="h-3 w-3" /> {clashes.size} clashing lessons
          </Badge>
        ) : (
          <Badge variant="green">No clashes detected</Badge>
        )}
      </header>

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
