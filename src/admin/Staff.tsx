import { useState, type FormEvent } from 'react'
import { UserPlus, X } from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { createTeacher, fetchStaff, fetchSubjects, tempStaffPassword, useQuery } from '@/lib/api'
import { staff as mockStaff } from '@/lib/mockData'

export default function Staff() {
  const { data: staff, refetch } = useQuery(fetchStaff, mockStaff)
  const { data: subjects } = useQuery(fetchSubjects, [])
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [subjectSel, setSubjectSel] = useState<string[]>([])
  const [password, setPassword] = useState(tempStaffPassword)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const toggleSubject = (name: string) =>
    setSubjectSel((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const result = await createTeacher({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      title: title.trim() || 'Teacher',
      subjects: subjectSel,
      password,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess(`${firstName} ${lastName} added — their sign-in password is \"${password}\". Pass it on securely; they log in at the Teacher Portal.`)
    setShowForm(false)
    setFirstName(''); setLastName(''); setEmail(''); setTitle(''); setSubjectSel([])
    setPassword(tempStaffPassword())
    refetch()
    setTimeout(() => setSuccess(''), 5000)
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">{staff.length} teachers</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add teacher'}
        </Button>
      </header>

      {success && (
        <Card className="animate-pop-in border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✅ {success}
        </Card>
      )}

      {showForm && (
        <Card className="animate-fade-up p-5">
          <h2 className="mb-4 font-bold">New teacher</h2>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <Input type="email" placeholder="School email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Role title, e.g. Head of Maths" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Initial password (give this to the teacher)
              </label>
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" required />
                <Button type="button" variant="outline" onClick={() => setPassword(tempStaffPassword())}>
                  Regenerate
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Subjects taught</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.name)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                      subjectSel.includes(s.name)
                        ? 'text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    style={subjectSel.includes(s.name) ? { background: `hsl(${s.color})` } : undefined}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Add teacher'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold">{t.name}</p>
                <p className="truncate text-sm text-muted-foreground">{t.role}</p>
              </div>
              <Badge variant={t.onSite ? 'green' : 'neutral'}>
                {t.onSite ? 'On site' : 'Off site'}
              </Badge>
            </div>
            <p className="mt-2 truncate text-xs text-muted-foreground">{t.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.subjects.map((s) => (
                <Badge key={s} variant="accent">{s}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
