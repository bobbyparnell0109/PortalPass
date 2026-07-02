import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, Fingerprint } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/store'
import { currentStudent, DEMO_PIN } from '@/lib/mockData'

const PIN_LENGTH = 5

export default function PinLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const { login, session } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (session?.role === 'student') navigate('/app', { replace: true })
  }, [session, navigate])

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return
    if (pin === DEMO_PIN) {
      setSuccess(true)
      const t = setTimeout(() => {
        login('student', `${currentStudent.firstName} ${currentStudent.lastName}`)
        navigate('/app')
      }, 450)
      return () => clearTimeout(t)
    }
    setError(true)
    const t = setTimeout(() => {
      setPin('')
      setError(false)
    }, 500)
    return () => clearTimeout(t)
  }, [pin, login, navigate])

  const press = (d: string) => {
    if (pin.length < PIN_LENGTH && !success) setPin(pin + d)
  }
  const backspace = () => setPin(pin.slice(0, -1))

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-violet-600 to-fuchsia-600 px-6 py-12 text-white">
      <div className="flex flex-col items-center gap-2 pt-8 text-center animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 text-3xl backdrop-blur">
          {currentStudent.avatarEmoji}
        </div>
        <h1 className="mt-2 text-2xl font-black">Hey {currentStudent.firstName}!</h1>
        <p className="text-white/70">Enter your {PIN_LENGTH}-digit PIN</p>
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
          <KeypadButton
            aria-label="Biometric login"
            onClick={() => {
              // Demo: biometrics resolve instantly. On device this calls
              // the platform WebAuthn / Face ID API.
              setSuccess(true)
              setTimeout(() => {
                login('student', `${currentStudent.firstName} ${currentStudent.lastName}`)
                navigate('/app')
              }, 450)
            }}
          >
            <Fingerprint className="mx-auto h-6 w-6" />
          </KeypadButton>
          <KeypadButton onClick={() => press('0')}>0</KeypadButton>
          <KeypadButton aria-label="Delete digit" onClick={backspace}>
            <Delete className="mx-auto h-6 w-6" />
          </KeypadButton>
        </div>
        <button className="mt-6 w-full text-center text-sm font-semibold text-white/70 hover:text-white">
          Forgot PIN?
        </button>
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
