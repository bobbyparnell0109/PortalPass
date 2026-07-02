import { useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { Badge, Button, Card, SegmentedControl } from '@/components/ui'
import { cn } from '@/lib/utils'
import { timetable } from '@/lib/mockData'
import type { Lesson } from '@/lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function Timetable() {
  const jsDay = new Date().getDay()
  const today = jsDay === 0 || jsDay === 6 ? 0 : jsDay - 1
  const [day, setDay] = useState(today)
  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState<'day' | 'week'>('day')
  const [selected, setSelected] = useState<Lesson | null>(null)

  const lessons = timetable
    .filter((l) => l.day === day)
    .sort((a, b) => a.start.localeCompare(b.start))

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black tracking-tight">Timetable</h1>
        <SegmentedControl
          className="w-36"
          options={[
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
          ]}
          value={view}
          onChange={setView}
        />
      </header>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset - 1)} aria-label="Previous week">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm font-semibold text-muted-foreground">
          {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : `${Math.abs(weekOffset)} weeks ${weekOffset > 0 ? 'ahead' : 'ago'}`}
        </p>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset + 1)} aria-label="Next week">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {view === 'day' ? (
        <>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => setDay(i)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-bold transition-all',
                  i === day
                    ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                  i === today && weekOffset === 0 && i !== day && 'ring-2 ring-accent/40',
                )}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {lessons.map((l, i) => (
              <button
                key={l.id}
                className="w-full text-left"
                onClick={() => setSelected(selected?.id === l.id ? null : l)}
              >
                <Card
                  className="overflow-hidden p-0 transition-transform hover:scale-[1.01]"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex">
                    <div className="w-1.5 shrink-0" style={{ background: `hsl(${l.color})` }} />
                    <div className="flex flex-1 items-center gap-3 p-4">
                      <div className="w-14 text-center">
                        <p className="text-sm font-black">{l.start}</p>
                        <p className="text-xs text-muted-foreground">{l.end}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{l.subject}</p>
                        <p className="text-sm text-muted-foreground">{l.teacher}</p>
                      </div>
                      <Badge variant="neutral" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {l.room}
                      </Badge>
                    </div>
                  </div>
                  {selected?.id === l.id && (
                    <div className="animate-fade-up border-t border-border bg-muted/50 p-4 text-sm">
                      <p>
                        <span className="font-semibold">Building:</span> {l.building}
                      </p>
                      <p>
                        <span className="font-semibold">Teacher:</span> {l.teacher}
                      </p>
                      <p className="text-muted-foreground">
                        Tap and hold to add to your device calendar (coming soon)
                      </p>
                    </div>
                  )}
                </Card>
              </button>
            ))}
            {lessons.length === 0 && (
              <Card className="p-6 text-center text-muted-foreground">No lessons — free day!</Card>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {DAYS.map((d, i) => (
            <div key={d} className="space-y-1.5">
              <p
                className={cn(
                  'rounded-lg py-1 text-center text-xs font-bold',
                  i === today && weekOffset === 0
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {d}
              </p>
              {timetable
                .filter((l) => l.day === i)
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setDay(i)
                      setView('day')
                      setSelected(l)
                    }}
                    className="w-full rounded-lg p-1.5 text-left text-white transition-transform hover:scale-105"
                    style={{ background: `hsl(${l.color})` }}
                  >
                    <p className="truncate text-[10px] font-bold leading-tight">{l.subject}</p>
                    <p className="text-[9px] text-white/80">{l.start}</p>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
