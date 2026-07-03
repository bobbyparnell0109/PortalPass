import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Users, ShieldCheck, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui'

const portals = [
  {
    to: '/login',
    icon: GraduationCap,
    title: 'Student App',
    desc: 'PIN login, your dashboard, timetable, homework and more',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    to: '/parent/login',
    icon: Users,
    title: 'Parent Portal',
    desc: "Track your child's progress, attendance and lunch account",
    gradient: 'from-sky-500 to-cyan-400',
  },
  {
    to: '/staff/login',
    icon: BookOpen,
    title: 'Teacher Portal',
    desc: 'Take registers, set homework and enter grades for your classes',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    to: '/admin/login',
    icon: ShieldCheck,
    title: 'School Admin',
    desc: 'Manage students, timetables, attendance and announcements',
    gradient: 'from-emerald-500 to-teal-400',
  },
]

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-6">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-10 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">PortalPass</h1>
          <p className="mt-2 text-white/80">
            The school platform students actually want to open
          </p>
        </div>
        <div className="space-y-4">
          {portals.map((p) => (
            <Link key={p.to} to={p.to} className="block">
              <Card className="flex items-center gap-4 border-0 p-5 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lg`}
                >
                  <p.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-white/60">
          Live demo backed by Supabase — student PIN 12345 · parent@portalpass.demo /
          admin@springwood.sch.uk with password PortalPass-Demo-2026
        </p>
      </div>
    </div>
  )
}
