import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { HomeworkItem, Role } from './types'
import { homework as seedHomework, messageThreads } from './mockData'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type FontSize = 'small' | 'normal' | 'large' | 'xl'

export interface AccentOption {
  name: string
  value: string // hsl triple
  soft: string
  softDark: string
}

export const ACCENTS: AccentOption[] = [
  { name: 'Violet', value: '262 83% 58%', soft: '262 90% 96%', softDark: '262 40% 18%' },
  { name: 'Ocean', value: '217 91% 55%', soft: '217 92% 95%', softDark: '217 45% 17%' },
  { name: 'Emerald', value: '160 84% 39%', soft: '158 76% 93%', softDark: '160 45% 14%' },
  { name: 'Sunset', value: '21 90% 52%', soft: '24 100% 94%', softDark: '21 50% 16%' },
  { name: 'Bubblegum', value: '330 81% 56%', soft: '327 87% 95%', softDark: '330 45% 17%' },
  { name: 'Gold', value: '38 92% 45%', soft: '45 96% 92%', softDark: '38 50% 15%' },
]

interface Prefs {
  themeMode: ThemeMode
  accent: string
  fontSize: FontSize
  compact: boolean
}

const DEFAULT_PREFS: Prefs = {
  themeMode: 'auto',
  accent: ACCENTS[0].value,
  fontSize: 'normal',
  compact: false,
}

const FONT_SCALE: Record<FontSize, number> = {
  small: 0.9,
  normal: 1,
  large: 1.1,
  xl: 1.2,
}

interface Session {
  role: Role
  name: string
}

interface AppState {
  session: Session | null
  login: (role: Role, name: string) => void
  logout: () => void
  prefs: Prefs
  setPrefs: (p: Partial<Prefs>) => void
  isDark: boolean
  homework: HomeworkItem[]
  toggleHomework: (id: string) => void
  unreadMessages: number
}

const AppContext = createContext<AppState | null>(null)

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('pp-prefs')
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    /* corrupted prefs fall back to defaults */
  }
  return DEFAULT_PREFS
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem('pp-session')
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [homework, setHomework] = useState<HomeworkItem[]>(seedHomework)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark =
    prefs.themeMode === 'dark' || (prefs.themeMode === 'auto' && systemDark)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.style.setProperty('--accent', prefs.accent)
    const accent = ACCENTS.find((a) => a.value === prefs.accent) ?? ACCENTS[0]
    root.style.setProperty('--accent-soft', isDark ? accent.softDark : accent.soft)
    root.style.setProperty('--font-scale', String(FONT_SCALE[prefs.fontSize]))
  }, [isDark, prefs.accent, prefs.fontSize])

  useEffect(() => {
    localStorage.setItem('pp-prefs', JSON.stringify(prefs))
  }, [prefs])

  const login = useCallback((role: Role, name: string) => {
    const s = { role, name }
    setSession(s)
    localStorage.setItem('pp-session', JSON.stringify(s))
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem('pp-session')
  }, [])

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefsState((prev) => ({ ...prev, ...p }))
  }, [])

  const toggleHomework = useCallback((id: string) => {
    setHomework((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, status: h.status === 'completed' ? 'pending' : 'completed' }
          : h,
      ),
    )
  }, [])

  const unreadMessages = useMemo(
    () =>
      messageThreads.reduce(
        (n, t) => n + t.messages.filter((m) => !m.read).length,
        0,
      ),
    [],
  )

  const value = useMemo(
    () => ({
      session,
      login,
      logout,
      prefs,
      setPrefs,
      isDark,
      homework,
      toggleHomework,
      unreadMessages,
    }),
    [session, login, logout, prefs, setPrefs, isDark, homework, toggleHomework, unreadMessages],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
