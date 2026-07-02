import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, Palette, School, Sun, SunMoon, Type } from 'lucide-react'
import { ACCENTS, useApp, type FontSize, type ThemeMode } from '@/lib/store'
import { Button, Card, SegmentedControl } from '@/components/ui'
import { cn } from '@/lib/utils'
import { currentStudent } from '@/lib/mockData'

const AVATARS = ['😎', '🦊', '🚀', '🌟', '⚽', '🎨', '🎮', '📚', '🐱', '🦄', '🔥', '🎧']

export default function Account() {
  const { prefs, setPrefs, logout } = useApp()
  const navigate = useNavigate()

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="pt-2">
        <h1 className="text-2xl font-black tracking-tight">My Account</h1>
      </header>

      <Card className="flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-soft text-4xl">
          {currentStudent.avatarEmoji}
        </div>
        <div>
          <p className="text-lg font-black">
            {currentStudent.firstName} {currentStudent.lastName}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <School className="h-3.5 w-3.5" />
            Springwood High · {currentStudent.form} · {currentStudent.house}
          </p>
        </div>
      </Card>

      {/* Avatar picker */}
      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <span className="text-lg">🧑‍🎨</span> Your avatar
        </h2>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              className={cn(
                'flex h-11 items-center justify-center rounded-xl text-2xl transition-all hover:scale-110',
                a === currentStudent.avatarEmoji ? 'bg-accent-soft ring-2 ring-accent' : 'bg-muted',
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      {/* Theme */}
      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <SunMoon className="h-5 w-5 text-accent" /> Appearance
        </h2>
        <SegmentedControl<ThemeMode>
          options={[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Auto', value: 'auto' },
          ]}
          value={prefs.themeMode}
          onChange={(v) => setPrefs({ themeMode: v })}
        />
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sun className="h-3.5 w-3.5" /> Auto follows your device setting <Moon className="h-3.5 w-3.5" />
        </div>
      </Card>

      {/* Accent color */}
      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Palette className="h-5 w-5 text-accent" /> Accent colour
        </h2>
        <div className="flex justify-between">
          {ACCENTS.map((a) => (
            <button
              key={a.name}
              title={a.name}
              onClick={() => setPrefs({ accent: a.value })}
              className={cn(
                'h-11 w-11 rounded-2xl transition-all hover:scale-110',
                prefs.accent === a.value && 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card',
              )}
              style={{ background: `hsl(${a.value})` }}
              aria-label={`${a.name} accent`}
            />
          ))}
        </div>
      </Card>

      {/* Font size */}
      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Type className="h-5 w-5 text-accent" /> Text size
        </h2>
        <SegmentedControl<FontSize>
          options={[
            { label: 'S', value: 'small' },
            { label: 'M', value: 'normal' },
            { label: 'L', value: 'large' },
            { label: 'XL', value: 'xl' },
          ]}
          value={prefs.fontSize}
          onChange={(v) => setPrefs({ fontSize: v })}
        />
      </Card>

      <Button
        variant="danger"
        className="w-full"
        onClick={() => {
          logout()
          navigate('/')
        }}
      >
        <LogOut className="h-4 w-4" /> Log out
      </Button>

      <p className="pb-2 text-center text-xs text-muted-foreground">PortalPass v0.1.0</p>
    </div>
  )
}
