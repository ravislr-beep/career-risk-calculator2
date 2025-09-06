import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars. Copy .env.example -> .env.local and set values.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// admin client factory - use this inside serverless functions ONLY
export function getSupabaseAdmin() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRole) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var for admin client.')
  return createClient(supabaseUrl, serviceRole)
}
