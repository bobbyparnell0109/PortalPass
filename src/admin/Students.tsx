import { useMemo, useState } from 'react'
import { Download, Search, Upload, UserPlus } from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { fetchAllStudents, useQuery } from '@/lib/api'
import { allStudents as mockStudents } from '@/lib/mockData'

export default function Students() {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState<'all' | number>('all')
  const { data: allStudents } = useQuery(fetchAllStudents, mockStudents)

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

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">{allStudents.length} on roll</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4" /> Add student
          </Button>
        </div>
      </header>

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
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Year / Form</th>
              <th className="px-4 py-3">House</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Lunch balance</th>
              <th className="px-4 py-3">Status</th>
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
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
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
