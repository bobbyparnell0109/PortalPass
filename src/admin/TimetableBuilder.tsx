import { useMemo, useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { timetable } from '@/lib/mockData'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [
  { label: 'P1', start: '08:50' },
  { label: 'P2', start: '09:55' },
  { label: 'P3', start: '11:15' },
  { label: 'P4', start: '13:10' },
  { label: 'P5', start: '14:15' },
]

export default function TimetableBuilder() {
  const [selected, setSelected] = useState<string | null>(null)

  // Clash detection: same teacher or room in the same slot
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
  }, [])

  const grid = useMemo(() => {
    const m = new Map<string, (typeof timetable)[number]>()
    for (const l of timetable) m.set(`${l.day}-${l.start}`, l)
    return m
  }, [])

  const sel = timetable.find((l) => l.id === selected)

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Timetable — 10RW</h1>
          <p className="text-sm text-muted-foreground">
            Click a lesson to inspect · drag-and-drop editing coming in Phase 2
          </p>
        </div>
        <div className="flex items-center gap-2">
          {clashes.size > 0 ? (
            <Badge variant="red">
              <AlertTriangle className="h-3 w-3" /> {clashes.size} clashes
            </Badge>
          ) : (
            <Badge variant="green">No clashes detected</Badge>
          )}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </header>

      <Card className="overflow-x-auto p-4">
        <table className="w-full border-separate border-spacing-1.5">
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
            {PERIODS.map((p) => (
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
                        <div className="flex h-16 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground">
                          Free
                        </div>
                      </td>
                    )
                  return (
                    <td key={day}>
                      <button
                        onClick={() => setSelected(l.id === selected ? null : l.id)}
                        className={`h-16 w-full rounded-xl p-2 text-left text-white transition-all hover:scale-[1.03] ${
                          selected === l.id ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''
                        }`}
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

      {sel && (
        <Card className="animate-pop-in p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black">{sel.subject}</h2>
              <p className="text-sm text-muted-foreground">
                {DAYS[sel.day]} {sel.start}–{sel.end}
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
              <p className="font-semibold">10RW</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
