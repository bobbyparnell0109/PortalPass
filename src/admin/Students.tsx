import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, Download, KeyRound, Search, Upload, UserPlus, X } from 'lucide-react'
import { Badge, Button, Card, Input, Progress } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { parseCsv } from '@/lib/csv'
import {
  createStudent,
  fetchAllStudents,
  importStudents,
  resetStudentPin,
  setStudentStatus,
  useQuery,
  type ImportRowResult,
} from '@/lib/api'
import { allStudents as mockStudents } from '@/lib/mockData'

const randomPin = () => String(Math.floor(10000 + Math.random() * 90000))

const CSV_TEMPLATE =
  'first_name,last_name,email,year_group,form,house,pin\n' +
  'Alex,Johnson,alex.johnson@yourschool.co.uk,7,7RD,Falcon,\n' +
  'Priya,Patel,priya.patel@yourschool.co.uk,7,7RD,Osprey,41287\n'

interface ParsedStudent {
  firstName: string
  lastName: string
  email: string
  yearGroup: number
  form: string
  house: string
  pin: string
  problem?: string
}

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

  // Bulk CSV import
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedStudent[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [importResults, setImportResults] = useState<ImportRowResult[] | null>(null)

  const onCsvChosen = async (file: File) => {
    const text = await file.text()
    const { rows } = parseCsv(text)
    const students: ParsedStudent[] = rows.map((r) => {
      const s: ParsedStudent = {
        firstName: r.first_name ?? '',
        lastName: r.last_name ?? '',
        email: (r.email ?? '').toLowerCase(),
        yearGroup: Number(r.year_group) || 0,
        form: (r.form ?? '').toUpperCase(),
        house: r.house ?? '',
        pin: /^\d{4,6}$/.test(r.pin ?? '') ? r.pin : randomPin(),
      }
      if (!s.firstName || !s.lastName) s.problem = 'missing name'
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) s.problem = 'invalid email'
      else if (s.yearGroup < 1 || s.yearGroup > 14) s.problem = 'invalid year_group'
      else if (!s.form) s.problem = 'missing form'
      return s
    })
    setImportResults(null)
    setParsed(students)
  }

  const runImport = async () => {
    if (!parsed || importing) return
    const valid = parsed.filter((p) => !p.problem)
    setImporting(true)
    setProgress({ done: 0, total: valid.length })
    const results = await importStudents(valid, (done, total) => setProgress({ done, total }))
    setImporting(false)
    setImportResults(results)
    setParsed(null)
    refetch()
  }

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

  const resetPin = async (id: string, name: string) => {
    const newPin = randomPin()
    const result = await resetStudentPin(id, newPin)
    if (!result.ok) setError(result.error)
    else setSuccess(`${name}'s PIN has been reset to ${newPin} — hand it over securely`)
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
        <div className="flex gap-2">
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
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
            download="portalpass-students-template.csv"
          >
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" /> Template
            </Button>
          </a>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setSuccess('') }}>
            {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add student'}
          </Button>
        </div>
      </header>

      {/* CSV preview + import */}
      {parsed && !importing && (
        <Card className="animate-fade-up p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">
              Ready to import {parsed.filter((p) => !p.problem).length} students
              {parsed.some((p) => p.problem) &&
                ` (${parsed.filter((p) => p.problem).length} rows skipped)`}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setParsed(null)}>Cancel</Button>
              <Button size="sm" onClick={runImport} disabled={parsed.every((p) => p.problem)}>
                <Upload className="h-4 w-4" /> Import now
              </Button>
            </div>
          </div>
          <div className="mt-3 max-h-56 space-y-1 overflow-y-auto text-sm">
            {parsed.slice(0, 50).map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-1.5">
                <span className="truncate">
                  {p.firstName} {p.lastName} · {p.email} · Y{p.yearGroup} {p.form}
                </span>
                {p.problem ? (
                  <Badge variant="red">{p.problem}</Badge>
                ) : (
                  <Badge variant="green">PIN {p.pin}</Badge>
                )}
              </div>
            ))}
            {parsed.length > 50 && (
              <p className="px-3 py-1 text-xs text-muted-foreground">…and {parsed.length - 50} more</p>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Accounts are created one by one to respect sign-up rate limits — a large
            school import runs at roughly 100–150 students per minute.
          </p>
        </Card>
      )}

      {importing && (
        <Card className="p-5">
          <h2 className="font-bold">Importing… {progress.done} of {progress.total}</h2>
          <Progress value={(progress.done / Math.max(1, progress.total)) * 100} className="mt-3" />
        </Card>
      )}

      {importResults && (
        <Card className="animate-fade-up p-5">
          <h2 className="font-bold">
            Import finished — {importResults.filter((r) => !r.error).length} enrolled,{' '}
            {importResults.filter((r) => r.error).length} failed
          </h2>
          {importResults.some((r) => r.error) && (
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {importResults.filter((r) => r.error).map((r) => (
                <div key={r.row} className="rounded-lg bg-red-50 px-3 py-1.5 text-red-700 dark:bg-red-950/40 dark:text-red-300">
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
                    onClick={() => resetPin(s.id, s.firstName)}
                    aria-label="Reset PIN"
                  >
                    <KeyRound className="h-4 w-4" /> Reset PIN
                  </Button>
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
