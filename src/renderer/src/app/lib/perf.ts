/**
 * Performance baseline utility.
 *
 * Captures timing marks at key points in the app lifecycle and prints a
 * structured summary to the DevTools console. Development only — every
 * function is a no-op in production builds.
 *
 * MARKS (in chronological order)
 * ────────────────────────────────
 *   renderer-start   First JS in the renderer — set automatically on module init.
 *   auth-ready       Supabase getSession() has resolved; user is known.
 *   shell-visible    AppShell has passed all loading guards; layout is on screen.
 *   page-data-ready  The first page's query data has arrived (Dashboard feed).
 *
 * ADDING NEW MARKS
 * ────────────────
 * 1. Add the mark name to the MarkName union below.
 * 2. Call perfMark('your-mark') at the right point in the code.
 * 3. Add it to REPORT_MARKS if it should appear in the summary.
 *
 * REALTIME LATENCY
 * ────────────────
 * Logged separately from realtimeManager.ts whenever a fresh event arrives
 * (payload.new.created_at within the last 60 seconds). Approximates the time
 * between a row being written to Postgres and the client receiving the event.
 */

const IS_DEV = import.meta.env.DEV

// Captured as early as possible — set when this module is first evaluated.
// Import this module before anything else in main.tsx for the most accurate reading.
const RENDERER_START = performance.now()

type MarkName =
  | 'renderer-start'
  | 'auth-ready'
  | 'shell-visible'
  | 'page-data-ready'

const marks = new Map<MarkName, number>()

// renderer-start is always set immediately
marks.set('renderer-start', RENDERER_START)

/**
 * Record a timing mark. Each mark is logged individually as it arrives,
 * and the full summary is printed once all report marks are present.
 */
export function perfMark(name: MarkName): void {
  if (!IS_DEV) return
  if (marks.has(name)) return // Don't overwrite — first value is canonical

  const t = performance.now()
  marks.set(name, t)

  const delta = (t - RENDERER_START).toFixed(0)
  console.debug(`[Perf] ${name}: +${delta}ms from renderer start`)

  tryPrintSummary()
}

// Print the summary once all of these are recorded
const REPORT_MARKS: MarkName[] = ['auth-ready', 'shell-visible', 'page-data-ready']

function tryPrintSummary(): void {
  if (!REPORT_MARKS.every((m) => marks.has(m))) return

  const t0 = marks.get('renderer-start')!
  const tAuth = marks.get('auth-ready')!
  const tShell = marks.get('shell-visible')!
  const tPage = marks.get('page-data-ready')!

  console.group(
    '%c━━ Roost Performance Baseline ━━',
    'color: #7F77DD; font-weight: bold'
  )
  console.debug(`Auth check:           ${(tAuth - t0).toFixed(0).padStart(4)}ms`)
  console.debug(`Home data load:       ${(tShell - tAuth).toFixed(0).padStart(4)}ms`)
  console.debug(`First page data:      ${(tPage - tShell).toFixed(0).padStart(4)}ms`)
  console.debug(`─────────────────────────────`)
  console.debug(`Total (interactive):  ${(tPage - t0).toFixed(0).padStart(4)}ms`)
  console.debug(`(Realtime latency logged separately as events arrive)`)
  console.groupEnd()
}

/**
 * Log a realtime event latency reading.
 * Called from realtimeManager when a fresh event arrives.
 *
 * @param table    The table the event came from
 * @param latencyMs  Approximate ms between the DB write and client receipt
 */
export function logRealtimeLatency(table: string, latencyMs: number): void {
  if (!IS_DEV) return
  console.debug(`[Perf] Realtime latency (${table}): ${latencyMs.toFixed(0)}ms`)
}
