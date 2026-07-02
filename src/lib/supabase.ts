import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// PortalPass demo backend (Supabase project "PortalPass", eu-west-2).
// The publishable key is safe to ship to clients — row-level security is
// what protects the data. Override via .env for your own project.

const DEMO_URL = 'https://ghpifoswlustuhgszxmk.supabase.co'
const DEMO_KEY = 'sb_publishable_XrPvmad_eU7CK942_ac_SA__gxLHJJ0'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEMO_URL
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEMO_KEY

export const supabase: SupabaseClient = createClient(url, anonKey)
export const supabaseConfig = { url, anonKey }

// Demo credentials for the seeded Springwood High School data. In
// production the student PIN flow exchanges a verified PIN for a session
// via an edge function instead of a shared password.
export const DEMO_PASSWORD = 'PortalPass-Demo-2026'
export const DEMO_STUDENT_EMAIL = 'bobby.parnell@springwood.sch.uk'
