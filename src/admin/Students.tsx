import { useMemo, useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, Search, UserPlus, X } from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  createStudent,
  fetchAllStudents,
  setStudentStatus,
  useQuery,
} from '@/lib/api'
import { allStudents as mockStudents } from '@/lib/mockData'

const randomPin = () => String(Math.floor(10000 + Math.random() * 90000))

export default function Students() {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState<'all' | number>('all')
  const { data: allStudents, refetch } = useQuery(fetchAllStudents, mockStudents)

  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [yearGroup, setYearGroup] = useState(7)
  const [form, setForm] = useState('')
  const [house, setHouse] = useState('')
  const [pin, setPin] = useState(randomPin)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const years = [...new Set(allStudents.map((s) => s.yearGroup))].sort((a, b) => a - b)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allStudents.filter((s) => {
      if (year !== 'all' && s.yearGroup !== year) return false
      if (!q) return true
      return (
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.form.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    })
  }, [allStudents, query, year])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const result = await createStudent({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      yearGroup,
      form: form.trim().toUpperCase(),
      house: house.trim(),
      pin,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess(`${firstName} ${lastName} enrolled — their PIN is ${pin}. Write it down and hand it over securely!`)
    setShowForm(false)
    setFirstName(''); setLastName(''); setEmail(''); setForm(''); setHouse('')
    setPin(randomPin())
    refetch()
  }

  const toggleArchive = async (id: string, current: string) => {
    const result = await setStudentStatus(id, current === 'active' ? 'left' : 'active')
    if (!result.ok) setError(result.error)
    else refetch()
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">{allStudents.length} on roll</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setSuccess('') }}>
          {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add student'}
        </Button>
      </header>

      {success && (
        <Card className="animate-pop-in border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✅ {success}
        </Card>
      )}
      {error && !showForm && (
        <Card className="border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </Card>
      )}

      {showForm && (
        <Card className="animate-fade-up p-5">
          <h2 className="mb-4 font-bold">Enrol a student</h2>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <Input type="email" placeholder="School email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Year group</label>
                <select
                  value={yearGroup}
                  onChange={(e) => setYearGroup(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {[7, 8, 9, 10, 11, 12, 13].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Form, e.g. 7RD</label>
                <Input placeholder="Form" value={form} onChange={(e) => setForm(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">House</label>
                <Input placeholder="House" value={house} onChange={(e) => setHouse(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Login PIN (5 digits — give this to the student)
              </label>
              <div className="flex gap-2">
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-32 text-center font-mono text-lg tracking-[0.3em]"
                  required
                />
                <Button type="button" variant="outline" onClick={() => setPin(randomPin())}>
                  Regenerate
                </Button>
              </div>
            </div>
            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
            <Button type="submit" disabled={busy || pin.length !== 5}>
              {busy ? 'Enrolling…' : 'Enrol student'}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, form or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Year / Form</th>
              <th className="px-4 py-3">House</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Lunch balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-lg">
                      {s.avatarEmoji}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  Y{s.yearGroup} · {s.form}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.house}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.attendancePct >= 95 ? 'green' : s.attendancePct >= 90 ? 'amber' : 'red'}>
                    {s.attendancePct}%
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={s.lunchBalance < 5 ? 'font-semibold text-amber-600' : ''}>
                    {formatCurrency(s.lunchBalance)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.status === 'active' ? 'green' : 'neutral'}>{s.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleArchive(s.id, s.status)}
                    aria-label={s.status === 'active' ? 'Archive student' : 'Restore student'}
                  >
                    {s.status === 'active' ? (
                      <><Archive className="h-4 w-4" /> Archive</>
                    ) : (
                      <><ArchiveRestore className="h-4 w-4" /> Restore</>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No students match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
