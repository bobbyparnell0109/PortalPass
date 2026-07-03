import { useMemo, useState } from 'react'
import { BarChart3, Save } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import {
  createAssessmentWithGrades,
  fetchMyTeachingLessons,
  fetchStudentsByForm,
  fetchSubjects,
  useQuery,
} from '@/lib/api'
import type { Student } from '@/lib/types'

interface Entry {
  grade: string
  score: string
  feedback: string
}

export default function StaffGrades() {
  const { data: subjects } = useQuery(fetchSubjects, [])
  const { data: lessons } = useQuery(fetchMyTeachingLessons, [])
  const classGroups = useMemo(
    () => [...new Set(lessons.map((l) => l.classGroup ?? ''))].filter(Boolean).sort(),
    [lessons],
  )

  const [classGroup, setClassGroup] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [name, setName] = useState('')
  const [term, setTerm] = useState('Summer 2026')
  const [students, setStudents] = useState<Student[]>([])
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadClass = async (g: string) => {
    setClassGroup(g)
    setSuccess('')
    const list = await fetchStudentsByForm(g)
    setStudents(list)
    setEntries({})
  }

  const setEntry = (id: string, patch: Partial<Entry>) =>
    setEntries((prev) => {
      const current = prev[id] ?? { grade: '', score: '', feedback: '' }
      return { ...prev, [id]: { ...current, ...patch } }
    })

  const complete = students.filter((s) => entries[s.id]?.grade && entries[s.id]?.score)

  const save = async () => {
    if (busy || complete.length === 0) return
    setBusy(true)
    setError('')
    const result = await createAssessmentWithGrades({
      subjectId: subjectId || subjects[0]?.id || '',
      name: name.trim(),
      term: term.trim(),
      entries: complete.map((s) => ({
        studentId: s.id,
        grade: entries[s.id].grade,
        score: Number(entries[s.id].score),
        feedback: entries[s.id].feedback,
      })),
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess(`${complete.length} grades saved — students and parents see them instantly`)
    setEntries({})
    setName('')
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Enter grades</h1>
        <p className="text-sm text-muted-foreground">
          Create an assessment and grade the whole class in one screen
        </p>
      </header>

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Class</label>
            <select
              value={classGroup}
              onChange={(e) => loadClass(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">Pick a class…</option>
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Assessment name</label>
            <Input placeholder="e.g. End of unit test" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Term</label>
            <Input value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
        </div>
      </Card>

      {students.length > 0 && (
        <Card className="overflow-x-auto p-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2">Student</th>
                <th className="w-24 pb-2">Grade</th>
                <th className="w-24 pb-2">Score %</th>
                <th className="pb-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 font-semibold">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      className="h-9 w-20 text-center"
                      placeholder="7"
                      value={entries[s.id]?.grade ?? ''}
                      onChange={(e) => setEntry(s.id, { grade: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      className="h-9 w-20 text-center"
                      placeholder="74"
                      type="number"
                      min="0"
                      max="100"
                      value={entries[s.id]?.score ?? ''}
                      onChange={(e) => setEntry(s.id, { score: e.target.value })}
                    />
                  </td>
                  <td className="py-2">
                    <Input
                      className="h-9"
                      placeholder="One line of feedback (optional)"
                      value={entries[s.id]?.feedback ?? ''}
                      onChange={(e) => setEntry(s.id, { feedback: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
          {success && (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              ✅ {success}
            </p>
          )}
          <Button
            className="mt-4"
            onClick={save}
            disabled={busy || complete.length === 0 || !name.trim()}
          >
            <Save className="h-4 w-4" />
            {busy ? 'Saving…' : `Save ${complete.length} grades`}
          </Button>
        </Card>
      )}

      {classGroup === '' && (
        <Card className="p-8 text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-2 h-8 w-8" />
          Pick one of your classes to start grading
        </Card>
      )}
    </div>
  )
}
