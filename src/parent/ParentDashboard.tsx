import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BookOpen, TrendingUp, Utensils, Wallet } from 'lucide-react'
import { Badge, Button, Card, Progress } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/store'
import {
  fetchGrades,
  fetchHomework,
  fetchMyStudent,
  fetchTransactions,
  useQuery,
} from '@/lib/api'
import {
  currentStudent,
  grades as mockGrades,
  homework as mockHomework,
  transactions as mockTransactions,
} from '@/lib/mockData'

export default function ParentDashboard() {
  const { school } = useApp()
  const { data: child } = useQuery(fetchMyStudent, currentStudent)
  const { data: grades } = useQuery(fetchGrades, mockGrades)
  const { data: homework } = useQuery(fetchHomework, mockHomework)
  const { data: transactions } = useQuery(fetchTransactions, mockTransactions)
  const avg = Math.round(grades.reduce((s, g) => s + g.score, 0) / Math.max(1, grades.length))
  const pendingHw = homework.filter((h) => h.status !== 'completed').length
  const overdueHw = homework.filter((h) => h.status === 'overdue').length
  const balance = child.lunchBalance
  const lowBalance = balance < 5

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Child selector — becomes tabs when a parent has multiple children */}
      <Card className="flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
          {child.avatarEmoji}
        </div>
        <div className="flex-1">
          <p className="text-lg font-black">
            {child.firstName} {child.lastName}
          </p>
          <p className="text-sm text-muted-foreground">
            Year {child.yearGroup} · {child.form} · {school.name}
          </p>
        </div>
        <Badge variant="green">Active</Badge>
      </Card>

      {(lowBalance || overdueHw > 0) && (
        <Card className="space-y-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Needs your attention
          </p>
          {lowBalance && (
            <p className="text-sm text-amber-700/90 dark:text-amber-300/90">
              Lunch balance is {formatCurrency(balance)} — consider topping up.
            </p>
          )}
          {overdueHw > 0 && (
            <p className="text-sm text-amber-700/90 dark:text-amber-300/90">
              {overdueHw} piece{overdueHw > 1 ? 's' : ''} of homework overdue.
            </p>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Attendance</p>
          <p className="text-2xl font-black">{child.attendancePct}%</p>
          <Progress value={child.attendancePct} className="mt-2" />
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Average grade</p>
          <p className="text-2xl font-black">{avg}%</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 4% vs last term</p>
        </Card>
        <Card className="p-4">
          <div
            className={cn(
              'mb-2 flex h-9 w-9 items-center justify-center rounded-xl',
              lowBalance
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
            )}
          >
            <Wallet className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Lunch balance</p>
          <p className="text-2xl font-black">{formatCurrency(balance)}</p>
          <Link to="/parent/topup">
            <Button variant="soft" size="sm" className="mt-2 w-full">
              Top up <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Grades by subject</h2>
          <div className="space-y-3">
            {grades.slice(0, 5).map((g) => (
              <div key={g.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold">{g.subject}</span>
                  <span className="text-muted-foreground">
                    Grade {g.grade} · {g.score}%
                  </span>
                </div>
                <Progress value={g.score} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Utensils className="h-4 w-4 text-accent" /> Recent lunch activity
          </h2>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <p className={cn('shrink-0 font-bold', tx.amount > 0 && 'text-emerald-600')}>
                  {tx.amount > 0 ? '+' : ''}
                  {formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-bold">Homework this week</h2>
        <div className="space-y-2">
          {homework.slice(0, 4).map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
              <div>
                <p className="font-semibold">
                  {h.subject}: {h.title}
                </p>
                <p className="text-xs text-muted-foreground">Due {h.dueDate}</p>
              </div>
              <Badge
                variant={h.status === 'completed' ? 'green' : h.status === 'overdue' ? 'red' : 'amber'}
              >
                {h.status}
              </Badge>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {pendingHw} outstanding · You'll get a weekly digest every Friday
        </p>
      </Card>
    </div>
  )
}
