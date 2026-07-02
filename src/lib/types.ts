export type Role = 'student' | 'parent' | 'staff' | 'admin'

export interface Student {
  id: string
  firstName: string
  lastName: string
  yearGroup: number
  form: string
  house: string
  email: string
  status: 'active' | 'left' | 'moved'
  attendancePct: number
  lunchBalance: number
  streakDays: number
  avatarEmoji: string
}

export interface Lesson {
  id: string
  subject: string
  teacher: string
  room: string
  building: string
  day: number // 0 = Monday
  start: string // "09:00"
  end: string
  color: string // tailwind-safe hsl string
}

export interface HomeworkItem {
  id: string
  subject: string
  title: string
  description: string
  teacher: string
  setDate: string
  dueDate: string
  estimatedMinutes?: number
  status: 'pending' | 'completed' | 'overdue'
}

export interface GradeEntry {
  id: string
  subject: string
  assessment: string
  grade: string
  score: number // 0-100 normalized for charts
  term: string
  feedback: string
  trend: 'up' | 'stable' | 'down'
}

export interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'late'
  reason?: string
  minutesLate?: number
}

export interface Announcement {
  id: string
  title: string
  body: string
  category: 'academic' | 'events' | 'important' | 'social'
  audience: string
  pinned: boolean
  createdAt: string
  read: boolean
}

export interface Message {
  id: string
  threadId: string
  from: string
  fromRole: Role
  body: string
  sentAt: string
  read: boolean
}

export interface MessageThread {
  id: string
  participant: string
  participantRole: Role
  subjectLine: string
  messages: Message[]
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number // negative = purchase, positive = top-up
  type: 'purchase' | 'topup' | 'refund'
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  category: 'exam' | 'holiday' | 'assembly' | 'trip' | 'club'
}

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  earned: boolean
  earnedAt?: string
}

export interface StaffMember {
  id: string
  name: string
  role: string
  subjects: string[]
  email: string
  onSite: boolean
}
