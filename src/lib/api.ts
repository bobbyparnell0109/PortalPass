import { useEffect, useState } from 'react'
import { supabase, DEMO_PASSWORD, DEMO_STUDENT_EMAIL } from './supabase'
import type {
  Announcement,
  AttendanceRecord,
  CalendarEvent,
  GradeEntry,
  HomeworkItem,
  Lesson,
  Message,
  MessageThread,
  Role,
  StaffMember,
  Student,
  Transaction,
} from './types'
import * as mock from './mockData'

// Data layer: every fetcher queries Supabase and falls back to the mock
// dataset if the backend is unreachable (e.g. the free project is paused),
// so the app always renders.

const todayISO = () => new Date().toISOString().slice(0, 10)

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.warn('[api] falling back to demo data:', err)
    return fallback
  }
}

function throwOnError<T>(res: { data: T | null; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null || res.data === undefined) throw new Error('no data')
  return res.data
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginResult {
  role: Role
  name: string
}

export async function studentPinLogin(pin: string): Promise<LoginResult | null> {
  return withFallback(
    async () => {
      const ok = throwOnError(
        await supabase.rpc('verify_pin', { user_email: DEMO_STUDENT_EMAIL, pin }),
      )
      if (!ok) return null
      // Demo: PIN unlocks the seeded student session. Production swaps this
      // for an edge function that mints the session after PIN verification.
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_STUDENT_EMAIL,
        password: DEMO_PASSWORD,
      })
      if (error) throw new Error(error.message)
      const profile = await fetchMyProfile()
      return { role: 'student', name: profile?.name ?? 'Student' }
    },
    pin === mock.DEMO_PIN
      ? { role: 'student' as Role, name: `${mock.currentStudent.firstName} ${mock.currentStudent.lastName}` }
      : null,
  )
}

export async function emailLogin(
  email: string,
  password: string,
  expectedRole: Role,
): Promise<LoginResult | { error: string }> {
  return withFallback<LoginResult | { error: string }>(
    async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      const profile = await fetchMyProfile()
      if (!profile) return { error: 'No profile found for this account' }
      if (profile.role !== expectedRole) {
        await supabase.auth.signOut()
        return { error: `This account is a ${profile.role} account — use the right portal` }
      }
      return { role: profile.role, name: profile.name }
    },
    // Offline demo mode: accept anything, like the original scaffold did
    { role: expectedRole, name: email },
  )
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } catch {
    /* already signed out or offline */
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

async function fetchMyProfile(): Promise<{ role: Role; name: string } | null> {
  const uid = await currentUserId()
  if (!uid) return null
  const row = throwOnError(
    await supabase
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', uid)
      .single(),
  ) as { role: Role; first_name: string; last_name: string }
  return { role: row.role, name: `${row.first_name} ${row.last_name}` }
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

interface OverviewRow {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_emoji: string
  year_group: number
  form: string
  house: string
  status: string
  lunch_balance_pence: number
  streak_days: number
  attendance_pct: number
}

function mapOverview(r: OverviewRow): Student {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    yearGroup: r.year_group,
    form: r.form,
    house: r.house,
    email: r.email,
    status: r.status as Student['status'],
    attendancePct: Number(r.attendance_pct),
    lunchBalance: r.lunch_balance_pence / 100,
    streakDays: r.streak_days,
    avatarEmoji: r.avatar_emoji,
  }
}

/** The signed-in student, or (for parents) their first linked child. */
export async function fetchMyStudent(): Promise<Student> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase.from('students_overview').select('*').limit(10),
    ) as OverviewRow[]
    if (rows.length === 0) throw new Error('no student visible')
    const uid = await currentUserId()
    const own = rows.find((r) => r.id === uid)
    return mapOverview(own ?? rows[0])
  }, mock.currentStudent)
}

export async function fetchAllStudents(): Promise<Student[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('students_overview')
        .select('*')
        .order('form')
        .order('last_name'),
    ) as OverviewRow[]
    if (rows.length === 0) throw new Error('no students visible')
    return rows.map(mapOverview)
  }, mock.allStudents)
}

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------

export async function fetchLessons(): Promise<Lesson[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('lessons')
        .select(
          'id, day_of_week, start_time, end_time, subjects(name, color), rooms(name, building), staff(profiles(first_name, last_name))',
        )
        .eq('is_deleted', false),
    ) as unknown as {
      id: string
      day_of_week: number
      start_time: string
      end_time: string
      subjects: { name: string; color: string } | null
      rooms: { name: string; building: string } | null
      staff: { profiles: { first_name: string; last_name: string } | null } | null
    }[]
    if (rows.length === 0) throw new Error('no lessons visible')
    return rows.map((r) => ({
      id: r.id,
      subject: r.subjects?.name ?? 'Lesson',
      teacher: r.staff?.profiles
        ? `${r.staff.profiles.first_name} ${r.staff.profiles.last_name}`
        : '—',
      room: r.rooms?.name ?? '—',
      building: r.rooms?.building ?? '',
      day: r.day_of_week,
      start: r.start_time.slice(0, 5),
      end: r.end_time.slice(0, 5),
      color: r.subjects?.color ?? '240 5% 50%',
    }))
  }, mock.timetable)
}

// ---------------------------------------------------------------------------
// Homework
// ---------------------------------------------------------------------------

export async function fetchHomework(): Promise<HomeworkItem[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('homework')
        .select(
          'id, title, description, set_date, due_date, estimated_minutes, subjects(name), staff(profiles(first_name, last_name)), homework_submissions(status)',
        )
        .eq('is_deleted', false),
    ) as unknown as {
      id: string
      title: string
      description: string | null
      set_date: string
      due_date: string
      estimated_minutes: number | null
      subjects: { name: string } | null
      staff: { profiles: { first_name: string; last_name: string } | null } | null
      homework_submissions: { status: string }[]
    }[]
    if (rows.length === 0) throw new Error('no homework visible')
    return rows.map((r) => {
      const sub = r.homework_submissions[0]
      const completed = sub?.status === 'completed' || sub?.status === 'submitted'
      const status: HomeworkItem['status'] = completed
        ? 'completed'
        : r.due_date < todayISO()
          ? 'overdue'
          : 'pending'
      return {
        id: r.id,
        subject: r.subjects?.name ?? '—',
        title: r.title,
        description: r.description ?? '',
        teacher: r.staff?.profiles
          ? `${r.staff.profiles.first_name} ${r.staff.profiles.last_name}`
          : '—',
        setDate: r.set_date,
        dueDate: r.due_date,
        estimatedMinutes: r.estimated_minutes ?? undefined,
        status,
      }
    })
  }, mock.homework)
}

export async function setHomeworkStatus(
  homeworkId: string,
  completed: boolean,
): Promise<void> {
  const uid = await currentUserId()
  if (!uid) return // offline demo: state only lives in the store
  await supabase.from('homework_submissions').upsert({
    homework_id: homeworkId,
    student_id: uid,
    status: completed ? 'completed' : 'pending',
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  })
}

// ---------------------------------------------------------------------------
// Grades and attendance
// ---------------------------------------------------------------------------

export async function fetchGrades(): Promise<GradeEntry[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('grades')
        .select('id, grade, score, feedback, assessments(name, term, subjects(name))')
        .eq('is_deleted', false),
    ) as unknown as {
      id: string
      grade: string
      score: number | null
      feedback: string | null
      assessments: { name: string; term: string; subjects: { name: string } | null } | null
    }[]
    if (rows.length === 0) throw new Error('no grades visible')
    return rows
      .map((r) => {
        const score = Number(r.score ?? 0)
        return {
          id: r.id,
          subject: r.assessments?.subjects?.name ?? '—',
          assessment: r.assessments?.name ?? '—',
          grade: r.grade,
          score,
          term: r.assessments?.term ?? '',
          feedback: r.feedback ?? '',
          // Trend needs assessment history; until multiple terms are stored
          // we approximate from the normalised score.
          trend: (score >= 74 ? 'up' : score >= 63 ? 'stable' : 'down') as GradeEntry['trend'],
        }
      })
      .sort((a, b) => a.subject.localeCompare(b.subject))
  }, mock.grades)
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  return withFallback(async () => {
    const uid = await currentUserId()
    let q = supabase
      .from('attendance_records')
      .select('date, status, minutes_late, reason, student_id')
      .eq('is_deleted', false)
      .order('date')
    // Parents may see several children; scope students to themselves.
    if (uid) q = q.eq('student_id', uid)
    const rows = throwOnError(await q) as unknown as {
      date: string
      status: AttendanceRecord['status']
      minutes_late: number | null
      reason: string | null
    }[]
    if (rows.length === 0) throw new Error('no attendance visible')
    return rows.map((r) => ({
      date: r.date,
      status: r.status,
      minutesLate: r.minutes_late ?? undefined,
      reason: r.reason ?? undefined,
    }))
  }, mock.attendance)
}

export async function markAttendance(
  marks: { studentId: string; status: AttendanceRecord['status'] }[],
): Promise<boolean> {
  return withFallback(async () => {
    const schoolId = await mySchoolId()
    const date = todayISO()
    const ids = marks.map((m) => m.studentId)
    // AM registration rows have lesson_id null, which the unique index
    // treats as distinct — replace today's rows instead of upserting.
    await supabase
      .from('attendance_records')
      .delete()
      .eq('date', date)
      .is('lesson_id', null)
      .in('student_id', ids)
    const { error } = await supabase.from('attendance_records').insert(
      marks.map((m) => ({
        school_id: schoolId,
        student_id: m.studentId,
        date,
        status: m.status,
      })),
    )
    if (error) throw new Error(error.message)
    return true
  }, true)
}

async function mySchoolId(): Promise<string> {
  const uid = await currentUserId()
  if (!uid) throw new Error('not signed in')
  const row = throwOnError(
    await supabase.from('profiles').select('school_id').eq('id', uid).single(),
  ) as { school_id: string }
  return row.school_id
}

// ---------------------------------------------------------------------------
// Announcements and events
// ---------------------------------------------------------------------------

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('announcements')
        .select('id, title, body, category, audience, pinned, publish_at')
        .order('pinned', { ascending: false })
        .order('publish_at', { ascending: false }),
    ) as unknown as {
      id: string
      title: string
      body: string
      category: Announcement['category']
      audience: string
      pinned: boolean
      publish_at: string
    }[]
    if (rows.length === 0) throw new Error('no announcements visible')
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      category: r.category,
      audience: r.audience,
      pinned: r.pinned,
      createdAt: r.publish_at,
      read: true,
    }))
  }, mock.announcements)
}

export async function createAnnouncement(a: {
  title: string
  body: string
  category: Announcement['category']
  audience: string
  pinned: boolean
}): Promise<boolean> {
  return withFallback(async () => {
    const uid = await currentUserId()
    const schoolId = await mySchoolId()
    const { error } = await supabase.from('announcements').insert({
      school_id: schoolId,
      title: a.title,
      body: a.body,
      category: a.category,
      audience: a.audience,
      pinned: a.pinned,
      created_by: uid,
    })
    if (error) throw new Error(error.message)
    return true
  }, true)
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('calendar_events')
        .select('id, title, category, starts_on')
        .order('starts_on'),
    ) as unknown as {
      id: string
      title: string
      category: CalendarEvent['category']
      starts_on: string
    }[]
    if (rows.length === 0) throw new Error('no events visible')
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      date: r.starts_on,
    }))
  }, mock.events)
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function fetchThreads(): Promise<MessageThread[]> {
  return withFallback(async () => {
    const uid = await currentUserId()
    if (!uid) throw new Error('not signed in')
    const rows = throwOnError(
      await supabase
        .from('message_threads')
        .select(
          'id, subject_line, thread_participants(profile_id, profiles(first_name, last_name, role)), messages(id, sender_id, body, sent_at, read_at)',
        )
        .order('created_at'),
    ) as unknown as {
      id: string
      subject_line: string | null
      thread_participants: {
        profile_id: string
        profiles: { first_name: string; last_name: string; role: Role } | null
      }[]
      messages: {
        id: string
        sender_id: string
        body: string
        sent_at: string
        read_at: string | null
      }[]
    }[]
    if (rows.length === 0) throw new Error('no threads visible')
    return rows.map((t) => {
      const other = t.thread_participants.find((p) => p.profile_id !== uid)
      const participant = other?.profiles
        ? `${other.profiles.first_name} ${other.profiles.last_name}`
        : 'Conversation'
      const msgs: Message[] = t.messages
        .sort((a, b) => a.sent_at.localeCompare(b.sent_at))
        .map((m) => ({
          id: m.id,
          threadId: t.id,
          from: m.sender_id === uid ? 'You' : participant,
          fromRole: (m.sender_id === uid ? 'student' : other?.profiles?.role ?? 'staff') as Role,
          body: m.body,
          sentAt: m.sent_at,
          read: m.sender_id === uid || m.read_at !== null,
        }))
      return {
        id: t.id,
        participant,
        participantRole: (other?.profiles?.role ?? 'staff') as Role,
        subjectLine: t.subject_line ?? '',
        messages: msgs,
      }
    })
  }, mock.messageThreads)
}

export async function sendMessage(threadId: string, body: string): Promise<void> {
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('messages').insert({ thread_id: threadId, sender_id: uid, body })
}

// ---------------------------------------------------------------------------
// Lunch account
// ---------------------------------------------------------------------------

export async function fetchTransactions(): Promise<Transaction[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('lunch_transactions')
        .select('id, created_at, description, amount_pence, type')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ) as unknown as {
      id: string
      created_at: string
      description: string | null
      amount_pence: number
      type: Transaction['type']
    }[]
    if (rows.length === 0) throw new Error('no transactions visible')
    return rows.map((r) => ({
      id: r.id,
      date: r.created_at.slice(0, 10),
      description: r.description ?? r.type,
      amount: r.amount_pence / 100,
      type: r.type,
    }))
  }, mock.transactions)
}

export async function topUpLunch(studentId: string, amountPence: number): Promise<boolean> {
  return withFallback(async () => {
    const uid = await currentUserId()
    if (!uid) throw new Error('not signed in')
    const schoolId = await mySchoolId()
    // Demo flow — production goes through Stripe Checkout and the webhook
    // inserts this row with the payment intent id via the service role.
    const { error } = await supabase.from('lunch_transactions').insert({
      school_id: schoolId,
      student_id: studentId,
      amount_pence: amountPence,
      type: 'topup',
      description: 'Top-up (card •••• 4242)',
      initiated_by: uid,
    })
    if (error) throw new Error(error.message)
    return true
  }, true)
}

// ---------------------------------------------------------------------------
// Staff (admin)
// ---------------------------------------------------------------------------

export async function fetchStaff(): Promise<StaffMember[]> {
  return withFallback(async () => {
    const rows = throwOnError(
      await supabase
        .from('staff')
        .select('id, title, subjects, on_site, profiles(first_name, last_name, email, role)')
        .eq('is_deleted', false),
    ) as unknown as {
      id: string
      title: string | null
      subjects: string[]
      on_site: boolean
      profiles: { first_name: string; last_name: string; email: string; role: Role } | null
    }[]
    const teachers = rows.filter((r) => r.profiles?.role === 'staff')
    if (teachers.length === 0) throw new Error('no staff visible')
    return teachers.map((r) => ({
      id: r.id,
      name: r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : '—',
      role: r.title ?? 'Teacher',
      subjects: r.subjects,
      email: r.profiles?.email ?? '',
      onSite: r.on_site,
    }))
  }, mock.staff)
}

// ---------------------------------------------------------------------------
// useQuery — minimal fetch-on-mount hook with loading state
// ---------------------------------------------------------------------------

export function useQuery<T>(fetcher: () => Promise<T>, initial: T): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    fetcher()
      .then((d) => active && setData(d))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { data, loading }
}
