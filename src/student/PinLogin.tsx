import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Delete, Fingerprint } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { cachedSchool, studentPinLogin } from '@/lib/api'
import { DEMO_STUDENT_EMAIL } from '@/lib/supabase'

const PIN_LENGTH = 5

interface Paired {
  email: string
  name: string
  avatarEmoji: string
}

function loadPaired(): Paired | null {
  try {
    const raw = localStorage.getItem('pp-paired')
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

export default function PinLogin() {
  const [paired, setPaired] = useState<Paired | null>(loadPaired)
  const [emailDraft, setEmailDraft] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(false)
  const { login, session } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (session?.role === 'student') navigate('/app', { replace: true })
  }, [session, navigate])

  const finishLogin = (result: { role: 'student'; name: string }, email: string) => {
    const p: Paired = {
      email,
      name: result.name.split(' ')[0],
      avatarEmoji: paired?.avatarEmoji ?? '🎒',
    }
    localStorage.setItem('pp-paired', JSON.stringify(p))
    setSuccess(true)
    setTimeout(() => {
      login(result.role, result.name)
      navigate('/app')
    }, 450)
  }

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || checking || !paired) return
    let active = true
    setChecking(true)
    studentPinLogin(paired.email, pin).then((result) => {
      if (!active) return
      setChecking(false)
      if (result) {
        finishLogin({ role: 'student', name: result.name }, paired.email)
      } else {
        setError(true)
        setTimeout(() => {
          setPin('')
          setError(false)
        }, 500)
      }
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const press = (d: string) => {
    if (pin.length < PIN_LENGTH && !success && !checking) setPin(pin + d)
  }
  const backspace = () => {
    if (!checking) setPin(pin.slice(0, -1))
  }

  const biometric = async () => {
    // Demo: biometrics resolve via the demo student's PIN. On device this
    // calls the platform WebAuthn / Face ID API instead.
    if (checking || success || !paired) return
    if (paired.email !== DEMO_STUDENT_EMAIL) return
    setChecking(true)
    const result = await studentPinLogin(paired.email, '12345')
    setChecking(false)
    if (result) finishLogin({ role: 'student', name: result.name }, paired.email)
  }

  const pairDevice = (e: FormEvent) => {
    e.preventDefault()
    const email = emailDraft.trim().toLowerCase()
    if (!email.includes('@')) return
    const p: Paired = { email, name: email.split(/[.@]/)[0], avatarEmoji: '🎒' }
    localStorage.setItem('pp-paired', JSON.stringify(p))
    setPaired(p)
    setPin('')
  }

  // ---- First run on this device: pair it with the student ----
  if (!paired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-violet-600 to-fuchsia-600 px-6 py-12 text-white">
        <div className="w-full max-w-sm animate-fade-up text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-3xl backdrop-blur">
            🎒
          </div>
          <h1 className="text-2xl font-black">Welcome to {cachedSchool().name}</h1>
          <p className="mt-2 text-white/70">
            First time on this device — enter your school email once, then it's
            just your PIN from here on
          </p>
          <form onSubmit={pairDevice} className="mt-8 space-y-3">
            <input
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              placeholder="you@school.co.uk"
              autoComplete="email"
              className="h-13 w-full rounded-2xl border-0 bg-white/15 px-5 py-3.5 text-center text-white placeholder:text-white/50 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-violet-700 transition-transform active:scale-95"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <button
            onClick={() => {
              setEmailDraft(DEMO_STUDENT_EMAIL)
            }}
            className="mt-6 text-sm font-semibold text-white/70 hover:text-white"
          >
            Trying the demo? Tap for Bobby's email
          </button>
        </div>
      </div>
    )
  }

  // ---- Paired: PIN unlock ----
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-violet-600 to-fuchsia-600 px-6 py-12 text-white">
      <div className="flex flex-col items-center gap-2 pt-8 text-center animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-3xl backdrop-blur">
          {paired.avatarEmoji}
        </div>
        <h1 className="mt-2 text-2xl font-black">
          Hey {paired.name.charAt(0).toUpperCase() + paired.name.slice(1)}!
        </h1>
        <p className="text-white/70">
          {checking ? 'Checking…' : `Enter your ${PIN_LENGTH}-digit PIN`}
        </p>
      </div>

      <div className={cn('flex gap-4', error && 'animate-shake')}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 w-4 rounded-full border-2 border-white/60 transition-all duration-150',
              i < pin.length && 'scale-110 border-white bg-white',
              success && 'border-emerald-300 bg-emerald-300',
              error && 'border-red-300 bg-red-300',
              checking && 'animate-pulse',
            )}
          />
        ))}
      </div>

      <div className="w-full max-w-xs">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <KeypadButton key={d} onClick={() => press(d)}>
              {d}
            </KeypadButton>
          ))}
          <KeypadButton aria-label="Biometric login" onClick={biometric}>
            <Fingerprint className="mx-auto h-6 w-6" />
          </KeypadButton>
          <KeypadButton onClick={() => press('0')}>0</KeypadButton>
          <KeypadButton aria-label="Delete digit" onClick={backspace}>
            <Delete className="mx-auto h-6 w-6" />
          </KeypadButton>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm font-semibold text-white/70">
          <button className="hover:text-white">Forgot PIN?</button>
          <button
            className="hover:text-white"
            onClick={() => {
              localStorage.removeItem('pp-paired')
              setPaired(null)
              setPin('')
              setEmailDraft('')
            }}
          >
            Not {paired.name.charAt(0).toUpperCase() + paired.name.slice(1)}? Switch
          </button>
        </div>
      </div>
    </div>
  )
}

function KeypadButton({
  children,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  'aria-label'?: string
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className="h-16 rounded-2xl bg-white/10 text-2xl font-bold backdrop-blur transition-all hover:bg-white/20 active:scale-90 active:bg-white/30"
    >
      {children}
    </button>
  )
}
