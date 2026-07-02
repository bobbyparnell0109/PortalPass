import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useApp } from '@/lib/store'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useApp()
  const navigate = useNavigate()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    // Demo auth. Production: Supabase Auth with staff RBAC roles.
    login('admin', email)
    navigate('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Card className="w-full max-w-sm animate-fade-up border-slate-800 bg-slate-900 p-8 text-slate-100 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black">PortalPass Admin</h1>
          <p className="text-sm text-slate-400">Springwood High School</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="email"
            placeholder="Staff email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" size="lg">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  )
}
