import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useApp } from '@/lib/store'
import { cachedSchool, emailLogin } from '@/lib/api'

export default function StaffLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useApp()
  const navigate = useNavigate()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password || busy) return
    setBusy(true)
    setError('')
    const result = await emailLogin(email, password, 'staff')
    setBusy(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    login(result.role, result.name)
    navigate('/staff')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 p-6">
      <Card className="w-full max-w-sm animate-fade-up border-0 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black">Teacher Portal</h1>
          <p className="text-sm text-muted-foreground">{cachedSchool().name}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="email"
            placeholder="School email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo: okafor@springwood.sch.uk · PortalPass-Demo-2026
        </p>
      </Card>
    </div>
  )
}
