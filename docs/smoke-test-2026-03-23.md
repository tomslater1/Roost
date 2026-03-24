# Smoke Test — 2026-03-23

> **✅ COMPLETE — App fully operational as of 2026-03-24**
>
> All pages, features, and settings verified end-to-end. Every failure encountered during testing was diagnosed and fixed before sign-off. The app is ready for daily use by both users.
>
> **Bugs fixed during this smoke test:**
> - Apple Calendar `webcal://` subscription rejected by Supabase — fixed by setting `verify_jwt = false` in `supabase/config.toml` and redeploying the Edge Function with `--no-verify-jwt`
> - App showed "Synced" on reload when calendar had never actually been subscribed — fixed by using server-side `calendar_last_fetched_at` timestamp as the sole source of truth (only "Synced" if the Edge Function stamped a fetch within the last 3 hours), verified via Supabase Realtime push
> - Settings cog was buried in the profile dropdown — moved to top bar next to notification bell
> - No account security settings existed — added full Change Email + Change Password flow behind `supabase.auth.reauthenticate()` OTP step-up auth
> - Notification preferences page did not exist — built from scratch: in-app / macOS / future iOS toggles, per-type toggles (chores, expenses, shopping, settlements), quiet hours with overnight range support and animated drum-scroll time picker
> - Notification bell persisted in top bar even when in-app notifications were disabled — bell now animates out instantly when `in_app_enabled` is toggled off
> - Profile Preferences card had dead select dropdowns (no onChange, no state) and an email notifications row that belonged on the Notifications page — removed email row, replaced dead selects with Radix UI themed dropdowns wired to a new `user_preferences` Supabase table, added Week starts on (Mon/Sun) and Time format (12h/24h) as animated pill segment controls
> - `supabase db push` tried to re-apply all previous migrations — fixed by running `supabase migration repair --status applied` for migrations 0001–0015 so the CLI recognised them as already applied

---

## Auth & Onboarding
- [x] App boots without getting stuck on loading screen
- [x] Sign up with email (new account created, home set up)
- [x] Onboarding flow triggers and completes
- [x] Sign in with existing email account
- [x] Sign out (redirects to welcome)
- [x] Google OAuth sign in
- [x] Join flow — sign up with a second account using an invite code from Settings → Household

---

## Dashboard
- [x] Dashboard loads with real data (shopping count, chore count, balance, activity feed)
- [x] Real-time: change something on another page, confirm dashboard updates without navigating away

---

## Shopping
- [x] Add an item (Hazel normalises the name)
- [x] Check off an item
- [x] Delete an item
- [x] Clear completed items
- [x] Items grouped by category

---

## Expenses
- [x] Add an expense (Hazel categorises the title)
- [x] Balance card shows correct amount
- [x] Delete an expense
- [x] Settle up flow (modal, submit)

---

## Chores
- [x] Add a chore (title, assigned to, planned for, frequency, room — all mandatory except notes)
- [x] Room defaults to "All Rooms", date defaults to today
- [x] Mark a chore as complete (strikethrough animates, moves to Completed card)
- [x] Untick a completed chore (moves back to To do)
- [x] Delete a chore (confirmation dialog)
- [x] Overdue card appears when a chore's planned date has passed
- [x] Person filter (Everyone / Me / Partner) filters the list correctly
- [x] Stats row (To do / Overdue / Completed) updates reactively
- [x] Hazel glossy loading bar appears while a chore is being added
- [x] Room picker shows Groups section (All Rooms, All Bedrooms, All Bathrooms, custom) and individual rooms
- [x] Room groups: All Bedrooms / All Bathrooms always present; en suite / en-suite / ensuite classify under All Bathrooms
- [x] Frequency chip picker (One-time / Daily / Weekly / Monthly)
- [x] Recurring badge shown on chore row for non-one-time frequency

---

## Budget
- [x] Budget page loads with spend data — stats row (total spent, vs last month, active categories)
- [x] All categories shown as expandable pill rows, sorted by spend
- [x] Clicking a category expands expense drawer (date, payer, shared/personal badge, recurring indicator)
- [x] Shared and personal expenses both included in totals ("Shared & personal" sub-text)
- [x] Hazel categorises expenses against household's actual category list (Sonnet model, hard-clamped output)
- [x] Category override dropdown in expense form (manual pick bypasses Hazel)
- [x] "Manage limits" button navigates to Settings → Budget Categories
- [x] Month navigation (prev/next) filters spend correctly; next disabled on current month

---

## Calendar
- [x] Calendar loads and shows events from chores/expenses
- [x] Subscribe button opens webcal:// URL in Apple Calendar
- [x] Sync status shows "Pending" while Apple Calendar fetches for the first time
- [x] Sync status updates to "Synced" only after server confirms a real fetch (calendar_last_fetched_at)
- [x] Manual refresh button appears when synced; fetches feed and updates event count
- [x] Synced state persists across app reloads (server-derived, not local state)

---

## Settings
- [x] Profile — change display name saves correctly
- [x] Profile — avatar colour and icon saves correctly
- [x] Profile — shows correct sign-in method (email vs Google)
- [x] Profile — Week starts on (Mon/Sun) saves to user_preferences table
- [x] Profile — Time format (12h/24h) saves to user_preferences table
- [x] Profile — Date format dropdown saves correctly (themed Radix Select)
- [x] Profile — Currency dropdown saves correctly (themed Radix Select)
- [x] Household — invite code visible, partner shown if joined
- [x] Household — home name saves correctly
- [x] Notifications — In-app toggle hides/shows notification bell in top bar immediately
- [x] Notifications — macOS toggle gates system notifications
- [x] Notifications — Per-type toggles (chores, expenses, shopping, settlements) work
- [x] Notifications — Quiet hours enable/disable shows animated time picker
- [x] Notifications — Quiet hours time picker drum-scroll works, saves correctly
- [x] Account — Change email requires OTP re-auth before accepting new address
- [x] Account — Change password requires OTP re-auth before accepting new password
- [x] Account — Sign out works

---

## Shortcuts & Misc
- [x] Keyboard shortcuts: `G` then `S`/`E`/`C`/`B` navigates pages
- [x] Quick-add: `N` then `S`/`E`/`C` opens modals
- [x] Theme toggle (Cmd+Shift+L)
