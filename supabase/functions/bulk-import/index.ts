// Bulk student import, server side. Creates auth users via the GoTrue admin
// API (no sign-up rate limit, no email sent) and inserts profile + student
// rows with the service role, then bcrypts the PINs in one SQL round trip
// (service_set_pin_hashes, migration 0007).
//
// Auth: the caller must be a signed-in admin; students land in the caller's
// own school. The client sends rows in chunks (see importStudents in
// src/lib/api.ts) so each invocation stays well inside the wall-clock limit.

import { createClient } from 'npm:@supabase/supabase-js@2'

const service = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StudentRow {
  firstName: string
  lastName: string
  email: string
  yearGroup: number
  form: string
  house: string
  pin: string
  avatarEmoji?: string
}

interface RowResult {
  row: number
  label: string
  error?: string
}

const MAX_ROWS_PER_CALL = 50

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'not signed in' }, 401)
  const { data: userData, error: userErr } = await service.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: 'not signed in' }, 401)

  const { data: caller } = await service
    .from('profiles')
    .select('school_id, role')
    .eq('id', userData.user.id)
    .single()
  if (!caller || caller.role !== 'admin') return json({ error: 'admins only' }, 403)
  const schoolId = caller.school_id

  let students: StudentRow[]
  try {
    const body = await req.json()
    students = body.students
    if (!Array.isArray(students) || students.length === 0) throw new Error('empty')
  } catch {
    return json({ error: 'body must be { students: [...] }' }, 400)
  }
  if (students.length > MAX_ROWS_PER_CALL) {
    return json({ error: `at most ${MAX_ROWS_PER_CALL} students per call` }, 400)
  }

  const results: RowResult[] = []
  const pins: { id: string; pin: string }[] = []

  for (let i = 0; i < students.length; i++) {
    const s = students[i]
    const email = String(s.email ?? '').trim().toLowerCase()
    const label = `${s.firstName} ${s.lastName} <${email}>`
    try {
      if (!s.firstName || !s.lastName) throw new Error('missing name')
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('invalid email')
      if (!/^[0-9]{4,6}$/.test(s.pin)) throw new Error('PIN must be 4-6 digits')
      const yearGroup = Number(s.yearGroup)
      if (!Number.isInteger(yearGroup) || yearGroup < 1 || yearGroup > 14) {
        throw new Error('invalid year group')
      }

      // Same PIN-derived credential admin_set_pin issues (migration 0005),
      // so PIN login works identically for bulk-imported students.
      const { data: created, error: cErr } = await service.auth.admin.createUser({
        email,
        password: `pp-pin:${s.pin}:${email}`,
        email_confirm: true,
      })
      if (cErr) {
        throw new Error(
          /already/i.test(cErr.message) ? 'an account with this email already exists' : cErr.message,
        )
      }
      const uid = created.user.id

      const { error: pErr } = await service.from('profiles').insert({
        id: uid,
        school_id: schoolId,
        role: 'student',
        first_name: s.firstName,
        last_name: s.lastName,
        email,
        avatar_emoji: s.avatarEmoji ?? '🙂',
      })
      if (pErr) {
        await service.auth.admin.deleteUser(uid)
        throw new Error(pErr.message)
      }
      const { error: sErr } = await service.from('students').insert({
        id: uid,
        school_id: schoolId,
        year_group: yearGroup,
        form: s.form,
        house: s.house,
      })
      if (sErr) {
        await service.from('profiles').delete().eq('id', uid)
        await service.auth.admin.deleteUser(uid)
        throw new Error(sErr.message)
      }

      pins.push({ id: uid, pin: s.pin })
      results.push({ row: i + 1, label })
    } catch (e) {
      results.push({ row: i + 1, label, error: e instanceof Error ? e.message : String(e) })
    }
  }

  if (pins.length > 0) {
    const { error: pinErr } = await service.rpc('service_set_pin_hashes', { items: pins })
    // Login still works without pin_hash (the auth password carries the PIN);
    // surface the problem without failing rows that were otherwise created.
    if (pinErr) {
      return json({ results, warning: `PIN hashes not stored: ${pinErr.message}` })
    }
  }

  return json({ results })
})
