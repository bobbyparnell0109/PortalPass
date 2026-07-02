import type {
  Achievement,
  Announcement,
  AttendanceRecord,
  CalendarEvent,
  GradeEntry,
  HomeworkItem,
  Lesson,
  MessageThread,
  StaffMember,
  Student,
  Transaction,
} from './types'

// Demo dataset for Springwood High School. In production this comes from
// Supabase (see supabase/migrations) via the same shapes in types.ts.

export const SUBJECT_COLORS: Record<string, string> = {
  Maths: '221 83% 53%',
  English: '350 80% 55%',
  Science: '160 84% 39%',
  History: '32 95% 44%',
  Geography: '174 80% 36%',
  French: '262 83% 58%',
  Art: '316 73% 52%',
  PE: '0 84% 60%',
  Computing: '199 89% 48%',
  Music: '45 93% 47%',
}

export const currentStudent: Student = {
  id: 'stu-001',
  firstName: 'Bobby',
  lastName: 'Parnell',
  yearGroup: 10,
  form: '10RW',
  house: 'Falcon',
  email: 'bobby.parnell@springwood.sch.uk',
  status: 'active',
  attendancePct: 96.4,
  lunchBalance: 7.35,
  streakDays: 12,
  avatarEmoji: '😎',
}

export const timetable: Lesson[] = [
  { id: 'l1', subject: 'Maths', teacher: 'Mr Okafor', room: 'M12', building: 'Main', day: 0, start: '08:50', end: '09:50', color: SUBJECT_COLORS.Maths },
  { id: 'l2', subject: 'English', teacher: 'Ms Reid', room: 'E4', building: 'East Wing', day: 0, start: '09:55', end: '10:55', color: SUBJECT_COLORS.English },
  { id: 'l3', subject: 'Science', teacher: 'Dr Patel', room: 'S7', building: 'Science Block', day: 0, start: '11:15', end: '12:15', color: SUBJECT_COLORS.Science },
  { id: 'l4', subject: 'PE', teacher: 'Mr Brooks', room: 'Gym', building: 'Sports Hall', day: 0, start: '13:10', end: '14:10', color: SUBJECT_COLORS.PE },
  { id: 'l5', subject: 'History', teacher: 'Mrs Lane', room: 'H2', building: 'Main', day: 0, start: '14:15', end: '15:15', color: SUBJECT_COLORS.History },
  { id: 'l6', subject: 'Computing', teacher: 'Mr Zhang', room: 'C1', building: 'Tech Block', day: 1, start: '08:50', end: '09:50', color: SUBJECT_COLORS.Computing },
  { id: 'l7', subject: 'Maths', teacher: 'Mr Okafor', room: 'M12', building: 'Main', day: 1, start: '09:55', end: '10:55', color: SUBJECT_COLORS.Maths },
  { id: 'l8', subject: 'French', teacher: 'Mme Girard', room: 'F3', building: 'East Wing', day: 1, start: '11:15', end: '12:15', color: SUBJECT_COLORS.French },
  { id: 'l9', subject: 'Art', teacher: 'Ms Novak', room: 'A1', building: 'Arts Centre', day: 1, start: '13:10', end: '15:15', color: SUBJECT_COLORS.Art },
  { id: 'l10', subject: 'Science', teacher: 'Dr Patel', room: 'S7', building: 'Science Block', day: 2, start: '08:50', end: '09:50', color: SUBJECT_COLORS.Science },
  { id: 'l11', subject: 'Geography', teacher: 'Mr Hale', room: 'G5', building: 'Main', day: 2, start: '09:55', end: '10:55', color: SUBJECT_COLORS.Geography },
  { id: 'l12', subject: 'English', teacher: 'Ms Reid', room: 'E4', building: 'East Wing', day: 2, start: '11:15', end: '12:15', color: SUBJECT_COLORS.English },
  { id: 'l13', subject: 'Music', teacher: 'Mr Adeyemi', room: 'Mu1', building: 'Arts Centre', day: 2, start: '13:10', end: '14:10', color: SUBJECT_COLORS.Music },
  { id: 'l14', subject: 'Maths', teacher: 'Mr Okafor', room: 'M12', building: 'Main', day: 2, start: '14:15', end: '15:15', color: SUBJECT_COLORS.Maths },
  { id: 'l15', subject: 'English', teacher: 'Ms Reid', room: 'E4', building: 'East Wing', day: 3, start: '08:50', end: '09:50', color: SUBJECT_COLORS.English },
  { id: 'l16', subject: 'Science', teacher: 'Dr Patel', room: 'S7', building: 'Science Block', day: 3, start: '09:55', end: '10:55', color: SUBJECT_COLORS.Science },
  { id: 'l17', subject: 'History', teacher: 'Mrs Lane', room: 'H2', building: 'Main', day: 3, start: '11:15', end: '12:15', color: SUBJECT_COLORS.History },
  { id: 'l18', subject: 'Computing', teacher: 'Mr Zhang', room: 'C1', building: 'Tech Block', day: 3, start: '13:10', end: '14:10', color: SUBJECT_COLORS.Computing },
  { id: 'l19', subject: 'French', teacher: 'Mme Girard', room: 'F3', building: 'East Wing', day: 3, start: '14:15', end: '15:15', color: SUBJECT_COLORS.French },
  { id: 'l20', subject: 'Geography', teacher: 'Mr Hale', room: 'G5', building: 'Main', day: 4, start: '08:50', end: '09:50', color: SUBJECT_COLORS.Geography },
  { id: 'l21', subject: 'Maths', teacher: 'Mr Okafor', room: 'M12', building: 'Main', day: 4, start: '09:55', end: '10:55', color: SUBJECT_COLORS.Maths },
  { id: 'l22', subject: 'PE', teacher: 'Mr Brooks', room: 'Field', building: 'Sports Hall', day: 4, start: '11:15', end: '13:05', color: SUBJECT_COLORS.PE },
  { id: 'l23', subject: 'Science', teacher: 'Dr Patel', room: 'S8', building: 'Science Block', day: 4, start: '14:15', end: '15:15', color: SUBJECT_COLORS.Science },
]

export const homework: HomeworkItem[] = [
  { id: 'h1', subject: 'Maths', title: 'Quadratic equations worksheet', description: 'Complete exercises 4A–4C on solving quadratics by factorising. Show all working.', teacher: 'Mr Okafor', setDate: '2026-06-29', dueDate: '2026-07-02', estimatedMinutes: 40, status: 'pending' },
  { id: 'h2', subject: 'English', title: 'Macbeth essay plan', description: 'Plan an essay on ambition in Macbeth. Include at least 5 quotes with analysis points.', teacher: 'Ms Reid', setDate: '2026-06-28', dueDate: '2026-07-03', estimatedMinutes: 60, status: 'pending' },
  { id: 'h3', subject: 'Science', title: 'Electrolysis lab write-up', description: 'Write up the copper sulfate electrolysis practical: method, results table, conclusion.', teacher: 'Dr Patel', setDate: '2026-06-26', dueDate: '2026-07-01', estimatedMinutes: 45, status: 'overdue' },
  { id: 'h4', subject: 'French', title: 'Vocab: Les vacances', description: 'Learn the holiday vocabulary list for a test on Friday.', teacher: 'Mme Girard', setDate: '2026-06-30', dueDate: '2026-07-04', estimatedMinutes: 20, status: 'pending' },
  { id: 'h5', subject: 'History', title: 'Cold War sources questions', description: 'Answer questions 1–6 on the Cuban Missile Crisis source pack.', teacher: 'Mrs Lane', setDate: '2026-06-24', dueDate: '2026-06-30', estimatedMinutes: 35, status: 'completed' },
  { id: 'h6', subject: 'Computing', title: 'Python functions exercises', description: 'Finish the functions exercises on the class repl. All tests should pass.', teacher: 'Mr Zhang', setDate: '2026-06-25', dueDate: '2026-06-29', estimatedMinutes: 30, status: 'completed' },
]

export const grades: GradeEntry[] = [
  { id: 'g1', subject: 'Maths', assessment: 'Algebra unit test', grade: '7', score: 78, term: 'Summer 2026', feedback: 'Strong algebra skills. Focus on showing full working in multi-step problems.', trend: 'up' },
  { id: 'g2', subject: 'English', assessment: 'Macbeth essay', grade: '6', score: 68, term: 'Summer 2026', feedback: 'Good analysis of language. Develop your points with more context.', trend: 'stable' },
  { id: 'g3', subject: 'Science', assessment: 'Chemistry mock', grade: '7', score: 74, term: 'Summer 2026', feedback: 'Excellent practical understanding. Revise ionic equations.', trend: 'up' },
  { id: 'g4', subject: 'History', assessment: 'Cold War assessment', grade: '6', score: 65, term: 'Summer 2026', feedback: 'Solid knowledge. Work on source evaluation technique.', trend: 'down' },
  { id: 'g5', subject: 'Geography', assessment: 'Rivers fieldwork', grade: '7', score: 76, term: 'Summer 2026', feedback: 'Great data presentation and conclusions.', trend: 'up' },
  { id: 'g6', subject: 'French', assessment: 'Speaking assessment', grade: '5', score: 58, term: 'Summer 2026', feedback: 'Pronunciation improving. Practise longer spontaneous answers.', trend: 'stable' },
  { id: 'g7', subject: 'Computing', assessment: 'Programming project', grade: '8', score: 85, term: 'Summer 2026', feedback: 'Outstanding project with well-structured code.', trend: 'up' },
  { id: 'g8', subject: 'Art', assessment: 'Portfolio review', grade: '7', score: 72, term: 'Summer 2026', feedback: 'Creative portfolio. Annotate your development process more.', trend: 'stable' },
]

export const progressOverTime = [
  { term: 'Aut 1', Maths: 62, English: 60, Science: 64 },
  { term: 'Aut 2', Maths: 65, English: 63, Science: 66 },
  { term: 'Spr 1', Maths: 69, English: 64, Science: 68 },
  { term: 'Spr 2', Maths: 72, English: 66, Science: 71 },
  { term: 'Sum 1', Maths: 75, English: 67, Science: 72 },
  { term: 'Sum 2', Maths: 78, English: 68, Science: 74 },
]

function buildAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const start = new Date('2026-06-01')
  for (let i = 0; i < 32; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    if (d > new Date('2026-07-02')) break
    const iso = d.toISOString().slice(0, 10)
    if (iso === '2026-06-08') {
      records.push({ date: iso, status: 'absent', reason: 'Illness (authorised)' })
    } else if (iso === '2026-06-17') {
      records.push({ date: iso, status: 'late', minutesLate: 12, reason: 'Bus delay' })
    } else if (iso === '2026-06-25') {
      records.push({ date: iso, status: 'late', minutesLate: 5 })
    } else {
      records.push({ date: iso, status: 'present' })
    }
  }
  return records
}

export const attendance: AttendanceRecord[] = buildAttendance()

export const announcements: Announcement[] = [
  { id: 'a1', title: 'Sports Day — Friday 10 July', body: 'Sports Day takes place on the top field. Wear house colours! Parents welcome from 12:30.', category: 'events', audience: 'Whole school', pinned: true, createdAt: '2026-07-01T09:00:00Z', read: false },
  { id: 'a2', title: 'Year 10 mock exam timetable published', body: 'Mock exams run 13–17 July. Check the Exams module for your personal timetable.', category: 'important', audience: 'Year 10', pinned: true, createdAt: '2026-06-30T14:30:00Z', read: false },
  { id: 'a3', title: 'Library summer reading challenge', body: 'Sign up in the library to take part in the summer reading challenge. Prizes for the top readers!', category: 'academic', audience: 'Whole school', pinned: false, createdAt: '2026-06-28T10:00:00Z', read: true },
  { id: 'a4', title: 'End of term charity bake sale', body: 'The student council bake sale is on 16 July at break. Bring donations to the hall from 8:15.', category: 'social', audience: 'Whole school', pinned: false, createdAt: '2026-06-27T08:45:00Z', read: true },
]

export const messageThreads: MessageThread[] = [
  {
    id: 't1',
    participant: 'Mr Okafor',
    participantRole: 'staff',
    subjectLine: 'Maths revision session',
    messages: [
      { id: 'm1', threadId: 't1', from: 'Mr Okafor', fromRole: 'staff', body: 'Hi Bobby, I am running a quadratics revision session Thursday lunchtime in M12 ahead of the mocks. It would be great to see you there.', sentAt: '2026-07-01T11:20:00Z', read: false },
    ],
  },
  {
    id: 't2',
    participant: 'Ms Reid',
    participantRole: 'staff',
    subjectLine: 'Essay feedback',
    messages: [
      { id: 'm2', threadId: 't2', from: 'Ms Reid', fromRole: 'staff', body: 'Your Macbeth essay plan is looking strong. Remember to include context on Jacobean beliefs about kingship.', sentAt: '2026-06-29T15:05:00Z', read: true },
      { id: 'm3', threadId: 't2', from: 'You', fromRole: 'student', body: 'Thanks Miss, I will add a paragraph on the divine right of kings.', sentAt: '2026-06-29T16:12:00Z', read: true },
    ],
  },
]

export const transactions: Transaction[] = [
  { id: 'tx1', date: '2026-07-01', description: 'Lunch — pasta pot, juice', amount: -3.15, type: 'purchase' },
  { id: 'tx2', date: '2026-06-30', description: 'Break — bagel', amount: -1.2, type: 'purchase' },
  { id: 'tx3', date: '2026-06-30', description: 'Lunch — chicken wrap meal', amount: -3.45, type: 'purchase' },
  { id: 'tx4', date: '2026-06-29', description: 'Top-up (card •••• 4242)', amount: 15, type: 'topup' },
  { id: 'tx5', date: '2026-06-26', description: 'Lunch — pizza slice, water', amount: -2.85, type: 'purchase' },
]

export const events: CalendarEvent[] = [
  { id: 'e1', title: 'Year 10 mocks begin', date: '2026-07-13', category: 'exam' },
  { id: 'e2', title: 'Sports Day', date: '2026-07-10', category: 'trip' },
  { id: 'e3', title: 'Summer holidays start', date: '2026-07-22', category: 'holiday' },
  { id: 'e4', title: 'Whole school assembly', date: '2026-07-06', category: 'assembly' },
  { id: 'e5', title: 'Coding club showcase', date: '2026-07-08', category: 'club' },
]

export const achievements: Achievement[] = [
  { id: 'ac1', title: 'Perfect Week', description: '100% attendance for a full week', emoji: '🎯', earned: true, earnedAt: '2026-06-19' },
  { id: 'ac2', title: 'Homework Hero', description: 'All homework submitted on time for 2 weeks', emoji: '📚', earned: true, earnedAt: '2026-06-12' },
  { id: 'ac3', title: 'On Fire', description: '10-day app streak', emoji: '🔥', earned: true, earnedAt: '2026-06-30' },
  { id: 'ac4', title: 'Early Bird', description: 'No lates for a whole month', emoji: '🐦', earned: false },
  { id: 'ac5', title: 'Top of the Class', description: 'Highest score in an assessment', emoji: '🏆', earned: false },
]

// ---- Admin-side data ----

export const allStudents: Student[] = [
  currentStudent,
  { id: 'stu-002', firstName: 'Amelia', lastName: 'Chen', yearGroup: 10, form: '10RW', house: 'Falcon', email: 'amelia.chen@springwood.sch.uk', status: 'active', attendancePct: 98.2, lunchBalance: 12.4, streakDays: 8, avatarEmoji: '🦊' },
  { id: 'stu-003', firstName: 'Dev', lastName: 'Sharma', yearGroup: 10, form: '10KH', house: 'Osprey', email: 'dev.sharma@springwood.sch.uk', status: 'active', attendancePct: 92.1, lunchBalance: 2.1, streakDays: 3, avatarEmoji: '🚀' },
  { id: 'stu-004', firstName: 'Grace', lastName: 'Osei', yearGroup: 11, form: '11PL', house: 'Kestrel', email: 'grace.osei@springwood.sch.uk', status: 'active', attendancePct: 99.0, lunchBalance: 20.75, streakDays: 21, avatarEmoji: '🌟' },
  { id: 'stu-005', firstName: 'Liam', lastName: "O'Connor", yearGroup: 9, form: '9TB', house: 'Falcon', email: 'liam.oconnor@springwood.sch.uk', status: 'active', attendancePct: 88.7, lunchBalance: 0.45, streakDays: 1, avatarEmoji: '⚽' },
  { id: 'stu-006', firstName: 'Sofia', lastName: 'Marino', yearGroup: 8, form: '8JW', house: 'Osprey', email: 'sofia.marino@springwood.sch.uk', status: 'active', attendancePct: 95.5, lunchBalance: 8.9, streakDays: 5, avatarEmoji: '🎨' },
  { id: 'stu-007', firstName: 'Noah', lastName: 'Williams', yearGroup: 7, form: '7RD', house: 'Kestrel', email: 'noah.williams@springwood.sch.uk', status: 'active', attendancePct: 97.3, lunchBalance: 5.6, streakDays: 14, avatarEmoji: '🎮' },
  { id: 'stu-008', firstName: 'Zara', lastName: 'Ahmed', yearGroup: 11, form: '11PL', house: 'Falcon', email: 'zara.ahmed@springwood.sch.uk', status: 'left', attendancePct: 94.0, lunchBalance: 0, streakDays: 0, avatarEmoji: '📖' },
]

export const staff: StaffMember[] = [
  { id: 'st1', name: 'Mr Okafor', role: 'Head of Maths', subjects: ['Maths'], email: 'okafor@springwood.sch.uk', onSite: true },
  { id: 'st2', name: 'Ms Reid', role: 'English Teacher', subjects: ['English'], email: 'reid@springwood.sch.uk', onSite: true },
  { id: 'st3', name: 'Dr Patel', role: 'Head of Science', subjects: ['Science'], email: 'patel@springwood.sch.uk', onSite: true },
  { id: 'st4', name: 'Mrs Lane', role: 'History Teacher, Head of Year 10', subjects: ['History'], email: 'lane@springwood.sch.uk', onSite: false },
  { id: 'st5', name: 'Mr Zhang', role: 'Computing Teacher', subjects: ['Computing'], email: 'zhang@springwood.sch.uk', onSite: true },
]

// Demo PIN for the mock student account. Real PINs are bcrypt-hashed
// server-side — see supabase/migrations.
export const DEMO_PIN = '12345'
