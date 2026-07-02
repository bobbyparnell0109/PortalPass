import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { Badge, Card, SegmentedControl } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { SUBJECT_COLORS } from '@/lib/mockData'

type Filter = 'all' | 'pending' | 'done'

export default function Homework() {
  const { homework, toggleHomework } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const list = homework.filter((h) =>
      filter === 'all' ? true : filter === 'done' ? h.status === 'completed' : h.status !== 'completed',
    )
    // Overdue first, then by due date, completed last
    return [...list].sort((a, b) => {
      const rank = (s: string) => (s === 'overdue' ? 0 : s === 'pending' ? 1 : 2)
      return rank(a.status) - rank(b.status) || a.dueDate.localeCompare(b.dueDate)
    })
  }, [homework, filter])

  const done = homework.filter((h) => h.status === 'completed').length

  const complete = (id: string, wasCompleted: boolean) => {
    toggleHomework(id)
    if (!wasCompleted) {
      setJustCompleted(id)
      setTimeout(() => setJustCompleted(null), 900)
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="pt-2">
        <h1 className="text-2xl font-black tracking-tight">Homework</h1>
        <p className="text-sm text-muted-foreground">
          {done} of {homework.length} completed — keep it up! 💪
        </p>
      </header>

      <SegmentedControl
        options={[
          { label: 'All', value: 'all' },
          { label: 'To do', value: 'pending' },
          { label: 'Done', value: 'done' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <div className="space-y-3">
        {filtered.map((h) => {
          const isDone = h.status === 'completed'
          const isOverdue = h.status === 'overdue'
          const color = SUBJECT_COLORS[h.subject] ?? '240 5% 50%'
          return (
            <Card
              key={h.id}
              className={cn(
                'relative overflow-hidden p-4 transition-all',
                isDone && 'opacity-60',
                isOverdue && 'ring-2 ring-red-400/60',
              )}
            >
              {justCompleted === h.id && (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center gap-2 text-xl">
                  {['🎉', '⭐', '🎊', '✨', '🙌'].map((e, i) => (
                    <span key={i} className="animate-confetti" style={{ animationDelay: `${i * 60}ms` }}>
                      {e}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => complete(h.id, isDone)}
                  className="mt-0.5 shrink-0 text-accent transition-transform active:scale-75"
                  aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
                <button className="flex-1 text-left" onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge style={{ background: `hsl(${color} / 0.15)`, color: `hsl(${color})` }}>
                      {h.subject}
                    </Badge>
                    {isOverdue && <Badge variant="red">Overdue</Badge>}
                  </div>
                  <p className={cn('mt-1.5 font-bold', isDone && 'line-through')}>{h.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Due{' '}
                      {new Date(h.dueDate).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    {h.estimatedMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />~{h.estimatedMinutes} min
                      </span>
                    )}
                  </div>
                  {expanded === h.id && (
                    <div className="mt-3 animate-fade-up rounded-xl bg-muted/60 p-3 text-sm">
                      <p>{h.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Set by {h.teacher}</p>
                    </div>
                  )}
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
