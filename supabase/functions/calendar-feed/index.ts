// Supabase Edge Function — iCal feed for Apple Calendar subscription
// GET /functions/v1/calendar-feed?token={calendar_token}
//
// Returns a valid iCalendar (.ics) feed containing all chores with due dates
// and all expenses (recurring expenses use RRULE for native calendar recurrence).
// Apple Calendar subscriptions poll this endpoint every ~1 hour automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Date helpers ──────────────────────────────────────────────────────────────

// Convert YYYY-MM-DD to YYYYMMDD for iCal
function toICalDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

// Add one day to YYYY-MM-DD and return as YYYYMMDD (iCal all-day DTEND is exclusive)
function nextDay(dateStr: string): string {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

// Escape special characters in iCal text values
function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow CORS preflight (Apple Calendar may not need this, but good practice)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' },
    })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response('Missing token', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Authenticate via the per-home calendar token
  const { data: home, error: homeError } = await supabase
    .from('homes')
    .select('id, name')
    .eq('calendar_token', token)
    .single()

  if (homeError || !home) {
    return new Response('Not found', { status: 404 })
  }

  // Stamp the fetch time so the app UI knows the subscription is active
  await supabase
    .from('homes')
    .update({ calendar_last_fetched_at: new Date().toISOString() })
    .eq('id', home.id)

  // Fetch chores with due dates
  const { data: chores } = await supabase
    .from('chores')
    .select('id, title, due_date, frequency, description')
    .eq('home_id', home.id)
    .not('due_date', 'is', null)

  // Fetch all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, title, amount, date, is_recurring, recurrence_interval, notes')
    .eq('home_id', home.id)

  const vevents: string[] = []

  // ── Chore events ───────────────────────────────────────────────────────────
  for (const chore of chores ?? []) {
    const lines = [
      'BEGIN:VEVENT',
      `UID:roost-chore-${chore.id}@roost.app`,
      `DTSTART;VALUE=DATE:${toICalDate(chore.due_date)}`,
      `DTEND;VALUE=DATE:${nextDay(chore.due_date)}`,
      `SUMMARY:${escapeIcal(chore.title)}`,
      `DESCRIPTION:${escapeIcal(chore.frequency ? `Repeats ${chore.frequency}` : 'One-off chore')}`,
      'END:VEVENT',
    ]
    vevents.push(lines.join('\r\n'))
  }

  // ── Expense events ─────────────────────────────────────────────────────────
  for (const expense of expenses ?? []) {
    const amount = `£${Number(expense.amount).toFixed(2)}`
    const summary = escapeIcal(`${expense.title} — ${amount}`)

    const lines = [
      'BEGIN:VEVENT',
      `UID:roost-expense-${expense.id}@roost.app`,
      `DTSTART;VALUE=DATE:${toICalDate(expense.date)}`,
      `DTEND;VALUE=DATE:${nextDay(expense.date)}`,
      `SUMMARY:${summary}`,
    ]

    // Add RRULE for recurring expenses so Apple Calendar expands them natively
    if (expense.is_recurring && expense.recurrence_interval) {
      const freq = (expense.recurrence_interval as string).toUpperCase()
      lines.push(`RRULE:FREQ=${freq}`)
    }

    if (expense.notes) {
      lines.push(`DESCRIPTION:${escapeIcal(expense.notes)}`)
    }

    lines.push('END:VEVENT')
    vevents.push(lines.join('\r\n'))
  }

  // ── Assemble iCalendar feed ────────────────────────────────────────────────
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Roost//Roost App//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcal(home.name)}`,
    'X-WR-CALDESC:Shared chores and expenses',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(ical, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
})
