# Roost Frontend Migration

Migrating the Figma Make UI (`roost/`) into the Electron app (`src/renderer/src/`).

**Status key:** ✅ Done · 🔄 In progress · ⬜ Not started

---

## Phase 1 — Dependencies ✅ DONE

Align the Electron app's packages with what the Figma Make frontend requires.

### Remove
- `framer-motion` → replaced by `motion` (same library, new package name)
- `react-router-dom` v6 → replaced by `react-router` v7
- `tailwindcss-animate` → absorbed into Tailwind v4
- `autoprefixer` → not needed with Tailwind v4

### Add (runtime)
- `motion@12.23.24` — animation library used throughout Figma UI
- `react-router@7.13.0` — v7 Data mode used in `routes.tsx`
- `canvas-confetti@1.9.4` — settle up celebration
- `react-day-picker@8.10.1` — date picker in modals
- `next-themes@0.4.6` — theme persistence
- `recharts@2.15.2` — charts in Budget page
- Missing Radix UI primitives (accordion, alert-dialog, avatar, badge,
  calendar, collapsible, hover-card, menubar, navigation-menu, progress,
  radio-group, scroll-area, slider, switch, tabs, toggle, toggle-group)

### Add (dev)
- `tailwindcss@4.x` — upgrade from v3
- `@tailwindcss/vite` — Tailwind v4 uses a Vite plugin, not PostCSS

---

## Phase 2 — Copy Figma Make source files ✅ DONE

Replace the scaffolded renderer UI with the complete Figma Make codebase.

### Steps
1. Delete `src/renderer/src/` contents (keep `types/` and `lib/supabase.ts`)
2. Copy `roost/src/app/` → `src/renderer/src/app/`
3. Copy `roost/src/styles/` → `src/renderer/src/styles/`
4. Copy `roost/src/main.tsx` → `src/renderer/src/main.tsx`
5. Update `src/renderer/src/main.tsx` to import from the new style paths
6. Update `src/renderer/index.html` if needed

### What to preserve from the old renderer
- `src/renderer/src/types/database.types.ts` — Supabase generated types
- `src/renderer/src/lib/supabase.ts` — Supabase client
- `src/renderer/src/hooks/` — Supabase realtime hook

---

## Phase 3 — Fix Electron-specific issues ✅ DONE

Electron doesn't have a real browser URL bar, so `createBrowserRouter` won't work.

### Steps
1. Open `src/renderer/src/app/routes.tsx`
2. Change `createBrowserRouter` → `createHashRouter`
   - Import from `react-router` (not `react-router-dom`)
3. Verify all `<Link>` and `<NavLink>` imports come from `react-router`
4. Run `npm run dev` and confirm navigation works

---

## Phase 4 — Upgrade Tailwind v3 → v4 ✅ DONE (completed during Phase 2)

Tailwind v4 uses a CSS-based config instead of `tailwind.config.ts`. The Figma
Make theme system (`theme.css`) is already written for v4.

### Steps
1. Delete `tailwind.config.ts` (v3 config, no longer used)
2. Delete `postcss.config.js` (PostCSS not needed with Tailwind v4 + Vite plugin)
3. Update `electron.vite.config.ts` — add `@tailwindcss/vite` plugin to renderer config
4. Copy `roost/src/styles/theme.css` into the renderer styles (done in Phase 2)
5. Ensure `src/renderer/src/styles/index.css` imports:
   ```css
   @import "tailwindcss";
   @import "./theme.css";
   @import "./fonts.css";
   ```
6. Run `npm run dev` — confirm warm cream theme renders correctly

---

## Phase 5 — Wire up Supabase ✅ DONE

Replace the mock data in `AppContext.tsx` with real Supabase queries. This is the
biggest phase and will be done feature by feature.

### Order of operations
1. **Auth** — replace Welcome/Join/Setup mock flows with real Supabase Auth (Google OAuth + email)
2. **Shopping** — replace mock shopping items with `useQuery` + `useMutation` against `shopping_items` table
3. **Expenses** — wire expenses and settlements to `expenses` / `settlements` tables
4. **Chores** — wire chores to `chores` table
5. **Calendar** — wire calendar events to `calendar_events` table
6. **Budget** — wire budget categories to `budget_categories` table
7. **Realtime** — add `useRealtime` hook to each feature so changes sync live between both Macs

### Notes
- Keep `AppContext.tsx` as the single source of truth for now — swap its internals
  from in-memory state to TanStack Query calls
- All Zod schemas live in `src/renderer/src/lib/schemas/`
- All DB types in `src/renderer/src/types/database.types.ts`
- Run `npm run gen:types` to regenerate types after any DB schema changes

---

## Phase 6 — Smoke test & cleanup ⬜ (NEXT)

1. Run `npm run typecheck` — zero TypeScript errors
2. Run `npm run build` — production build succeeds
3. Manually test every page and feature
4. Remove the `roost/` directory (no longer needed)
5. Update `NORTH_STAR.md` / `README.md` to reflect the new stack

---

## Current blockers / notes

- Tailwind v4 upgrade (Phase 4) must happen at the same time as Phase 2 file copy
  — the Figma CSS won't render at all under v3.
- `react-router` v7 uses the same package name as v6 (`react-router`) but v6 used
  `react-router-dom`. Be careful with imports — v7 exports everything from `react-router`.
- The Figma Make app uses `motion` (the renamed Framer Motion package). Imports look
  like `import { motion } from 'motion/react'`.
