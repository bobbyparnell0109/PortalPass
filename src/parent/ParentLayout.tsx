import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { useApp } from '@/lib/store'

export default function ParentLayout() {
  const { logout } = useApp()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/parent" className="flex items-center gap-2 font-black">
            <Sparkles className="h-5 w-5 text-accent" /> PortalPass
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
              Parent
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
