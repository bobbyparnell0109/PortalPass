import { useEffect, useState } from 'react'
import { Check, Palette, School as SchoolIcon, Save } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { cachedSchool, fetchSchool, updateSchool } from '@/lib/api'

const BRAND_PRESETS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#ca8a04', '#ea580c', '#dc2626', '#db2777',
]

export default function SchoolSettings() {
  const [name, setName] = useState(cachedSchool().name)
  const [color, setColor] = useState(cachedSchool().primaryColor)
  const [hoursStart, setHoursStart] = useState(cachedSchool().hoursStart)
  const [hoursEnd, setHoursEnd] = useState(cachedSchool().hoursEnd)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchSchool().then((s) => {
      if (!active) return
      setName(s.name)
      setColor(s.primaryColor)
      setHoursStart(s.hoursStart)
      setHoursEnd(s.hoursEnd)
    })
    return () => {
      active = false
    }
  }, [])

  const save = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    setSaved(false)
    const result = await updateSchool({ name, primaryColor: color, hoursStart, hoursEnd })
    setSaving(false)
    if (result.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <header>
        <h1 className="text-2xl font-black tracking-tight">School settings</h1>
        <p className="text-sm text-muted-foreground">
          Make PortalPass your school's own — these apply across the student
          and parent apps instantly
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <SchoolIcon className="h-4 w-4 text-accent" /> Identity
        </h2>
        <div>
          <label className="mb-1 block text-sm font-semibold">School name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" />
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on login screens, the student's account page and parent portal
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Day starts</label>
            <Input type="time" value={hoursStart} onChange={(e) => setHoursStart(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Day ends</label>
            <Input type="time" value={hoursEnd} onChange={(e) => setHoursEnd(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <Palette className="h-4 w-4 text-accent" /> Brand colour
        </h2>
        <p className="text-sm text-muted-foreground">
          The default accent colour every student and parent sees. Students can
          still pick their own in personalisation settings.
        </p>
        <div className="flex flex-wrap gap-2">
          {BRAND_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-all hover:scale-110',
                color.toLowerCase() === c && 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card',
              )}
              style={{ background: c }}
              aria-label={`Brand colour ${c}`}
            >
              {color.toLowerCase() === c && <Check className="h-5 w-5" />}
            </button>
          ))}
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-border px-3">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#7c3aed'}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Custom brand colour"
            />
            <span className="font-mono text-xs">{color}</span>
          </label>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: color }}>
          <p className="font-black">{name || 'Your school'}</p>
          <p className="text-sm text-white/80">This is how your brand colour looks in the apps</p>
        </div>
      </Card>

      {error && (
        <Card className="border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Couldn't save: {error}
          {error.includes('policy') && ' — the school_operations migration (0004) may not be applied yet.'}
        </Card>
      )}
      {saved && (
        <Card className="animate-pop-in border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✅ Saved — students and parents see the new branding on their next refresh
        </Card>
      )}
      <Button onClick={save} disabled={saving || !name.trim()}>
        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  )
}
