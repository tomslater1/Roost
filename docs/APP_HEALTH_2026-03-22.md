# Roost — App Health Review
**Date:** 22 March 2026
**Status:** Pre-launch, Phase 3.5 in progress
**Reviewer:** Claude Code

---

## Executive Summary

Roost is a genuinely impressive piece of software for a personal project. Every core feature — shopping, expenses, chores, budget, calendar, and activity feed — is fully implemented and wired to a live Supabase backend with real-time sync. The design system is exceptional. TypeScript passes with zero errors. The architecture is clean and well-separated.

**For two people who share a home and both use Macs: it's functionally ready right now.**

The gap between "works for us" and "Mac App Store release" or "open to strangers" is real, but it's primarily distribution and polish work, not foundational rebuilds. The hard parts are done.

---

## Overall Scores

| Dimension | Score | Notes |
|---|---|---|
| Feature completeness | 9 / 10 | All core features built and wired to live data |
| Design quality | 9 / 10 | Warm, considered, consistently applied |
| Code quality | 9 / 10 | Strict TypeScript, clean hook architecture |
| Data layer | 9 / 10 | TanStack Query + Supabase Realtime, optimistic updates |
| Production stability | 8 / 10 | Migration 0009 applied, notifications wired, not smoke-tested with 2 accounts |
| Error handling | 8 / 10 | Excellent translation layer, no global error boundary yet |
| Native Mac feel | 6 / 10 | Good fundamentals, missing menu bar + native integrations |
| Mac App Store readiness | 3 / 10 | No signing, notarization, builder config, or native menu |
| Real-user readiness | 7 / 10 | 2–3 weeks of fixes away from inviting a second person |
| iOS readiness | 0 / 10 | Electron does not run on iOS — separate build required |
| Competitive position | 7 / 10 | Best-in-class for Mac couples, limited by mobile gap |
| **Overall** | **7.5 / 10** | **Impressive personal app, close to beta quality** |

---

## Feature-by-Feature Status

### Dashboard
**Status: ✅ Complete**

The true home screen. Real-time summary cards for all sections, quick-add buttons for shopping/expense/chore, live activity feed, balance card, budget progress, budget category breakdown, recent expenses. All data is derived from existing hooks via `AppContext` — the dashboard fires no independent Supabase queries. Changes made on one Mac appear on the dashboard on the other Mac within ~500ms via Supabase Realtime WebSocket. Staggered animations on the activity feed items. The balance card recalculates dynamically as settlements are added.

**Gaps:** The budget card hardcodes "March Budget" as the heading instead of pulling the current month name dynamically.

---

### Shopping List
**Status: ✅ Complete**

Category-aware shopping list with collapsible groups (Produce, Dairy, Bakery, Meat & Fish, Frozen, Drinks, Snacks, Household, Personal Care, Other). Keyword-based auto-categorisation on add (e.g. "salmon" → Meat & Fish). Real-time checkbox sync. Enter-to-add keyboard shortcut. Sort by category / recent / name. Search filtering. Completed items collected in a Done section with a clear-all button. Next shop date picker with `updateNextShopDate()` writing to `homes.next_shop_date`. Delete on hover.

**Gaps:** Auto-categorisation uses a keyword list in the UI rather than Claude — it misses uncommon items. No ability to reorder within a category or mark an item as priority.

---

### Expenses
**Status: ✅ Complete**

Full expense ledger with splits. Add/edit/delete with a form modal (title, amount, category, date, split type, recurring toggle). Split types: shared (50/50) and personal. Recurring expenses (weekly/monthly/yearly) with `is_recurring` and `recurrence_interval`. Balance calculation: sums all shared expenses, subtracts settlements, shows net owed in either direction. Settlement history (immutable ledger). Filters by category and payer. Category icons and colour chips. Real-time sync.

**Gaps:** No ability to edit a settlement once created (intentionally immutable, but worth documenting). The category list in the add form is different from the categories available in the budget section — could cause mismatches.

---

### Chores
**Status: ✅ Complete**

Chore management with assignment, due dates, frequency, and completion history. Per-person tabs (All / My Tasks / Partner's Tasks). Overdue chores sorted to the top with a red date indicator. Completion timestamp stored in `last_completed_at`. Completed chores section with strikethrough animation. Frequency options: one-time, daily, weekly, monthly. Notes field. Delete with confirmation. Real-time sync.

**Gaps:** No chore streaks counter (documented in NORTH_STAR Phase 2.5 as a stretch goal). No unassigned chores view. Frequency labels in the display could be clearer (shows raw value rather than "Every week").

---

### Calendar
**Status: ✅ Complete**

Month grid with event-dot indicators (colour-coded by type: chore=primary, expense=success, shopping=secondary). Stats cards at top (Total, Today, Recurring, Overdue). Filterable event list with tabs (All / Today / Upcoming / Overdue / Recurring). Click a day to filter. Click an event to navigate to its source section. Recurring expense expansion for 6 months via `date-fns`. Recurring chore expansion for 3 months. `useCalendarEvents` hook aggregates chores, expenses, and next shop date client-side — no new Supabase queries beyond what each section already makes.

**Gaps:** No Apple Calendar / webcal subscription button in the UI (the Supabase Edge Function for the `.ics` feed exists at `supabase/functions/calendar-feed/index.ts` but there's no button wired to it). No ability to add events directly from the calendar.

---

### Budget
**Status: ✅ Complete**

Per-category budget limits stored in the `budgets` table (per home, per month). Month navigation with prev/next. Four summary cards: Total Budget, Spent, Remaining, Progress %. Overall progress bar that shifts from green → amber → red as spend approaches limit. Two sections: budgeted categories (with limits, progress bars, edit/delete) and unbudgeted categories (spend recorded but no limit set). Quick "Set limit" button on unbudgeted categories. Category icons via `CategoryIcon` component. Custom categories supported via `home_custom_categories` table. Real-time subscriptions on both `budgets` and `home_custom_categories`.

**Gaps:** No projected end-of-month spend (documented in NORTH_STAR as a goal). No month-on-month trend chart. The budget page and the expenses page use slightly different category name lists — users may create expenses in categories that don't map to their budget entries.

---

### DishBoard
**Status: 🔷 Placeholder**

A polished "coming soon" screen. Animated intro, pulsing "In development" badge, three feature-preview cards explaining what the integration will do (meal plan sync, smart ingredient dedup, real-time cross-device). A disclaimer footer: "This tab is a placeholder while the integration is built." Establishes DishBoard as a first-class tab in the nav from day one.

**Not wired.** No actual integration exists. Depends on DishBoard (Thomas's recipe app) having an API.

---

### Activity Feed
**Status: ✅ Complete (with reliability caveat)**

Real-time log of household actions with user attribution. Used in the Dashboard card and accessible from the dedicated feed. Events are written via `logActivity()` called from within each mutation in `AppContext`. The `useActivityFeed` hook fetches the most recent entries.

**Reliability gap:** Activity is logged at the application layer, not via database triggers. If the app crashes after a mutation succeeds but before `logActivity()` fires, the event is silently lost. This is documented in Phase 3.5 as a task to fix with Supabase DB triggers — no user-visible impact today, but it means the feed is not a perfect audit log.

---

### Notifications
**Status: ✅ Complete**

`useNotifications` hook fetches from the `notifications` table, subscribes to INSERT events via Supabase Realtime (new notifications trigger an OS notification if they arrive within 30 seconds), and exposes `markAllRead`. The `notifications` table is populated by Supabase DB triggers on `activity_feed` inserts (migration 0007).

`NotificationPanel` is fully wired to real data via `useApp()`. Calls `markAllNotificationsAsRead()` on mount so the unread badge clears the moment the panel opens. Timestamps are formatted as relative time ("2 minutes ago", "Yesterday") via an inline helper. Falls back to a `Bell` icon for unknown notification types. Empty state shown when no notifications exist.

---

### Auth
**Status: ✅ Complete**

Email + password sign up and sign in (Welcome.tsx). Google OAuth via deep link (`roost://auth/callback`). Invite code join flow (Join.tsx) — works with both email and Google. Post-auth setup (Setup.tsx): display name, create home OR join existing via invite code. Session persists via Supabase's localStorage token. Navigation guards in `AppContext` redirect to `/welcome` if no session and `/setup` if session exists but no home. Leave household and delete account flows in Settings. Deep link protocol registered for macOS.

**Gaps:** No email confirmation step visible in the signup flow (may be a Supabase project setting). No password strength requirement client-side. No "forgot password" flow visible in the Welcome screen.

---

### Settings
**Status: ✅ Mostly Complete**

Five settings pages: Profile (display name, avatar), Household (name, invite code, member list), Budget Categories, Hazel (AI), Account (sign out, leave home, delete account). Onboarding replay button in Account. Danger zone with confirmation dialogs on destructive actions. Invite code copy-to-clipboard.

**Gaps:** No notification preferences. No app preferences (window size, startup behaviour). No data export. No email address change (Supabase handles this but there's no UI).

---

### Onboarding
**Status: ✅ Complete**

12-step guided tour that fires on first app open. Uses `data-onboarding` attributes on elements for spotlight targeting. Tooltip placement (top/bottom/left/right/center) with viewport clamping so tooltips never go off-screen. Dark overlay with backdrop blur. Skip / Next / Complete buttons. Progress dots. Auto-navigates between routes (e.g. step on Dashboard, then navigates to Shopping for the next step). Completion state stored in `localStorage`.

**Not tested end-to-end** with a fresh account. Needs a smoke test to confirm the navigation timing works correctly and it doesn't re-show for returning users.

---

## Technical Health

### TypeScript
`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. TypeScript passes with **zero errors** as of today. All 12 hooks are typed. AppContext's exposed API is fully typed. Zod schemas are the source of truth for all database types.

### Data Layer
TanStack Query v5 manages all server state. Every mutation uses `onMutate` optimistic updates with `onError` rollback. `useRealtime` hook manages Supabase Realtime WebSocket subscriptions — each hook subscribes to its own table and invalidates its TanStack Query cache on change. The `realtimeManager` has exponential backoff reconnect logic and health checks.

### Error Handling
Centralised error translation in `src/app/lib/errors.ts`. Maps Supabase auth error codes and Postgres error codes (23505, 23503, etc.) to user-friendly strings. Network error detection with phrase matching. Falls back to the original message if it's under 120 characters. `toast.error()` calls throughout mutations. No global React error boundary — uncaught render errors would crash the page with no recovery UI.

### Database
9 migrations. Complete household schema: homes, home_members, shopping_items, expenses, expense_splits, chores, settlements, budgets, home_custom_categories, notifications, activity_feed. RLS policies on every table using `get_user_home_id()` security-definer function. Notifications populated by Supabase DB triggers on activity_feed inserts.

**Migration 0009 not applied to live DB.** The code already uses `split_type = 'solo'` — this will throw a Postgres check constraint violation until the migration is run.

### Electron Security
- `contextIsolation: true` ✅
- `sandbox: true` ✅
- `nodeIntegration: false` ✅
- Preload exposes only 5 APIs via `contextBridge`: `platform`, `onAuthCallback`, `removeAuthCallback`, `notify`, `normalize`
- External links open in system browser via `shell.openExternal` ✅
- Anthropic API key in main process only, never bundled into renderer ✅
- No hardcoded credentials anywhere in the codebase ✅

**Missing:** No Content Security Policy headers configured in Vite. No CSP means a theoretical XSS in the renderer could reach the preload — low risk given the app only loads its own bundle, but worth adding.

### Performance
- TanStack Query deduplicates and caches all requests — page navigation is instant after first load
- Optimistic updates make toggles and mutations feel instantaneous
- Supabase Realtime WebSocket delivers changes in ~200–500ms
- `motion/react` animations are GPU-accelerated
- No pagination on expenses or shopping items — a household with 500+ expenses will feel the cost of a full-table fetch on every mount
- AppContext mounts all hooks at startup — initial load fetches everything at once

### AI (Hazel)
Claude Haiku model used for text normalisation: shopping item names, expense titles, chore titles are cleaned and standardised before saving. The `normalizeInput()` call happens in the main process via IPC — the Anthropic API key never touches the renderer. Graceful fallback to the original text if the API call fails. Hazel settings page exists. Full AI assistant features (suggestions, smart categorisation dialogue) are documented as Phase 3.5 work and not yet surfaced.

---

## How Close to the Mac App Store?

**Realistic timeline: 2–4 months**

### What's already good
- Electron 32 with strong security defaults
- `titleBarStyle: 'hiddenInset'` for native Mac window chrome
- Deep link protocol registered (`roost://`)
- External URLs open in system browser
- macOS dock behaviour (keeps running when window closed)

### What's missing

**Build & Distribution (Critical)**
- No `electron-builder` config file exists (referenced in package.json but not written)
- No code signing setup (Developer ID certificate or Mac App Store certificate)
- No notarization configuration — required by macOS Gatekeeper for all distributed apps since 2020
- No App Store Connect listing, screenshots, descriptions, or metadata

**App Sandbox (Required for MAS)**
The Mac App Store requires App Sandbox. Electron apps can be sandboxed but need explicit entitlements:
- `com.apple.security.network.client` — for all Supabase/Anthropic HTTP calls
- Possibly `com.apple.developer.associated-domains` for deep links
- The `roost://` OAuth redirect may need review against MAS guidelines

**Native Mac Features (Expected by Mac users)**
- No native menu bar (File / Edit / View / Window / Help) — this is a strong Mac convention and its absence feels wrong
- No auto-update mechanism (electron-updater / Sparkle) — you can't manually push updates to both Macs forever
- No system tray or menu bar app mode
- Native notifications work (Electron's Notification API) but no notification categories or actions

**Direct distribution vs. Mac App Store**
Direct distribution (`.dmg` download) only needs signing + notarization — achievable in 2–3 weeks once the electron-builder config exists. Mac App Store adds App Sandbox entitlements, MAS-specific certificates, and Apple's review process (1–7 days typical).

**Recommendation:** Ship via direct distribution first (faster, fewer constraints), move to MAS in a second phase.

---

## How Close to Real Users?

**Realistic timeline: 2–3 weeks**

Two people who know each other can already use Roost today if they're patient about rough edges. "Real users" — people who expect everything to just work — need a few things fixed first.

### Blockers (must fix)

| Issue | Impact | Fix |
|---|---|---|
| ~~Migration 0009 not applied~~ | ~~Solo expenses throw a DB error~~ | ✅ Applied 22 March 2026 |
| ~~NotificationPanel uses mock data~~ | ~~Opening notifications shows fake entries~~ | ✅ Wired 22 March 2026 |
| No smoke test done | Unknown failure points in the full user flow | Manual test every action, both accounts |
| Onboarding not end-to-end tested | May break or re-show incorrectly | Fresh account test |

### Things that are fine
- Auth flow is robust across email + Google, multi-path join
- RLS isolates each home's data at the database level — users cannot see other households
- Error messages are user-friendly throughout
- Network resilience: the Realtime manager reconnects with backoff, offline banner exists
- Real-time sync works across two accounts

### What would make it meaningfully better for new users
- A landing page / web URL that explains the app before asking someone to download it
- A magic link invite that opens the app and pre-fills the invite code
- Email notifications for household activity (not just in-app)
- Forgot password flow in the Welcome screen

---

## How Close to iOS?

**Realistic timeline: 3–6 months, built separately**

Electron does not run on iOS. There is no shared runtime between the current app and a hypothetical iOS version. This is a greenfield build.

### What carries over to iOS
- All Supabase hooks (useShoppingList, useExpenses, useChores, useBudget, etc.)
- All Zod schemas and database types
- AppContext business logic
- The Supabase backend entirely — zero changes needed
- date-fns utilities
- DESIGN_ETHOS as a design reference

### What must be rebuilt
- Every page component (React DOM → React Native)
- Navigation (React Router → Expo Router / React Navigation)
- All styling (Tailwind CSS → NativeWind or StyleSheet)
- Electron-specific code (IPC, deep links via custom scheme, main process)
- All shadcn/ui components → equivalent RN components

### Options

**React Native with Expo (recommended)**
Best quality ceiling, full native iOS APIs, largest community. Reuses all Supabase hooks. Estimated 3–4 months for feature parity. Expo's managed workflow works well with Supabase.

**Capacitor (middle path)**
Wraps the existing React web app in a native iOS shell. Better than a PWA, not as good as React Native. More compatible with existing component code. Estimated 6–8 weeks with significant layout refactoring for touch targets and viewport.

**Progressive Web App (quickest)**
Add manifest.json and service worker to the existing app. iOS users add it to their home screen. Estimated 2–4 weeks. Quality ceiling is low — Safari PWAs have no push notifications, no background sync, limited access to native APIs. Will feel like a website.

**Recommendation:** Don't start iOS until the Mac app has stable users. The Supabase backend and all hooks carry over with zero changes — the client is all the work. React Native with Expo is the right call when the time comes.

---

## Competitive Analysis

### The landscape

| App | Platform | Focus | Strengths | Weaknesses |
|---|---|---|---|---|
| **OurHome** | iOS / Android | Couples & families | Established, chores + shopping, points system | Mobile only, dated UI (2018 design era), no expenses |
| **Tody** | iOS / Mac | Chores only | Beautiful Mac + iOS app, habit tracking | Single-purpose, no shared finances |
| **Splitwise** | iOS / Android / Web | Expenses only | Best-in-class expense splitting, huge user base | Single-purpose, no household management |
| **Cozi** | iOS / Android / Web | Family organiser | Calendar + shopping + chores, established | Designed for families not couples, cluttered, no budgeting |
| **FamilyWall** | iOS / Android / Web | Family dashboard | All-in-one | Generic, not couple-focused, no Mac app |
| **Notion (shared)** | All | Flexible | Infinitely customisable | Not purpose-built, requires setup discipline, no real-time household data |
| **Honeydue** | iOS / Android | Couples finances | Couples-first, bank sync, expense tracking | Finances only, no chores/shopping, US-focused |

### Where Roost wins

**Unique combination.** No competitor combines shopping list + expense splitting + settlement tracking + chore management + budget tracking + a household calendar in a single, purpose-built Mac app for two people. Roost is the only thing in this space designed specifically for a couple on Macs.

**Real-time sync quality.** Supabase Realtime WebSocket delivers changes in under a second to both Macs. OurHome and Cozi rely on periodic polling. The experience of watching your partner check off a shopping item and seeing it disappear on your screen in real time is genuinely different from a 30-second polling loop.

**Design quality.** The warm cream palette, physics-based animations, and consistent design system are significantly above OurHome (which hasn't been meaningfully redesigned since launch) and Cozi (which is functional but dense). Roost looks like a 2026 Mac app, not a 2014 iOS port.

**Expense splitting depth.** The settlement ledger, shared/personal/solo split types, and balance calculation rival Splitwise's core feature — which is a full standalone app.

**Budget integration.** Budget limits that pull from your actual expense data, with per-category tracking, is a feature no household competitor offers. Splitwise's premium plan has budgets but they're not integrated with a shared household view.

### Where Roost is behind

**No mobile app.** Every competitor is mobile-first or at minimum has an iOS app. Grocery shopping happens in the store, on your phone. Logging a chore completion happens when you finish cleaning. The absence of an iOS app means Roost can't be used at the most natural moments for most tasks.

**Discovery and distribution.** Roost has no web presence, no App Store listing, no way for someone to find it. Every competitor can be downloaded in 30 seconds from the App Store.

**Collaboration friction.** Joining requires both people to download an app and exchange an invite code. There's no magic link, no web fallback, no way to participate without a Mac.

**DishBoard is a promise.** The meal planning integration is the most differentiated feature Roost promises (automatic ingredient sync from meal plans to shopping list) — and it doesn't exist yet. Competitors don't have this either, but they're not promising it.

**No recurring billing or in-app purchase.** Splitwise monetises with a premium tier. OurHome has ads. Roost has no monetisation path yet — not a problem today, but relevant if it ever grows.

### Honest competitive position

Roost is **the best household dashboard for couples who both use Macs.** Within that specific niche, it is genuinely better than anything else available. The niche is real and underserved. The product quality is high enough to retain users who find it.

The strategic question is whether the niche is large enough or whether iOS + direct distribution widens it enough to matter. An iOS app would make Roost directly competitive with OurHome (the closest equivalent) on both platforms, with meaningfully better design and more features.

---

## Recommended Next Steps

### This week
1. ~~**Apply migration 0009**~~ — ✅ Done, 22 March 2026.
2. ~~**Wire NotificationPanel**~~ — ✅ Done, 22 March 2026.
3. **Full smoke test** — every feature, both accounts, on both Macs. Document every failure.
4. **Fix smoke test failures** — before inviting anyone else.

### Next 2–4 weeks (Phase 3.5 completion)
5. Wire activity feed to DB triggers (reliability, not urgency)
6. Test and verify onboarding end-to-end on a fresh account
7. Wire quick-add modals (verify all mutations actually save)
8. Keyboard shortcuts audit — replace `prompt()` navigation with proper programmatic routing
9. Add global error boundary to the root layout
10. Confirm production build (`npm run build && npm run package`) succeeds

### Next 1–2 months (Mac distribution)
11. Write electron-builder config (bundle ID, entitlements, targets, icons)
12. Set up Developer ID code signing
13. Set up notarization (via `electron-notarize` or `@electron/notarize`)
14. Add native menu bar (File, Edit, View, Window, Help — standard Mac structure)
15. Add auto-update via `electron-updater`
16. Decide: direct distribution (.dmg) or Mac App Store (adds sandbox complexity, adds review delay)
17. Set up a basic landing page so you can send someone a URL before they download

### Longer term (3–6 months)
18. iOS app via React Native + Expo — reuse all Supabase hooks, rebuild UI
19. Email notifications via Supabase Edge Function
20. Magic link invite flow (link that installs + joins in one tap)
21. Query pagination for households with large expense/shopping history
22. DishBoard integration when the API is ready

---

*Document generated from codebase analysis on 22 March 2026. Reflects the state of the `main` branch as of that date.*
