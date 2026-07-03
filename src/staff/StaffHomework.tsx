import { useMemo, useState, type FormEvent } from 'react'
import { BookOpen, Send } from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import {
  createHomework,
  fetchHomeworkSetByMe,
  fetchMyTeachingLessons,
  fetchSubjects,
  useQuery,
} from '@/lib/api'

export default function StaffHomework() {
  const { data: subjects } = useQuery(fetchSubjects, [])
  const { data: lessons } = useQuery(fetchMyTeachingLessons, [])
  const { data: mine, refetch } = useQuery(fetchHomeworkSetByMe, [])

  const classGroups = useMemo(
    () => [...new Set(lessons.map((l) => l.classGroup ?? ''))].filter(Boolean).sort(),
    [lessons],
  )

  const [classGroup, setClassGroup] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [minutes, setMinutes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const result = await createHomework({
      subjectId: subjectId || subjects[0]?.id || '',
      classGroup: classGroup || classGroups[0] || '',
      title: title.trim(),
      description: description.trim(),
      dueDate,
      estimatedMinutes: minutes ? Number(minutes) : undefined,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess(`Homework set — every student in ${classGroup || classGroups[0]} sees it now`)
    setTitle('')
    setDescription('')
    setDueDate('')
    setMinutes('')
    refetch()
    setTimeout(() => setSuccess(''), 5000)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 animate-fade-up">
      <div>
        <h1 className="mb-4 text-2xl font-black tracking-tight">Set homework</h1>
        {success && (
          <Card className="mb-4 animate-pop-in border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            ✅ {success}
          </Card>
        )}
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Class</label>
                <select
                  value={classGroup}
                  onChange={(e) => setClassGroup(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {classGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
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
            </div>
            <Input placeholder="Title, e.g. Chapter 4 questions" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea
              placeholder="What exactly should they do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Due date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Estimated minutes</label>
                <Input type="number" min="5" max="240" placeholder="30" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || classGroups.length === 0}>
              <Send className="h-4 w-4" /> {busy ? 'Setting…' : 'Set homework'}
            </Button>
            {classGroups.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                You need timetabled classes before you can set homework
              </p>
            )}
          </form>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <BookOpen className="h-5 w-5 text-accent" /> Recently set ({mine.length})
        </h2>
        <div className="space-y-2">
          {mine.map((h) => (
            <Card key={h.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate font-bold">{h.title}</p>
                <p className="text-sm text-muted-foreground">
                  {h.subject} · {h.classGroup}
                </p>
              </div>
              <Badge variant={h.dueDate < new Date().toISOString().slice(0, 10) ? 'neutral' : 'accent'}>
                due {h.dueDate}
              </Badge>
            </Card>
          ))}
          {mine.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Homework you set appears here
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
