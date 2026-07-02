import { ArrowDownLeft, ArrowUpRight, QrCode } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import { currentStudent, transactions } from '@/lib/mockData'

export default function LunchAccount() {
  const balance = currentStudent.lunchBalance
  const low = balance < 5
  const critical = balance < 2

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="pt-2">
        <h1 className="text-2xl font-black tracking-tight">Lunch account</h1>
      </header>

      <Card
        className={cn(
          'border-0 p-5 text-white shadow-lg',
          critical
            ? 'bg-gradient-to-br from-red-500 to-rose-500 shadow-red-500/25'
            : low
              ? 'bg-gradient-to-br from-amber-500 to-orange-400 shadow-amber-500/25'
              : 'bg-gradient-to-br from-emerald-500 to-teal-400 shadow-emerald-500/25',
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/80">Current balance</p>
            <p className="text-4xl font-black">{formatCurrency(balance)}</p>
            {low && (
              <p className="mt-1 text-sm text-white/90">
                Running low — ask a parent to top up 💳
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <QrCode className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-4 text-xs text-white/70">Card •••• 8841 · Show QR at the till</p>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-bold">Recent activity</h2>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  tx.amount > 0
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400',
                )}
              >
                {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className={cn('font-bold', tx.amount > 0 ? 'text-emerald-600' : '')}>
                {tx.amount > 0 ? '+' : ''}
                {formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="font-bold">Top-ups</p>
          <p className="text-sm text-muted-foreground">Handled by your parent in the Parent Portal</p>
        </div>
        <Badge variant="accent">Stripe secured</Badge>
      </Card>
    </div>
  )
}
