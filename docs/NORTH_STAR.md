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

- [ ] **Dropdown calendar date pickers (all date inputs)** — Every place in the app where a date is entered — adding a chore with a due date, setting the next shop date, logging an expense date — should use a native-feeling popover calendar picker rather than a plain text input or the browser's default date widget. The picker should open below the input field, show a month grid with prev/next navigation, highlight today, and close on selection or outside click. This should be a single reusable `<DatePicker>` component built on Radix UI Popover (already installed) with full keyboard support: arrow keys navigate days, Enter selects, Escape closes. This is a quality-of-life improvement that touches chores, expenses, shopping (next shop date), and any future feature that takes a date.

- [x] **Dashboard build-out** — The Dashboard is currently a placeholder. It should become the true home screen: a single view where a couple can see everything that matters without navigating away. The layout is a grid of summary cards, each deep-linking to its full section. Cards to include: **Shopping** (count of unchecked items + the last 3 items added), **Chores** (overdue count + the next due chore), **Expenses** (current balance — who owes whom and how much), **Budget** (current month spend vs. limit, colour-coded), **Activity Feed** (the 5 most recent events, with avatars), and **Next Shop Date** (prominently displayed with a countdown: "Shopping in 3 days"). The dashboard is read-only — it surfaces information, it does not replace the dedicated section pages. It should update in real-time: when your partner checks off a shopping item, the dashboard card count drops immediately.

- [x] **DishBoard integration tab (coming soon)** — Add a new tab to the sidebar labelled "DishBoard" with an appropriate icon (e.g. a chef's hat or fork/knife). The tab contains a polished "coming soon" screen that explains what the integration will do: when a meal is planned in DishBoard (Thomas's recipe and meal planning app), its ingredients are pushed automatically to the Roost shopping list. The screen should feel intentional — not an empty placeholder, but a preview with a short description, a visual mockup or icon treatment, and a note that this is in development. This tab establishes the integration as a first-class feature in the app's navigation from day one, so it does not feel bolted on later.

- [ ] **Shopping list enhancements** — Build out the shopping section beyond the basics. Features to add: (1) **Next shop date** — a date input at the top of the shopping list page that saves to `homes.next_shop_date` and shows a visible countdown ("Shopping in 3 days / tomorrow / today"). This already has a database column from migration 0006. (2) **Category grouping** — when items have a category assigned, group them under collapsible headers (Produce, Dairy, Bakery, etc.) so the list is easier to navigate in-store. Ungrouped items fall under "Other". (3) **Quick-add from keyboard** — pressing Enter after typing an item name immediately submits and refocuses the input, allowing rapid successive additions without reaching for the mouse.

- [ ] **Chore improvements** — Flesh out the chores section to make it genuinely useful for a couple managing a home. Features to add: (1) **Completion history** — a simple log of recent completions ("Tom completed 'Clean bathroom' · 2 days ago") visible in the chore detail or as a subtle history row. (2) **Overdue indicator** — chores past their due date are visually flagged (a red date label) and sorted to the top of the list. (3) **Chore streaks** — for recurring chores, show a small streak counter ("✓ 4 weeks in a row") as a light motivational touch. This requires tracking completion timestamps, which are already stored in `last_completed_at`. (4) **Unassigned chores view** — a visual indicator that a chore has no assignee, prompting someone to pick it up.

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
- [x] **Chore improvements** — (1) Overdue indicator — chores past due date sorted to the top with a red date label (already partially in place). (2) Completion history — a subtle log of recent completions visible in the chore list ("Tom · 2 days ago"). (3) Streaks — for recurring chores, show a small streak counter ("✓ 4 weeks in a row") using `last_completed_at`. (4) Unassigned chores — visual indicator when a chore has no assignee.
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

### 🍎 Phase 5 — Mac App Store
*Everything required to submit to the Mac App Store.*

Be honest: this is the most technically complex phase, and it has nothing to do with features. Mac App Store distribution requires code signing with an Apple Developer account, notarisation, App Sandbox compliance, App Store Connect metadata, and passing Apple's app review. Each of these has real complexity. Budget time and patience.

**What's required:**

- [ ] **Apple Developer Program** — $99/year. Required. Sign up at developer.apple.com.
- [ ] **App Sandbox** — Mac App Store apps must run in the sandbox. This restricts what the app can access (filesystem, network, etc.). Will likely break things — audit and fix.
- [ ] **Code signing** — Sign with a Mac App Distribution certificate. Every build must be signed.
- [ ] **Notarisation** — Even outside the App Store, Apple requires notarisation for apps distributed on macOS 10.15+. For the App Store this is handled by Apple.
- [ ] **Hardened Runtime** — Required for notarisation. Review entitlements.
- [ ] **App Store Connect setup** — App name, description, keywords, category, age rating, support URL, privacy policy URL
- [ ] **Screenshots** — Required sizes: 1280×800 or 1440×900 for Mac. Minimum 3, maximum 10.
- [ ] **App icon** — Proper icon set at all required sizes (16, 32, 64, 128, 256, 512, 1024px). Currently a placeholder.
- [ ] **Privacy manifest** — Apple now requires a privacy manifest file declaring what data the app collects
- [ ] **App review preparation** — Ensure the app works with a demo account that Apple's review team can use. Write clear review notes.
- [ ] **Pricing** — Free, freemium, or paid. Decide before submission.

**Honest note:** Apple's review can reject for unexpected reasons. Plan for at least one rejection cycle and the 1–2 week turnaround it involves. The sandbox restrictions in particular may require rethinking how certain features work. This phase is not quick.

**Estimated time:** 4–8 weeks (heavily dependent on Apple review cycles)

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
- Shopping list with real-time sync
- Expense splitting with running balance
- Chores with assignments and due dates
- Activity feed (live log of household events)
- Auth: signup, login, invite/join flow
- Settings: invite code, member list, display name
- Push notifications when your partner makes a change

### Enhancement — Makes the experience meaningfully better
- Dark mode (system-aware)
- Chore recurrence (weekly, monthly)
- Custom expense splits (not just equal)
- Settle up flow for expenses
- Calendar with shared events and bill due dates → **Phase 2.5**
- Bill reminders — notification X days before a due date
- Shared notes / pinboard — a freeform shared space for anything
- Search across all content
- Keyboard shortcuts throughout
- Command palette (`Cmd+K`)
- macOS menu bar widget — quick add item without opening the full app
- Auto-update (electron-updater)
- Grocery budget — set a weekly budget, track spend against it → **Phase 2.5**
- Dropdown date pickers throughout → **Phase 2.5**
- Dashboard build-out → **Phase 2.5**
- Shopping list: category grouping, next shop date, quick-add keyboard flow → **Phase 2.5**
- Chore overdue indicators, completion history, streaks → **Phase 2.5**

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
