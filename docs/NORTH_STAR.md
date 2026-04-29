# Roost — North Star Document

> Read this at the start of every session. Update the session log at the end of every session.
> Also read: [DESIGN_ETHOS.md](DESIGN_ETHOS.md) — the visual language, color system, and interaction patterns for all UI work.

---

## Vision

Roost is the shared dashboard for two people building a life together. It lives on both of your Macs, stays in sync in real time, and quietly keeps your household running — shopping lists, shared expenses, chores, a calendar, and a live feed of everything happening in your home. It is not trying to be a productivity app. It is not trying to be a platform. It is trying to be the thing you and your partner actually open every day, without thinking about it, because it makes your shared life a little easier and a little more connected. When it is finished, it should feel like it was built by someone who cares about the details — native, fast, calm, and genuinely useful.

---

## Guiding Principles

These are the filters every decision gets measured against.

**Built for two.** Every feature should make sense for exactly two people. Not teams. Not families. Two people who share a home and trust each other completely.

**Feels native.** This is a Mac app first. It should respect macOS conventions, use the system font, feel at home in the dock, and never feel like a website wrapped in a box. iOS later, same standard.

**Simple over clever.** When in doubt, do less. A feature that does one thing well is more valuable than a feature that does three things adequately. Resist scope creep.

**Real use beats polish.** An imperfect feature my girlfriend and I actually use every day is worth more than a beautiful feature we never reach for. Ship, use, improve.

**Privacy by default.** Data lives in our Supabase project. RLS enforces isolation at the database level. No analytics, no tracking, no third-party data sharing. What happens in our home stays in our home.

**Build the foundation once.** Architectural decisions — the database schema, RLS policies, the Supabase client, the Zod schemas — should be made carefully and not revisited. Features get built on top. The foundation does not move.

**No hardcoded names.** Roost ships to the App Store for any couple — never use "Tom", "Beth", or any personal names in code, UI strings, comments, or documentation examples. Use `currentUser`/`partnerName` from `AppContext`, or `me`/`partner` in internal variable names, and `[User]`/`[Partner]` as placeholders in written examples. Database columns that represent per-member splits must use generic names (`member1_percentage`, not `tom_percentage`).

---

## 🗺 The Roadmap

---

### ✅ Phase 0 — Foundation
*The scaffold is in place and the app runs.*

This phase is done. The Electron + React + TypeScript + Supabase foundation is built, the database schema and RLS policies are live, and the app opens on both Macs. No features are fully functional yet, but everything is wired up correctly.

**Completed:** March 2026

---

### ✅ Phase 1 — Make It Real
*Get the core features working well enough that we actually use Roost every day.*

This phase is done. Auth flow (email + Google OAuth), shopping list, expenses, chores, activity feed, and settings are all working end-to-end. Both users can log in, see each other's data, and make changes that sync in real time.

**Completed:** March 2026

---

### ✅ Phase 2 — Make It Solid
*Widen the footings before adding more floors.*

This phase is done. Error handling, offline resilience, optimistic updates, Splitwise-style expenses (settlements, custom splits), Zustand state management, Zod validation hardening, centralised Realtime architecture, performance instrumentation, and loading/empty states are all complete.

**Completed:** March 2026

---

### ⬜ Phase 2.5 — Make It Deeper
*Add meaningful new features and content depth before the polish phase begins.*

Phase 2 locked down the architecture. Phase 3 will define the visual language. Phase 2.5 lives in between: it is where the app grows from a functional skeleton into something genuinely rich and daily-useful. The goal here is not polish — it is substance. Every feature in this phase should make a real couple's life measurably easier. When Phase 2.5 is complete, the app should have no obvious gaps; every section should feel considered and complete enough to hand to someone without apology.

**Features to build:**

- [x] **Budgeting section (new page)** — A dedicated view for household financial health. Couples can set a monthly budget for any category (groceries, eating out, household, entertainment) or a single total household budget. The page shows: total spent this month vs. budget with a visual progress bar (green → amber → red as the limit approaches), a breakdown by category pulling from existing expense data, month-on-month spend trends as a simple bar chart, and a projected end-of-month total based on the current spend rate. Budget limits are stored per home in the database. This is not a replacement for the Expenses section — it is an overview layer on top of it. The guiding question is: "are we on track this month?" answered at a glance without opening a spreadsheet.

- [x] **Dropdown calendar date pickers (all date inputs)** — Every place in the app where a date is entered — adding a chore with a due date, setting the next shop date, logging an expense date — should use a native-feeling popover calendar picker rather than a plain text input or the browser's default date widget. The picker should open below the input field, show a month grid with prev/next navigation, highlight today, and close on selection or outside click. This should be a single reusable `<DatePicker>` component built on Radix UI Popover (already installed) with full keyboard support: arrow keys navigate days, Enter selects, Escape closes. This is a quality-of-life improvement that touches chores, expenses, shopping (next shop date), and any future feature that takes a date.

- [x] **Dashboard build-out** — The Dashboard is currently a placeholder. It should become the true home screen: a single view where a couple can see everything that matters without navigating away. The layout is a grid of summary cards, each deep-linking to its full section. Cards to include: **Shopping** (count of unchecked items + the last 3 items added), **Chores** (overdue count + the next due chore), **Expenses** (current balance — who owes whom and how much), **Budget** (current month spend vs. limit, colour-coded), **Activity Feed** (the 5 most recent events, with avatars), and **Next Shop Date** (prominently displayed with a countdown: "Shopping in 3 days"). The dashboard is read-only — it surfaces information, it does not replace the dedicated section pages. It should update in real-time: when your partner checks off a shopping item, the dashboard card count drops immediately.

- [x] **DishBoard integration tab (coming soon)** — Add a new tab to the sidebar labelled "DishBoard" with an appropriate icon (e.g. a chef's hat or fork/knife). The tab contains a polished "coming soon" screen that explains what the integration will do: when a meal is planned in DishBoard (Thomas's recipe and meal planning app), its ingredients are pushed automatically to the Roost shopping list. The screen should feel intentional — not an empty placeholder, but a preview with a short description, a visual mockup or icon treatment, and a note that this is in development. This tab establishes the integration as a first-class feature in the app's navigation from day one, so it does not feel bolted on later.

- [ ] **Shopping list enhancements** — Build out the shopping section beyond the basics. Features to add: (1) **Next shop date** — a date input at the top of the shopping list page that saves to `homes.next_shop_date` and shows a visible countdown ("Shopping in 3 days / tomorrow / today"). This already has a database column from migration 0006. (2) **Category grouping** — when items have a category assigned, group them under collapsible headers (Produce, Dairy, Bakery, etc.) so the list is easier to navigate in-store. Ungrouped items fall under "Other". (3) **Quick-add from keyboard** — pressing Enter after typing an item name immediately submits and refocuses the input, allowing rapid successive additions without reaching for the mouse.

- [ ] **Chore improvements** — Flesh out the chores section to make it genuinely useful for a couple managing a home. Features to add: (1) **Completion history** — a simple log of recent completions ("[User] completed 'Clean bathroom' · 2 days ago") visible in the chore detail or as a subtle history row. (2) **Overdue indicator** — chores past their due date are visually flagged (a red date label) and sorted to the top of the list. (3) **Chore streaks** — for recurring chores, show a small streak counter ("✓ 4 weeks in a row") as a light motivational touch. This requires tracking completion timestamps, which are already stored in `last_completed_at`. (4) **Unassigned chores view** — a visual indicator that a chore has no assignee, prompting someone to pick it up.

- [ ] **Calendar page (full build)** — The Calendar page is currently a "coming soon" placeholder. Promote the calendar feature plan (already designed in detail) from backlog to Phase 2.5. This includes: a month grid view with event dots, an upcoming events list below the grid aggregating chores with due dates and expenses with dates/recurrence, and an Apple Calendar sync button that opens a webcal:// subscription. The webcal feed is served by a Supabase Edge Function authenticated by a per-home `calendar_token`. This is a complete, production-quality calendar, not a stub. Full implementation details are documented in the calendar feature plan.

**Technical tasks:**

- [x] **Budget database migration** — Add a `budgets` table to store per-home monthly budget limits by category. Schema: `id`, `home_id`, `category` (string, nullable — null means total household budget), `amount` (numeric), `period` ('monthly'), `created_at`. Write the migration, RLS policies (same home = read/write), and add the types to `database.types.ts` and Zod schemas. The UI reads existing `expenses` rows — no changes to the expenses table needed.

- [x] **`DatePicker` component** — Build a reusable `src/renderer/src/components/ui/DatePicker.tsx` using Radix UI Popover + a custom calendar grid. Accepts `value: Date | null`, `onChange: (date: Date) => void`, `placeholder?: string`, and `disabled?: boolean`. Use `date-fns` (already installed) for all date arithmetic. Full keyboard support: arrow key navigation, Enter to select, Escape to close, Tab to cycle through prev/next month buttons. Replace every raw `<input type="date">` in the codebase once the component is built.

- [x] **`useCalendarEvents` hook** — A new aggregation hook (`src/renderer/src/hooks/useCalendarEvents.ts`) that pulls from the existing `useChores()` and `useExpenses()` hooks and returns `CalendarEvent[]` sorted by date, plus an `eventsByDate` record keyed by `YYYY-MM-DD` for the dot indicators on the calendar grid. Handles recurring expense expansion for the next 6 months using `date-fns` `addWeeks`/`addMonths`/`addYears`. No new Supabase queries — purely client-side aggregation over already-loaded data.

- [x] **Supabase Edge Function: calendar feed** — `supabase/functions/calendar-feed/index.ts`. A Deno Edge Function that returns a valid `.ics` file for the home identified by the `token` query parameter. Queries chores (by `due_date`) and expenses (by `date`, with `RRULE` for recurring) and builds the iCal payload. Returns `Content-Type: text/calendar`. Authenticated solely by the secret `calendar_token` UUID — no Supabase auth header required (Apple Calendar can't send one). Returns 400 for missing token, 404 for invalid token.

- [x] **Dashboard data aggregation** — The Dashboard page should not fire its own Supabase queries. It should consume data from existing hooks (`useShoppingList`, `useChores`, `useExpenses`, `useHome`, `useActivityFeed`) and derive its summary values client-side. This ensures the dashboard is always in sync with its source-of-truth pages without duplicating network requests or cache entries. If any of those hooks are not already mounted (the user navigates directly to the Dashboard on launch), TanStack Query will fetch them on demand.

- [x] **`useBudget` hook** — A new hook (`src/renderer/src/hooks/useBudget.ts`) that fetches budget limits from the new `budgets` table and computes current month spend per category by filtering `expenses` data. Returns: `{ budgets, totalSpent, spentByCategory, projectedMonthEnd, isOverBudget }`. Includes a `setBudget` mutation for creating or updating a limit. Real-time subscription on the `budgets` table so both partners see limit changes immediately.

- [x] **Page navigation update** — Add the DishBoard tab to `src/renderer/src/components/layout/Sidebar.tsx` and the `/budget` route to the router in `App.tsx`. Ensure ordering in the sidebar is logical: Dashboard → Shopping → Expenses → Budget → Chores → Calendar → DishBoard → Settings (bottom).

**Definition of done:**
The app has no placeholder pages — every tab in the sidebar leads to a complete, usable feature. The dashboard gives a genuine at-a-glance view of household status. Budget limits can be set and tracked. Every date input uses the reusable DatePicker. Apple Calendar sync works end-to-end. DishBoard tab is present with a polished coming-soon screen. All new features have real-time sync, loading states, empty states, and error handling.

**Estimated time:** 4–6 weeks

---

### ✅ Phase 3 — Make It Beautiful
*Design it in Figma. Build it in code. Make it feel like it belongs on a Mac.*

This phase is done. The complete UI was designed using Figma Make (Figma's AI design tool), exported to GitHub, and migrated into the Electron app via a structured 5-phase migration plan documented in `FRONT_END_MIGRATION.md`. The result: a full warm-cream design system (Tailwind v4 CSS variables), 30+ shadcn/ui components, full page set including onboarding, animations via `motion`, and the Figma UI wired to real Supabase data via an AppContext adapter layer.

**What was done:**
- Full Figma Make design covering every page: Dashboard, Shopping, Expenses, Budget, Chores, Calendar, DishBoard, Settings, Auth (Welcome/Join/Setup)
- Complete design system: warm cream palette, custom typography, consistent spacing/radius, dark/light mode support via ThemeContext
- Tailwind v3 → v4 migration (CSS-based config, `@tailwindcss/vite` plugin)
- React Router v6 → v7, `framer-motion` → `motion` package
- AppContext adapter pattern: real Supabase hooks behind the Figma UI's interface
- RootLayout pattern for provider nesting inside router context
- DB migration 0009 adding 'solo' split type
- All pages wired to live Supabase data

**Completed:** March 2026

---

### ✅ Phase 3.5 — Polish & Stability
*Make the Figma UI fully functional and feel genuinely finished before opening the doors.*

Phase 3 landed a beautiful new UI in the Electron app. Phase 3.5 is about closing the gap between "looks great" and "works great" — fixing bugs, wiring up everything the Figma migration left as stubs, adding the AI assistant for small daily tasks, and smoke-testing every surface so the app is genuinely ready for a second user.

**Bug fixes & stability:**

- [x] **Run migration 0009** — Apply `supabase/migrations/0009_add_solo_split_type.sql` to the live Supabase project. Currently the DB check constraint doesn't allow the 'solo' split type that the code already uses.
- [x] **TypeScript clean pass** — Run `npm run typecheck` and fix all errors. The Figma migration introduced new types; some mismatches likely exist between the Figma UI types and the Supabase types.
- [x] **Full smoke test** — Manually test every page and every action: add/edit/delete for shopping, expenses, chores; settle up flow; settings; auth flow (email + Google); join flow with a second account. Document and fix every failure. **Completed 2026-03-24** — see `docs/smoke-test-2026-03-23.md` for full report and bug fixes.
- [x] **Remove `roost/` directory** — The original Figma Make export is no longer needed in the repo. Remove it to keep the codebase clean. **Completed 2026-03-24.**
- [~] **Activity feed DB triggers** — ⚠️ Known limitation. Action strings are human-readable and perspective-dependent (e.g. `"You settled up"`) making PL/pgSQL reconstruction fragile. App-layer fire-and-forget is acceptable for now. Revisit if silent activity loss becomes a real issue.
- [x] **Error boundary review** — No ErrorBoundary existed (never carried over from Phase 2). Created `components/ErrorBoundary.tsx` (class component, logs to console, "Try again" reset). Wraps `<Outlet />` in AppShell (all authenticated pages) and `<RouterProvider />` in App.tsx (top-level catch-all). **Completed 2026-03-24.**
- [x] **Offline banner wiring** — `useOnlineStatus` hook existed but no banner component was ever built. Created `components/OfflineBanner.tsx`: slim warning-amber strip, `WifiOff` icon, warm voice copy, `height: 0 → auto` slide-in via `AnimatePresence`. Wired between TopBar and `<main>` in AppShell so it pushes content down gracefully. **Completed 2026-03-24.**
- [ ] **Realtime two-account test** — Verify real-time sync works end-to-end with two logged-in accounts. Confirm changes on one Mac appear instantly on the other without a manual refresh. *(Carried to Phase 4)*

**UI polish:**

- [x] **Quick add modals** — Wired to real Supabase mutations via AppContext. Now mounted globally in AppShell via QuickAddContext so keyboard shortcuts can trigger them from any page.
- [x] **Notification panel** — Fully wired to real `useNotifications` data with real-time subscription. Mark-as-read persists to the DB immediately.
- [x] **Settle Up modal** — Redesigned with "From → To" transfer summary, animated arrow, sage-toned confirmation animation. Wired to `addSettlement`.
- [x] **Onboarding flow** — Auto-triggers on first launch (800ms delay to let app render). localStorage flag prevents re-showing for returning users. Skip and complete both persist the flag.
- [x] **Theme toggle** — Persists to localStorage, system preference fallback on first launch, keyboard shortcut (Cmd/Ctrl+Shift+L) active.
- [x] **Keyboard shortcuts** — Chord state machine replaces `prompt()`: G then D/S/E/C/B navigates; N then S/E/C opens quick-add modals; Escape closes all modals. Chord hint pill badge animates in/out.
- [x] **Empty states audit** — Shopping (empty list + all-done variants), Expenses (no expenses + no filter results), Chores (with add CTA), Dashboard activity — all use the `EmptyState` component with warm copy and spring animation.
- [x] **Loading states audit** — Shopping, Expenses, Chores use `ListSkeleton`; Dashboard shows `StatsSkeleton` + `CardSkeleton` while all three sources load. `isShoppingLoading`, `isExpensesLoading`, `isChoresLoading` exposed from AppContext.
- [x] **Animations QA** — Settings pages, DishBoard, balance cards, and SettleUp modal all reviewed and animated to match design ethos.
- [x] **Settings pages full redesign** — Profile (avatar picker), Household (MemberAvatar, animated invite), Hazel (examples, spring toggle), SettingsLayout (animated tab indicator + page transitions), Account (inline confirmation flows).
- [x] **Profile avatar customisation** — Users can choose from 12 colours and 25 icons. Persists to Supabase `home_members`. Shown everywhere via MemberAvatar component.
- [x] **TopBar wired to real data** — Real unread count, MemberAvatar, real display name/email, working sign out.
- [x] **ActivityFeed wired to real data** — `useApp().activities` replaces mock data. Dashboard widget shows live feed.
- [x] **Design ethos colour pass** — Balance card (Expenses), Remaining card (Budget), Settlement history, DishBoard, Progress icons — all emerald/red/sky Tailwind colours replaced with semantic tokens (`text-success`, `text-warning`, `text-destructive`, progressive hue backgrounds).

**Minor Claude AI integration:**

Add a small, focused Claude AI assistant to the parts of the app where natural language saves real time. This is not a chatbot — it is targeted smart-fill for specific inputs, using the Claude API in the Electron main process (keeps the API key out of the renderer).

- [~] **Shopping list: smart add** — Original spec (batch paste → checkbox preview) was superseded by Hazel's silent per-item normalisation, which is less intrusive and covers the daily-use pattern. Not built as described; considered resolved.
- [~] **Expense: smart categorise** — Original spec (real-time ghost-text pill) was superseded by Hazel's on-save categorisation. Less intrusive, no extra API calls while typing. Not built as described; considered resolved.
- [x] **Chore: smart suggestions** — "Suggest" button added to the Chores page header. Hazel returns 5 seasonal, duplicate-aware suggestions as quick-add chips. Chips transition to a success state after adding.
- [x] **Claude API wiring** — Done. `src/main/claude.ts` with `MAIN_VITE_ANTHROPIC_API_KEY`, IPC via `window.api.normalize()` and `window.api.suggestChores()`. API key never reaches the renderer.

**Technical tasks:**

- [x] **`npm run typecheck`** — Zero TypeScript errors before Phase 4
- [x] **`npm run build`** — Production build succeeds and produces a working `.dmg`
- [x] **Update `database.types.ts`** — Run `npm run gen:types` after migration 0009 is applied
- [x] **Dependency audit** — Removed 26 unused npm packages (69 transitive) and 28 dead shadcn UI component files. Zero TypeScript errors and production build confirmed clean after removal.

**Definition of done:**
Every page works end-to-end with real data. Zero TypeScript errors. Production build succeeds. The AI smart-add, smart-categorise, and chore suggestions are all working. Both Thomas and his girlfriend can use the app without encountering any broken states.

**Completed:** March 2026

---

### 🚪 Phase 4 — Open the Doors
*Prepare for other couples to use it. Make it work for people who never heard of Supabase.*

Up to this point, Roost has been running on a shared Supabase project that I manage. Phase 4 makes it self-contained — a couple can download it, create an account, and be up and running without any technical setup.

**Carried over from Phase 3.5 / 2.5:**

- [ ] **Realtime two-account test** — Verify real-time sync works end-to-end with two logged-in accounts on separate Macs. Confirm changes appear instantly on the other machine without a manual refresh. This is the core feature — must pass before anything else in Phase 4.
- [x] **Shopping list enhancements** — (1) Next shop date countdown at the top of the Shopping page, pulling from `homes.next_shop_date` ("Shopping in 3 days / tomorrow / today"). (2) Category grouping — when items have a category, group them under collapsible headers in-store order. Ungrouped items fall under "Other".
- [x] **Chore improvements** — (1) Overdue indicator — chores past due date sorted to the top with a red date label (already partially in place). (2) Completion history — a subtle log of recent completions visible in the chore list ("[User] · 2 days ago"). (3) Streaks — for recurring chores, show a small streak counter ("✓ 4 weeks in a row") using `last_completed_at`. (4) Unassigned chores — visual indicator when a chore has no assignee.
- [x] **DatePicker on all remaining date inputs** — Audit every date input in the app and confirm the reusable `DatePicker` component is used everywhere. Replace any remaining raw `<input type="date">` instances.

**Features to build:**

- [x] **Self-serve account creation** — Hosted Supabase backend (already done), but the signup/invite flow needs to be bulletproof for non-technical users
- [x] **Invite link** — Share a link (`roost://join?code=abc123`) instead of just a code string. Deep link opens the app directly to the join screen.
- [x] **Push notifications** — macOS notifications when your partner does something. Uses Electron's notification API.
- [x] **Home name** — Let couples name their home ("The Flat", "Our Place")
- [x] **Account settings** — Change email, change password, delete account
- [x] **Landing page** — A simple webpage explaining what Roost is and linking to the download. Even one page. Required before sharing publicly.
- [x] **Auto-update** — `electron-updater` so the app updates itself when a new version is released. Critical for post-launch maintenance.

**Technical tasks:**

- [x] Implement `electron-updater` with a GitHub Releases update server
- [ ] Sign the app with a Developer ID certificate (required for Gatekeeper, even without App Store)
- [x] **Set up a proper release pipeline** — See full process below.
- [x] Write a privacy policy (required for App Store and good practice) — see `docs/PRIVACY_POLICY.md`

---

## 🚀 Release Pipeline

*How a new version of Roost goes from code to both Macs.*

This pipeline is the source of truth for every release. No version ships without Thomas explicitly signing off.

### How it works

1. **CI builds the release as a draft.** Every push to a `v*` tag triggers GitHub Actions. The workflow builds the universal macOS DMG + zip, uploads all artifacts, and creates a **draft** GitHub Release. The draft is invisible to the auto-updater — `latest-mac.yml` only updates when a release is published.

2. **Thomas reviews and publishes.** Open [github.com/tomslater1/Roost/releases](https://github.com/tomslater1/Roost/releases), find the draft, and verify: the DMG downloads and opens, the build looks right. When happy, click **"Publish release"**. That is the sign-off. Nothing goes live without it.

3. **Auto-updater picks it up.** Within 5 seconds of the next app launch on either Mac, `electron-updater` sees the new `latest-mac.yml` and shows the update banner. The user downloads and restarts. Done.

### Steps for every release

```
1. Finish the work — all commits on main, typecheck passing
2. Bump version in package.json  (e.g. "1.0.11" → "1.1.0")
3. Update the session log in NORTH_STAR.md
4. git add . && git commit -m "Release v1.x.x"
5. git push origin main
6. git tag v1.x.x && git push origin v1.x.x
7. Wait ~8 minutes for GitHub Actions to finish
8. Open github.com/tomslater1/Roost/releases
9. Review the draft release — download the DMG, confirm it opens
10. Click "Publish release"  ← Thomas's sign-off
11. Both Macs will show the update banner on next launch
```

### Version numbering

- **Patch** (`1.0.x`) — bug fixes, invisible improvements, no new UI
- **Minor** (`1.x.0`) — new features or meaningful UI changes
- **Major** (`x.0.0`) — reserved for breaking changes or a major relaunch

### What's automated (GitHub Actions)

- Checkout, `npm ci`, `electron-vite build`, `electron-builder --publish always`
- Secrets injected: `GH_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
- `CSC_IDENTITY_AUTO_DISCOVERY=false` — skips codesign (unsigned for now, see Phase 5)
- Artifacts uploaded: `Roost.dmg`, `Roost-{version}-universal-mac.zip`, `latest-mac.yml`

### What's NOT automated (by design)

- **Publishing the release** — Thomas always does this manually. The draft gate ensures nothing goes to users without review.
- **Version bump** — Intentional. Claude or Thomas bumps it explicitly per release so the version number is always a deliberate decision.

### Current status

Auto-update is live and working (v1.0.10+). The pipeline produces draft releases. Signing and notarisation are deferred to Phase 5 — the app currently bypasses Gatekeeper because both Macs already have it installed with trust established.

---

**Definition of done:**
A friend who is not a developer can download the app, create an account, and invite their partner without asking me for help. Auto-update works. The app is signed and not blocked by Gatekeeper.

**Estimated time:** 3–5 weeks

---

### 🪺 Phase 4.5 — Roost Nest Freemium Foundation
*Add the paid layer without compromising the warmth or the architecture.*

Roost stays genuinely useful for free, but the complete experience now lives behind a household subscription called **Roost Nest**. This phase is about building the subscription foundation once, correctly: the subscription state lives on `homes`, Stripe writes via webhook, the app reads and gracefully degrades, and both the Mac app and future iOS app share the exact same source of truth.

**Principles for this phase:**
- Platform-agnostic subscription state on `homes`
- Webhook-driven updates only — never trust the client to mark itself paid
- Graceful free-tier fallback if Stripe is unavailable or status is unknown
- RLS-consistent with the existing `get_user_home_id()` pattern
- Zod-validated at every boundary

**Free tier (Roost):**
- Shopping list — full, unlimited, real-time
- Expenses — current 30 days only
- Chores — add, assign, complete (no recurrence)
- Activity feed — always full
- Pinboard — full access
- Budget — current month only
- Hazel — shopping normalisation and chore suggestions only
- Real-time sync — always on
- 14-day Nest trial on first signup

**Roost Nest (£4.99/month or £39.99/year per household):**
- Full expense history
- Budget history and trends
- Hazel expense auto-categorisation
- Hazel budget insights and forecasting
- Chore recurrence and streak tracking
- Calendar sync (iCal export / subscription)
- iOS app access when it launches
- Early access to new features

**Foundation work:**
- [x] Add household subscription columns to `homes` and immutable `subscription_events` audit log
- [x] Create subscription schemas and canonical `useSubscription()` hook
- [x] Add `NestGate` as the primary UI primitive for feature gating
- [x] Gate Hazel expense categorisation in the main process and budget insights in both renderer + IPC
- [x] Filter free-tier expenses to the last 30 days only
- [x] Restrict free-tier budget navigation to the current month
- [x] Add secure Stripe IPC handlers for checkout, portal, and price lookup
- [x] Scaffold Stripe webhook Edge Function for subscription-state sync
- [x] Start new households on a 14-day Nest trial at the database layer

**Still to complete after the foundation pass:**
- [x] Polish the upgrade/manage-subscription UX in Settings and gated surfaces
- [~] Add Stripe webhook secret + live price IDs in all required environments — env names are now documented in `.env.example` and `docs/STRIPE_SUBSCRIPTION_ROLLOUT.md`; still requires adding the real live values in each environment
- [~] Run the subscription migration in the Supabase SQL editor — migration is ready (`0024_subscription.sql`) and documented in `docs/STRIPE_SUBSCRIPTION_ROLLOUT.md`; still requires running against the live project
- [~] Deploy the Stripe webhook Edge Function and register the Stripe endpoint — function config now disables gateway JWT in `supabase/config.toml` and rollout steps are documented; still requires live deployment + Stripe dashboard setup
- [~] Manually test the full trial → active → canceled lifecycle end to end — explicit test checklist added in `docs/STRIPE_SUBSCRIPTION_ROLLOUT.md`; still requires execution in Stripe/Supabase

**Definition of done:**
Subscription state is household-level, webhook-driven, reflected live in the UI, and safe to reuse for iOS without redesigning the model. Free users keep a generous product. Nest unlocks paid features cleanly and warmly.

---

### 🌐 Phase 5 — Website Distribution & Frictionless Download
*Make Roost feel trustworthy, obvious, and easy to install for a completely non-technical couple.*

The Mac App Store is no longer the goal. Phase 5 is now about direct distribution done properly: a polished website, clear messaging, trustworthy download flows, signed and notarised builds, and an install experience that does not require hand-holding. The standard here is simple: someone who has never heard of Supabase, GitHub Releases, or Gatekeeper should be able to land on the site, understand Roost in under a minute, download it, open it safely, and get into the app without messaging me for help.

This phase is partly technical and partly product/marketing. The app itself may already work well, but if the website is unclear, the download feels risky, or the install instructions are vague, the product is not truly ready for real people.

**What's required:**

- [ ] **Website becomes the real front door** — The landing page should clearly explain what Roost is, who it is for, and why a couple would want it. It should feel like the same product as the app: warm, calm, trustworthy, and intentional. No placeholder copy, no generic startup language.
- [ ] **Clear download path** — The site needs a prominent, unmissable download CTA that points to the latest stable macOS build. The user should never need to browse GitHub manually to find the app.
- [ ] **Versioned release handoff from GitHub to website** — GitHub Releases can remain the build/distribution backend, but the website must surface the current release cleanly so the average user never sees the plumbing unless they want to.
- [ ] **Signed macOS app** — Sign Roost with a Developer ID certificate so it feels like legitimate Mac software instead of a suspicious unsigned download.
- [ ] **Notarisation** — Notarise every public build so Gatekeeper allows the app to open cleanly on a normal Mac.
- [ ] **Hardened runtime / release safety audit** — Confirm production builds meet modern macOS distribution expectations and that nothing in the release configuration undermines trust or stability.
- [ ] **First-run install guidance** — The website should have a short, well-designed help section for the first open: how to install the DMG, what to expect on first launch, and what to do if macOS warns about an unknown developer before signing/notarisation are fully locked down.
- [ ] **Simple support surface** — Add an obvious support/contact path on the site so users know where to go if something goes wrong.
- [ ] **Website polish for trust** — Add real screenshots, concise feature explanation, privacy reassurance, and enough product detail that a couple feels confident downloading it.
- [ ] **Download confidence signals** — Version number, last updated date, Apple Silicon/Intel support wording, and a short note on privacy and updates should all be easy to find.
- [ ] **Auto-update confidence** — The website copy should make it clear that Roost updates itself, so users are not worried that downloading directly means they are stuck managing updates manually.

**Suggested website sections:**

- Hero: what Roost is in one sentence + download CTA
- Why Roost: shopping, expenses, chores, calendar, pinboard — the shared-life story
- Screenshots: real app UI, not mock fluff
- Privacy: private by default, no analytics, data stays in your home
- How it works: download → sign in → invite partner → start using it
- Support / FAQ: install help, updates, known issues, contact

**Definition of done:**
A non-technical user can discover Roost from the website, understand it, download it safely, install it on their Mac without confusion, and trust that it is legitimate software. The app is signed, notarised, clearly presented, and easy to get running without direct help from me.

**Estimated time:** 3–6 weeks

---

### 📱 Phase 6 — iOS
*Bring Roost to iPhone. Same Supabase backend, new frontend.*

The Supabase backend is already shared — every feature built for macOS works on iOS by default. The iOS app is a new frontend in React Native that talks to the same database. The goal is feature parity with the macOS app, optimised for a phone.

**Approach:**

- React Native (not Expo for production, but Expo for scaffolding and development)
- Shared Supabase client and type definitions
- iOS-native navigation patterns (tab bar, not sidebar)
- Push notifications via APNs

**Key considerations:**

- This is a separate codebase — shared logic (Supabase queries, Zod schemas) can be extracted into a shared package if needed
- App Store submission is a separate process from Mac App Store (different certificates, different review team)
- TestFlight is the equivalent of direct `.app` distribution for iOS

**Definition of done:**
The iOS app is on the App Store. My girlfriend and I use it on our phones. Real-time sync works between Mac and iPhone.

**Estimated time:** 6–10 weeks after Phase 5

---

## 📋 Feature Backlog

### Core — Must have before anyone else uses it
- ~~Shopping list with real-time sync~~
- ~~Expense splitting with running balance~~
- ~~Chores with assignments and due dates~~
- ~~Activity feed (live log of household events)~~
- ~~Auth: signup, login, invite/join flow~~
- ~~Settings: invite code, member list, display name~~
- ~~Push notifications when your partner makes a change~~

### Enhancement — Makes the experience meaningfully better
- ~~Dark mode (system-aware)~~
- ~~Chore recurrence (weekly, monthly)~~
- ~~Custom expense splits (not just equal)~~
- ~~Settle up flow for expenses~~
- ~~Calendar with shared events and bill due dates~~ → **Phase 2.5**
- ~~Bill reminders — notification X days before a due date~~
- ~~Shared notes / pinboard — a freeform shared space for anything~~
- ~~Search across all content~~
- ~~Keyboard shortcuts throughout~~
- ~~Command palette (`Cmd+K`)~~
- macOS menu bar widget — quick add item without opening the full app
- ~~Auto-update (electron-updater)~~
- ~~Grocery budget / household budget tracking~~ → **Phase 2.5**
- ~~Dropdown date pickers throughout~~ → **Phase 2.5**
- ~~Dashboard build-out~~ → **Phase 2.5**
- ~~Shopping list: category grouping, next shop date, quick-add keyboard flow~~ → **Phase 2.5**
- ~~Chore overdue indicators, completion history, streaks~~ → **Phase 2.5**

### Ambitious — For when the foundation is solid
- **Moving checklist** — Thomas is moving in with his girlfriend in June 2026. A structured shared checklist for the move, with categories (things to buy, admin tasks, dates to remember). Could be the first "special mode" in the app.
- **Dishboard integration** — Roost + Dishboard (Thomas's recipe app, built in Python/PySide6/Supabase). When a meal is planned in Dishboard, ingredients push to the Roost shopping list automatically. This is genuinely useful and architecturally interesting — a cross-app Supabase integration.
- **Shared wishlist / gift ideas** — A private list where each person can add things they want. Hidden from your partner by default (they only see your wishlist, you only see theirs). Useful for birthdays and Christmas. Requires a twist on the RLS model.
- **Household budget** — Total monthly budget, tracked against logged expenses. Graphs. Trends over time.
- **Receipt scanning** — Point your camera at a receipt, have the app extract the total and suggest a category. Requires vision API integration.

### Someday — Interesting but not a priority
- Web version (Supabase backend makes this technically easy)
- Third user (e.g. a housemate who shares the shopping list but not expenses)
- Recurring expense auto-logging (e.g. rent logs itself on the 1st of every month)
- Shared photo album — a private shared feed of photos from home
- Integration with Google Calendar or Apple Calendar for the calendar view
- Siri shortcuts for quick actions on iOS
- Apple Watch complication showing the shopping list

---

## 🔧 Technical Debt & Architecture Notes

Things that were done quickly or need revisiting. Be honest here — this is not a shame list, it is a maintenance list.

### Known issues to fix in Phase 2

**~~`updated_at` on `shopping_items`~~** — ✅ Fixed in v0.7. Postgres trigger `set_updated_at()` added via migration 0002.

**Activity feed writes — upgrade to DB triggers (Phase 2)** — Application-layer writes via `logActivity()` are working (v0.4) but fragile: if a mutation succeeds but the app crashes before `logActivity()` runs, the event is lost silently. Phase 2 should replace this with Supabase database triggers that fire on every `INSERT`/`UPDATE`/`DELETE` regardless of what the application does. More reliable and not dependent on every future developer remembering to call `logActivity()`.

**~~`useRealtime` callback stability~~** — ✅ Fixed in v0.3. All consuming hooks wrap `invalidate` in `useCallback`.

**Expense balance calculation** — Currently computed client-side in `useExpenses.ts` by iterating all expenses. This works for small datasets but will become slow with history. In Phase 2, consider a Postgres function or view that computes the balance server-side.

**No error boundary** — If a component throws during render, the whole app white-screens. Add a top-level `ErrorBoundary` component in `App.tsx` that shows a recoverable error state. (Phase 2 technical task.)

**`useAuth` uses `useNavigate` directly** — This is fine for now but couples the hook tightly to React Router. Consider returning a redirect flag instead of calling `navigate()` inside the hook if this causes testing issues later.

**Database types are hand-written** — `src/renderer/src/types/database.types.ts` was written by hand to match the migration. It will drift from the real schema over time. In Phase 2, set up `npx supabase gen types typescript` as part of the build process to keep it in sync automatically. (Phase 2 technical task.)

**Stripe Tax** — Enable Stripe Tax in the Stripe dashboard before going live with real payments.

### UI terminology conventions

**`budget_type = 'envelope'` → displayed as "Lifestyle" in the UI** — The database column `budget_type` on `budget_template_lines` and `budgets` stores the value `'envelope'`. In all user-facing copy (badges, labels, descriptions, sheet titles, button text) this is shown as "Lifestyle" or "lifestyle budget". The database value, TypeScript types, hook variable names (`envelopeLines`, `totalEnvelopes`, `getEnvelopes`, `getRemainingInEnvelope`), and Zod schema field names must never be changed to match the UI label — they remain as `envelope`. Only what the user reads on screen uses the Lifestyle terminology.

### Category system architecture (from Session 32)

**Categories are Lifestyle budget template lines — not a separate concept.** The `home_custom_categories` table and the `BUILT_IN_CATEGORIES` array are deprecated. The authoritative category list for a home is `budget_template_lines` where `budget_type = 'envelope'`. When a Lifestyle budget line is created, it becomes a category. Fixed lines (rent, broadband, Netflix) are never categories.

- `useBudgetTemplate` exposes `categories`, `getCategoryByName`, `hasCategories` — derived from `envelopeLines`.
- `AppContext.allCategories` is an alias for `budgetTemplateHook.categories`.
- `ExpenseQuickAddSheet` uses `categories`/`hasCategories`. If no lines exist, it shows a "Set up your budget first" prompt linking to `/money/budgets`. Submitting with no category saves `null` (not `"Other"`).
- `Spending.tsx` bars are driven by `envelopeLines`. Orphaned expenses (category not matching any line) appear in an "Uncategorised" row.
- `home_custom_categories` is kept for data safety but is no longer written to. See migration 0037.
- `BudgetCategories.tsx` settings page was deleted. Route `/settings/budget-categories` redirects to `/money/budgets`.

### Architectural decisions that should not change

**Zod as single source of truth** — TypeScript types are derived from Zod schemas, never written separately. Do not break this pattern.

**RLS enforced at the database level** — Application-level auth checks are secondary. The database must always be the authoritative guard. Never relax an RLS policy to make something easier to code.

**Feature-grouped code** — Shopping code lives in `components/shopping/`, `hooks/useShoppingList.ts`, `lib/schemas/shopping.ts`. Do not reorganise by file type. The feature grouping makes it easy to reason about a feature in isolation.

---

## 📖 How to Use This Document

**As the developer (Thomas):**
- Read the current phase section at the start of each week to remind yourself what matters
- Add ideas to the backlog freely — the backlog is a brain dump, not a commitment
- When you complete a phase, add a date and move on. Don't look back.

**As Claude Code:**
- Read this document at the start of any significant build session before writing a single line of code
- Understand which phase we are in and what the current priorities are
- After each session, add an entry to the session log below
- If a technical decision conflicts with the guiding principles, flag it before proceeding
- Do not build Phase 3 features during Phase 1. Resist polish when function is what matters.

**Updating this document:**
- Session log: updated by Claude Code after every session
- Backlog: updated freely, any time
- Phase completion: mark with ✅ and a date when the definition of done is met
- Technical debt: add new items as they are discovered, remove items as they are fixed

---

## 📅 Session Log

### Session 38 — 12 April 2026 — Overview screen: five bug fixes (bars, chart, Zone 4, category mover)

Five targeted fixes to `pages/money/Overview.tsx`. No new features. No structural changes.

**Fix 1 — Income bar colour:** Income bar was using `bg-accent/60` (a peachy tint that could be misread as semantic). Changed to `rgba(61, 50, 41, 0.12)` inline style — a muted warm baseline that reads as "full income" without any connotation. Fixed costs bar stays terracotta `#d4795e`.

**Fix 2 — Spending trend chart showing no bars:** Root cause: the chart container used `flex items-end` instead of `items-stretch`. Because child columns had no explicit height, their inner `style={{ height: "100%" }}` resolved to 0px and every `motion.div` animated from 0 to 0. Fixed by separating chart area from label row. Chart area: `flex h-40 items-stretch` — columns now fill the full 40-row height via stretch. Each column: `relative flex-1 flex items-end` — bars use `absolute bottom-0 height: X%` of a real pixel height. Month labels moved to a separate `<div className="flex gap-2.5 mt-2">` row beneath the chart. Removed unused `containerRef` / `useRef` import. Months with no expense data show no bar element (not a stub).

**Fix 3 — Zone 4 goal contributions mixed with bills:** Goal contributions (savings goals with `monthly_contribution`) were rendered inline with upcoming bills, making it ambiguous what each row represented. Now rendered in two clearly labelled subsections: "BILLS" (10px uppercase muted label) and "GOAL CONTRIBUTIONS" (same style). The `Target` lucide icon replaced with a custom `GoalRing` — a 16px SVG ring in the goal's own colour, no fill. Removed the `✓` checkmark that showed on past contribution rows.

**Fix 4 — Past bills count not expandable:** The "X bills already out this month" row was a static `<div>`. Replaced with a `<button>` that toggles `pastBillsExpanded` state. Chevron rotates 90° when open. `AnimatePresence` animates height from 0 to auto when expanded. Expanded list shows each past bill: name, due date ordinal, amount.

**Fix 5 — Category mover referencing fixed cost names:** The biggest-mover calculation iterated all category names from expense history. Old expense records categorised under names like "Rent" (before it was modelled as a fixed line) caused the mover to say "Rent is down 100% vs last month." Fixed by building `envelopeNames = new Set(envelopeLines.map(l => l.name.toLowerCase()))` and skipping any category not in that set. Added `envelopeLines` to the `useMemo` dependency array.

**Other cleanup:** Removed unused `Target` import from lucide-react (replaced by `GoalRing`). Removed `useRef` import (was only used by the now-removed `containerRef` in TrendChart).

**Verification:** `npx tsc --noEmit` → zero errors.

---

### Session 37 — 12 April 2026 — Overview screen: complete rebuild, all six zones, data errors fixed

Complete ground-up rebuild of `pages/money/Overview.tsx`. The old implementation had fundamental data errors and did not connect properly to the budget system. Deleted and rewritten from scratch. No other screens or hooks were modified.

**Data errors fixed:**

- **Error 1 — Fixed costs showing £0:** Old code read fixed costs from `useMonthlySummary` (backed by the deprecated `recurring_bills` table). New code reads `totalFixed` from `useBudgetTemplate` — the sum of all active `budget_template_lines` where `budget_type = 'fixed'`. This is now the single source of truth for fixed costs everywhere.

- **Error 2 — Lifestyle spending showing budgeted amount:** Old code displayed the sum of lifestyle template line amounts as if it were actual spending. New code computes `actualSpend` by summing all expenses logged for the selected month from the `expenses` array in AppContext. Budget and actual spend are now always distinct values.

- **Error 3 — Red bar when barely any money spent:** Direct consequence of Error 2. Now fixed: the lifestyle bar and ring reflect actual spend as a proportion of the lifestyle budget total.

- **Error 4 — Income editor on Overview:** The "Edit income for [Month]" collapsible section removed entirely. Replaced with a single muted link at the bottom: "Update your income in Settings →" navigating to `/settings/money`.

- **Error 5 — Partner income field:** The inline income editor exposed both user income fields, violating the privacy model. Removed with the editor.

**Six zones built:**

**Zone 1 — The Pulse:**
- 120×120px animated SVG ring arc. Stroke draws from 0 to target over 0.8s ease-out on mount. Colour: sage (0–69%), amber (70–89%), terracotta (90–99%), red (100%+). Centre shows percentage + "of budget used".
- Three stacked stats: Spent this month (with expense count), Lifestyle budget left (colour-coded), Projected surplus with daily rate calculation (hidden if < 3 days data or no income).
- Hazel ambient line below the stats: single italic muted sentence. Static fallback logic in priority order: category over budget → projected overspend → healthy surplus → early month → default. Pro users get a live `window.api.budgetInsights` call with silent static fallback on failure.
- "No budget set" empty ring + prompt if no envelope lines exist.
- "Set income for full picture" prompt if income not set.

**Zone 2 — Money flow:**
- Three stacked bars (income baseline, fixed costs, lifestyle spending) all sized relative to income = 100%.
- Fixed costs bar is always terracotta. Three chips below showing top fixed sections by amount (Housing, Subscriptions, Transport etc.) — tapping navigates to Budgets screen.
- Lifestyle bar is colour-coded green/amber/red by spend percentage. A vertical ceiling indicator marks the lifestyle budget total. "£X of £Y lifestyle budget" subtext.
- Surplus row: income − fixedCosts − actualSpend. Green if positive, red if negative.
- "Income not set" empty state with link to Settings → Money.

**Zone 3 — Budget status:**
- One row per active lifestyle (envelope) template line. Sorted: overspent first, then by spend% descending, then alphabetical.
- Each row: category name + progress bar + "£X of £Y". Overspent rows show "-£X over" in red with overflow indicator on the bar.
- Bars colour at 0–69% sage, 70–89% amber, 90%+ red.
- "See all X categories →" link if more than 6 lines. "Manage budgets →" link always shown.

**Zone 4 — Upcoming this month:**
- Only rendered when viewing the current month. Hidden entirely if no upcoming data.
- Fixed lines with `day_of_month` set, split: upcoming (day > today), past (day ≤ today). Past bills collapsed to a single "X bills already out this month" row. Upcoming bills show name, "Due Nth", amount. Bills due within 3 days get amber "Due soon" indicator.
- Goal contributions (active goals with `monthly_contribution`) shown with a Target icon. Past contributions show a check mark.
- Tapping a bill navigates to `/money/budgets`. Tapping a goal navigates to `/money/goals`.

**Zone 5 — Spending trend:**
- Bar chart of last 6 months of actual spend. Only months with at least one expense are rendered. Hidden if fewer than 2 months of data.
- Current month: terracotta. Previous months: warm grey `#ddd4c6`. Current month has a faded projection extension showing projected spend to end of month.
- Dotted reference line at total lifestyle budget amount, labelled "Budget" at the right.
- Hover tooltips: "[Month]: £X spent · £Y budgeted".
- Free tier: current month is real, previous months shown as locked grey bars with a "See your spending history with Roost Pro" overlay.
- "See full history →" navigates to `/money/spending`.

**Zone 6 — Month on month comparison:**
- Gated behind Pro (`canAccess("budget_insights")`). Free tier shows `ProTeaserCard`.
- Visual bar comparison: two horizontal bars (current vs previous month) sized relative to each other. Not a text sentence.
- Percentage change chip: "↑ X% more" or "↓ X% less".
- Biggest category mover shown only if change is >20% and >£10 absolute.

**What was removed:**
- The "Edit income for [Month]" collapsible — gone entirely.
- The partner income input field — gone.
- The 2×2 "This month summary" stat card grid — replaced by Zone 1 and Zone 2.
- The "Where it went" fixed/lifestyle section with the broken red bar — replaced by Zone 2.

**Navigation connections:**
- Zone 3: "Manage budgets →" → `/money/budgets`
- Zone 4 bills: → `/money/budgets`
- Zone 4 goals: → `/money/goals`
- Zone 5: "See full history →" → `/money/spending`
- Bottom: "Update your income in Settings →" → `/settings/money`

**Scramble mode:** All amounts use `useScramble().fmt()` throughout. Scrambled mode shows "•••" for all currency values.

**Loading states:** Zones load independently. Zone 1/2/3 wait on `isExpensesLoading || isTemplateLoading || isHouseholdIncomeLoading`. Zone 4 waits on `isTemplateLoading || isSavingsGoalsLoading`. Zone 5 has its own `useQuery` with a skeleton.

**Verification:** `npx tsc --noEmit` → zero errors.

---

### Session 36 — 12 April 2026 — Budgets screen: health score, bill clash detection, amount comparison, income allocation bar

Four display/intelligence features added to `Budgets.tsx`. No new hooks created. One migration for data layer.

**Migration `0040_last_amount.sql`:**
- `budget_template_lines`: adds `last_amount numeric(10,2)` and `amount_changed_at timestamptz`
- `last_amount` stores the previous amount before the most recent edit (for month-on-month comparison)
- `amount_changed_at` records when the change was made (comparison indicator shown for 60 days)

**`useBudgetTemplate.ts` changes:**
- `budgetTemplateLineSchema`: added `last_amount` and `amount_changed_at` fields so they flow through to the UI
- `updateLine.mutationFn`: reads current cached amount via `queryClient.getQueryData` before saving; if amount has changed, captures it as `last_amount` and sets `amount_changed_at = new Date().toISOString()`

**Feature 1 — Budget health score card (`Budgets.tsx`):**
- `computeHealthScore()`: 4 factors × 25 pts — income coverage, goals funded, lifestyle coverage, rollover awareness
- Ratings: 85+ Healthy, 65+ Good, 45+ Getting there, 25+ Needs attention, else Just starting
- `staticHazelLine()`: static ambient sentence per score band (free tier fallback)
- `BudgetHealthCard`: 5th summary card with rating text in semantic color, 4px progress bar, italic Hazel sentence below
- Pro (`isNest`): calls `window.api.budgetInsights` IPC on mount; uses `res.data.summary` as the Hazel line

**Feature 2 — Bill clash detection (`Budgets.tsx`):**
- `detectBillClusters()`: finds fixed lines with `day_of_month` set, groups bills within a 3-day sliding window with combined total ≥ £200
- Signature = sorted `${id}:${day}` joined by `|`; changes when dates change so dismissed clashes re-surface
- `BillClashCard`: amber warning card between summary and budget table; dismissible via × button
- Dismissed signatures persisted to localStorage key `roost-dismissed-clashes`

**Feature 3 — Budget vs last month comparison (`Budgets.tsx`):**
- `BudgetRow` read mode: shows ↑/↓ inline indicator left of amount when `last_amount` differs from current amount and `amount_changed_at` is within 60 days
- Increase shown in amber (`#854f0b`), decrease in green (`#4d8057`)
- Displays formatted delta (e.g. `↑ +£20.00`)

**Feature 4 — Income allocation bar (`Budgets.tsx`):**
- `ALLOCATION_CONFIG`: fixed ordered list of section groups with display labels and colors
- `IncomeAllocationBar`: stacked horizontal bar (12px, fully rounded) divided by section group totals; unallocated remainder shown if >0.5%
- Animation: `motion.div` with `scaleX` 0→1, staggered by 0.05s per segment, `transformOrigin: left`
- Hover tooltip via React state + `position: fixed` (follows cursor)
- Clicking bar segment or legend dot scrolls to `document.getElementById('budget-section-' + key)`
- If income not set, shows muted prompt instead

**Layout order:** header → summary cards (5) → income allocation bar → bill clash cards → budget table

**Scroll targets:** each `BudgetSection` wrapped in `<div id="budget-section-{id}">` for allocation bar navigation

**Verification:** `npx tsc --noEmit` → zero errors.

**Pending action (user):** Run migration `0040_last_amount.sql` in the Supabase SQL editor, then regenerate types with `npm run gen:types`.

---

### Session 35 — 12 April 2026 — Five budget features: goal lines, DATE column, annual costs, rollover, ownership

All five features implemented in one session. One migration covers all database changes. No existing UI was broken.

**Migration `0039_goal_budget_link.sql`:**
- `savings_goals`: adds `monthly_contribution numeric(10,2)`, `contribution_day integer default 1 check (1..31)`, `budget_line_id uuid references budget_template_lines(id) on delete set null`
- `budget_template_lines`: adds `is_annual boolean not null default false`, `annual_amount numeric(10,2)`, `rollover_enabled boolean not null default false`, `ownership text not null default 'shared' check (...)`
- New table `budget_rollover_history`: `id`, `home_id`, `template_line_id`, `month`, `base_amount`, `rollover_amount`, `effective_amount`, `created_at`; unique(template_line_id, month); full RLS + realtime

**Feature 1 — Goals as budget lines (`useSavingsGoals.ts`):**
- `addGoal` mutationFn: if `monthly_contribution > 0`, creates a `budget_template_lines` row (section_group='goals', budget_type='fixed') then links it back via `budget_line_id`
- `updateGoal`: syncs budget line name/amount/day when goal fields change
- `deleteGoal` + `completeGoal`: deactivate linked line before removing/completing goal
- New `setGoalContribution(id, amount, day)` — creates or re-activates linked line
- New `removeGoalContribution(id)` — deactivates line, clears monthly_contribution
- Both exposed from `AppContext`

**Feature 2 — DATE column for fixed sections (`Budgets.tsx`):**
- `colTemplate` for fixed sections updated: `"1fr 60px 90px 44px"` (household) and `"1fr 60px 90px 90px 90px 44px"` (split) — 60px DATE slot between LINE ITEM and BUDGETED
- `BudgetRow`: DATE cell rendered only for `type === "fixed"` rows; read mode shows ordinal day (1st, 14th etc.) or `—`; edit mode shows tappable pill; click opens inline input (1–31, commits on blur/Enter)
- `handleDayCommit` + `editingDayId` state added to `Budgets()` component
- New props threaded through `BudgetSection` → `BudgetRow`

**Feature 3 — Annual costs spread monthly (`useBudgetTemplate.ts`, `Budgets.tsx`):**
- `addLine` + `updateLine`: auto-compute `amount = round(annual_amount / 12, 2)` when `is_annual = true`
- `annualTotal` useMemo exposed from hook
- `BudgetRow` budgeted cell: shows `£X/yr` secondary line in muted text when `is_annual && annual_amount`

**Feature 4 — Rollover for lifestyle budgets (`Budgets.tsx`):**
- `useQuery("rollover-history", ...)` fetches `budget_rollover_history` for the selected month
- `rolloverByLine` derived map (lineId → rollover_amount)
- `useEffect` on month change: idempotent upsert — for each rollover-enabled envelope line, computes prev month's effective − actual spend and upserts `budget_rollover_history`
- `BudgetRow` budgeted cell: `effectiveBudget = amount + rollover`; positive rollover shown as `+ £X from last month` in muted green, negative as `- £X from last month` in muted amber

**Feature 5 — Shared vs personal flags (`useBudgetTemplate.ts`, `Budgets.tsx`):**
- `updateLine`: auto-sets `member1_percentage` when ownership changes (member1→100, member2→0, shared→50 if not provided)
- `BudgetRow` name cell: shows 20px `AvatarCircle` beside name for member1/member2 ownership
- Edit mode: ownership pills (Shared / Me / Partner) animate in below split slider for envelope rows; `handleOwnershipChange` callback

**Goals section in Budgets screen:**
- `GOALS_SECTION` constant (type='fixed', not in `SECTIONS` array — not user-configurable)
- `GoalsSection` component: renders goal-linked budget lines with a `MiniGoalRing` (16px SVG) for progress; DATE column; tapping a row navigates to `/money/goals`; "Manage goals →" footer link
- Rendered after the SECTIONS.map() loop when `goalLines.length > 0`

**Goals.tsx AddGoalSheet:**
- New `DayPicker` component: horizontal scroll strip showing 1st–31st day buttons
- New `daySuffix()` helper for ordinal formatting
- `monthlyContribution` and `contributionDay` state added to AddGoalSheet
- Monthly contribution input (£ prefix) + sublabel "This becomes a fixed line in your budget."
- `DayPicker` animates in only when a contribution amount is entered
- Both fields included in `addGoal.mutate()` payload

**Verification:** `npx tsc --noEmit` → zero errors.

**Pending action (user):** Run migration `0039_goal_budget_link.sql` in the Supabase SQL editor, then regenerate types with `npm run gen:types`.

---

### Session 33 — 12 April 2026 — Budgets screen: edit mode, section hierarchy, per-row split indicator

Full refinement pass on `pages/money/Budgets.tsx`. No other screens or shared hooks modified beyond adding `tom_percentage` to the budget template schema.

**Edit mode:**

- New `editMode` boolean state (default false). "Edit" button in the page header (top right, beside month navigator and split toggle). In read mode: outlined button, warm dark text, 13px. In edit mode: filled terracotta (`#d4795e`), cream text, 13px. Toggling to edit mode shows an amber banner ("Editing your budget — changes save automatically", 11px muted) below the header using `AnimatePresence` fade.

- `exitEditMode()` helper clears all editing state (amount, note, name, remove, context menu) when Done is tapped.

- **Add buttons** hidden entirely in read mode (not rendered at all). In edit mode they animate in with a 50ms staggered delay per section index.

- **Amounts** no longer render as buttons in read mode — plain `<span>`. Edit mode restores hover-underline + click-to-edit behaviour.

- **Row name editing**: in edit mode each row name is a button. Clicking opens `InlineNameInput` (new component) — an inline input that saves on blur/Enter and calls `updateTemplateLine({ name })`.

- **Context menu** suppressed in read mode (`onContextMenu` handler is `undefined` on the motion.div when not in edit mode). In edit mode, right-click works as before.

**Section header visual hierarchy:**

- Font size: 13px → 15px, weight 500.
- Fixed sections: `border-left: 3px solid #c75146`, background `rgba(199,81,70,0.04)`.
- Lifestyle sections: `border-left: 3px solid #534ab7`, background `rgba(83,74,183,0.04)`.
- `borderRadius: 0` on header button (straight left edge matching the accent border).
- Column header sub-row: added 4px extra top padding (`6px 8px 4px`).

**Empty sections in read mode:** `BudgetSection` returns `null` when `!editMode && lines.length === 0`. Prevents Savings allocation and other empty sections appearing as broken stubs.

**Per-row split indicator:**

- `SplitBar` component: 36×4px, `borderRadius: 2`, overflow hidden flex row. Left = member 1's `avatar_color`, right = member 2's `avatar_color`. Width proportional to `member1_percentage`. `title` tooltip: "[User] X% · [Partner] Y%". Always rendered in both read and edit mode, in a new rightmost column (44px).

- Grid column templates updated to include the 44px split bar column: `colTemplate(type, viewMode)` and `grandColTemplate(viewMode)` helper functions consolidate the template strings.

**Edit mode split slider:**

- `SplitSlider` component: appears below each row in edit mode via `AnimatePresence` height animation (0.2s). Layout: `[MeAvatar] [Me%] [range input] [Partner%] [PartnerAvatar]`. Range: 0–100, step: 5. Local state updates live; debounced 400ms save via `handleMePctCommit → updateTemplateLine({ member1_percentage })`. "Equal" label at 50, "X pays all" labels at 0/100.

- `AvatarCircle` (20px) uses `getInitials(name)` and `avatar_color`.

**Split mode column update:**

- Me column now uses `line.amount * (member1_percentage / 100)`, partner = `amount - meAmount`. Section totals and grand total row follow the same calculation. No more hardcoded `/ 2` anywhere.

**Grand total split bar:** Weighted average `(Σ amount × mePct/100) / totalBudgeted` drives the grand total `SplitBar`.

**Row padding:** Read mode 10px top/bottom, edit mode 14px top/bottom (accommodates slider row). Envelope progress bar right-padding updated from 28px to 44px to match new column width.

**Database:** Migration `0038_template_split.sql` adds `member1_percentage numeric(5,2) NOT NULL DEFAULT 50.00 CHECK (member1_percentage BETWEEN 0 AND 100)` to `budget_template_lines`. Must be run in Supabase SQL editor.

**`useBudgetTemplate.ts`:** Added `member1_percentage: z.coerce.number().min(0).max(100).default(50)` to `budgetTemplateLineSchema`; added `member1_percentage?: number` to `UpdateTemplateLineData`.

**Verification:** `npx tsc --noEmit` → zero errors.

**Pending action (user):** Run migration `0038_template_split.sql` in the Supabase SQL editor, then regenerate types with `npm run gen:types`.

---

### Session 34 — 12 April 2026 — Remove all hardcoded names; genericise for App Store

Critical audit and cleanup: the app is shipping to the App Store for any couple, so all hardcoded personal names ("Tom", "Beth") were removed from the entire codebase.

**Audit results:**
- No hardcoded names appeared in user-visible UI strings — `AppContext` already derived `currentUser`/`partnerName` dynamically.
- Hardcoded names were present only in internal variable names, code comments, SQL migration files, and session log entries.

**Changes made:**

**Migration rewrite (`0038_template_split.sql`):** Column renamed from `tom_percentage` to `member1_percentage`. The migration had not yet been applied to Supabase. The old file was overwritten with the generic version. "member1" = the home creator; "member2" percentage is always `100 - member1_percentage`.

**`useBudgetTemplate.ts`:** Renamed `tom_percentage` → `member1_percentage` in the Zod schema and `UpdateTemplateLineData` interface.

**`Budgets.tsx`:** All internal tom/beth variable names renamed to me/partner:
- `tomColor`/`bethColor` → `meColor`/`partnerColor`
- `tomName`/`bethName` props → `meName`/`partnerName` props (consolidated with `currentUserName`/`partnerName`)
- `tomPct`/`tomAmount`/`bethAmount` → `mePct`/`meAmount`/`partnerAmount`
- `totalTomSplit`/`totalBethSplit` → `totalMeSplit`/`totalPartnerSplit`
- `totalTomBudgeted`/`totalBethBudgeted` → `totalMeBudgeted`/`totalPartnerBudgeted`
- `grandTomPct` → `grandMePct`
- `handleTomPctCommit`/`onTomPctCommit` → `handleMePctCommit`/`onMePctCommit`
- `line.tom_percentage` → `line.member1_percentage` (all references)
- `BudgetSectionProps`: removed redundant `tomName`/`bethName`/`currentUserName` props, unified under `meName`/`partnerName`

**`useMoneySettings.ts`:** Fixed comment `// Tom's % (0–100)` → `// member 1's % (0–100)`.

**`Overview.tsx`:** Renamed local state `tomIncome`/`setTomIncome` → `myIncome`/`setMyIncome`. (The underlying DB column `tom_amount` is already in production and was not changed here.)

**New hook `useMemberNames.ts`:** Created `src/renderer/src/app/hooks/useMemberNames.ts` exposing `{ me, partner, meInitials, partnerInitials, meColour, partnerColour, hasPartner }` for consistent name/colour access across the app.

**`docs/NORTH_STAR.md`:** Added "No hardcoded names" guiding principle. Replaced all Tom/Beth example names with [User]/[Partner] in roadmap entries and session logs.

**Pending action (user):** Run migration `0038_template_split.sql` in the Supabase SQL editor, then regenerate types with `npm run gen:types`.

---

### Session 32 — 11 April 2026 — Category system rebuild: template lines as single source of truth

Foundational architectural change replacing the old category model (`home_custom_categories` table + `BUILT_IN_CATEGORIES` array + `BudgetCategories.tsx` settings page) with a new model where categories are derived directly from Lifestyle budget template lines.

**Architecture:** `budget_template_lines` where `budget_type = 'envelope'` is now the only source of truth for categories. Creating a Lifestyle budget line automatically makes it a category. Fixed lines are never categories.

**Files changed:**

- **`lib/categories.ts`** — `Category.emoji` and `.color` made optional; added `id?: string`; added `deriveCategoryColour(name)` (stable hash → 5-colour palette).
- **`components/CategoryIcon.tsx`** — Added `Tag` fallback when `category.emoji` is absent.
- **`hooks/useBudgetTemplate.ts`** — Added `categories`, `getCategoryByName`, `hasCategories` derived from `envelopeLines`.
- **`context/AppContext.tsx`** — `allCategories` now sourced from `budgetTemplateHook.categories`; added `categories`, `hasCategories`, `getCategoryByName` to context.
- **`components/expenses/ExpenseQuickAddSheet.tsx`** — Pills from template lines; "Set up budget first" prompt when no lines; saves `null` (not `"Other"`) when uncategorised.
- **`pages/money/Spending.tsx`** — Bars driven by `envelopeLines`; orphaned expenses → "Uncategorised" row; empty state for no lines; "Manage budget limits →" now links to `/money/budgets`.
- **`pages/money/Overview.tsx`** — "Discretionary" → "Lifestyle spending" in stat card and split bar.
- **`routes.tsx`** — Removed `BudgetCategories` import; route `/settings/budget-categories` redirects to `/money/budgets`.
- **`hooks/useExpenses.ts`** — Replaced `home_custom_categories` query with `useBudgetTemplate().envelopeLines` for Hazel category grounding; Hazel fallback changed from `'Other'` to `undefined`.
- **`pages/Pinboard.tsx`** — Replaced `home_custom_categories` query and `mergeCategories` with `useBudgetTemplate().categories`.
- **`hooks/useBudget.ts`** — Removed `customCatsQuery`, `invalidateCustomCats`, `home_custom_categories` realtime subscription, `addCustomCategory` mutation, `deleteCustomCategory` mutation; `allCategories` stubbed to `[]`.
- **`pages/settings/BudgetCategories.tsx`** — Deleted.
- **`supabase/migrations/0037_deprecate_categories.sql`** — Adds deprecation comment to `home_custom_categories` table.
- **`docs/NORTH_STAR.md`** — Added category system architecture note.

**Verification:** `npx tsc --noEmit` → zero errors.

---

### Session 31 — 11 April 2026 — Terminology: "Envelope" → "Lifestyle" in all UI copy

Terminology-only update. No logic, schema, hook, or type changes. The budget type previously labelled "Envelope" in the UI is now labelled "Lifestyle" everywhere the user can read it. The database value `'envelope'` and all internal code identifiers (`envelopeLines`, `totalEnvelopes`, `getEnvelopes`, `getRemainingInEnvelope`, etc.) are unchanged.

**Files changed (UI copy only):**

- **`pages/money/Budgets.tsx`** — `TypeBadge`: label `Envelope` → `Lifestyle`; badge colours updated from sage (`#e1f5ee`/`#085041`) to soft purple (`#f0eafa`/`#3c3489`). Empty state description: `Envelopes are allowances...` → `Lifestyle budgets are allowances...`.
- **`pages/money/Spending.tsx`** — Sheet title `Set envelope for {category}` → `Set lifestyle budget for {category}`; button text `Set envelope` → `Set lifestyle budget`; inline labels `envelope` → `lifestyle budget`; `No envelope set` → `No lifestyle budget set`; `Set envelope →` → `Set lifestyle budget →`.
- **`pages/settings/MoneySettings.tsx`** — Alert description: `Get alerted when an envelope reaches...` → `Get alerted when a lifestyle budget reaches...`.
- **`docs/NORTH_STAR.md`** — Added UI terminology convention note documenting the `envelope` → Lifestyle mapping.

**Verification:** `npx tsc --noEmit` → zero errors.

---

### Session 30 — 11 April 2026 — Money home screen: visual polish + RPC fallback

Polish pass on `pages/Money.tsx` fixing rendering bugs and upgrading visual quality. No hooks, AppContext, or sub-screens were modified.

**Bugs fixed:**

- **RPC 404 error / "Something went wrong loading your summary"**: `get_monthly_summary` returns 404 because migrations 0032+0033 have not yet been applied to the live Supabase project. The RPC function with the new signature (`p_home_id`, `p_month`) does not exist yet. Fixed by catching `PGRST202`/404 in `useMonthlySummary.ts` — hook now returns `undefined` instead of throwing, suppressing the error toast entirely.

- **Surplus showing £0.00 when income is set**: With the RPC unavailable the app was falling through to `summary === undefined` with no fallback, so the ring arc and stat rows all showed zeroes. Fixed by building a client-side `effectiveSummary` in `Money()` from already-loaded data: `clientTotalSpent` from `budgetCategories`, `clientSurplus = incomeAmount − totalBudgeted`, `clientPctSpent` = spend ÷ max(totalBudgeted, incomeAmount). When the RPC is later deployed, `summary` will populate and override the fallback automatically.

- **React "Expected static flag was missing" error**: `useCurrencyFormat()` was called after an early `if (isLoading) return` inside `SummaryCard`, violating Rules of Hooks. Moved all hook calls to before the early return.

**Visual upgrades:**

- **Ring arc** — Doubled in size: `88px` container, `RING_R = 36`, `RING_STROKE = 8` (was 60px / 24 / 6). The ring is now the dominant visual anchor on screen. Green threshold colour updated to sage `#9db19f`.

- **Stat row hierarchy** — Four distinct type scales instead of one uniform size:
  - Income: `18px / font-weight 500` (anchor row)
  - Remaining: `15px / 500` colour-coded green/amber/red by `remainingPct` thresholds
  - Surplus: `14px / 500` with ↑/↓ arrow prefix
  - Spent: `14px / 400 muted`

- **Navigation card accents** — Each card has a small coloured circle accent in the trailing slot: blue (Overview), sage (Spending), amber (Budgets), terracotta (Goals). Budgets card subtitle rendered in terracotta when no budget is set up yet (`subtitleHighlight` flag).

- **Spacing** — Container changed to `px-6 pt-5 pb-6`. Card internal padding tightened. `space-y-2` gap between nav cards. Spending bar height increased to `6px`.

- **Error state** — Moved inside `SummaryCard` (via `hasError` / `onRetry` props) rather than a standalone full-width card. No longer disrupts the layout when the error is transient.

**Schema change — `lib/schemas/money.ts`:** `fixed_costs` made `.optional().default(0)` for resilience when the new RPC version returns a different field set.

**Pending action (user):** Run migrations 0032 and 0033 in the Supabase SQL editor to deploy the updated `get_monthly_summary` function. Until then, the client-side fallback is active and all numbers are derived from local data.

**Verification:** `npx tsc --noEmit` → zero errors.

---

### Session 29 — 11 April 2026 — Money home screen: layout rebuild and information hierarchy

Complete restructure of the Money home screen (`pages/Money.tsx`). No hooks, AppContext, or sub-screens were modified. Presentation and priority only.

**Problem solved:** Navigation cards were buried at the bottom after three stacked empty-state sections. New users saw a ring, a balance card, and three large empty states before they could navigate anywhere. Empty states were competing for prominence with actual navigation.

**New layout (top to bottom):**
1. Page header — unchanged
2. Ring arc summary card — tightened padding (`p-4`)
3. Balance card — only rendered when `balance.amount > 0` (wrapped in `AnimatePresence`)
4. Navigation cards — **moved to position 4**, always visible without scrolling
5. Spending bars — hidden entirely when no expenses this month
6. Upcoming bills strip — hidden entirely when no bills configured
7. Savings goals — hidden entirely when no goals exist

**Component changes:**

- **`SectionLabel`** — Rebuilt to the spec: `10px`, `font-weight 500`, uppercase, `#6b6157`, `letter-spacing 0.05em`. Was `text-xl font-semibold` (large and heavy).

- **`RingArc`** — Added `onLabelClick?: () => void` and `labelColor?: string` props. When `onLabelClick` is provided the center renders as a `<button>` rather than a `<div>`. The arc draw animation (0.6s ease-out) was already correct.

- **`SummaryCard`** — Added `onSetIncomeClick` prop. When `!hasIncome`: ring label is `"Set income"` in terracotta (`#d4795e`), tappable → navigates to `/settings/money`. Sublabel hidden in no-income state (was showing "Set income" as sublabel below "–"). Hazel ambient line unchanged — already hidden when null.

- **`BalanceCard`** — Completely rewritten. Old design showed a tall card even for the "You're even" state. New design: compact single-row (`px-4 py-2.5`), coloured dot (green if owed, amber if owing) + balance text + small outlined settle-up button. "You're even" state is entirely gone — caller guards with `hasNonZeroBalance`.

- **`NavigationCards`** — Added `hasIncome` prop. Dynamic subtitles:
  - Overview: `"£X income · £Y spent · £Z surplus"` when income+summary exist; falls back to `"Income, fixed costs, surplus"`
  - Spending: `"Groceries £218 · 4 categories"` (top category + count) when expenses exist; falls back to `"Log and review your spending"`
  - Budgets: unchanged logic (uses `summary.total_budgeted`)
  - Goals: `"New sofa · 60% saved"` (nearest goal name + progress %) when goals exist; falls back to `"What are you saving toward?"`

- **`SpendingBars`** — Added `onAddExpense` prop. Returns `null` when `catsWithSpend.length === 0` (empty state removed). Footer row with `"+ Add expense"` terracotta text link (right-aligned).

- **`UpcomingBillsStrip`** — Returns `null` when `bills.length === 0`. Empty-state card removed entirely. Section label changed from "Upcoming Bills" to "Coming Up".

- **`SavingsGoalsSummary`** — Returns `null` when `activeGoals.length === 0`. Empty-state card removed. "See all" link now navigates to `/money/goals`.

- **`Money()` component** — Removed `IncomeSetupPrompt` and `SpendingAlertCard` from layout. Layout reordered per spec. Container changed from `space-y-5` to `flex flex-col gap-3` (12px gaps between sections). `max-w-2xl` instead of `max-w-6xl` for readable column width. `handleSetIncomeClick` navigates to `/settings/money`. FAB `z-index` bumped to `z-40`.

**Empty home screen:** Shows only ring card (with "Set income" tap prompt) + four nav cards with setup subtitles. Zero empty-state sections.

**Verification:** `npx tsc --noEmit` exits 0 — zero TypeScript errors.

---

### Session 28 — 11 April 2026 — Data layer: budget_type + unified Budgets model

Data-layer-only session. No UI changes. Restructures the Money section's data model ahead of the unified Budgets screen build.

**What changed:**

- **`supabase/migrations/0032_budget_type.sql`** — Adds `budget_type text NOT NULL DEFAULT 'envelope' CHECK (IN ('fixed', 'envelope'))` and `day_of_month integer CHECK (BETWEEN 1 AND 31)` to the `budgets` table. Fixed = committed recurring cost; envelope = spending allowance. Run this in the Supabase SQL editor, then regenerate types.

- **`supabase/migrations/0033_update_monthly_summary.sql`** — Replaces `get_monthly_summary` RPC. Fixed costs now read from `budgets WHERE budget_type = 'fixed'` instead of `recurring_bills`. New return fields: `envelopes_total`, `total_budgeted`, `actual_spend`, `pct_of_income_budgeted`. Projected spend formula now adds fixed costs to the daily-rate projection. Run this in the Supabase SQL editor.

- **`lib/schemas/budgets.ts`** — Added `budget_type: z.enum(['fixed','envelope']).default('envelope')` and `day_of_month: z.number().int().min(1).max(31).nullable().optional()` to `budgetSchema` and `upsertBudgetSchema`. Exported new `BudgetType` type.

- **`lib/schemas/money.ts`** — Updated `monthlySummarySchema` with new fields (`envelopes_total`, `total_budgeted`, `actual_spend`, `pct_of_income_budgeted`). Added a Zod `.transform()` to provide backward-compat aliases: `actual_spend → total_spent`, `envelopes_total → discretionary`. Existing UI code compiles and behaves correctly against both the old and new RPC versions without modification.

- **`types/database.types.ts`** — Added `budget_type: string` and `day_of_month: number | null` to the `budgets` Row/Insert/Update types to match the new schema.

- **`hooks/useBudget.ts`** — Added five new computed accessors derived from cached query data:
  - `getFixedBudgets(month)` — fixed-type rows ordered by day_of_month then category
  - `getEnvelopes(month)` — envelope-type rows ordered by category
  - `getTotalFixed(month)` — sum of fixed budget amounts
  - `getTotalEnvelopes(month)` — sum of envelope budget amounts
  - `getRemainingInEnvelope(category, month)` — envelope amount minus category spend for the month
  - `migrateRecurringBillsToBudgets` mutation — one-time background migration that reads `recurring_bills` and creates corresponding `budget_type = 'fixed'` rows for the current month; guards against double-run; no toasts (silent background task). `budget_type` and `day_of_month` are carried in the upsert, so carry-forward of these fields is automatic.
  - Updated `summary` memo to filter `budgeted` rows by `budget_type = 'envelope'` only (the breakdown UI is envelope-only).

- **`hooks/useMonthlySummary.ts`** — Replaced `recurring_bills` realtime subscription with `budgets`, since fixed costs now live in `budgets`.

**Carry-forward note:** No explicit carry-forward function existed in the codebase. The `upsertBudget` mutation uses `{ onConflict: 'home_id,category,month' }` and now accepts `budget_type` and `day_of_month` in its input — any future carry-forward that copies rows across months will include the new columns automatically.

**Verification:** `npx tsc --noEmit` exits 0 — zero TypeScript errors.

**Next steps:** Run migrations 0032 and 0033 in the Supabase SQL editor. Regenerate types (`npx supabase gen types typescript --project-id kfpjfhzgtejhzqdurkuu > src/renderer/src/app/types/database.types.ts`). Build the unified Budgets screen UI.

---

### Session 27 — 11 April 2026 — Polish pass: identity, currency, balance card, edge cases

Final polish session closing out the Money rebuild and structural changes from sessions 22–26. The goal: one considered product, not features added over time.

**App identity audit — findings and fixes:**

- **Dashboard.tsx** — 9 hardcoded `£` symbols replaced with `fmt()` from `useCurrencyFormat()`. The "March Budget" card title updated to `{currentMonthLabel} spending` (dynamic month name). "Budget Categories" card renamed to "Spending categories". "View budget" button now links to `/money`. Budget categories link now goes to `/money/spending`. Import added: `useCurrencyFormat`, `format` from `date-fns`.
- **SettleUpModal.tsx** — 4 hardcoded `£` symbols replaced with `fmt()`. "Amount (£)" label simplified to "Amount". Import added: `useCurrencyFormat`.
- **KeyboardShortcuts.tsx** — `G+E` description updated from "Go to Expenses" → "Go to Spending". `G+B` description updated from "Go to Budget" → "Go to Money". Navigation target for `G+B` updated from `/budget` to `/money` (skips the redirect).
- The back navigation on all Money sub-screens already read "← Money" (via `MoneyBackLink` in `MoneyShared.tsx`). No changes needed.
- Settings Money tab already prominent (3rd position) with Wallet icon. No changes needed.

**Currency symbol consistency audit:**
- All four Money screens (Money.tsx, Overview.tsx, Spending.tsx, BillsAndGoals.tsx) already use `fmt()` — done in sessions 22–24.
- Dashboard and SettleUpModal were the two remaining surfaces. Both fixed this session.
- MoneySettings.tsx income inputs already use dynamic symbol via `getCurrencySymbol()`. No change needed.

**Balance card — final polish:**
- Added `justSettled` detection in `BalanceCard`: `useRef` tracks previous amount; when `prev > 0 && balance.amount === 0`, triggers a 2-second celebration state.
- Celebration: scale pulse on the outer `motion.div` (`[1, 1.025, 1]`), spring bounce on the checkmark icon (`[1, 1.3, 1]` with snappy easing), subtitle changes from "Nothing owed either way" → "Just settled up ✓".
- Settle up button converted from `<button>` to `<motion.button>` with `whileTap={{ scale: 0.92 }}` and spring physics for satisfying tap feedback.

**IncomeSetup edge cases:**
- **Single-income households:** `tom_amount` and `partner_amount` now send `null` when the field is left empty (was sending `0`). `myAmount`/`partnerAmount` are typed `number | null`; the mutation receives the correct nullable values.
- **Zero income:** Explicitly entered `0` is allowed (button enables, mutation fires). A gentle contextual note appears: *"With no income set, Roost will track spending without a surplus calculation."* — shown via `AnimatePresence` when `combined === 0 && !bothEmpty`.
- **Large/small amounts:** No validation blocking. Intl formatting handles both gracefully.

**PIN lock — edge case review (no code changes):**
- Crash while locked: `roost-lock-state = 'true'` persists to `localStorage`. On relaunch, `LockContext` reads state synchronously — always locked on next boot if lock was active. ✓
- Sleep with auto-lock = Immediately: macOS triggers window blur on sleep, which fires `app:blur` → `mainWindow.webContents.send('app:blur')`. ✓
- Enable lock without completing PIN: `isEnabled` is only written to `true` inside `setupPIN()` which first verifies both entries match, then writes config. `isLocked()` has an explicit `!config.pinHash` guard. ✓ All verified correct — no code changes needed.

**Verification:** `npx tsc --noEmit` exits 0. `npm run build` produces a signed `.app` successfully.

**PIN architecture note for when app signing is complete:**
The lock/unlock interface is biometric-ready. Touch ID activation path: (1) sign the app with a Developer ID certificate (Phase 5), (2) in `LockScreen.tsx` remove the `disabled` prop from the Touch ID button and call `window.TouchID.authenticate()` (or use `keytar`/`node-touchid` from the main process via IPC), (3) on success call `unlock()` from `useLock()`. No structural changes to `appLock.ts`, `LockContext`, or `LockScreen` needed — the architecture was designed for this from day one (Session 25).

---

### Session 27 — 11 April 2026 — Budgets screen complete rebuild (permanent template model)

Complete ground-up rebuild of the Budgets screen (`/money/budgets`). The old monthly-setup model has been replaced by a permanent household budget template. Lines are set once and roll forward automatically; the month navigator overlays actual spend data on top.

**Architecture change — permanent budget template:**
- Previous model: budget lines stored per-month in the `budgets` table. Each month had to be set up independently.
- New model: `budget_template_lines` table stores the household's permanent financial plan. Lines exist without a month date. When viewing any month, the page generates the view by overlaying that month's actual spend from the `expenses` table on top of the template.

**Migration 0034_budget_template.sql:**
- New table `budget_template_lines` with columns: `id`, `home_id`, `name`, `amount` (numeric 10,2 ≥ 0), `budget_type` ('fixed' | 'envelope'), `section_group`, `day_of_month`, `note`, `is_active`, `sort_order`, `created_at`, `updated_at`.
- RLS: select/insert/update/delete all use `get_user_home_id()` guard.
- `updated_at` trigger auto-fires on row change.
- Added to `supabase_realtime` publication.
- **Run in Supabase SQL editor before deploying.**

**New hook — `useBudgetTemplate`** (`hooks/useBudgetTemplate.ts`):
- Fetches all `is_active = true` template lines for the current home, ordered by section_group / sort_order / created_at.
- Exposes: `templateLines`, `fixedLines`, `envelopeLines`, `linesBySection` (keyed by section_group), `addLine`, `updateLine`, `removeLine`, `migrate`, `totalFixed`, `totalEnvelopes`, `totalBudgeted`, `isLoading`.
- `updateLine` uses optimistic updates for instant UI response on inline amount edits.
- `removeLine` sets `is_active = false` — soft delete only, never hard deletes.
- `migrate` mutation: if `templateLines` is empty and the home has existing `budgets` rows, migrates them into template lines once on first load (idempotent guard; uses category-name heuristics to assign `section_group`; logs to console).
- Realtime subscription on `budget_template_lines`.

**AppContext wiring:** Added `useBudgetTemplate` to `AppContext`. Exposes all hook return values as: `templateLines`, `fixedLines`, `envelopeLines`, `linesBySection`, `addTemplateLine`, `updateTemplateLine`, `removeTemplateLine`, `migrateTemplate`, `totalFixed`, `totalEnvelopes`, `totalBudgeted`, `isTemplateLoading`.

**New Budgets page — `pages/money/Budgets.tsx` (complete rewrite):**

Sections in order (fixed then envelope):
1. Housing & bills (fixed)
2. Subscriptions & leisure (fixed)
3. Transport (fixed)
4. Food & drink (envelope)
5. Household (envelope)
6. Personal (envelope)
7. Savings allocation (envelope)

Key features built:
- **Page header:** MoneyBackLink + "Budgets" h1 (22px/500) + MoneyMonthNavigator + per-person segmented toggle (Household / [User] / [Partner]).
- **Summary cards (4):** Combined income (from `getIncomeForMonth`), Total budgeted, Unallocated (green/amber/red with "Available for savings" / "Over-allocated" label), Spent so far (with % of budget subtitle).
- **Collapsible sections:** Clicking a section header toggles it; AnimatePresence drives the height animation (0.2s). Collapsed sections show only name + type badge.
- **Section type badges:** Fixed = `#faece7`/`#712b13`; Envelope = `#e1f5ee`/`#085041`.
- **Column headers adapt per section type and view mode.** Fixed sections show [Line item][Budgeted]; Envelope sections show [Line item][Budgeted][Spent][Remaining]. Split mode shows [Line item][Budgeted][[User]][[Partner]] for all sections.
- **Fixed rows:** Name + note dot + clickable amount (inline edit) + no progress bar.
- **Envelope rows:** Name + note dot + clickable budgeted amount + spent + remaining (green/amber/red) + 3px progress bar coloured green/amber/red by threshold (>20% green, 0–20% amber, overspent red).
- **Inline amount editing:** Click amount → cell becomes input with terracotta border, 1.02x scale. Enter/blur commits (calls `updateTemplateLine`). Escape cancels.
- **Note dot:** 6px sage circle beside name when note exists. Hover shows tooltip. Not a button.
- **Section totals:** Each expanded section shows a totals row (slightly darker bg, 11px).
- **Grand total row:** Heavy top border, spans full width. Shows Total budgeted / Total spent / Total remaining in household mode; Total / [User] / [Partner] in split mode.
- **Add row button:** Dashed-border button at bottom of each section. Opens `AddBudgetLineSheet`.
- **AddBudgetLineSheet:** Bottom sheet pre-filled with section type/group. Name input + horizontal suggestions. £-prefixed amount input. Day-of-month picker (fixed only). Note input (120 char limit). Save button calls `addTemplateLine`. Slides up with `AnimatePresence`.
- **Right-click context menu:** Appears at cursor, fades in (0.1s). Options: Edit notes (opens inline NoteEditor), Duplicate row (adds copy with " (copy)" suffix), Move to section (sub-menu with other sections), Remove row (triggers inline confirmation). Danger item styled red. Closes on outside click.
- **Inline note editor:** Textarea appears below row name. Blur or Enter saves. Escape cancels.
- **Inline remove confirmation:** "Remove [name]? This removes it from your budget permanently." with "Yes, remove" and "Cancel" links.
- **Empty state (first-time setup):** If `templateLines.length === 0`: Wallet icon, "Set up your household budget" heading, body text, "Set up budget" button.
- **Setup flow:** Clicking "Set up budget" shows a full-screen form with all sections and their preset suggestions at £0. User fills in applicable amounts. "Save budget" batch-creates all non-zero lines.
- **Migration:** On mount, if `templateLines` is empty, `migrateTemplate.mutate()` runs once (ref-guarded) to migrate existing `budgets` rows silently.
- **Spend calculation:** Expense categories matched to template line names case-insensitively. Spend per line = sum of `expenses.amount` where `expenses.category.toLowerCase() === line.name.toLowerCase()` for the selected month.
- **Animation:** New rows highlight terracotta → transparent (0.5s). Section expand/collapse 0.2s. Context menu opacity only. Progress bars animate width on mount.

**Verification:** `npx tsc --noEmit` exits 0 — zero TypeScript errors.

---

### Session 27 — 11 April 2026 — Settings → Money tab full rewrite + global money preferences

Complete rewrite of the Settings → Money tab and implementation of several new fully-functional household financial preferences.

**Migration:**
- `supabase/migrations/0036_money_settings.sql` — adds `personal_income`, `income_visible_to_partner`, `income_set_at` to `home_members`; adds `default_expense_split`, `budget_carry_forward`, `scramble_mode`, `overspend_alert_threshold` to `homes`.
- Run this migration in the Supabase SQL editor before use. Types updated manually to match.

**New hooks:**
- **`hooks/useMoneySettings.ts`** — Reads and mutates all money-related settings. Derives: `myIncome`, `myIncomeVisibleToPartner`, `incomeSetAt`, `partnerIncomeVisible`, `partnerIncome` (only non-null when both have consented), `combinedIncome`, `defaultSplit`, `budgetCarryForward`, `scrambleMode`, `overspendAlertThreshold`. Mutations: `setMyIncome`, `setIncomeVisibility`, `updateHomeSetting`, `toggleScrambleMode`.
- **`hooks/useScramble.ts`** — `fmt(amount)` returns `"•••"` when scramble mode is ON, delegates to `useCurrencyFormat()` when OFF. Used throughout Money screens.

**Global state additions (AppContext):**
- `scrambleMode: boolean`, `toggleScrambleMode()`, `defaultExpenseSplit: number`, `budgetCarryForward: 'auto' | 'manual'`, `overspendAlertThreshold: number`

**Settings → Money tab (4 sections):**
1. **Your income** — Single input for current user only (not a combined input). Last-updated date. Inline "Saved ✓" confirmation (no toast). Share-with-partner toggle with consent status. Combined household income display (only when both consented).
2. **Privacy & display** — Scramble mode (prominent row with terracotta toggle when ON + amber "ON" badge). Hide balances on Money home (localStorage, device-only).
3. **Budget preferences** — Default split (slider with avatar pair + live percentage labels). Budget carry-forward segmented control (Automatic/Manual). Spending alerts pill selector (50%–90%).
4. **Currency** — Unchanged.
- Removed: "Manage budget categories" section.

**Scramble mode (global):**
- Toggle in Settings → Money tab syncs to `homes.scramble_mode` (real-time via `useHome` subscription).
- `ScrambleBanner` in `AppShell.tsx` shows an amber pill banner on all `/money*` routes when scramble is ON. Tapping turns it off.
- All amounts in `Money.tsx` (`SummaryCard`, `BalanceCard`, `NavigationCards`, `SpendingBars`, `UpcomingBillsStrip`, `SavingsGoalsSummary`) use `useScramble().fmt` instead of `useCurrencyFormat()`.

**Hide balances on Money home:**
- Toggle in Settings stores `roost-hide-balances` in localStorage.
- `Money.tsx` reads this on mount and listens to storage events for cross-tab sync.
- Ring shows "Tap / to reveal" when hidden. Tapping reveals amounts for 5 seconds then re-hides.
- Stat rows show "—" when hidden.

**Overspend alert threshold:**
- Read from `AppContext.overspendAlertThreshold` (default 80).
- `pctColor()` in `Money.tsx` and `getStatusColor()` / `getStatusTone()` in `MoneyShared.tsx` now accept a `threshold` param (default 80). Colour transitions adapt dynamically.
- `SpendingBars` in `Money.tsx` uses the live threshold for bar colour.

**Budget carry-forward:**
- `Budgets.tsx` checks `budgetCarryForward` before auto-migrating. `auto`: silent carry-forward on new month. `manual`: empty state shows "Carry forward last month" button alongside "Set up budget".

**Default expense split:**
- `defaultExpenseSplit` from AppContext exposed to `ExpenseQuickAddSheet`. Split type initialised from preference (currently always "equal" since the custom split UI is Pro-only and requires manual entry — foundation is in place for future enhancement).

**Verification:** `npx tsc --noEmit` exits 0 — zero TypeScript errors.

---

### Session 26 — 11 April 2026 — Income setup screen + onboarding tour updates

Added the income onboarding screen that gates first entry into the dashboard, and updated the guided tour.

**New app flow (new users):**
1. Signup → home setup (existing)
2. `/income-setup` — full-screen income entry screen
3. Onboarding tour (updated)
4. Dashboard

**Existing users:** If `household_income` has no rows for their home and they haven't dismissed the screen, they are redirected to `/income-setup` once on next boot. After setting income or skipping, the screen never shows again.

**What was built:**

- **`pages/IncomeSetup.tsx`** (new) — Full-screen warm page, outside AppShell (no nav/topbar). Staggered entrance animation. Two currency-prefixed number inputs (your income + partner's income, where partner name is pulled from `home_members`). Live combined total display (animates on value change). Privacy toggle (keeps individual amounts private; stores intent in `notes` field). "Set up our finances →" CTA — calls `setIncome.mutate()` with `tom_amount`, `partner_amount`, `combined_amount`, then navigates to `/dashboard`. "I'll do this later" — sets `roost-income-setup-dismissed = 'true'` in localStorage, navigates to `/dashboard`. Currency symbol derived from `home.currency_symbol` via `Intl.NumberFormat.formatToParts`. Exports `INCOME_SETUP_DISMISSED_KEY` and `shouldShowIncomeSetup` utility.

- **`routes.tsx`** — Added `{ path: "income-setup", Component: IncomeSetup }` as a direct child of `RootLayout` (same level as AppShell). Access to AppProvider/LockProvider but no AppShell UI.

- **`components/AppShell.tsx`** — Added `useApp()` import and destructures `incomeRows`, `isHouseholdIncomeLoading`. Added `isHouseholdIncomeLoading` to the loading gate (prevents dashboard flash before redirect fires). After auth/home guards: if `incomeRows.length === 0 && !localStorage.getItem('roost-income-setup-dismissed')` → `<Navigate to="/income-setup" replace />`.

- **`components/Onboarding.tsx`** — Rebuilt step list (still 12 steps, 0–11):
  - Removed: "Organise your shopping" (step 5) and "Manage expenses easily" (step 7) — both were center-placement, no-target steps that added little value
  - Updated: Step 5 (was "Expense tracking") → now "Money" with new copy: "Money is your household financial hub. Log what you spend, set budgets, track bills, and save toward goals — together." Route updated to `/money`.
  - Added: Step 6 "Who's paid more?" — spotlights `[data-onboarding='money-balance-card']` on `/money`, explaining the balance card and Settle up.
  - Added: Step 7 "Bills & Goals" — spotlights `[data-onboarding='money-bills-goals']` on `/money`, explaining recurring bills and the calendar.

- **`pages/Money.tsx`** — Added `data-onboarding="money-balance-card"` wrapper div around `<BalanceCard>`. Added `data-onboarding="money-bills-goals"` to the Bills & Goals `motion.button` in `NavigationCards`.

**Timing note:** `OnboardingContext` was not changed. The auto-start timer fires 800ms after `RootLayout` mounts. Since `Onboarding.tsx` (the overlay) only renders inside `AppShell`, and `/income-setup` is outside AppShell, the tour cannot display until the user navigates to `/dashboard`. This means the sequence is naturally enforced without any extra coordination.

**Verification:** `npx tsc --noEmit` exits 0 — zero TypeScript errors.

---

### Session 25 — 11 April 2026 — PIN app lock (functional)

Implemented the complete PIN app-lock system, designed from the start with Face ID as the future fallback unlock path.

**Architecture principle:** The lock system is not PIN-specific. The lock/unlock flow is a single interface — PIN currently powers it, and biometric unlock will call the same `unlock()` path after a successful system biometric prompt. No structural changes needed when Touch ID ships.

**What was built:**

- **`lib/appLock.ts`** — Core lock module. Config stored in `roost-lock-config` (localStorage), lock state in `roost-lock-state`. PIN hashed with `crypto.subtle.digest('SHA-256')` + fixed salt `'roost-salt-v1'`. Never stores the raw PIN. Exports: `getConfig`, `updateConfig`, `isLocked`, `lock`, `setUnlocked`, `setupPIN`, `verifyPIN`, `clearPIN`, `autoLockDelayFromString`, `autoLockDelayToString`.

- **`context/LockContext.tsx`** — React context wrapping the entire app. On mount: if lock is enabled and a PIN exists, starts locked (always locks on launch for security). Listens to `app:blur` / `app:focus` IPC events to start/cancel the auto-lock timer. Renders `<LockScreen>` as a fixed overlay (z-[200]) via `AnimatePresence` — app content stays mounted beneath it so React state and TanStack Query cache survive lock/unlock. Exports `useLock()` with `{ locked, lock, unlock, refreshLockEnabled }`.

- **`components/security/LockScreen.tsx`** — Full-screen overlay (`fixed inset-0 z-[200] bg-background`). Warm cream background, Roost branding (Home icon in terracotta), 6-dot PIN display with scale animation on fill. Custom 3×4 keypad (same warm card style as ExpenseQuickAddSheet). Shake animation on wrong PIN (`x: [0, -10, 10, ...]`). 5 failed attempts → 10-second cooldown with countdown. "Use Touch ID" button present but disabled for future biometric path.

- **`components/security/PINSetupFlow.tsx`** — Three-step modal (`z-[300]`, above LockScreen). Step 1: "Create your PIN" → Step 2: "Confirm your PIN" (mismatch shakes and returns to Step 1) → Step 3: success checkmark in terracotta, auto-closes after 1.5 s. Escape key cancels and calls `onCancel()` so the caller can revert the toggle. Calls `appLock.setupPIN(pin)` on Step 3.

- **`pages/settings/Security.tsx`** (rewritten) — Fully wired:
  - Toggle ON → opens `PINSetupFlow`
  - Toggle OFF → reveals inline `InlinePINConfirm` component (6 dots + compact keypad, animates in/out) — correct PIN calls `clearPIN()` and closes; cancel dismisses
  - "Change PIN" row (visible when enabled) → inline confirm of current PIN → on success opens `PINSetupFlow` again
  - Auto-lock selector → calls `appLock.updateConfig({ autoLockDelay: ms })` with ms derived from the string value
  - All state derives from `appLock.getConfig()` on mount; `refreshConfig()` re-reads after any mutation
  - Removed the old "PIN coming soon" stub banner entirely

- **`main/index.ts`** — Added `mainWindow.on('blur')` → `send('app:blur')` and `mainWindow.on('focus')` → `send('app:focus')`.

- **`preload/index.ts`** — Exposed `onAppBlur`, `onAppFocus`, `removeAppWindowListeners` via `contextBridge`.

- **`types/window.d.ts`** — Added type declarations for the three new IPC methods.

- **`components/RootLayout.tsx`** — Wrapped the provider tree with `<LockProvider>` between `AppProvider` and `OnboardingProvider`.

**Verification:** `npx tsc --noEmit` exits 0 — zero TypeScript errors.

---

### Session 24 — 11 April 2026 — Settings restructure: Money, Security + household currency

Two structural sessions combined into one log entry.

**Settings restructure (Session 23):**

- **SettingsLayout** — Rewrote to a 9-tab horizontal nav (Profile, Household, Money, Security, Notifications, Hazel, Rooms, Account, Subscription) with `overflow-x-auto scrollbar-none` for scroll on smaller widths. Animated tab indicator uses `motion.div layoutId`.
- **MoneySettings** (`pages/settings/MoneySettings.tsx`) — New settings section at `/settings/money`:
  - *Income section* — Two currency-prefixed inputs for your income and partner's income, pulling from `useHouseholdIncome`. Live combined total. Privacy toggle stored in localStorage. Save button with 2-second inline "Income updated for Month Year" confirmation. "Last set Month Year" / "Not set yet" indicator.
  - *Budget categories section* — Tappable row navigating to `/settings/budget-categories`. Shows active category count badge.
  - *Currency section* — Select dropdown (GBP/USD/EUR/AUD/CAD/JPY/CHF). Calls `updateCurrencySymbol` on change; persisted to `homes.currency_symbol` via Supabase.
- **Security** (`pages/settings/Security.tsx`) — New settings section at `/settings/security`:
  - App lock toggle (localStorage `roost-app-lock`). When enabled, shows animated `PinComingSoonBanner`.
  - Auto-lock select (Immediately/1m/5m/15m/Never), only visible when app lock enabled via `AnimatePresence`.
  - Touch ID toggle — disabled, "Coming soon" badge, localStorage `roost-use-touch-id`.
- **Routes** — Added `money` and `security` children under `/settings`.

**Household currency (Session 24):**

- **Migration `0031_currency_symbol.sql`** — `alter table homes add column if not exists currency_symbol text not null default 'GBP'`.
- **`database.types.ts`** — Added `currency_symbol: string` to homes Row/Insert/Update.
- **`lib/schemas/home.ts`** — Added `currency_symbol: z.string().optional().default('GBP')`.
- **`hooks/useHome.ts`** — Added `useCurrencyFormat()` hook (uses `Intl.NumberFormat` with ISO 4217 codes, reads `home.currency_symbol`). Added `updateCurrencySymbol` mutation. Both exported.
- **`lib/utils.ts`** — `formatCurrency` updated to accept optional `currency` param (defaults `'GBP'`); kept for non-hook callsites.
- **`MoneyShared.tsx`** — Re-exports `useCurrencyFormat` for convenience.
- **All Money screens updated** — `Money.tsx`, `Spending.tsx`, `Overview.tsx`, `BillsAndGoals.tsx` — all `formatCurrency(x)` calls replaced with `const fmt = useCurrencyFormat()` + `fmt(x)` in every sub-component that renders currency. `formatCurrency` import removed from each file.

**Verification:** `npx tsc --noEmit` exits 0 — zero TypeScript errors.

---

### Session 22 — 11 April 2026 — Expenses consolidated into Money section

Structural session: moved all expense-related functionality from the Expenses sidebar item into the Money section where it belongs conceptually. No data model or hook changes.

**What changed:**

- **BottomNav** — Removed the Expenses nav item and `Receipt` icon import. Nav now has 6 items: Dashboard, Shopping, Money, Chores, Calendar, Pinboard.
- **Routes** — `/expenses` redirects to `/money/spending` via `<Navigate replace />`. Expenses page stays as a dead route temporarily.
- **Money home screen** — Added a `BalanceCard` component between the ring arc summary card and the spending alert card. Shows: "You're even" (success green + checkmark), "[Partner] owes you £X" (success green + settle up button), or "You owe [Partner] £X" (warning amber + settle up button). Settle up button opens the existing `SettleUpModal` unchanged.
- **Spending screen** — Added "All Expenses" section at the bottom with the full chronological expense list for the selected month (date DESC). Each row shows title, coloured category pill, payer MemberAvatar, amount, date, and recurring badge. Free-tier Pro gate row for expenses older than 30 days (same pattern as category detail). Settlement history collapsible below the expense list: "X settlements ▼" expands to show all settlements.
- **Cross-links updated** — `/expenses` links in Budget.tsx, Dashboard.tsx, KeyboardShortcuts.tsx, useGlobalSearch.ts, and Onboarding.tsx all updated to `/money/spending`.
- **Zero TypeScript errors** after all changes.

### Session 21 — 11 April 2026 — Bills & Goals screen + ExpenseQuickAddSheet (Session 4 of N)

Built the final two deliverables of the Money section rebuild: the Bills & Goals sub-screen and the new expense quick-add bottom sheet.

**What was built:**

- **BillsAndGoals screen** (`pages/money/BillsAndGoals.tsx`) — full-page screen at `/money/bills-and-goals`:
  - Horizontal-scroll bill calendar strip for the next 30 days, highlighting the most imminent bill in terracotta, amber urgency dot for bills within 3 days
  - Committed costs summary card ("X bills · £Y/month total" + % of income if income set)
  - Full recurring bills list with hover-reveal edit/remove actions, inline removal confirmation, free-tier lock overlay beyond 5 bills, empty and loading states
  - BillEditorSheet — slide-up bottom sheet for add/edit: name, £ amount, day-of-month horizontal picker (1–31), category input; handles PRO_REQUIRED by closing and delegating
  - Savings goals list with 52px SVG progress rings, On track/Behind status pills, monthly-needed calculation, free-tier gate (1 goal on free), completed goals collapsed section
  - AddGoalSheet — name, target amount, optional DatePicker, 6-colour swatch picker; handles PRO_REQUIRED by opening upgrade modal
  - GoalDetailSheet — 96px animated ring, progress bar, add-savings inline input calling addToGoal, mark-complete confirmation, delete confirmation

- **ExpenseQuickAddSheet** (`components/expenses/ExpenseQuickAddSheet.tsx`) — reusable bottom sheet:
  - State 1 (amount entry): blinking cursor, custom 3×4 number pad with press animations; decimal and backspace handling
  - State 2 (full details): smooth transition when description field focused; who-paid avatar buttons (current user + partner); Equal / Custom / Solo split selector (Custom gates to Pro via upgrade modal); "Edit amount" link back to pad
  - Hazel category suggestion: 500ms debounce on description, auto-selects on Pro, highlights (dashed border) on free for manual confirmation
  - Category pill scroll row with filled/outlined/suggested states using consistent colour hash
  - Submit flow: validates amount > 0 and description present; brief green check animation on success; closes and calls onSuccess callback

- **Routing** — `routes.tsx`: added `/money/bills-and-goals` → `BillsAndGoals`; `/money/bills` now redirects to `/money/bills-and-goals`; Money home nav card path updated to match.

- **Money.tsx FAB** — terracotta `+` button fixed bottom-right, opens `ExpenseQuickAddSheet` from the home screen.

- **Expenses page** — primary Add Expense button and empty-state CTA now open `ExpenseQuickAddSheet` instead of the legacy dialog. Old dialog still present (not removed per spec).

**Verification:**
- `npx tsc --noEmit` exits 0 — zero TypeScript errors.

**Status:** Session 4 complete. Money section rebuild is done: home screen, Overview, Spending, Bills & Goals, and the new expense quick-add sheet are all built and routed. Ready for the polish session.

---

### Session 20 — 11 April 2026 — Money Overview + Spending screens (Session 3 of N)

Built the first two Money sub-screens: **Overview** (`/money/overview`) and **Spending** (`/money/spending`). Per the session rules, this was UI-only: no changes to `Money.tsx`, the money hooks, or `AppContext` wiring.

**What was built:**

- **Shared Money screen primitives** — added `pages/money/MoneyShared.tsx` with a reusable warm Money header, gated month navigator, shared month persistence (`?month=YYYY-MM` + localStorage fallback), stat cards, progress bars, and shared financial status colour helpers.
- **Overview screen** — added `pages/money/Overview.tsx` with:
  - back link and gated month navigation synced to the shared Money month state
  - 2×2 summary card grid for income, spend, fixed costs, and discretionary spend
  - “Where it went” fixed vs discretionary split card with surplus callout
  - pure CSS/SVG spending trend chart with free-tier teaser treatment and live monthly budget-limit markers
  - Pro-gated month-on-month comparison card
  - inline monthly income editor with separate partner fields and combined total
- **Spending screen** — added `pages/money/Spending.tsx` with:
  - SVG donut chart by category using the same stable category colour hash as the Money home screen
  - ambient Hazel-style insight line
  - full category list versus limits with green / amber / red threshold fills
  - animated single-expand category rows using `AnimatePresence`
  - inline expense entries with avatar chips, dates, free-tier 30-day gating, and “X more” expansion
  - bottom link to the existing budget limit management page
- **Routing update** — replaced the stub `/money/overview` and `/money/spending` routes in `routes.tsx` with the new real screens.

**Verification:**
- `npx tsc --noEmit --pretty false` completed cleanly after the new routes and screens were added.

**Status:** Session 3 complete. Money Overview and Spending screens are built and routed. Ready for Session 4.

---

### Session 19 — 11 April 2026 — Money home screen UI (Session 2 of N)

Built the complete Money home screen (`src/renderer/src/app/pages/Money.tsx`). Data layer only in this session — no modifications to existing pages, hooks, or context.

**What was built:**

- **Money page** (`pages/Money.tsx`) — 950-line single-file component containing all six sections and all sub-components as internal functions, matching the existing page pattern exactly.

**Section 1 — Ring arc summary card:**
- Animated SVG donut ring (60×60px) showing % of income spent, coloured green/amber/red based on thresholds (70/90%)
- Four animated stat rows (AnimatedNumber counts up on mount over 0.4s): Income, Spent, Remaining, Est. surplus. Remaining and surplus are colour-coded to financial status.
- Hazel insight line — italic muted text driven by static pct_spent logic (Pro IPC hook deferred to a future session)
- Skeleton loading state while summary/income queries are in flight

**Section 2 — Spending alert (conditional):**
- Only renders if any budget category is ≥ 80% of its limit
- Shows worst offender with pct, amount, and days left in month; "and N others" if multiple

**Section 3 — Upcoming bills strip:**
- Horizontal-scroll row of pill cards for the next 30 days via `getBillsForDateRange`
- Most imminent card highlighted in primary/terracotta; others use card surface
- "Today" / "Tomorrow" / date labels; "No bills added yet" empty state with + button
- Max 6 cards; staggered entrance animation

**Section 4 — Savings goals summary:**
- Mini ring (28px) per active goal showing current/target %, coloured by goal's `colour` field
- Status pill: "On track" (green) or "Behind" (amber) driven by monthly surplus ÷ goals vs monthly needed
- Free-tier users with ≥ 1 goal see a soft "Add more goals with Roost Nest →" CTA that opens the upgrade modal
- "Start saving together" empty state; "See all X goals →" overflow link; max 2 shown inline

**Section 5 — Spending bars:**
- Horizontal bar per active budget category, spend vs limit
- Bar colour: green < 70%, amber 70-90%, red > 90% of limit; terracotta if no limit set
- Category dot uses a stable hash of the category name → app palette colour
- "No spending logged yet" empty state; "X more categories →" overflow link; max 4 bars

**Section 6 — Navigation cards:**
- Three tappable cards: Overview, Spending, Bills & Goals
- Spending card subtitle shows top category name + amount if data exists
- Bills card subtitle shows next bill name + days until

**Income setup prompt:**
- Full-width warm card shown above Section 1 if `incomeRows.length === 0`
- £ prefixed input with Save button; calls `setIncome.mutate()` on the current month
- Disappears via `AnimatePresence` once any income is saved

**Routing and navigation:**
- Added `/money` route → `Money` component in `routes.tsx`
- `/budget` redirected to `/money` for backwards compatibility (Navigate component)
- Stub routes for `/money/overview`, `/money/spending`, `/money/bills` pointing back to Money (sub-screens in future sessions)
- `BottomNav` updated: "Budget" (PiggyBank) → "Money" (Wallet icon, `/money` path)

**Verification:**
- `npm run typecheck` → zero errors

**Status:** Money home screen UI complete. Ready for Session 3 (Money sub-screens: Overview, Spending, Bills & Goals).

---

### Session 21 — 11 April 2026 — Spending screen polish + Goals screen (full build)

Two things shipped in this session: Spending screen gains a FAB and envelope awareness; Goals gets its own full screen.

**Spending screen — `pages/money/Spending.tsx`:**
- Added floating action button (terracotta circle, `fixed bottom-24 right-5`) — opens `ExpenseQuickAddSheet`
- FAB pre-selects `expandedCategory` as `defaultCategory` — if you're looking at "Eating Out" and tap "+", the sheet opens on Eating Out
- Category bar label updated: `hasLimit` → "£X of £Y envelope" (was: "£Y limit"); `!hasLimit` → "No envelope set"
- "Set envelope →" text link appears below each category card with no envelope set
- Tapping it opens `SetEnvelopeSheet` — an inline bottom sheet with amount input that calls `supabase.from('budgets').upsert(...)` with `budget_type: 'envelope'` for the selected month
- All expenses log section was already present — confirmed working
- `translateError` used for error toast on envelope upsert

**Goals screen — `pages/money/Goals.tsx` (full build):**
- Replaces the stub created in Session 20
- Uses `useApp()` for all goals data and `summary.surplus`
- **Contribution summary card**: if any active goal has a target date, shows "To hit your goals you need to save £X/month. Your current surplus is £Y." — coloured green/amber/red
- **GoalCard**: 64×64 SVG ring chart, goal name, saved/target amounts, "by Month YYYY" target, monthly needed, status pill ("On track" / "Behind" / "No deadline")
- **GoalDetailSheet**: 96×96 animated SVG ring, add savings inline, mark complete, remove with confirm
- **AddGoalSheet**: name, target amount, date picker, colour picker — ported and cleaned from BillsAndGoals.tsx
- **Pro gating**: free tier shows 1 active goal + soft gate card below; Pro shows all
- **CompletedGoalsSection**: collapsible, shows completed goals with check icon, final amount, completion date, duration (via `date-fns formatDuration`)
- **Empty state**: warm, centred, PiggyBank icon, "Add your first goal" CTA
- `BillsAndGoals.tsx` remains as dead code (not deleted — clean up in polish session)

**Routing:** `/money/bills-and-goals` → redirects to `/money/budgets` (confirmed from Session 20)

**Money section restructure: complete.** Overview, Spending, Budgets, Goals all have standalone screens. BillsAndGoals.tsx is dead code.

**Verification:**
- `npm run typecheck` → zero errors

**Status:** Money section restructure complete. Ready for iOS sessions.

---

### Session 20 — 11 April 2026 — Budgets UI: new screen wired into Money home

Built the `/money/budgets` screen and wired it into the app. Replaces the old "Bills & Goals" navigation entry with two separate cards: "Budgets" and "Goals".

**Data layer changes (sessions 18+19 foundations applied here):**
- `supabase/migrations/0032_budget_type.sql` — adds `budget_type` ('fixed'|'envelope') and `day_of_month` columns to `budgets`
- `supabase/migrations/0033_update_monthly_summary.sql` — `get_monthly_summary` now reads fixed costs from `budgets WHERE budget_type='fixed'` (not `recurring_bills`); returns `envelopes_total`, `total_budgeted`, `actual_spend`, `pct_of_income_budgeted`
- `lib/schemas/money.ts` — `monthlySummarySchema` gains new fields + backward-compat `.transform()` mapping `actual_spend→total_spent` and `envelopes_total→discretionary` so existing UI compiles unchanged
- `lib/schemas/budgets.ts` — `budgetSchema` and `upsertBudgetSchema` updated with `budget_type` and `day_of_month`
- `database.types.ts` — `budgets.Row/Insert/Update` updated with new columns
- `useBudget` — added `getFixedBudgets`, `getEnvelopes`, `getTotalFixed`, `getTotalEnvelopes`, `getRemainingInEnvelope`, `batchUpsertBudgets` (quiet batch upsert for carry-forward/preset), `migrateRecurringBillsToBudgets`
- `useMonthlySummary` — realtime subscription switched from `recurring_bills` → `budgets`

**New screen — `pages/money/Budgets.tsx`:**
- Three view states: budget set (main view), carry-forward prompt (prev month exists, no current), preset template (fresh setup)
- Fixed Costs section: ordered by day_of_month, shows ordinal day (1st, 2nd…), color dot, amount, % of income, hover-to-delete
- Envelopes section: inline progress bars, "£X of £Y", unallocated amount shown
- `AddBudgetSheet`: fixed or envelope type, quick preset chips, day-of-month picker (fixed only)
- `EnvelopeDetailSheet`: SVG ring chart (manual, no library), expense list, inline amount edit, delete with confirm
- `DayOfMonthPicker`: 31-button scrollable strip
- `CarryForwardPrompt`: carry forward or set up fresh
- `PresetTemplate`: UK household preset categories (Housing & Bills, Subscriptions, Food, Transport, Household, Personal, Savings), sticky save button, partner name interpolation

**Routing:**
- `/money/bills-and-goals` → redirects to `/money/budgets`
- `/money/budgets` → `Budgets` component
- `/money/goals` → `Goals` stub (full build in Session C)

**Money home NavigationCards:**
- Replaced "Bills & Goals" card with "Budgets" card (`CalendarDays` icon, shows `${fmt(totalBudgeted)} planned · ${fmt(unallocated)} unallocated` or "Set up your {month} budget")
- Added "Goals" card (`PiggyBank` icon, shows active goal count + nearest goal name)
- `data-onboarding="money-bills-goals"` preserved on Budgets card for onboarding compatibility

**Verification:**
- `npm run typecheck` → zero errors

**Status:** Budgets screen complete. Goals stub live. Ready for Session C — Goals full build.

---

### Session 18 — 11 April 2026 — Money section rebuild: backend and data layer (Session 1 of N)

Built the complete TypeScript/React data layer for the new Money section redesign. No UI changes — this session is backend and data layer only.

**Migrations (local record files created — already applied in Supabase):**
- `0027_household_income.sql` — `household_income` table with RLS, unique constraint on `(home_id, month)`, `updated_at` trigger
- `0028_savings_goals.sql` — `savings_goals` table with RLS, `updated_at` trigger, free-tier limit trigger (`check_savings_goals_limit`: max 1 goal on free tier, raises `upgrade_required`)
- `0029_recurring_bills.sql` — `recurring_bills` table with RLS, `updated_at` trigger, free-tier limit trigger (`check_recurring_bills_limit`: max 3 bills on free tier, raises `upgrade_required`)
- `0030_money_functions.sql` — `get_monthly_summary` RPC (income, fixed_costs, discretionary, total_spent, surplus, projected_total, pct_spent) + category normalisation triggers on `expenses`

Note: local 0026 was already taken by `generate_lifetime_promo_codes`, so money migrations are 0027–0030.

**Zod schemas — `src/renderer/src/app/lib/schemas/money.ts`:**
- `householdIncomeSchema` + `createHouseholdIncomeSchema` + `HouseholdIncome` / `CreateHouseholdIncome` types
- `savingsGoalSchema` + `createSavingsGoalSchema` + `updateSavingsGoalSchema` + types
- `recurringBillSchema` + `createRecurringBillSchema` + `updateRecurringBillSchema` + types
- `monthlySummarySchema` + `MonthlySummary` type
- `ProRequiredError` interface (typed error for upgrade prompts)

**Hooks created:**
- `useHouseholdIncome` — fetches all income rows, `getIncomeForMonth(date)` derived helper, `setIncome` upsert mutation with optimistic update + rollback, Realtime subscription
- `useSavingsGoals` — full CRUD (`addGoal`, `updateGoal`, `deleteGoal`, `completeGoal`, `addToGoal`), optimistic updates throughout, `upgrade_required` DB error maps to typed `{ code: 'PRO_REQUIRED', feature: 'savings_goals' }`, `activeGoals`/`completedGoals` derived arrays, Realtime subscription
- `useRecurringBills` — fetches active bills ordered by `day_of_month`, `addBill`/`updateBill`/`deactivateBill` mutations (never hard-deletes), `upgrade_required` maps to typed error, `getBillsForDateRange(start, end)` pure function returning `BillOccurrence[]` with `next_date` + `days_until` for the bill calendar strip, Realtime subscription
- `useMonthlySummary` — calls `get_monthly_summary` RPC, parses through `monthlySummarySchema`, `selectedMonth` state (defaults to current month), Realtime subscriptions on `expenses`/`household_income`/`recurring_bills` to auto-invalidate the summary

**AppContext wiring:**
All four hooks wired into `AppProvider` and exposed through `AppContextType`. All return values from each hook are available via `useApp()`. No existing hooks or pages modified.

**Verification:**
- `npm run typecheck` → zero errors

**Status:** Backend complete. Ready for Session 2 — Money home screen UI.

---

### Session 17 — 29 March 2026
Shipped a focused premium polish cycle across Roost’s highest-impact surfaces, with special attention on Shopping, Chores, shared controls, and interaction quality. This session also prepared the app for the next GitHub draft-release pipeline run.

**Premium polish work:**
- Refined shared UI primitives (cards, buttons, badges, inputs, checkboxes, dialogs, popovers, selects) for calmer hierarchy, subtler glass layering, stronger tactile feedback, and more deliberate focus treatment
- Tightened the shared motion system: durations shortened, easing unified, hover/press states made more restrained and more macOS-adjacent
- Upgraded empty/loading states so they feel more product-grade and less prototype-like

**Shopping page improvements:**
- Reworked the quick-add area, category grouping rhythm, row density, and metadata emphasis so the page scans more easily and feels less repetitive
- Improved category headers and active/done row treatment to create clearer hierarchy and calmer section separation
- Revised completion behavior so shopping items now remain in their aisle/category when checked, with a slower left-to-right strike animation and in-place completed state

**Chores page improvements:**
- Reduced noise across stats, filters, and row metadata; improved distinction between overdue, open, and completed surfaces
- Strengthened row hierarchy and common actions so task scanning feels lighter and more intentional
- Updated chore completion behavior to keep the premium strike/confirmation feel while restoring a dedicated Completed section for chores only

**Interaction polish:**
- Standardised button hover/press/focus feedback across the app
- Refined modal, popover, select, and date-picker entrance/exit behavior for smoother, calmer overlays
- Improved row-level feedback on Shopping and Chores so common actions feel clearer and more satisfying without becoming flashy

**Verification:**
- Repeatedly validated with `npm run build:app` during the pass
- Final production app build passes cleanly at `v1.4.0`, ready for the GitHub draft-release pipeline

### Session 16 — 28 March 2026
Prepared the Roost Nest release for the GitHub draft-release pipeline and verified the desktop build path end to end.

**Release pipeline work:**
- Fixed the Electron Builder macOS icon path to use `resources/Icon.icns`, matching the real file on disk and the runtime icon loader
- Split the build scripts so `build:app` runs the Electron/Vite production bundle and `release` publishes from that clean app build path
- Confirmed `npm run typecheck`, `npm run build:app`, and the full local `npm run build` DMG flow all complete successfully

**Release contents in this version:**
- Roost Nest freemium foundation, Stripe desktop bridge, webhook scaffold, and subscription settings flows are now release-ready in the repo
- Lifetime promo-code redemption is wired end to end with dedicated UI and server-side validation
- Budget analytics and expense-history gating now degrade gracefully for free households with warm Nest upgrade prompts

### Session 13 — 28 March 2026
Laid the Roost Nest freemium foundation: subscription state now has a home in the data model, the first paid gates are wired, and Stripe has a secure desktop-side integration path.

**Subscription architecture:**
- Added a new subscription migration (`0024_subscription.sql`) with household-level columns on `homes` and an immutable `subscription_events` audit log
- Extended the latest `create_home_for_user()` function so every new household starts on a 14-day Nest trial at the database layer, not in the UI
- Added subscription Zod schemas and extended `homeSchema` so the app can read subscription state safely even during rollout

**Canonical gating primitives:**
- Added `useSubscription()` as the single source of truth for Nest access checks (`canAccess(feature)`)
- Added `NestGate` as the shared warm upgrade wrapper for soft/hard feature gating

**First gated features:**
- Expenses now filter free households to the last 30 days only, with a Nest upgrade card beneath the visible list
- Budget month navigation now stays on the current month for free households
- Hazel expense categorisation is now gated in the main process (renderer cannot unlock it by itself)
- Hazel budget insights are gated in both renderer and IPC, with a soft preview-style Nest gate in Budget Analytics

**Stripe foundation:**
- Installed the Stripe SDK and added a secure main-process Stripe bridge for checkout session creation, customer portal session creation, and live price lookup
- Added preload + `window.api` typing for Stripe and gated Hazel IPC calls
- Added a Stripe webhook Edge Function scaffold that writes subscription events and updates the owning home
- Added Stripe environment variables to `.env.example`

**Verification:**
- `tsc --noEmit --pretty false` runs cleanly after the foundation pass
- `npm run build` progresses through the Electron/Vite production pipeline after the subscription changes

### Session 14 — 28 March 2026
Built the first visible Roost Nest subscription UI so the freemium system can be seen, exercised, and tested from inside the app.

**Subscription UX surfaces:**
- Added a new **Subscription** tab to Settings with distinct trialing, active, free, past-due, and canceled states
- Added a global `UpgradeModal` with annual/monthly plan selection, warm feature list, Stripe checkout redirect state, and graceful retry handling
- Added a slim `TrialBanner` beneath the TopBar that appears only when the trial is within 7 days of ending

**Gating refinements:**
- `NestGate` CTAs now open the shared Upgrade modal rather than showing inert buttons
- Expense-history upsell copy at the bottom of the Expenses list now matches the new subscription tone of voice
- Budget Analytics now uses a clearer Nest upsell message for Hazel insights
- Free-tier previous-month budget navigation now invites the user to upgrade rather than failing silently, with hover text explaining why

**Subtle shell signals:**
- Added a small past-due warning indicator to the TopBar notification bell so payment issues are visible without feeling loud or alarming
- Wired the Upgrade modal globally into the authenticated shell so any gate or settings surface can open the same flow

### Session 15 — 28 March 2026
Added lifetime promo-code redemption for Roost Nest so Thomas can grant permanent Nest access without Stripe.

**Lifetime access foundation:**
- Added migration `0025_lifetime_access.sql` to introduce `promo_codes`, seed `ROOST-TEST`, and extend `homes.subscription_status` to include `lifetime`
- Extended the subscription schemas with promo code models and promo redemption response/error types
- Updated `useSubscription()` so lifetime access counts as Nest everywhere and unlocks all gated features

**Server-side redemption flow:**
- Added Supabase Edge Function `redeem-promo` to validate promo codes server-side, verify the user belongs to the target home, upgrade the home to lifetime Nest, and mark the code redeemed
- Kept the flow idempotent so homes already on lifetime access return a safe response rather than corrupting state

**App-side redemption UX:**
- Added `useRedeemPromo()` hook to call the Edge Function, validate the response with Zod, and refresh the home query immediately after success
- Added a promo code redemption section to the bottom of the Subscription settings page with warm success/error copy and uppercase code entry
- Added a dedicated lifetime subscription state in Settings with a warm “Lifetime” Nest presentation and no billing controls
- Promo code redemption now works end-to-end after aligning function auth with the repo’s known-good Edge Function pattern and disabling gateway JWT verification for `redeem-promo`

### Session 12 — 27 March 2026
Major Budget section rework: split into two tabs (Analytics + Categories), added forward-looking month navigation, Hazel-powered forecasting, and richer visual analytics.

**Two-tab Budget architecture:**
- Split the Budget page into an **Analytics** tab and a **Categories** tab, switchable via a warm pill toggle at the top
- Analytics tab contains the household overview, stats, six-month spend chart, Hazel forecast, plain-English narrative, attention callouts, and top-category bars
- Categories tab preserves the full existing category breakdown with expandable rows, expense drill-down, recurring cost visibility, and status badges — nothing removed

**Forward-looking month navigation:**
- Extended month navigation so users can skip up to **12 months into the future** as well as back into the past
- Month selector now shows "X months ahead" context when viewing future months
- `useBudget` hook updated with `canGoForward`, `monthsAhead`, and a capped `nextMonth` callback

**Hazel-assisted budget forecasting:**
- Added a new `getBudgetInsights` function in `src/main/claude.ts` that takes the month's budget numbers and top categories and returns a warm summary, outlook, and 3 focus points
- Wired through IPC (`budget:insights`), preload bridge (`budgetInsights`), and `window.d.ts` types
- Analytics tab calls Hazel on mount and displays the forecast in a dedicated card with loading skeleton and graceful fallback

**Visual analytics (no external chart library):**
- Built a lightweight six-month spend-vs-budget bar chart using pure CSS/Tailwind (no recharts dependency added)
- Added a top-categories horizontal bar visualization showing relative spend, limit status, and recurring breakdown
- All visuals follow the design ethos: warm rounded bars, muted tones, gentle status colours

**Preserved existing functionality:**
- All category rows, expandable drawers, expense history, recurring cost callouts, budget limit management, and settings integration remain intact on the Categories tab
- The household overview card, stats row, plain-English narrative, and needs-attention panel all remain on the Analytics tab

**Verification:**
- `npm run typecheck` passes after the full Budget rework

### Session 11 — 27 March 2026
Completed the app-wide date/time picker consistency pass from the enhancement backlog.

**Date picker unification:**
- Audited the renderer for all date entry surfaces and confirmed there are no remaining raw `<input type="date">` or `<input type="time">` controls anywhere in the app
- Refined the shared `DatePicker` to feel calmer and more native to Roost's design language: softer rounded trigger, clearer date label hierarchy, warmer popover treatment, and a more polished calendar grid
- Updated the shared calendar styling to better match the design ethos with softer navigation controls, roomier day cells, and gentler “today” / selected states

**Time picker unification:**
- Extracted the Apple-style drum time picker from Settings → Notifications into a reusable `components/ui/TimePicker.tsx`
- Kept the native-feeling hour/minute spinner interaction and warm visual treatment so future time-based features can reuse the same component without duplicating logic
- Notifications quiet hours now consume the shared `TimePicker` component rather than owning a one-off local implementation

**Verification:**
- Re-audited the renderer after the refactor to confirm all date/time entry points are covered by the shared components
- Ran `npm run typecheck` successfully after the refactor

### Session 10 — 27 March 2026
Pinboard replaced DishBoard and became a real shared household surface rather than a placeholder integration tab.

**Pinboard (new feature):**
- Replaced the DishBoard route/tab/page entirely with a new Pinboard page built to match the warm Roost design ethos
- Added `pinboard_notes` table (migration 0021) with realtime, RLS, expiry dates, optional app-link metadata, and per-home shared notes
- Added `usePinboard` hook + Zod schemas for fetching, creating, deleting, and live-syncing notes
- Pinboard UI reworked so the board itself is the primary focus; note creation moved into a modal composer behind an Add note button

**Pinboard usability improvements:**
- Added note targeting: notes can be for yourself, your partner, or everyone in the home
- Added optional notifications on note creation and wired pinboard notification preference into Settings → Notifications
- Added note acknowledgements / seen state (migration 0022): recipients can mark a note as seen, the board shows seen counts and "needs your eyes" state
- Added compact composer controls for recipient targeting, notify/silent mode, expiry, and note linking to app entities
- Refined composer styling: bordered writing surface, cleaner notification selector, calmer hierarchy

**Backend migrations:**
- `0021_pinboard_notes.sql` — base pinboard notes table + realtime + RLS
- `0022_pinboard_note_experience.sql` — target_scope, target_user_id, notify_on_create, acknowledgements table, and pinboard notifications trigger

**Release prep:**
- Version bumped to `v1.1.0` for a minor feature release (new user-facing functionality)

### Session 9 — 24 March 2026
Full smoke test completed and signed off. App fully operational. All bugs found during testing were fixed before sign-off.

**Calendar sync (full build):**
- Replaced one-time `.ics` export with a live `webcal://` subscription (Apple Calendar auto-refreshes ~hourly)
- Edge Function now stamps `calendar_last_fetched_at` on every GET — "Synced" state is derived solely from this server timestamp (within 3h window), not from client-side guess
- Supabase Realtime pushes `calendar_last_fetched_at` updates back to the app so status flips to Synced without polling
- Fixed Apple Calendar rejecting the subscription URL — root cause was Supabase requiring JWT auth by default; fixed with `supabase/config.toml` `verify_jwt = false` and `--no-verify-jwt` flag on deploy
- Fixed app showing "Synced" on reload when never actually synced — UI state was set optimistically when `openExternal()` returned; now only server truth counts
- Added pending state (amber pulsing dot, 60s timeout) and manual refresh button when synced
- Migration 0016: `calendar_last_fetched_at TIMESTAMPTZ` column on `homes`

**Settings — top bar cog:**
- Settings icon moved from profile dropdown into the top bar (next to notification bell and theme toggle)

**Settings — Account security:**
- New Security card in Account settings with Change Email and Change Password
- Both flows require `supabase.auth.reauthenticate()` OTP step-up before accepting changes — not just a client-side guard, enforced server-side via `updateUser({ nonce: otp })`
- Google OAuth users see a note explaining password controls don't apply

**Settings — Notifications page (new):**
- New tab in Settings for notification preferences
- Delivery section: In-app, macOS (live), iOS (coming soon badge)
- Content section: per-type toggles for chores, expenses, shopping, settlements
- Quiet hours: enable/disable with animated drum-scroll time picker replacing native `<input type="time">`
- `TimeUnit` component with directional slide animation via `AnimatePresence mode="popLayout"` + `useRef` for direction tracking
- All prefs saved instantly to `notification_preferences` Supabase table (migration 0017) with optimistic updates
- `useNotificationPreferences` hook (staleTime 5 min, upsert with rollback)
- `useNotifications` updated to gate macOS notifications on prefs + quiet hours (overnight range support)
- In-app notification filtering: returns `[]` if `in_app_enabled` false, else filters by type — unread badge and panel automatically correct
- Notification bell in top bar now animated out (spring) when `in_app_enabled` toggled off

**Settings — Profile preferences (rework):**
- Removed email notifications row (belongs on Notifications page)
- All preference selects now wired to real DB — previously dead `<select>` elements with no onChange
- Currency and Date format use Radix UI `Select` (fully themed, no macOS native dropdown)
- Added Week starts on (Monday/Sunday) with animated pill segment control — `layoutId` sliding background
- Added Time format (12h/24h) with same segment control
- New `user_preferences` Supabase table (migration 0018) with RLS; `useUserPreferences` hook with same optimistic-update pattern as notification prefs
- `SegmentControl` component uses `useId()` to ensure unique `layoutId` per instance

**Migrations applied:** 0016 (calendar_last_fetched_at), 0017 (notification_preferences), 0018 (user_preferences)

**Documents updated:** smoke-test-2026-03-23.md (completed + all bugs documented), NORTH_STAR.md Phase 3.5 smoke test marked complete, memory/project_roost.md updated.

---

### Session 8 — 22 March 2026
Polish sprint. Avatar system, full settings redesign, design ethos colour pass across all pages.

**MemberAvatar system:** New `MemberAvatar` component as single source of truth for all user avatars. 12-colour palette, 25 Lucide icon options, first-letter fallback. Sizes xs→xl, circle and square shapes. Used in TopBar, ActivityFeed, Profile, and Household settings. AppContext updated with `currentMember`, `partnerMember`, `userIcon`. **Pending:** DB migration — `alter table home_members add column if not exists avatar_icon text default null` (known issue #13).

**Settings pages redesign:** Profile (inline avatar picker — colour swatches + icon grid — saves to Supabase; inline name editing); Household (MemberAvatar throughout, animated copy buttons, AnimatePresence partner invite); Hazel (identity card + examples card + spring-animated toggles + privacy note); SettingsLayout (layoutId animated tab indicator, AnimatePresence page transitions); Account (inline animated confirmation flows for leave/delete, no `window.confirm()`).

**Dashboard:** Activity feed replaces "partner's tasks" as third top card. All three top cards fixed at `h-64`. Activity feed shows name + action + timestamp (no avatars). Balance card redesigned — direction pill badge, fade-up animation, outline button, no garish green.

**Colour system pass:** Expenses balance card gets progressive hue (success/destructive) based on who owes. Budget Remaining card gets 4-stage hue (<60% success → 60-80% faint warning → 80-100% warning → >100% destructive). Settlement history rows use on-brand muted. SettleUp modal redesigned with From→To transfer summary and animated confirmation. DishBoard page fully redesigned with AnimatedPage, staggered animations, and on-brand colours.

**TopBar + ActivityFeed:** Both wired to real data — no more mock data anywhere in the shell.

**Documents updated:** CONTEXT.md v1.3 → v1.5, NORTH_STAR.md Phase 2.5 and 3.5 updated.

---

### Session 7 — 22 March 2026
Phase 3 complete. Full Figma Make UI migrated into the Electron app and wired to Supabase.

**Figma Make migration (5 phases):**
- Phase 1 — Dependencies: upgraded Tailwind v3 → v4 (`@tailwindcss/vite` plugin), React Router v6 → v7, `framer-motion` → `motion`, added all missing Radix UI primitives and runtime packages
- Phase 2 — File copy: replaced `src/renderer/src/` with the complete Figma Make codebase. Preserved `types/database.types.ts`, `lib/supabase.ts`, `hooks/`
- Phase 3 — Electron fixes: `createBrowserRouter` → `createHashRouter`, all `react-router-dom` imports → `react-router`, created `RootLayout` to wrap AuthProvider/AppProvider/OnboardingProvider inside the router
- Phase 4 — Tailwind v4: CSS-based config via `theme.css`, emptied `postcss.config.js`, added `@tailwindcss/vite` to `electron.vite.config.ts`
- Phase 5 — Supabase wiring: rewrote `AppContext.tsx` from scratch as an adapter layer — real hooks (`useShoppingList`, `useExpenses`, `useSettlements`, `useChores`, `useRealCalendarEvents`, `useBudget`, `useActivityFeed`, `useNotifications`, `useHome`, `useAuthContext`) behind the Figma UI's interface. Added `memberName()` / `memberColor()` adapter functions using `avatar_color` from DB. Updated auth pages (Welcome, Join, Setup), settings pages (Account, Household, Profile), and AppShell auth guard.

**DB changes:** Migration 0009 — adds 'solo' to `expenses.split_type` check constraint (needs to be run in Supabase dashboard).

**Bugs fixed during migration:**
- `Cannot find module 'autoprefixer'` — emptied `postcss.config.js`
- `Can't resolve 'tw-animate-css'` — installed `tw-animate-css`
- `n.entity_type` → `n.type` in AppContext notifications mapping
- `memberColor` was generating colour from UUID charcode — fixed to use `avatar_color` column from DB
- `getInitials` duplicated locally — removed, import from `@/lib/utils`
- `AuthContext`/`useAuth` `react-router-dom` imports → `react-router`

**Documents updated:** FRONT_END_MIGRATION.md created (6-phase migration tracker), NORTH_STAR.md updated (Phase 1/2/3 marked complete, Phase 2.5 marked not started, Phase 3.5 added), CONTEXT.md updated to v1.3.

---

### Session 6 — 21 March 2026
Wrote Phase 2.5 and rewrote Phase 3. No code written this session — roadmap only.

**Phase 2.5 — Make It Deeper:** Added as a new phase between Phase 2 and Phase 3. Covers: Budgeting section (new page + `budgets` table), Dropdown date pickers (reusable `DatePicker` component), Dashboard build-out (summary cards, real-time, deep links), DishBoard integration tab (coming soon screen), Shopping list enhancements (next shop date, category grouping, quick-add), Chore improvements (overdue indicators, completion history, streaks), and Calendar page (full build from the existing plan). Technical tasks: budget migration, `DatePicker` component, `useCalendarEvents` hook, iCal Edge Function, `useBudget` hook, sidebar/router updates. Feature backlog updated with Phase 2.5 pointers.

**Phase 3 — Make It Beautiful (rewritten):** Restructured around a Figma-first design workflow. Thomas is new to Figma. Phase 3 is now a 10-step process: (1) Claude Code generates a comprehensive design brief for the Figma AI assistant; (2) Figma setup and Figma for VS Code extension install; (3) Design the visual language in Figma (colours, typography, spacing, components, all pages); (4) Design review and lock; (5) Extract design tokens into Tailwind config and CSS variables; (6) Implement the component library from Figma specs; (7) Apply to all pages; (8) Onboarding and first-run experience; (9) Accessibility and keyboard behaviour; (10) Dark mode and final visual QA side-by-side with the Figma file. Estimated 6–9 weeks.

---

Added Phase 2.5 to NORTH_STAR.md, sitting between Phase 2 (Make It Solid) and Phase 3 (Make It Beautiful). Phase 2.5 covers: Budgeting section (new page + `budgets` table migration), Dropdown calendar date pickers (reusable `DatePicker` component), Dashboard build-out (summary cards, deep links, real-time), DishBoard integration tab (coming soon screen), Shopping list enhancements (next shop date, category grouping, quick-add), Chore improvements (overdue indicators, completion history, streaks), and Calendar page (full build, promoting the existing calendar feature plan). Technical tasks defined: budget DB migration, `DatePicker` component, `useCalendarEvents` hook, Supabase Edge Function for iCal feed, dashboard data aggregation pattern, `useBudget` hook, and sidebar/router navigation updates. Feature backlog updated with Phase 2.5 pointers.

---

### Session 5 — 20 March 2026
Phase 2 architectural foundations: state management, validation hardening, Realtime architecture, and performance instrumentation.

**State management (Zustand):**
- Created `src/renderer/src/store/uiStore.ts` — singleton UI store for modal open/close states and settle-up dialog data
- Migrated `AddExpenseForm`, `AddChoreForm`, and `SettleUpDialog` off scattered `useState` onto the store
- Fixed notification bell toggle: moved click-outside detection to `TopBar` (parent of bell + panel); panel's own `mousedown` was intercepting the bell click before the toggle could fire

**Validation layer hardening:**
- Every `queryFn` now uses `z.array(schema).parse(data)` — bad DB data surfaces as a query error, not silent corruption
- Every mutation return value now uses `schema.parse(data)`
- Realtime handlers in `useNotifications` use `safeParse()` with error logging (bad payload doesn't crash the subscription)
- Added `setupFormSchema` to `lib/schemas/user.ts`; `Setup.tsx` now validates before any Supabase call
- Made `calendar_token` and `next_shop_date` optional in `homeSchema` — app degrades gracefully if migrations 0004/0006 haven't been applied

**Realtime architecture:**
- Created `src/renderer/src/lib/realtimeManager.ts` — centralised subscription manager with ref-counting, channel deduplication (key = `table:event:filter`), status tracking, and automatic reconnection on `window.online`
- Rewrote `useRealtime.ts` as a thin wrapper around `subscribe()` from the manager
- All 6 consuming hooks unchanged externally; channel leaks and ghost subscriptions eliminated

**Performance instrumentation:**
- Created `src/renderer/src/lib/perf.ts` — dev-only timing utility, no-op in production
- Marks: `renderer-start` (module init), `auth-ready` (AuthContext), `shell-visible` (AppShell), `page-data-ready` (useActivityFeed queryFn)
- `realtimeManager` logs per-table realtime latency for fresh INSERT events
- Summary prints to DevTools console once all report marks fire — **open DevTools and cold-launch the app to capture baseline numbers**

**To record the actual baseline:** Open DevTools console, cold-launch the app, look for the `━━ Roost Performance Baseline ━━` group. Record the four numbers (auth check, home data load, first page data, total) here:

```
Auth check:           ___ms
Home data load:       ___ms
First page data:      ___ms
Total (interactive):  ___ms
Realtime latency:     ___ms (observed from first realtime event)
```

**Bugs fixed:**
- Rules of Hooks violation in AppShell (`useEffect` placed after early `return null`) — moved before all guards
- `home === undefined` (Zod error state) not caught — added explicit guard in AppShell
- Blank screen caused by `useActivityFeed()` called in Dashboard.tsx while `ActivityFeed` child already calls it — all perf instrumentation moved out of component render paths

---

### Session 4 — 18 March 2026
Strategic roadmap review and strengthening. No code written in this session — document only.

**Motivation:** The foundation of the app was not wide or deep enough to support everything planned for Phases 3–6. Phase 2 as written was patching cracks rather than widening footings. Ten architectural gaps were identified and integrated into the roadmap.

**Changes made:**
- **Phase 2** — Narrative rewritten to reflect its dual job (fix real-world breaks + strengthen foundations). Added: local data persistence (merged with offline resilience), notification/event architecture (DB triggers for activity feed), state management strategy (Zustand decision), validation layer hardening, comprehensive Realtime architecture, performance baseline recording, database type auto-generation. Removed the weak "Review Zod schemas" item and replaced it with the full validation hardening task. Removed the `updated_at` trigger item (already done in v0.7). Time estimate increased from 2–3 weeks to 4–6 weeks. DoD updated to reflect the new infrastructure work.
- **Phase 3** — Narrative rewritten to lead with the design system. Added: full design system (colour, type, spacing, component variants, animation standards) as an explicit prerequisite for all other Phase 3 work. Expanded "Keyboard shortcuts" to "Keyboard navigation and shortcuts" (full Tab navigation + focus management, not just hotkeys). Added accessibility (ARIA labels, contrast, focus management). Significantly expanded onboarding to cover both first-run flow and empty states for every feature. Time estimate increased from 3–4 weeks to 5–7 weeks. DoD updated.
- **Technical Debt section** — Marked `updated_at` trigger and `useRealtime` callback stability as resolved. Updated activity feed note to reflect app-layer writes are done but DB triggers are the Phase 2 upgrade path.

### Session 3 — 18 March 2026
- Built Google OAuth login via Electron deep links (`roost://` custom URL scheme)
- Added `/setup` page for post-OAuth onboarding (display name + create/join home)
- Rebuilt Settings page with profile, inline name editing, invite deep link, members, sign out
- Fixed critical invite code bug: new users couldn't look up homes by invite code due to RLS (fixed with `get_home_by_invite_code` security definer function)
- Added `home_members` to Supabase Realtime publication — members list now updates live
- Added `set_updated_at` trigger on `shopping_items` via migration 0002
- Added `home_members` realtime subscription to `useHome` hook
- **Status:** All Phase 1 features built. Auth flow (email + Google) complete. Join flow fixed. Settings working. Phase 1 definition of done pending real two-person test.

### Session 2 — 16 March 2026
- Fixed missing `postcss.config.js` — Tailwind was never running, app was completely unstyled
- Applied dark theme throughout: near-black background, violet accent, dark scrollbar
- Polished Login, Signup, Dashboard, Shopping, Expenses, Chores, Calendar pages
- Installed Framer Motion and created `lib/animations.ts` with reusable variants
- Page transitions: fade + slide on all route changes via AnimatePresence in AppShell
- Shopping list: items animate in (slide from left) and out (slide right) with stagger on load
- Activity feed: new entries animate in with card scale variant
- Fixed `useShoppingList`: `useCallback` on invalidate callback, refactored `ItemRow` to receive mutations as props (was creating one realtime subscription per list item)
- Shopping list confirmed working: add, check off, delete all functional
- **Status:** Shopping list working. Animations live. Auth stable. Real-time sync untested (needs second account).

### Session 1 — 16 March 2026
- Scaffolded full Electron + React + TypeScript + Supabase project from scratch
- Set up electron-vite, Tailwind CSS, shadcn/ui components, TanStack Query v5
- Created complete database schema with 7 tables and full RLS policies
- Created all Zod schemas, database types, hooks, pages, and layout components
- Fixed TypeScript errors: @vitejs/plugin-react version, supabase-js Database type format, useRealtime types
- Fixed SQL migration: moved `get_user_home_id()` function after table definitions
- Fixed RLS policies: added missing INSERT policies for `homes` and `home_members`
- Linked real Supabase project, confirmed app opens and runs
- **Status:** Foundation complete (Phase 0 done). Auth flow in progress — hitting RLS issues being resolved. No features functional yet.
