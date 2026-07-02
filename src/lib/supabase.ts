import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// PortalPass runs against Supabase in production. When the env vars are not
// set (local demo), the app falls back to the mock data layer so every
// screen still works end-to-end.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseEnabled = supabase !== null
