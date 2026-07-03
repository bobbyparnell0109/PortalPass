import { useState, type FormEvent } from 'react'
import { BookMarked, DoorOpen, Plus } from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { createRoom, createSubject, fetchRooms, fetchSubjects, useQuery } from '@/lib/api'

const SUBJECT_PALETTE = [
  '221 83% 53%', '350 80% 55%', '160 84% 39%', '32 95% 44%', '174 80% 36%',
  '262 83% 58%', '316 73% 52%', '0 84% 60%', '199 89% 48%', '45 93% 47%',
]

export default function SubjectsRooms() {
  const { data: subjects, refetch: refetchSubjects } = useQuery(fetchSubjects, [])
  const { data: rooms, refetch: refetchRooms } = useQuery(fetchRooms, [])

  const [subjectName, setSubjectName] = useState('')
  const [subjectColor, setSubjectColor] = useState(SUBJECT_PALETTE[0])
  const [roomName, setRoomName] = useState('')
  const [building, setBuilding] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const addSubject = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || !subjectName.trim()) return
    setBusy(true)
    setError('')
    const result = await createSubject(subjectName.trim(), subjectColor)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSubjectName('')
    refetchSubjects()
  }

  const addRoom = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || !roomName.trim()) return
    setBusy(true)
    setError('')
    const result = await createRoom(roomName.trim(), building.trim() || 'Main')
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRoomName('')
    refetchRooms()
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Subjects &amp; rooms</h1>
        <p className="text-sm text-muted-foreground">
          The building blocks of your timetable — subject colours flow through
          every student's app
        </p>
      </header>

      {error && (
        <Card className="border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <BookMarked className="h-4 w-4 text-accent" /> Subjects ({subjects.length})
          </h2>
          <form onSubmit={addSubject} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Subject name, e.g. Drama"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
              <Button type="submit" disabled={busy || !subjectName.trim()}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSubjectColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-lg transition-all hover:scale-110',
                    subjectColor === c && 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card',
                  )}
                  style={{ background: `hsl(${c})` }}
                  aria-label={`Subject colour ${c}`}
                />
              ))}
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span
                key={s.id}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-white"
                style={{ background: `hsl(${s.color})` }}
              >
                {s.name}
              </span>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-muted-foreground">No subjects yet — add your first above</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <DoorOpen className="h-4 w-4 text-accent" /> Rooms ({rooms.length})
          </h2>
          <form onSubmit={addRoom} className="flex flex-wrap gap-2">
            <Input
              placeholder="Room, e.g. D4"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-32 flex-none"
            />
            <Input
              placeholder="Building, e.g. Drama Block"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="min-w-40 flex-1"
            />
            <Button type="submit" disabled={busy || !roomName.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
          <div className="mt-4 space-y-1.5">
            {rooms.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
                <span className="font-semibold">{r.name}</span>
                <Badge variant="neutral">{r.building}</Badge>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground">No rooms yet — add your first above</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
