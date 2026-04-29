import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { perfMark } from '@/lib/perf'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  oauthPending: boolean
  oauthError: string | null
  clearOauthError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // True when we've reloaded after an OAuth callback (Google or Apple) and are
  // still processing the tokens (setSession → home check → navigate). Persisted
  // in localStorage so it survives the page reload.
  const [oauthPending, setOauthPending] = useState(
    () => !!localStorage.getItem('roost_oauth_pending') || !!localStorage.getItem('roost_google_pending')
  )
  const [oauthError, setOauthError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let settled = false

    // Safety net: if INITIAL_SESSION never fires (e.g. Supabase hangs on token
    // refresh), clear stale tokens and unblock the UI after 5 s.
    const hangTimer = setTimeout(() => {
      if (settled) return
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k))
      setSession(null)
      setLoading(false)
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (event === 'INITIAL_SESSION') {
        settled = true
        clearTimeout(hangTimer)
        setLoading(false)
        perfMark('auth-ready')

        // Google OAuth: tokens were stored in localStorage before the page reload
        // (see onAuthCallback below). We defer setSession() by one tick so that
        // Supabase's _initialize() fully releases its navigator.locks Web Lock
        // first — calling setSession() while the lock is held causes a deadlock.
        const pending = localStorage.getItem('roost_oauth_tokens')
        if (pending) {
          localStorage.removeItem('roost_oauth_tokens')
          try {
            const { access_token, refresh_token } = JSON.parse(pending)
            setTimeout(async () => {
              const { data } = await supabase.auth.setSession({ access_token, refresh_token })
              const session = data?.session
              if (!session) {
                localStorage.removeItem('roost_oauth_pending')
                setOauthPending(false)
                return
              }
              // Query DB after setSession() returns (lock released). Running this
              // inside the SIGNED_IN callback deadlocks against setSession()'s lock.
              const { data: member } = await supabase
                .from('home_members').select('id').eq('user_id', session.user.id).maybeSingle()

              // Clear the pending flag before navigating so the loading screen
              // disappears naturally as the new route mounts.
              localStorage.removeItem('roost_oauth_pending')
              setOauthPending(false)

              // Existing user → dashboard. New user → /setup to pick a name and home.
              navigate(member ? '/dashboard' : '/setup')
            }, 0)
          } catch {
            // Malformed token data — clear flag and let user try again.
            localStorage.removeItem('roost_oauth_pending')
            setOauthPending(false)
          }
        }
      }
    })

    return () => { clearTimeout(hangTimer); subscription.unsubscribe() }
  }, [])

  // OAuth deep-link handler (Google and Apple).
  // Tokens arrive via: roost://auth/callback#access_token=...&refresh_token=...
  // We store them under a non-sb- key (so pre-clearing ignores them) and
  // reload. On the next boot INITIAL_SESSION fires, picks them up above,
  // and calls setSession() once the lock is free.
  useEffect(() => {
    if (!window.api?.onAuthCallback) return

    window.api.onAuthCallback((url: string) => {
      // roost://join?code=XXXX — store the code so Setup.tsx can pre-fill it
      if (url.startsWith('roost://join')) {
        const query = url.split('?')[1] ?? ''
        const code = new URLSearchParams(query).get('code')
        if (code) localStorage.setItem('roost_pending_invite_code', code.toUpperCase())
        return
      }

      const hash = url.split('#')[1] ?? ''
      const p = new URLSearchParams(hash)
      const access_token = p.get('access_token')
      const refresh_token = p.get('refresh_token')
      // Check for a server-side OAuth error before looking for tokens
      const qp = new URLSearchParams(url.split('?')[1] ?? '')
      const oauthErr = qp.get('error')
      if (oauthErr) {
        const description = qp.get('error_description') ?? qp.get('error_code') ?? oauthErr
        localStorage.removeItem('roost_oauth_pending')
        setOauthPending(false)
        setOauthError(description.replace(/\+/g, ' '))
        return
      }

      if (!access_token || !refresh_token) return
      localStorage.setItem('roost_oauth_tokens', JSON.stringify({ access_token, refresh_token }))
      // Flag survives the reload and tells Welcome to show a loading screen
      // rather than the sign-in form while we're processing the tokens.
      // Clear legacy key in case it exists from an older app version
      localStorage.removeItem('roost_google_pending')
      localStorage.setItem('roost_oauth_pending', '1')
      window.location.reload()
    })

    return () => window.api.removeAuthCallback()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, oauthPending, oauthError, clearOauthError: () => setOauthError(null) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
