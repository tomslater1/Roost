# Roost — Build Context & Version History

> ⚠️ CLAUDE CODE: READ THIS FILE FIRST after any memory compression. It is the authoritative record of every change made to this project. The current version, the state of every feature, and every known issue are documented here.

---

## Quick reference

| Action | Shortcut |
|---|---|
| Start the app | **Cmd+Shift+B** in VS Code |

---

## How to use this file

**Claude Code must:**
- Read this file at the start of every session if memory has been compressed
- Update the version history with a new entry after every meaningful change
- Increment the version number for every build (v0.1 → v0.2 → v0.3 etc.)
- Never go to v1.0 unless Thomas explicitly says so
- Keep the "Current State" section accurate at all times

**Thomas reads this to:**
- See what changed in the last session
- Understand the current state of every feature
- Look back at why decisions were made

---

## Project Identity

| Field | Value |
|---|---|
| App name | Roost |
| Type | macOS desktop app (Electron) |
| Purpose | Shared life dashboard for couples |
| Developer | Thomas Slater |
| Partner user | Thomas's girlfriend |
| Supabase project | kfpjfhzgtejhzqdurkuu.supabase.co |
| Started | March 2026 |

---

## Tech Stack (do not change without noting it here)

| Layer | Technology |
|---|---|
| Desktop wrapper | Electron 32 + electron-vite |
| Frontend | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS **v4** + shadcn/ui (30+ components) |
| Animations | `motion` v12 (renamed Framer Motion package — import from `motion/react`) |
| Server state | TanStack Query v5 |
| Client state | Zustand (modal/UI state) |
| Forms | React Hook Form + Zod |
| Routing | React Router **v7** (imports from `react-router`, not `react-router-dom`) |
| Router type | `createHashRouter` (Electron has no real URL bar) |
| Icons | Lucide React |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Supabase client | @supabase/supabase-js v2.99.2 |
| Build tool | Vite 5 (via electron-vite) |
| Packaging | electron-builder |
| Plugin | @vitejs/plugin-react v4 (must stay v4 — v6 incompatible with Vite 5) |
| Tailwind plugin | @tailwindcss/vite (v4 — replaces PostCSS. `postcss.config.js` is empty) |
| Theme | Warm cream palette defined in `src/renderer/src/styles/theme.css` as CSS variables |
| Path alias | `@/` → `src/renderer/src/` |

---

## Current State (always up to date)

**Version:** v1.5
**Phase:** Phase 3.5 — Polish & Stability
**Last updated:** 22 March 2026

### Feature status

| Feature | Status | Notes |
|---|---|---|
| App shell / navigation | ✅ Working | Full Figma UI: AppShell, Sidebar, TopBar, BottomNav, AnimatedPage |
| TopBar | ✅ Working | Real unread count, MemberAvatar, real display name/email, real sign out |
| Auth — signup (email) | ✅ Working | Creates home + member on signup |
| Auth — login (email) | ✅ Working | signInWithPassword → /dashboard |
| Auth — Google OAuth | ✅ Working | Deep link via roost:// protocol, new users land on /setup |
| Auth — invite/join | ✅ Working | /join page + /setup join mode both handle invite codes |
| Auth — /setup page | ✅ Working | Post-OAuth onboarding: set name + create or join a home |
| Welcome / auth pages | ✅ Working | Figma Make Welcome, Join, Setup pages wired to real Supabase Auth |
| Shopping list | ✅ Working | Add, check off, delete, realtime, optimistic updates |
| Expenses | ✅ Working | Add, delete, balance, who-paid, settle up, settlement history, custom splits |
| Chores | ✅ Working | Add, complete, delete, assign-to selector, recurrence |
| Budget | ✅ Page exists | Figma UI page renders; useBudget hook wired; needs DB migration for budget limits |
| Activity feed | ✅ Working | Live feed via useActivityFeed hook + realtime subscription; dashboard widget (h-64 card, names only) |
| Calendar | ✅ Page exists | Figma UI calendar page renders with useRealCalendarEvents |
| DishBoard | ✅ Working | Coming-soon page — fully redesigned with AnimatedPage, staggered animations, on-brand colours |
| MemberAvatar | ✅ Working | Single source of truth for all avatars. Colour palette + 25 icon options. Sizes xs→xl. Needs DB migration for avatar_icon column (see issue #13) |
| Settings — Profile | ✅ Working | Avatar picker (colour swatches + icon grid), saves avatar_color + avatar_icon to Supabase home_members |
| Settings — Household | ✅ Working | MemberAvatar throughout, animated copy buttons, animated partner invite |
| Settings — Account | ✅ Working | Sign out, leave household, delete account |
| Settings — Budget Categories | ✅ Page exists | Figma UI page; needs budget DB migration to be fully functional |
| Notifications | ⚠️ Partial | useNotifications wired; notification panel UI exists; mark-as-read not yet wired |
| Quick add modals | ⚠️ Partial | UI exists; mutations need wiring |
| Theme toggle | ✅ Working | ThemeContext + next-themes; warm cream (light) and dark mode |
| Dark mode | ✅ Working | Full dark/light mode via ThemeContext and Tailwind v4 CSS variables |
| Real-time sync | ✅ Wired | Centralised realtimeManager; all tables subscribed; needs two-account verification |
| Onboarding flow | ✅ Page exists | Multi-step Onboarding component from Figma; needs end-to-end test |
| Keyboard shortcuts | ⚠️ Partial | KeyboardShortcuts component exists; Cmd+K not yet wired |
| Offline banner | ✅ Working | useOnlineStatus + amber banner in AppShell |
| Error boundary | ✅ Working | Top-level ErrorBoundary in App.tsx |

### Known issues / bugs

| # | Issue | Severity | Notes |
|---|---|---|---|
| 1 | ~~`updated_at` on shopping_items has no Postgres trigger~~ | ✅ Fixed | Trigger added in migration 0002. |
| 2 | ~~Activity feed has no writers~~ | ✅ Fixed | All three hooks write to activity_feed on every mutation via `lib/activity.ts`. |
| 3 | ~~`useRealtime` onUpdate callback not wrapped in useCallback~~ | ✅ Fixed | Fixed in v0.3 — `invalidate` wrapped in `useCallback` in `useShoppingList`. |
| 4 | ~~No global error boundary~~ | ✅ Fixed | ErrorBoundary wraps the entire app in App.tsx. |
| 5 | Expense balance calculated client-side | Low | Fine for now, may need server-side in future. |
| 6 | ~~Database types are hand-written~~ | ✅ Fixed | `npm run gen:types` regenerates from live schema. Run after every migration. |
| 7 | Migration 0009 not yet applied to live DB | High | `expenses_split_type_check` doesn't allow 'solo'. Run `supabase/migrations/0009_add_solo_split_type.sql` in Supabase SQL Editor. |
| 8 | Activity feed writes are application-layer | Medium | `logActivity()` is called from hooks — if the app crashes mid-mutation, the event is lost. Phase 3.5 task: move to DB triggers. |
| 9 | Quick add modals not wired | Medium | `QuickAddModals` component exists from Figma UI but mutations not connected. |
| 10 | Notification mark-as-read not persisted | Low | Panel shows notifications but read state is not saved to DB. |
| 11 | Keyboard shortcuts (`Cmd+K`) not wired | Low | `KeyboardShortcuts` component exists; command palette not implemented. |
| 12 | TypeScript errors from Figma migration | Unknown | Run `npm run typecheck` to get the full count. Phase 3.5 task. |
| 13 | `avatar_icon` column not applied to live DB | High | Run: `alter table home_members add column if not exists avatar_icon text default null` in Supabase SQL Editor. MemberAvatar component reads this column — without it, icon picks won't persist. |

### ⚠️ Zod datetime rule — do not break this

**Always use `z.string().datetime({ offset: true })` for all timestamp fields. Never use `z.string().datetime()` without the option.**

Supabase returns `timestamptz` as `2026-03-18T10:23:45.123456+00:00` — with a `+00:00` timezone offset. Zod's `z.string().datetime()` defaults to `offset: false`, which only accepts the `Z` suffix. Without `{ offset: true }`, every query that touches a `created_at` or similar field will throw a silent ZodError, TanStack Query will catch it and enter error state, and the app will show a blank screen with no visible error.

This caused a multi-session blank screen outage. Every schema file already has `{ offset: true }` set. Never remove it.

### Supabase state

| Item | Status |
|---|---|
| Project created | ✅ |
| Migrations applied | ✅ 0001–0008 applied; **0009 pending** (solo split type) |
| Email auth enabled | ✅ |
| Email confirmation | Disabled (for dev speed) |
| RLS policies | ✅ All tables covered |
| Realtime enabled | ✅ shopping_items, chores, expenses, activity_feed, expense_splits, settlements, home_members |
| Generated types | Run `npm run gen:types` after applying migration 0009 |

---

## Version History

---

### v1.5 — 22 March 2026
**"Polish Sprint — Avatar System, UI Redesigns, Design Ethos Alignment"**

#### What was built / changed

**MemberAvatar system**
- New `src/renderer/src/app/components/MemberAvatar.tsx` — single source of truth for all user avatars across the app
- Exports `AVATAR_COLORS` (12 warm palette colours), `AVATAR_ICON_OPTIONS` (25 Lucide icons + first-letter fallback)
- Used in TopBar, ActivityFeed, Household settings, Profile settings, and any future avatar surface
- Requires DB migration: `alter table home_members add column if not exists avatar_icon text default null` (issue #13)
- AppContext updated: `currentMember`, `partnerMember` exposed; `userIcon` added to Activity interface

**Settings pages — full redesign**
- Profile.tsx: Inline avatar picker (colour swatches + icon grid), saves to Supabase on every selection; inline name editing with save/cancel
- Household.tsx: MemberAvatar throughout; animated copy buttons (AnimatePresence swap Copy → Copied); animated invite section
- Hazel.tsx: Restructured into identity card + examples card + toggles card + privacy footer; spring-animated toggle thumb; before/after examples
- SettingsLayout.tsx: `layoutId` animated sliding tab indicator; AnimatePresence page transitions keyed on pathname
- Account.tsx: Inline animated confirmation flows (amber for leave, destructive for delete); no more `window.confirm()`

**Dashboard**
- Activity feed widget replaces "partner's tasks" as third top card
- All three top cards: fixed `h-64`, equal height — no more grid row stretching
- Activity feed: name + action + timestamp only (no avatars in this context)
- Balance card: direction pill badge (sage/terracotta), fade-up animation on amount, outline Settle Up button — no garish green

**Expenses page**
- Balance card: progressive hue — `bg-success/15 border-success/40` when owed, `bg-destructive/15 border-destructive/40` when owing
- Settlement history rows: on-brand `bg-muted/50` (replaced `bg-emerald-50 border-emerald-200`)

**SettleUp modal**
- Transfer summary: "From → To" names with animated arrow, balance amount in terracotta
- Sage-toned confirmation animation on settle (checkmark → closes)
- "Settle up" button label → "Confirm £X.XX"

**Budget page**
- Remaining card: 4-stage progressive hue based on `totalPct`: <60% subtle success → 60-80% faint warning → 80-100% warning → >100% destructive
- Card text stays plain foreground; only card background/border colours change
- All `emerald-*`, `red-*`, `amber-*` raw Tailwind colours replaced with semantic tokens (`text-success`, `text-warning`, `text-destructive`)

**DishBoard page**
- Full redesign: `AnimatedPage` wrapper, staggered entrance animations on every element
- Feature card icon colours use `bg-secondary/20`, `bg-accent/60` (replaced `bg-emerald-500/10`, `bg-sky-500/10`)
- Pulse dot uses `bg-warning` (replaced `bg-amber-500`)

**TopBar + ActivityFeed**
- TopBar: wired to real data — real unread count, real display name/email, real sign out via `useAuth()`
- ActivityFeed component: wired to `useApp().activities` (replaced hardcoded mock data)

---

### v0.1 — 16 March 2026
**"The Foundation"**
First working build. The scaffold is complete and the app opens on a real Mac connected to a real Supabase project.

#### What was built
- Full Electron + React + TypeScript project scaffolded from scratch using electron-vite
- Tailwind CSS configured with shadcn/ui CSS variables and macOS system font stack
- shadcn/ui components created manually: Button, Input, Label, Dialog, Checkbox, Skeleton, Separator
- TanStack Query v5 configured with 30s stale time
- React Router v6 with protected routes via AppShell
- AuthContext providing session state app-wide
- Full database schema created in Supabase:
  - Tables: `homes`, `home_members`, `shopping_items`, `expenses`, `expense_splits`, `chores`, `activity_feed`
  - RLS enabled on all tables
  - Helper function: `get_user_home_id()`
  - Realtime enabled on 4 tables
- Zod schemas for all entities (shopping, expenses, chores, home, user/auth)
- Hand-written `database.types.ts` matching the full schema
- Custom hooks: `useAuth`, `useHome`, `useShoppingList`, `useExpenses`, `useChores`, `useRealtime`
- Pages scaffolded: Dashboard, Shopping, Expenses, Chores, Calendar, Settings, Login, Signup, Join
- Feature components: ShoppingList, AddItemForm, ExpenseList, AddExpenseForm, ChoreBoard, AddChoreForm, ActivityFeed
- Layout: AppShell (auth guard), Sidebar, TopBar
- electron-builder configured for macOS (dmg, x64 + arm64)
- NORTH_STAR.md created with full roadmap from Phase 0 → Phase 6 (iOS App Store)
- CONTEXT.md created (this file)

#### Bugs fixed during this build
- `@vitejs/plugin-react` downgraded from v6 → v4 (v6 requires Vite 6, electron-vite ships Vite 5)
- SQL migration reordered: `get_user_home_id()` function moved after table definitions (PostgreSQL validates SQL function bodies at creation time — referencing `home_members` before it exists throws an error)
- RLS INSERT policies added for `homes` and `home_members` (missing from initial scaffold — without them, new users couldn't create a home because `get_user_home_id()` returns NULL before a home exists, causing all RLS checks to fail)
- `database.types.ts` updated to include `Relationships`, `Views`, `Enums`, `CompositeTypes` fields required by supabase-js v2.99.2
- `useRealtime.ts` rewritten to use `RealtimePostgresChangesFilter<'*'>` type correctly
- `vite-env.d.ts` added to provide `import.meta.env` types in the renderer
- Unused `Label` import removed from `Settings.tsx`

#### Known issues entering v0.2
- Auth flow not yet tested end-to-end (RLS fixes applied, awaiting confirmation)
- Activity feed has no writers — will always be empty until Phase 1 work adds them
- No error boundary

---

---

### v0.2 — 16 March 2026
**"Dark coat of paint"**
Quick UI pass to make the app visually readable and modern. Dark theme throughout, violet accent colour, tightened layout.

#### What changed
- `index.css` — replaced light theme CSS variables with dark theme: near-black background (`hsl(240 10% 6%)`), slightly lighter card surfaces, violet primary accent (`hsl(258 75% 65%)`), custom dark scrollbar
- `Sidebar.tsx` — tighter spacing, active nav item now uses `bg-primary/15 text-primary` highlight instead of flat accent, narrowed to 224px
- `TopBar.tsx` — reduced height, smaller avatar, cleaner spacing
- `Login.tsx` / `Signup.tsx` — form wrapped in a card with border, labels styled as small uppercase tracking, links use hover colour transition
- `Dashboard.tsx` — activity feed wrapped in a card, quick action buttons tightened
- `Shopping.tsx` — add form and list wrapped in separate cards
- `Chores.tsx` / `Expenses.tsx` / `Calendar.tsx` — consistent card wrapping, balance card now uses emerald/amber colours against dark background with icon
- `Input.tsx` — reduced height to h-9, rounded-lg, removed ring offset, dimmer placeholder

#### No functional changes — purely visual

---

### v0.3 — 16 March 2026
**"Shopping list"**
Shopping list feature wired up and ready to use.

#### What changed
- `postcss.config.js` created — was missing entirely, which meant Tailwind CSS never ran and the whole app was unstyled (white screen). This was the root cause of the v0.2 dark theme not appearing.
- `useShoppingList.ts` — wrapped `invalidate` callback in `useCallback` so `useRealtime` doesn't re-subscribe on every render. Consolidated all `onSuccess`/`onSettled` callbacks to use the single stable `invalidate` reference.
- `ShoppingList.tsx` — refactored `ItemRow` to accept `toggleItem` and `deleteItem` as props instead of calling `useShoppingList()` itself. Previously each row created its own hook instance, resulting in one realtime subscription per item.
- `useHome.ts` — `queryFn` return type updated to `Home | null` to handle users who are logged in but not yet linked to a home.

#### Feature status after this build
- Shopping list: add items, check off, delete, real-time sync — ready to test
- All other features: unchanged

---

### v0.4 — 16 March 2026
**"Phase 1 complete"**
Expenses, chores, and activity feed fully operational. All three features write to the activity feed. Real-time subscriptions wired on all tables.

#### What changed
- `lib/activity.ts` — fire-and-forget `logActivity()` helper writes to `activity_feed` on every mutation
- `hooks/useActivityFeed.ts` — TanStack Query + `useRealtime` subscription on `activity_feed` table
- `hooks/useShoppingList.ts` — activity writes on add/toggle/delete; mutation signatures updated to carry `name`
- `hooks/useExpenses.ts` — `useCallback` on `invalidate`, activity writes, `deleteExpense({ id, title })`, `members` exposed in return value
- `hooks/useChores.ts` — `useCallback`, activity writes, `completeChore`/`deleteChore` signatures carry `{ id, title }`
- `components/expenses/AddExpenseForm.tsx` — "Who paid" toggle using `Controller` from react-hook-form
- `components/expenses/ExpenseList.tsx` — props pattern (members + deleteExpense passed down), listItemVariants animations
- `components/chores/AddChoreForm.tsx` — "Assign to" native select using `useHome()` members
- `components/chores/ChoreBoard.tsx` — props pattern, complete + delete buttons, listItemVariants animations
- `components/feed/ActivityFeed.tsx` — uses `useActivityFeed`, AnimatePresence with cardVariants

---

### v0.5 — 17 March 2026
**"Google login + full auth flow"**
Google OAuth integrated via Electron deep links. Complete auth flow working end-to-end. New `/setup` page for post-OAuth onboarding.

#### What changed
- `src/main/index.ts` — registered `roost://` as a custom URL scheme (`app.setAsDefaultProtocolClient`), handles `open-url` macOS event, queues deep links if the window isn't ready yet, sends URL to renderer via `mainWindow.webContents.send('auth:callback', url)`
- `src/preload/index.ts` — exposes `onAuthCallback(cb)` and `removeAuthCallback()` via `contextBridge` so the renderer can safely receive IPC messages
- `src/renderer/src/types/window.d.ts` — TypeScript declarations for `window.api` (new file)
- `App.tsx` — moved `<BrowserRouter>` to wrap `<AuthProvider>` (required so AuthContext can call `useNavigate`), added `/setup` route
- `context/AuthContext.tsx` — listens for `window.api.onAuthCallback`, extracts `access_token`/`refresh_token` from the deep link hash, calls `supabase.auth.setSession()`, then checks if user has a `home_members` record — navigates to `/setup` if not, `/dashboard` if yes
- `hooks/useAuth.ts` — added `signInWithGoogle()`: calls `supabase.auth.signInWithOAuth` with `skipBrowserRedirect: true`, then opens the returned URL via `window.open()` which the main process intercepts and passes to `shell.openExternal()`
- `pages/Login.tsx` / `pages/Signup.tsx` — Google button added above the email form with the standard Google "G" SVG icon
- `pages/Setup.tsx` — new post-OAuth onboarding page: set display name (pre-filled from Google profile), toggle between "Create new home" and "Join with code", creates `homes` + `home_members` records, navigates to `/dashboard`
- `components/layout/AppShell.tsx` — added `useHome()` call; redirects to `/setup` if user is logged in but has no home (catches edge case of re-opening the app mid-setup)

---

### v1.3 — 22 March 2026
**"Phase 3 — Figma Make UI migration + Supabase wiring"**
Complete visual redesign landed. The full Figma Make frontend (built in Figma's AI design tool) was exported to GitHub and migrated into the Electron app via a 5-phase migration plan.

#### Tech stack changes
- **Tailwind CSS v3 → v4** — CSS-based config via `theme.css`, `@tailwindcss/vite` Vite plugin replaces PostCSS. `postcss.config.js` emptied to `export default {}`.
- **React Router v6 → v7** — All imports changed from `react-router-dom` to `react-router`. `createBrowserRouter` → `createHashRouter` (required for Electron).
- **framer-motion → motion** — Same library, new package name. Imports from `motion/react`.
- **New packages** — `canvas-confetti`, `react-day-picker`, `next-themes`, `recharts`, `tw-animate-css`, all missing Radix UI primitives.

#### New file structure
- `src/renderer/src/app/` — complete Figma Make app: pages, components, context, utils, routes
- `src/renderer/src/styles/` — Tailwind v4 styles: `index.css`, `theme.css` (warm cream palette), `fonts.css`
- `src/renderer/src/app/components/RootLayout.tsx` — new route-level component providing AuthProvider / AppProvider / OnboardingProvider inside the router tree

#### AppContext adapter pattern
`AppContext.tsx` was completely rewritten. The Figma UI's interface (display names, colour strings, Date objects) is maintained, but all data comes from real Supabase hooks: `useShoppingList`, `useExpenses`, `useSettlements`, `useChores`, `useRealCalendarEvents`, `useBudget`, `useActivityFeed`, `useNotifications`, `useHome`, `useAuthContext`. Adapter functions `memberName()` and `memberColor()` map user IDs to display names and avatar colours from the DB.

#### Pages now using real data
- Welcome / Join / Setup — wired to `useAuth` (signIn, signUp, signInWithGoogle, joinHome)
- Settings (Profile / Household / Account) — wired to `useAuthContext` + `useHome`
- AppShell — auth guard added: redirects to `/welcome` if no session

#### DB changes
- Migration 0009 (`supabase/migrations/0009_add_solo_split_type.sql`) — adds 'solo' to `expenses.split_type` check constraint. **Must be applied manually in Supabase SQL Editor.**

#### Bugs fixed during migration
- `Cannot find module 'autoprefixer'` — postcss.config.js emptied
- `Can't resolve 'tw-animate-css'` — package installed
- Notification field `n.entity_type` → `n.type` in AppContext
- `memberColor` was generating colour from UUID charcode — fixed to use `avatar_color` column
- `getInitials` duplicated locally — removed, imported from `@/lib/utils`
- `AuthContext` and `useAuth` imports of `useNavigate` fixed (`react-router-dom` → `react-router`)

---

### v1.2 — 19 March 2026
**"Phase 2 — Expenses v2 (Splitwise-like)"**
Full Splitwise-style expenses: summary card, one-off/recurring sections, settle-up flow, settlement history. Sensitive financial data secured via RLS + security-definer RPC.

#### SQL migration required — run `supabase/migrations/0003_expenses_v2.sql`

#### New DB objects
- `settlements` table — immutable ledger of settle-up events (home_id, paid_by, paid_to, amount, note, created_at). No update/delete policies — entries are permanent records.
- `settle_up` RPC — SECURITY DEFINER function that atomically marks all debtor's unsettled splits as settled AND inserts a settlement record. Explicit `home_members` membership check guards it. Single DB transaction, no partial state.
- `expense_splits` added to realtime publication — when a split is settled on one device, balance updates on the other in real time.
- `settlements` added to realtime publication.

#### Security notes
- `expense_splits` RLS joins through `expenses.home_id` — users can only see/modify splits for expenses in their own home.
- `settlements` RLS uses `home_id = get_user_home_id()` directly — same pattern as all other tables.
- `settle_up` uses SECURITY DEFINER but guards with an explicit `home_members` check before any writes. Consistent with `get_home_by_invite_code` pattern.
- Settlements are immutable by design — no update/delete policies means the financial ledger cannot be tampered with after the fact.

#### Code changes

**`lib/schemas/expenses.ts`** — added `ExpenseWithSplits`, `Settlement` types. Added `.superRefine` validation: `recurrence_interval` is required when `is_recurring = true`.

**`hooks/useRealtime.ts`** — made `filter` optional. Tables without `home_id` (e.g. `expense_splits`) can now subscribe without a filter string; RLS scopes what the user receives.

**`hooks/useExpenses.ts`** — major rewrite:
- Query now fetches `expenses + expense_splits(*)` in one round trip
- Balance calculated from unsettled splits (not raw `amount/2`) — respects settled state and custom splits
- `totals` exposes `{ myPaid, theirPaid, total }` for the summary card
- `partner` member exposed for the settle-up flow
- Two realtime subscriptions: expenses (home_id filter) + expense_splits (no filter, RLS-scoped)
- `settleUp` mutation calls the `settle_up` RPC, invalidates both expenses + settlements on success

**`hooks/useSettlements.ts`** (new) — standard query + realtime pattern for the settlements table.

**`AddExpenseForm.tsx`** — added recurring toggle (One-off / Recurring) and recurrence interval selector (Weekly / Monthly / Yearly), shown conditionally. Uses same segmented button pattern as "Who paid?".

**`ExpenseList.tsx`** — rewrite with two sections:
- **One-off** — non-recurring expenses with section subtotal
- **Recurring** — grouped by Weekly / Monthly / Yearly, each group with subtotal. Each row shows next due date (computed client-side using date-fns), highlighted amber if due within 3 days.
- Each row shows "you owe £X" badge when the current user has an unsettled split.

**`SettleUpDialog.tsx`** (new) — dialog showing who owes who + amount + optional note field + "Mark as settled" button. Explains that payment happens outside the app. Warns the action can't be undone.

**`SettlementHistory.tsx`** (new) — lists past settlements with emerald handshake icon, who paid who, amount, date, optional note. Shows last 3 by default with "Show all" toggle.

**`Expenses.tsx`** (rewrite) — new layout:
1. Summary card with 3 stats (you paid / they paid / total) + balance row with Settle up button
2. Expense list (one-off + recurring sections)
3. Settlement history section

---

### v1.1 — 19 March 2026
**"Phase 2 — Optimistic updates hardened"**
Every mutation now updates the UI instantly. Every failure rolls back cleanly. No ghost items, no lingering rows, no duplicates.

#### Mutation coverage after this build

| Mutation | Before | After |
|---|---|---|
| `addItem` | waits for server | instant (temp UUID), rollback on error |
| `toggleItem` | instant ✅ | unchanged |
| `deleteItem` | lingers until server | instant removal, restored on error |
| `addExpense` | waits for server | instant (temp UUID), rollback on error |
| `deleteExpense` | lingers until server | instant removal, restored on error |
| `addChore` | waits for server | instant (temp UUID), rollback on error |
| `completeChore` | waits for server | instant (sets last_completed_at), rollback on error |
| `deleteChore` | lingers until server | instant removal, restored on error |

#### The pattern applied to every mutation
1. `onMutate` — cancel any in-flight queries for this key (prevents a stale refetch from overwriting the optimistic state), snapshot the current cache, apply the change immediately
2. `onSuccess` — log activity only (no invalidate here)
3. `onError` — restore the snapshot (removes ghost items / restores deleted items), show toast
4. `onSettled` — always call `invalidate()` regardless of success or failure — this is the "reconcile with server" step

#### Why `onSettled` eliminates duplicates
For adds: `onMutate` inserts a temp item with `crypto.randomUUID()`. `onSettled` triggers a refetch that returns the real server row. The whole array is replaced, so the temp UUID item disappears and the real item takes its place — one item, correct ID, no flicker.

#### `onSuccess` no longer calls `invalidate()`
Previously some mutations called `invalidate()` in `onSuccess`. Since `onSettled` always runs after `onSuccess`, this would have caused two consecutive refetches. Moved all invalidation to `onSettled` only.

---

### v1.0 — 19 March 2026
**"Phase 2 — Offline resilience"**
Query cache persisted to localStorage. App loads instantly with cached data on every reopen. Offline detected with a subtle banner. Cache cleared on sign out.

#### What changed

**New packages:**
- `@tanstack/react-query-persist-client` — `PersistQueryClientProvider` wrapper
- `@tanstack/query-sync-storage-persister` — synchronous localStorage persister

**`main.tsx` — full rewrite:**
- `QueryClientProvider` replaced with `PersistQueryClientProvider`
- `gcTime` set to 24 hours (must be ≥ persister `maxAge` — if gcTime is shorter, the cache gets garbage-collected before the persister can save it)
- `createSyncStoragePersister` configured with `key: 'roost-query-cache'`, `throttleTime: 1000ms` (debounces writes so multiple simultaneous query updates, e.g. from a realtime event, don't hammer localStorage), `maxAge: 24h`
- `CACHE_VERSION = 'v1'` buster string — bump this in the source if the database schema changes in a breaking way; any persisted cache with an old buster is discarded

**`hooks/useAuth.ts` — signOut updated:**
- Calls `queryClient.clear()` to wipe in-memory cache
- Calls `window.localStorage.removeItem('roost-query-cache')` to wipe persisted cache
- This prevents user A's data from ever appearing when user B logs in on the same machine

**`hooks/useOnlineStatus.ts` (new):**
- Reads `navigator.onLine` synchronously on init (first render is always correct)
- Subscribes to `window online/offline` events to track changes
- Returns a simple `boolean`

**`components/layout/AppShell.tsx` — offline banner added:**
- Imports `useOnlineStatus`
- `OfflineBanner` component sits between `TopBar` and `main` — slides in/out in 150ms using `AnimatePresence` + `motion.div` height animation
- Amber strip: "You're offline — showing your last saved data"
- Only visible in the authenticated shell (not on login/signup pages)

#### How the cache flow works
1. **First ever open** — no cache; skeleton loaders show while data loads from Supabase; cache is written to localStorage
2. **Every subsequent open** — cache restored synchronously; data renders immediately (no skeletons); all queries are marked stale and refetch in the background; fresh data replaces stale data silently
3. **While offline** — amber banner shows; all queries return their cached data; mutations will fail with a toast error; Supabase Realtime disconnects gracefully
4. **Back online** — TanStack Query's `refetchOnReconnect: true` (default) fires refetches automatically; banner disappears; fresh data loads
5. **Sign out** — cache wiped from memory and localStorage; next login starts fresh

#### What stays the same
- `isLoading` is `false` whenever there is any cached data, so skeleton loaders will not show on reopens
- Realtime subscriptions are unaffected — they update the cache the same way; the persister picks up those changes and saves them
- `staleTime: 30s` is unchanged — data is background-refreshed after 30 seconds even when online

---

### v0.9 — 18 March 2026
**"Phase 2 — Loading and empty states"**
Every list has a shaped skeleton loader and a considered empty state. Error UI is unified. Dashboard has a personalised greeting.

#### What changed

**New file:** `components/ui/query-error.tsx` — shared `QueryError` component used by all four list components. Replaces the duplicated inline error divs that existed in ExpenseList, ChoreBoard, and ActivityFeed.

**Skeleton loaders — now match content shape:**
- `ShoppingList` — rows with a checkbox-sized square + varying-width text bar
- `ExpenseList` — bordered cards with two text lines on the left + an amount bar on the right
- `ChoreBoard` — bordered cards with a title bar + pill-shaped tag bars
- `ActivityFeed` — rows with a circular avatar + varying-width text bar + short timestamp bar

**Empty states — icon + title + subtitle on every list:**
- Shopping: ShoppingCart icon — "Your list is empty" / "Add the first item above — it'll appear for both of you instantly"
- Expenses: Receipt icon — "No expenses yet" / "Log a shared cost and Roost will track who's owed what"
- Chores: ClipboardList icon — "No chores yet" / "Add something that needs doing — assign it and track when it's done"
- Activity: Activity icon — "Nothing here yet" / "Activity appears here as you add items, log expenses, and complete chores"

**Dashboard — personalised greeting:**
- `getGreeting()` returns "Good morning / afternoon / evening" based on the current hour
- Pulls the current user's display name from `useHome()` members list, falls back to email prefix
- Heading reads: "Good morning, Tom" — updates automatically based on time of day

---

### v0.8 — 18 March 2026
**"Phase 2 — Error handling"**
Comprehensive error handling across every surface of the app. No error goes unhandled, no error message is a raw Supabase string.

#### What changed

**New files:**
- `lib/errors.ts` — `translateError(err: unknown): string` maps Supabase `AuthError` messages, Postgres error codes (23505, 42501, 42P01…), and network error phrases to plain English. All catch blocks in the app call this.
- `components/ErrorBoundary.tsx` — class component with `getDerivedStateFromError`. Catches uncaught render errors and shows a recovery card with "Try again" (clears error state) and "Reload app" (`window.location.reload()`) buttons.
- `components/ui/sonner.tsx` — themed `<Toaster />` wrapper. Configured for dark theme, bottom-right position, Roost design token classNames.

**New package:** `sonner` — toast notification library. `toast.error()` and `toast.success()` called from hook `onError`/`onSuccess` callbacks.

**App.tsx:** Added `<ErrorBoundary>` wrapping the entire app; added `<Toaster />` inside the provider tree.

**Hooks — all mutations now fire toasts on error and success:**
- `useShoppingList` — `onError: toast.error(translateError(err))` on addItem, toggleItem, deleteItem
- `useExpenses` — same; plus `toast.success('Expense logged')` on addExpense success
- `useChores` — same; plus `toast.success('Chore added')` and `toast.success('"Title" marked as done')`
- All hooks now expose `isError` and `refetch` in their return value

**Components — error states added:**
- `ShoppingList`, `ExpenseList`, `ChoreBoard`, `ActivityFeed` — each shows a `QueryError` component (friendly message + "Try again" button calling `refetch()`) when `isError` is true. Error check placed before the empty-state check so users never see "nothing here" when it's actually a network failure.

**Auth pages — all catch blocks now use `translateError`:**
- `Login.tsx`, `Signup.tsx`, `Join.tsx`, `Setup.tsx` — replaced raw `err.message` (or missing handling) with `translateError(err)`

**AddItemForm.tsx:** Wrapped `addItem.mutateAsync()` in try/catch. The hook's `onError` fires the toast; the catch silences the unhandled rejection in the console.

**Settings.tsx:** `DisplayNameEditor.save()` now catches Supabase errors and calls `toast.error(translateError(err))`; on success calls `toast.success('Name updated')`.

#### Error coverage summary
| Surface | Errors handled |
|---|---|
| Shopping mutations | toast on network/DB error |
| Expense mutations | toast on error + success confirmation |
| Chore mutations | toast on error + success confirmations |
| Shopping list render | QueryError UI + retry button |
| Expense list render | QueryError UI + retry button |
| Chore board render | QueryError UI + retry button |
| Activity feed render | QueryError UI + retry button |
| Login / Signup / Join | translateError → inline error paragraph |
| Setup | translateError → inline error paragraph |
| Display name edit | toast.error on save failure, toast.success on save |
| Uncaught render crash | ErrorBoundary recovery card |

---

### v0.7 — 18 March 2026
**"Phase 1 technical fixes"**
Fixed the broken invite/join flow, wired up home_members realtime, and added the missing updated_at trigger. All Phase 1 technical tasks complete.

#### What changed

**SQL migration 0002 (must be run in Supabase SQL Editor):**
- `get_home_by_invite_code(code text)` — security definer function that looks up a home by invite code, bypassing RLS. Fixes the broken join flow for new users.
- `alter publication supabase_realtime add table home_members` — makes the members list update live when a partner joins
- `set_updated_at()` trigger on `shopping_items` — auto-updates `updated_at` column on every row change

**Code changes:**
- `hooks/useAuth.ts` — `joinHome()` now calls `rpc('get_home_by_invite_code')` instead of querying `homes` directly
- `pages/Setup.tsx` — join mode also uses `rpc('get_home_by_invite_code')`
- `hooks/useHome.ts` — added `useRealtime` subscription on `home_members` table so the members list updates live when a partner joins

#### Supabase SQL to run
Go to your Supabase project → SQL Editor → paste and run `supabase/migrations/0002_phase1_fixes.sql`

---

### v0.6 — 17 March 2026
**"Settings"**
Settings page rebuilt for Phase 1. All three Phase 1 requirements covered: invite code, member list, display name editing.

#### What changed
- `pages/Settings.tsx` — full rewrite with four sections:
  - **Your profile** — avatar (coloured initials), inline display name editing (hover to reveal pencil, Enter to save, Escape to cancel), email, "Signed in with Google" badge for OAuth users
  - **Invite your partner** — invite code displayed in monospace with copy button; deep link row (`roost://join?code=XXXXXXXX`) with separate copy button — ready for Phase 4 link sharing
  - **Household** — all members listed with avatar, display name, role badge, "(you)" tag; "Waiting for partner…" shown when only one member
  - **Account** — sign out button in destructive colour

#### How display name editing works
Hover over your name → pencil icon appears → click to enter edit mode → type new name → Enter to save or Escape to cancel. Saves to `home_members` via Supabase and invalidates the `home-members` query.

#### How Google OAuth works end-to-end
1. User clicks "Continue with Google" → `supabase.auth.signInWithOAuth({ skipBrowserRedirect: true })` returns the Google URL
2. `window.open(url)` → main process `setWindowOpenHandler` intercepts → `shell.openExternal(url)` → system browser opens
3. User authenticates in browser → Google redirects to `roost://auth/callback#access_token=...`
4. macOS routes `roost://` to Electron → `app.on('open-url')` fires → `mainWindow.webContents.send('auth:callback', url)`
5. Renderer's `AuthContext` receives the URL, calls `supabase.auth.setSession()` → user is logged in
6. AuthContext checks `home_members` → redirects to `/setup` (new user) or `/dashboard` (returning user)

#### Supabase setup required (one-time, done in browser)
- Google Cloud Console: create OAuth 2.0 credentials, set redirect URI to `https://kfpjfhzgtejhzqdurkuu.supabase.co/auth/v1/callback`
- Supabase → Auth → Providers → Google: paste Client ID + Secret
- Supabase → Auth → URL Configuration: add `roost://auth/callback` to Redirect URLs
