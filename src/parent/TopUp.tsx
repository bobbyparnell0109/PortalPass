import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import { currentStudent } from '@/lib/mockData'

const AMOUNTS = [5, 10, 15, 20, 30, 50]

export default function TopUp() {
  const [amount, setAmount] = useState(15)
  const [autoTopUp, setAutoTopUp] = useState(false)
  const [done, setDone] = useState(false)

  const pay = () => {
    // Demo flow. Production creates a Stripe Checkout session via a
    // Supabase Edge Function and confirms by webhook before crediting.
    setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md animate-pop-in text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl dark:bg-emerald-950">
          ✅
        </div>
        <h1 className="text-2xl font-black">Top-up complete!</h1>
        <p className="mt-2 text-muted-foreground">
          {formatCurrency(amount)} added to {currentStudent.firstName}'s lunch account.
          A receipt has been emailed to you.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          New balance: <strong>{formatCurrency(currentStudent.lunchBalance + amount)}</strong>
        </p>
        <Link to="/parent">
          <Button className="mt-6">Back to dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 animate-fade-up">
      <Link to="/parent" className="flex items-center gap-1 text-sm font-semibold text-accent">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <header>
        <h1 className="text-2xl font-black tracking-tight">Top up lunch account</h1>
        <p className="text-sm text-muted-foreground">
          {currentStudent.firstName}'s balance: {formatCurrency(currentStudent.lunchBalance)}
        </p>
      </header>

      <Card className="p-5">
        <h2 className="mb-3 font-bold">Choose amount</h2>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={cn(
                'rounded-xl py-3 font-bold transition-all',
                amount === a
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25 scale-105'
                  : 'bg-muted hover:bg-muted/70',
              )}
            >
              £{a}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-accent" />
          <div>
            <p className="font-bold">Auto top-up</p>
            <p className="text-xs text-muted-foreground">
              Add {formatCurrency(amount)} every Monday at 8am
            </p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={autoTopUp}
          onClick={() => setAutoTopUp(!autoTopUp)}
          className={cn(
            'h-7 w-12 rounded-full p-1 transition-colors',
            autoTopUp ? 'bg-accent' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'block h-5 w-5 rounded-full bg-white shadow transition-transform',
              autoTopUp && 'translate-x-5',
            )}
          />
        </button>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <CreditCard className="h-5 w-5 text-accent" /> Payment method
        </h2>
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-muted text-xs font-black">
              VISA
            </div>
            <p className="text-sm font-semibold">•••• 4242</p>
          </div>
          <Badge variant="accent">Default</Badge>
        </div>
      </Card>

      <Button size="lg" className="w-full" onClick={pay}>
        Pay {formatCurrency(amount)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Payments processed securely by Stripe
      </p>
    </div>
  )
}
