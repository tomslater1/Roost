// Translates raw Supabase / Postgres / network errors into plain English.
// Every error surface in the app should pass through here so users never
// see internal error codes or stack traces.

// Known Supabase auth error messages → friendly equivalents
const AUTH_MESSAGES: Record<string, string> = {
  'invalid login credentials':
    'Email or password is incorrect.',
  'invalid email or password':
    'Email or password is incorrect.',
  'email not confirmed':
    'Please confirm your email address before signing in.',
  'user already registered':
    'An account with this email already exists. Try signing in instead.',
  'email already in use':
    'An account with this email already exists. Try signing in instead.',
  'email already exists':
    'An account with this email already exists. Try signing in instead.',
  'password should be at least 6 characters':
    'Password must be at least 6 characters.',
  'over_email_send_rate_limit':
    'Too many emails sent. Wait a moment and try again.',
  'email rate limit exceeded':
    'Too many attempts. Wait a moment and try again.',
  'signup_disabled':
    'Sign ups are currently disabled.',
  'email_address_not_authorized':
    'This email address is not permitted.',
  'weak_password':
    'Password is too weak. Use at least 8 characters with a mix of letters and numbers.',
  'session_not_found':
    'Your session has expired. Please sign in again.',
  'refresh_token_not_found':
    'Your session has expired. Please sign in again.',
}

// Postgres error codes → friendly equivalents
const POSTGRES_CODES: Record<string, string> = {
  '23505': 'This already exists — try a different value.',
  '23503': "This can't be removed because something else depends on it.",
  '23502': 'A required field is missing.',
  '42501': "You don't have permission to do this.",
  'PGRST116': 'Item not found.',
  'PGRST301': "You don't have permission to do this.",
}

// Phrases that indicate a network / connectivity problem
const NETWORK_PHRASES = [
  'failed to fetch',
  'networkerror',
  'load failed',
  'network request failed',
  'fetch failed',
  'unable to connect',
  'connection refused',
  'err_internet_disconnected',
  'err_network_changed',
]

export function translateError(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.'

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error)

  const lower = message.toLowerCase()

  // Network / connectivity errors — check first since they need immediate clarity
  if (NETWORK_PHRASES.some((phrase) => lower.includes(phrase))) {
    return "Can't connect. Check your internet connection and try again."
  }

  // Auth error messages (substring match — Supabase formats these inconsistently)
  for (const [key, friendly] of Object.entries(AUTH_MESSAGES)) {
    if (lower.includes(key.toLowerCase())) return friendly
  }

  // Postgres error codes (present on PostgrestError objects)
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : undefined

  if (code && POSTGRES_CODES[code]) return POSTGRES_CODES[code]

  // HTTP status codes that Supabase surfaces
  if (lower.includes('401') || lower.includes('403')) {
    return "You don't have permission to do this. Try signing out and back in."
  }

  // If the message is short and human-readable, show it as-is
  if (message.length > 0 && message.length < 120 && !message.includes('__')) {
    return message
  }

  return 'Something went wrong. Please try again.'
}
