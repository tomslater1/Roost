import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Check .env.local.')
}

// Remove expired tokens before the client boots. If Supabase finds expired
// tokens it will attempt a network refresh while holding a navigator.locks
// Web Lock — in Electron that fetch can hang forever and block every
// subsequent auth operation. Clearing them here means the client always
// initialises instantly with no network call.
try {
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith('sb-')) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    const val = JSON.parse(raw)
    if (val?.expires_at && val.expires_at < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem(key)
    }
  }
} catch {}

// flowType implicit: tokens arrive in the URL fragment from the Google OAuth
// deep-link. PKCE requires a server code-exchange that breaks across the
// system-browser → Electron boundary.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'implicit' },
})
