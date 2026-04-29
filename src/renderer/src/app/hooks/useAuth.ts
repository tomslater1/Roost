import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/context/AuthContext'

// useAuth exposes the current session state and auth actions (login, logout etc.)
// The session itself lives in AuthContext — this hook adds actions on top of it.
export function useAuth() {
  const { session, user, loading } = useAuthContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Signup failed — no user returned')

    if (!data.session) {
      // Email confirmation is enabled — the user must verify before continuing.
      // Throw a sentinel so the UI can show a confirmation prompt.
      throw new Error('EMAIL_CONFIRMATION_REQUIRED')
    }

    // Account created with an active session — go to Setup to pick a name and home.
    navigate('/setup')
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Supabase returns this when email confirmation is enabled but not yet completed.
      // Throw a sentinel so the UI can show a friendly "check your email" prompt.
      if (error.message.toLowerCase().includes('not confirmed')) {
        throw new Error('EMAIL_NOT_CONFIRMED')
      }
      throw error
    }
    // Check for an existing home — a confirmed-but-not-setup user has none yet.
    const { data: member } = await supabase
      .from('home_members').select('id').eq('user_id', data.user.id).maybeSingle()
    navigate(member ? '/dashboard' : '/setup')
  }

  async function resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
  }

  // Opens the system browser with a Google OAuth URL.
  // After the user authenticates, Google redirects to roost://auth/callback
  // which Electron intercepts and passes back to AuthContext via IPC.
  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'roost://auth/callback',
        // Don't let supabase-js redirect the Electron renderer — we open
        // the URL ourselves so it goes to the system browser instead.
        skipBrowserRedirect: true,
      },
    })

    if (error) throw error
    if (data.url) {
      // window.open is intercepted by the main process setWindowOpenHandler
      // which calls shell.openExternal() — opens in Chrome/Safari, not Electron.
      window.open(data.url)
    }
  }

  async function joinHome(
    email: string,
    password: string,
    displayName: string,
    inviteCode: string
  ) {
    // Create the account first
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) throw signUpError
    if (!data.user) throw new Error('Signup failed')

    if (!data.session) {
      throw new Error('EMAIL_CONFIRMATION_REQUIRED')
    }

    // Join the home via SECURITY DEFINER RPC — handles invite code lookup,
    // RLS bypass, and member insert atomically.
    const { error: joinError } = await supabase.rpc('join_home_by_invite_code', {
      code: inviteCode.trim(),
      display_name: displayName,
    })

    if (joinError) throw new Error(joinError.message.includes('Invalid invite code') ? 'Invalid invite code — no home found' : joinError.message)

    await queryClient.invalidateQueries({ queryKey: ['home'] })

    navigate('/dashboard')
  }

  async function signOut() {
    await supabase.auth.signOut()
    // Wipe the in-memory cache and the localStorage snapshot so a different
    // user logging in on the same machine never sees the previous user's data.
    queryClient.clear()
    window.localStorage.removeItem('roost-query-cache')
    navigate('/welcome')
  }

  async function leaveHome() {
    const { error } = await supabase.rpc('leave_home')
    if (error) throw error
    await supabase.auth.signOut()
    queryClient.clear()
    window.localStorage.removeItem('roost-query-cache')
    navigate('/welcome')
  }

  async function deleteAccount() {
    // Use raw fetch instead of supabase.functions.invoke so we can read the
    // response body directly — FunctionsHttpError swallows the actual message.
    // refreshSession() ensures we have a valid, non-expired access token.
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshed.session) {
      throw new Error(`Session refresh failed: ${refreshError?.message ?? 'no session returned'}`)
    }
    const session = refreshed.session

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // Use anon key as Bearer to pass gateway validation.
        // The user's access token is verified inside the function via the request body.
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: session.access_token }),
    })

    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`)

    // Auth user is already deleted — signOut() is best-effort to clear local state.
    supabase.auth.signOut().catch(() => {})
    queryClient.clear()
    window.localStorage.removeItem('roost-query-cache')
    navigate('/welcome')
  }

  // Opens the system browser with an Apple OAuth URL.
  // Supabase handles the Apple → Supabase callback server-side, then redirects
  // back to roost://auth/callback with the session tokens in the hash.
  async function signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'roost://auth/callback',
        skipBrowserRedirect: true,
      },
    })
    if (error) throw error
    if (data.url) {
      window.open(data.url)
    }
  }

  return { session, user, loading, signUp, signIn, signInWithGoogle, signInWithApple, resendConfirmation, joinHome, signOut, leaveHome, deleteAccount }
}
