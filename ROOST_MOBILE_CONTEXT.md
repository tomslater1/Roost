# ROOST MOBILE CONTEXT

**For the React Native iOS companion app — read this before writing a single line of code.**

*Generated: 24 March 2026 from a full audit of the Roost Mac app codebase.*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Complete Supabase Schema](#2-complete-supabase-schema)
3. [All Zod Schemas](#3-all-zod-schemas)
4. [Auth Architecture](#4-auth-architecture)
5. [Realtime Architecture](#5-realtime-architecture)
6. [Hook Patterns](#6-hook-patterns)
7. [Activity Feed Pattern](#7-activity-feed-pattern)
8. [Feature Specifications](#8-feature-specifications)
9. [Design System](#9-design-system)
10. [Environment Variables](#10-environment-variables)
11. [Known Technical Decisions](#11-known-technical-decisions)
12. [Current Phase and Status](#12-current-phase-and-status)
13. [Session Log Summary](#13-session-log-summary)

---

## 1. Project Overview

### What Roost Is

Roost is the shared dashboard for two people building a life together. It keeps a household running — shopping lists, shared expenses with splitting, chores, a calendar, and a live activity feed of everything happening in the home. It is not a productivity app. It is not a platform. It is the thing you and your partner actually open every day because it makes your shared life a little easier and a little more connected.

**Current state (March 2026):** The Mac app is fully functional and used daily by Thomas and his girlfriend. Phases 0 through 3.5 are complete. The app covers: auth, shopping list, expenses (with Splitwise-style splitting and settle-up), chores, budget tracking, an activity feed, notifications, a dashboard, and settings.

### Who It Is For

Exactly two people who share a home. Not teams. Not families. Not three housemates. The entire data model, UI, and feature set is built around this constraint. Every table that is home-scoped assumes a maximum of two members. The balance calculation (`useExpenses`) identifies "the partner" as the single member who is not the current user — this only works if there are exactly two members per home.

### The "Built for Two" Philosophy and Why It Matters Architecturally

This is the most important constraint the mobile app must respect:

- **Data isolation is per-home, not per-user.** Both partners see and modify the same data. There is no private data except notifications and user preferences.
- **"The partner" is always singular.** The balance calculation, member avatar display, notification targeting — all assume exactly one other person in the home.
- **The invite code allows exactly one more person.** Once two people are in a home, the invite code still exists but a third person joining would break assumptions throughout the app. The app does not currently prevent this at the UI level — it is a known trust-based constraint.
- **Both clients are equal.** Neither Mac nor iPhone is primary. Changes made on any device appear on all others via Supabase Realtime within seconds.

### Guiding Principles (from NORTH_STAR.md)

These filter every decision:

1. **Built for two.** Every feature makes sense for exactly two people who share a home and trust each other completely.
2. **Feels native.** iOS app should respect iOS conventions, use the system font where appropriate, and never feel like a website wrapped in a box.
3. **Simple over clever.** When in doubt, do less. Resist scope creep.
4. **Real use beats polish.** An imperfect feature used daily beats a beautiful feature never reached for.
5. **Privacy by default.** Data lives in the Supabase project. RLS enforces isolation at the DB level. No analytics, no tracking, no third-party data sharing.
6. **Build the foundation once.** The schema, RLS policies, and Zod schemas are set. The mobile app does not change any of these.

### Product Vision for the iOS App

The iOS app is the companion to the Mac app — same data, same backend, new form factor. The goal is **feature parity with the Mac app, optimised for a phone.** Key differences from the Mac app:

- Tab bar navigation instead of sidebar
- Push notifications via APNs (the Mac app uses macOS notifications)
- Touch-first interactions
- Expo for development tooling, but production-ready React Native

The Supabase backend is shared. Every feature built for macOS works on iOS by default. The iOS app is purely a new frontend.

---

## 2. Complete Supabase Schema

The schema is built across 20 migrations. What follows is the authoritative definition of every table, column, type, constraint, RLS policy, and function as of migration 0020.

**Do not modify the schema for the mobile app.** The Mac and iOS apps share one Supabase project. Any schema change affects both clients simultaneously.

### Core Tables

#### `homes`
```sql
CREATE TABLE homes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL DEFAULT 'Our Home',
  invite_code     TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at      TIMESTAMPTZ DEFAULT now(),
  -- Added migration 0004:
  calendar_token  UUID NOT NULL DEFAULT gen_random_uuid(),
  -- Added migration 0006:
  next_shop_date  DATE,
  -- Added migration 0016:
  calendar_last_fetched_at TIMESTAMPTZ
);
```

RLS policies:
- Authenticated users can INSERT (create a home on signup)
- SELECT where `id = get_user_home_id()`
- UPDATE where `id = get_user_home_id()`

#### `home_members`
```sql
CREATE TABLE home_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  display_name TEXT,
  avatar_color TEXT DEFAULT '#7F77DD',
  joined_at    TIMESTAMPTZ DEFAULT now(),
  -- Added migration 0011:
  avatar_icon  TEXT,  -- Lucide icon name string; NULL = show first letter of display_name
  UNIQUE(home_id, user_id)
);
```

RLS policies:
- SELECT where `home_id = get_user_home_id()`
- INSERT where `user_id = auth.uid()` (can only add yourself)
- UPDATE where `user_id = auth.uid()` (can only update your own record)
- DELETE where `user_id = auth.uid()` (used by leave_home())

In Realtime publication: YES (added migration 0002)

#### `shopping_items`
```sql
CREATE TABLE shopping_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  quantity   TEXT,
  category   TEXT,
  checked    BOOLEAN DEFAULT false,
  added_by   UUID REFERENCES auth.users(id),
  checked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()  -- auto-updated by trigger
);
```

Trigger: `shopping_items_updated_at` (added migration 0002) — sets `updated_at = now()` on every UPDATE.

RLS policies: Full CRUD scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

#### `expenses`
```sql
CREATE TABLE expenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  title               TEXT NOT NULL,
  amount              NUMERIC(10,2) NOT NULL,
  paid_by             UUID REFERENCES auth.users(id) NOT NULL,
  split_type          TEXT NOT NULL DEFAULT 'equal'
                        CHECK (split_type IN ('equal', 'custom', 'solo')),
                        -- 'solo' added in migration 0009
  category            TEXT,
  is_recurring        BOOLEAN DEFAULT false,
  recurrence_interval TEXT CHECK (recurrence_interval IN ('weekly', 'monthly', 'yearly')),
  notes               TEXT,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

Split types:
- `'equal'` — split evenly between all members. Creates `expense_splits` rows. Affects balance.
- `'custom'` — manual split amounts. Creates `expense_splits` rows. Affects balance.
- `'solo'` — one person's personal expense logged for visibility. No splits created. Does NOT affect balance.

RLS policies: Full CRUD scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

#### `expense_splits`
```sql
CREATE TABLE expense_splits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  amount     NUMERIC(10,2) NOT NULL,
  settled    BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ
);
```

**Important:** This table has NO `home_id` column. RLS policies join through `expenses` to verify home membership. This means you cannot filter by `home_id` in the Realtime subscription — subscribe without a filter and rely on RLS to scope results.

RLS policies: Full CRUD via join to `expenses.home_id = get_user_home_id()`

In Realtime publication: YES (added migration 0003)

#### `settlements`
```sql
CREATE TABLE settlements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  paid_by    UUID REFERENCES auth.users(id) NOT NULL,  -- the debtor
  paid_to    UUID REFERENCES auth.users(id) NOT NULL,  -- the creditor
  amount     NUMERIC(10,2) NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Immutable — no UPDATE or DELETE policies. Deleting a settlement would create a broken ledger (splits remain settled=true but the record of why is gone).

RLS policies: SELECT and INSERT only, scoped to `home_id = get_user_home_id()`

In Realtime publication: YES (added migration 0003)

#### `chores`
```sql
CREATE TABLE chores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  assigned_to      UUID REFERENCES auth.users(id),
  frequency        TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'fortnightly', 'monthly')),
  last_completed_at TIMESTAMPTZ,
  completed_by     UUID REFERENCES auth.users(id),
  due_date         DATE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  -- Added migration 0013:
  room             TEXT  -- plain text room name, not a FK
);
```

**Note on `room`:** Stored as plain text matching a room name in `home_rooms`. Not a foreign key — this is intentional. If a room is renamed in `home_rooms`, existing chore labels are preserved (they don't silently orphan).

RLS policies: Full CRUD scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

#### `activity_feed`
```sql
CREATE TABLE activity_feed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id     UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,       -- human-readable, e.g. "added milk to the shopping list"
  entity_type TEXT NOT NULL,       -- e.g. "shopping_item", "expense", "chore", "budget"
  entity_id   UUID,               -- the id of the affected entity
  metadata    JSONB,              -- currently unused, reserved for future use
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

Immutable — no UPDATE or DELETE policies. Activity rows are never modified after insert.

RLS policies: SELECT and INSERT only, scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

**Trigger:** `on_activity_inserted` — after every INSERT on `activity_feed`, fires `create_notifications_for_activity()` which creates one `notifications` row for every OTHER home member.

#### `notifications`
```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  -- recipient
  actor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,           -- who triggered it
  type       TEXT NOT NULL,    -- mirrors entity_type: 'expense', 'chore', 'shopping_item', etc.
  title      TEXT NOT NULL,    -- human-readable, e.g. 'logged £45.00 for Groceries'
  entity_id  UUID,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**No client INSERT policy.** Rows are created exclusively by the `create_notifications_for_activity()` trigger. Clients only SELECT and UPDATE (to mark as read).

RLS policies:
- SELECT where `user_id = auth.uid()` (users only see their own notifications)
- UPDATE where `user_id = auth.uid()` (users only mark their own as read)

In Realtime publication: YES

#### `notification_preferences` (migration 0017)
```sql
CREATE TABLE notification_preferences (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled      BOOLEAN NOT NULL DEFAULT true,
  macos_enabled       BOOLEAN NOT NULL DEFAULT true,
  chores_enabled      BOOLEAN NOT NULL DEFAULT true,
  expenses_enabled    BOOLEAN NOT NULL DEFAULT true,
  shopping_enabled    BOOLEAN NOT NULL DEFAULT true,
  settlements_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start   TEXT NOT NULL DEFAULT '22:00',  -- HH:MM
  quiet_hours_end     TEXT NOT NULL DEFAULT '08:00',  -- HH:MM
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

One row per user. The app upserts on first change; rows may not exist for users who have never changed preferences — treat missing rows as all-defaults.

RLS: full `FOR ALL` policy where `auth.uid() = user_id`

**Mobile note:** The `macos_enabled` column is Mac-specific. When implementing the mobile app, add an `ios_enabled` column via a new migration. Do not repurpose `macos_enabled`.

#### `user_preferences` (migration 0018)
```sql
CREATE TABLE user_preferences (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starts TEXT NOT NULL DEFAULT 'monday' CHECK (week_starts IN ('monday', 'sunday')),
  time_format TEXT NOT NULL DEFAULT '12h'    CHECK (time_format IN ('12h', '24h')),
  currency    TEXT NOT NULL DEFAULT 'GBP',
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Personal preferences (not shared with partner). Defaults reflect the UK users. The mobile app should respect these — display currency amounts using the user's `currency` preference, format dates using `date_format`.

RLS: full `FOR ALL` policy where `auth.uid() = user_id`

#### `budgets` (migration 0008)
```sql
CREATE TABLE budgets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  category   TEXT NOT NULL,
  month      DATE NOT NULL,  -- ALWAYS stored as YYYY-MM-01 (first day of month)
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(home_id, category, month)
);
```

**Month format:** Always `YYYY-MM-01`. This avoids timezone edge cases and makes month-scoped queries trivial. When upserting, use `format(startOfMonth(date), 'yyyy-MM-dd')`.

Upsert pattern: `onConflict = 'home_id,category,month'`

RLS: Full CRUD scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

#### `home_custom_categories` (migration 0008)
```sql
CREATE TABLE home_custom_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(home_id, name)
);
```

RLS: Full CRUD scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

#### `home_rooms` (migration 0013)
```sql
CREATE TABLE home_rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'Home',  -- Lucide icon name string
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(home_id, name)
);
```

RLS: Full CRUD scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

Migration 0014 seeds default rooms for existing homes (Living Room, Kitchen, Bedroom, Bathroom, Garden, Garage). New homes created after 0014 do NOT get default rooms automatically — the app handles this via the `useRooms` hook which detects an empty rooms list and shows an empty state with an add prompt.

#### `home_room_groups` (migration 0015 + 0019)
```sql
CREATE TABLE home_room_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id    UUID REFERENCES homes(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'Layers',  -- Lucide icon name
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(home_id, name)
);
```

**System groups ("All Rooms", "All Bedrooms", "All Bathrooms") are handled entirely in client code and never stored here.** Only user-created custom groups are stored in this table.

RLS: Full CRUD scoped to `home_id = get_user_home_id()`

In Realtime publication: YES

**Note:** Migration 0015 was marked applied in Supabase but never actually executed. Migration 0019 is an idempotent re-creation that actually created these tables. This is a migration history quirk — the tables exist, just via 0019 not 0015.

#### `room_group_members` (migration 0015 + 0019)
```sql
CREATE TABLE room_group_members (
  group_id UUID REFERENCES home_room_groups(id) ON DELETE CASCADE NOT NULL,
  room_id  UUID REFERENCES home_rooms(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (group_id, room_id)
);
```

Junction table for many-to-many between groups and rooms. No `home_id` — scoped via join to `home_room_groups`.

RLS: SELECT, INSERT, DELETE (no UPDATE) scoped via group → home join

In Realtime publication: YES

### Helper Functions

#### `get_user_home_id()` — the central RLS helper
```sql
CREATE OR REPLACE FUNCTION get_user_home_id()
RETURNS UUID AS $$
  SELECT home_id FROM home_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

Every RLS policy uses this function. It returns the `home_id` for the current authenticated user, or NULL if they have no home. **SECURITY DEFINER** means it runs as postgres (bypasses RLS) — this is safe because it only reads `home_members` which is implicitly trusted.

#### `get_home_by_invite_code(code TEXT)` — invite code lookup
```sql
CREATE OR REPLACE FUNCTION get_home_by_invite_code(code TEXT)
RETURNS UUID LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT id FROM homes WHERE lower(invite_code) = lower(code) LIMIT 1;
$$;
```

Used during the join flow. SECURITY DEFINER so a new user (not yet in any home) can look up a home without hitting the RLS wall. **Case-insensitive** — the invite code comparison normalises both sides to lowercase (migration 0020 fix).

#### `create_home_for_user(home_name, display_name)` — atomic home creation
```sql
CREATE OR REPLACE FUNCTION create_home_for_user(
  home_name TEXT DEFAULT 'Our Home',
  display_name TEXT DEFAULT 'User'
) RETURNS UUID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE new_home_id UUID;
BEGIN
  INSERT INTO homes (name) VALUES (home_name) RETURNING id INTO new_home_id;
  INSERT INTO home_members (home_id, user_id, role, display_name)
  VALUES (new_home_id, auth.uid(), 'owner', display_name);
  RETURN new_home_id;
END; $$;
```

Creates a home AND inserts the caller as owner in a single transaction. SECURITY DEFINER bypasses the RLS race condition that could occur if the session isn't fully propagated yet.

#### `join_home_by_invite_code(code, display_name)` — atomic home join
```sql
CREATE OR REPLACE FUNCTION join_home_by_invite_code(
  code TEXT,
  display_name TEXT DEFAULT 'User'
) RETURNS UUID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE target_home_id UUID;
BEGIN
  SELECT id INTO target_home_id FROM homes WHERE lower(invite_code) = lower(code) LIMIT 1;
  IF target_home_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  INSERT INTO home_members (home_id, user_id, display_name, role)
  VALUES (target_home_id, auth.uid(), display_name, 'member')
  ON CONFLICT (home_id, user_id) DO NOTHING;  -- idempotent
  RETURN target_home_id;
END; $$;
```

Case-insensitive invite code lookup. Idempotent via `ON CONFLICT DO NOTHING` — safe to call multiple times.

#### `settle_up(p_home_id, p_debtor_id, p_creditor_id, p_amount, p_note)` — atomic settlement
```sql
CREATE OR REPLACE FUNCTION settle_up(
  p_home_id UUID, p_debtor_id UUID, p_creditor_id UUID,
  p_amount NUMERIC, p_note TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE v_settlement_id UUID;
BEGIN
  -- Security gate: verify caller is a home member
  IF NOT EXISTS (SELECT 1 FROM home_members WHERE home_id = p_home_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this home' USING errcode = '42501';
  END IF;
  -- Mark all debtor's unsettled splits as settled
  UPDATE expense_splits es SET settled = true, settled_at = now()
  WHERE es.settled = false AND es.user_id = p_debtor_id
    AND EXISTS (SELECT 1 FROM expenses e WHERE e.id = es.expense_id AND e.home_id = p_home_id);
  -- Record the settlement
  INSERT INTO settlements (home_id, paid_by, paid_to, amount, note)
  VALUES (p_home_id, p_debtor_id, p_creditor_id, p_amount, p_note)
  RETURNING id INTO v_settlement_id;
  RETURN v_settlement_id;
END; $$;
```

SECURITY DEFINER so it can UPDATE `expense_splits` without hitting the join-based RLS policy. The explicit `home_members` check replaces the RLS guard.

#### `leave_home()` — remove self from home
```sql
-- If last member: deletes the home (cascades all data)
-- If partner remains: removes self from home_members
CREATE OR REPLACE FUNCTION leave_home() RETURNS VOID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE v_home_id UUID; v_member_count INT;
BEGIN
  SELECT home_id INTO v_home_id FROM home_members WHERE user_id = auth.uid();
  IF v_home_id IS NULL THEN RETURN; END IF;
  SELECT count(*) INTO v_member_count FROM home_members WHERE home_id = v_home_id;
  IF v_member_count <= 1 THEN
    DELETE FROM homes WHERE id = v_home_id;  -- cascades all data
  ELSE
    DELETE FROM home_members WHERE home_id = v_home_id AND user_id = auth.uid();
  END IF;
END; $$;
```

#### `delete_account()` — remove self completely
```sql
-- Calls leave_home() then auth user deletion is handled by the delete-account Edge Function
CREATE OR REPLACE FUNCTION delete_account() RETURNS VOID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  PERFORM leave_home();
  -- Auth user deletion is handled by the delete-account Edge Function.
  -- Supabase does NOT permit direct DELETE on auth.users via SQL.
END; $$;
```

**Important:** Direct `DELETE FROM auth.users` does not work in Supabase. Account deletion requires calling `auth.admin.deleteUser()` via the service role key in a Supabase Edge Function (`supabase/functions/delete-account/`). The mobile app must use this same Edge Function.

### Triggers

#### `on_activity_inserted` on `activity_feed`
Fires `create_notifications_for_activity()` after every INSERT. Creates one `notifications` row for every home member who is NOT the actor (`user_id`).

```sql
CREATE OR REPLACE FUNCTION create_notifications_for_activity()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;  -- skip system events
  INSERT INTO public.notifications (home_id, user_id, actor_id, type, title, entity_id)
  SELECT NEW.home_id, hm.user_id, NEW.user_id,
         coalesce(NEW.entity_type, 'general'), NEW.action, NEW.entity_id
  FROM public.home_members hm
  WHERE hm.home_id = NEW.home_id AND hm.user_id != NEW.user_id;
  RETURN NEW;
END; $$;
```

#### `shopping_items_updated_at` on `shopping_items`
Auto-sets `updated_at = now()` on every UPDATE. Uses the generic `set_updated_at()` trigger function.

### Realtime Publication Summary

All tables in the `supabase_realtime` publication:
- `shopping_items`
- `chores`
- `expenses`
- `activity_feed`
- `home_members`
- `expense_splits`
- `settlements`
- `notifications`
- `home_custom_categories`
- `budgets`
- `home_rooms`
- `home_room_groups`
- `room_group_members`

Tables NOT in Realtime (personal preferences — no need for cross-device sync since they're single-device personal settings):
- `notification_preferences`
- `user_preferences`

---

## 3. All Zod Schemas

These are the single source of truth for all data shapes. Copy them verbatim. TypeScript types are always derived from Zod schemas — never write types separately.

### Conventions Across All Schemas

- UUID fields use `z.string().uuid()` (Supabase returns UUIDs as strings)
- Timestamps use `z.string().datetime({ offset: true })` (Supabase returns ISO 8601 with timezone offset)
- Dates (DATE columns) use `z.string()` in `YYYY-MM-DD` format
- Server-generated fields (`id`, `created_at`, `home_id`) are omitted from "create" schemas
- Optional nullable fields use `.optional().nullable()`
- Zod `.default()` values match database column defaults

### `lib/schemas/user.ts`

```typescript
import { z } from 'zod'

export const activityFeedItemSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})

// Schema for a signup form
export const signupFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Display name is required').max(50),
})

// Schema for a login form
export const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

// Schema for the join-via-invite flow
export const joinFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Display name is required').max(50),
  invite_code: z.string().length(8, 'Invite codes are 8 characters'),
})

// Schema for the Google OAuth post-signup setup page
export const setupFormSchema = z.object({
  display_name: z.string().min(1, 'Your name is required').max(50, 'Name is too long'),
  invite_code: z.string().length(8, 'Invite codes are exactly 8 characters').optional(),
})

export type ActivityFeedItem = z.infer<typeof activityFeedItemSchema>
export type SignupForm = z.infer<typeof signupFormSchema>
export type LoginForm = z.infer<typeof loginFormSchema>
export type JoinForm = z.infer<typeof joinFormSchema>
export type SetupForm = z.infer<typeof setupFormSchema>
```

### `lib/schemas/shopping.ts`

```typescript
import { z } from 'zod'

export const shoppingItemSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1, 'Item name is required').max(100),
  quantity: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  checked: z.boolean().default(false),
  added_by: z.string().uuid().optional().nullable(),
  checked_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

// Used in the "add item" form — omit server-generated fields
export const createShoppingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100),
  quantity: z.string().optional(),
  category: z.string().optional(),
})

export type ShoppingItem = z.infer<typeof shoppingItemSchema>
export type CreateShoppingItem = z.infer<typeof createShoppingItemSchema>
```

### `lib/schemas/expenses.ts`

```typescript
import { z } from 'zod'

export const expenseSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  paid_by: z.string().uuid(),
  split_type: z.enum(['equal', 'custom', 'solo']).default('equal'),
  category: z.string().optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['weekly', 'monthly', 'yearly']).optional().nullable(),
  notes: z.string().optional().nullable(),
  date: z.string(), // YYYY-MM-DD
  created_at: z.string().datetime({ offset: true }),
})

export const expenseSplitSchema = z.object({
  id: z.string().uuid(),
  expense_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().positive(),
  settled: z.boolean().default(false),
  settled_at: z.string().datetime({ offset: true }).optional().nullable(),
})

// Expense with its splits embedded (used when fetching with ?select=*,expense_splits(*))
export const expenseWithSplitsSchema = expenseSchema.extend({
  expense_splits: z.array(expenseSplitSchema).default([]),
})

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  paid_by: z.string().uuid(),
  split_type: z.enum(['equal', 'custom', 'solo']).default('equal'),
  category: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  notes: z.string().optional(),
  date: z.string(),
}).superRefine((data, ctx) => {
  if (data.is_recurring && !data.recurrence_interval) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select how often this recurs',
      path: ['recurrence_interval'],
    })
  }
})

export const settlementSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  paid_by: z.string().uuid(),
  paid_to: z.string().uuid(),
  amount: z.number(),
  note: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})

export type Expense = z.infer<typeof expenseSchema>
export type ExpenseSplit = z.infer<typeof expenseSplitSchema>
export type ExpenseWithSplits = z.infer<typeof expenseWithSplitsSchema>
export type CreateExpense = z.infer<typeof createExpenseSchema>
export type Settlement = z.infer<typeof settlementSchema>
```

### `lib/schemas/chores.ts`

```typescript
import { z } from 'zod'

export const choreSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  frequency: z.enum(['once', 'daily', 'weekly', 'fortnightly', 'monthly']).optional().nullable(),
  last_completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_by: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(), // YYYY-MM-DD
  room: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})

export const createChoreSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
  due_date: z.string().optional(),
  room: z.string().optional().nullable(),
})

export type Chore = z.infer<typeof choreSchema>
export type CreateChore = z.infer<typeof createChoreSchema>
```

**Note:** The DB `frequency` CHECK allows `'once'` and `'fortnightly'` but `createChoreSchema` only allows `'daily'`, `'weekly'`, `'monthly'`. This is an intentional UI simplification — the creation form only shows these three, but existing data may have `'once'` or `'fortnightly'` values from older versions.

### `lib/schemas/home.ts`

```typescript
import { z } from 'zod'

export const homeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Home name is required').max(100),
  invite_code: z.string().length(8),
  // Optional — added in migration 0004. App degrades gracefully if not yet applied.
  calendar_token: z.string().uuid().optional(),
  // Optional — added in migration 0006. App degrades gracefully if not yet applied.
  next_shop_date: z.string().nullable().optional(), // YYYY-MM-DD
  // Optional — added in migration 0016. Null means never fetched (no active subscription).
  calendar_last_fetched_at: z.string().datetime({ offset: true }).nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
})

export const homeMemberSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'member']),
  display_name: z.string().nullable().optional(),
  avatar_color: z.string().default('#7F77DD'),
  // Optional — added in migration 0011. Null = show first letter of display name.
  avatar_icon: z.string().nullable().optional(),
  joined_at: z.string().datetime({ offset: true }),
})

export const updateHomeMemberSchema = homeMemberSchema.pick({
  display_name: true,
  avatar_color: true,
  avatar_icon: true,
})

export type Home = z.infer<typeof homeSchema>
export type HomeMember = z.infer<typeof homeMemberSchema>
export type UpdateHomeMember = z.infer<typeof updateHomeMemberSchema>
```

### `lib/schemas/budgets.ts`

```typescript
import { z } from 'zod'

export const budgetSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  category: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'month must be YYYY-MM-01'),
  amount: z.number().positive(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export const upsertBudgetSchema = z.object({
  category: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'month must be YYYY-MM-01'),
  amount: z.number().positive('Budget must be greater than 0'),
})

export const customCategorySchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1).max(40),
  color: z.string(),
  emoji: z.string(),
  created_at: z.string().datetime({ offset: true }),
})

export const createCustomCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name is too long'),
  color: z.string().min(1, 'Pick a colour'),
  emoji: z.string().min(1, 'Pick an emoji'),
})

export type Budget = z.infer<typeof budgetSchema>
export type UpsertBudget = z.infer<typeof upsertBudgetSchema>
export type CustomCategory = z.infer<typeof customCategorySchema>
export type CreateCustomCategory = z.infer<typeof createCustomCategorySchema>
```

### `lib/schemas/notifications.ts`

```typescript
import { z } from 'zod'

export const notificationSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  actor_id: z.string().uuid().nullable().optional(),
  type: z.string(),
  title: z.string(),
  entity_id: z.string().uuid().nullable().optional(),
  read: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
})

// Use AppNotification to avoid clashing with the browser/native global Notification class
export type AppNotification = z.infer<typeof notificationSchema>

export const notificationPrefsSchema = z.object({
  user_id: z.string(),
  in_app_enabled: z.boolean().default(true),
  macos_enabled: z.boolean().default(true),
  chores_enabled: z.boolean().default(true),
  expenses_enabled: z.boolean().default(true),
  shopping_enabled: z.boolean().default(true),
  settlements_enabled: z.boolean().default(true),
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().default('22:00'),
  quiet_hours_end: z.string().default('08:00'),
})

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>

export function defaultPrefs(userId: string): NotificationPrefs {
  return notificationPrefsSchema.parse({ user_id: userId })
}
```

### `lib/schemas/userPreferences.ts`

```typescript
import { z } from 'zod'

export const userPreferencesSchema = z.object({
  user_id:     z.string().uuid(),
  week_starts: z.enum(['monday', 'sunday']),
  time_format: z.enum(['12h', '24h']),
  currency:    z.string(),
  date_format: z.string(),
  updated_at:  z.string().datetime({ offset: true }).optional(),
})

export type UserPreferences = z.infer<typeof userPreferencesSchema>

export function defaultUserPrefs(userId: string): UserPreferences {
  return {
    user_id:     userId,
    week_starts: 'monday',
    time_format: '12h',
    currency:    'GBP',
    date_format: 'DD/MM/YYYY',
  }
}
```

### `lib/schemas/rooms.ts`

```typescript
import { z } from 'zod'

export const roomSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1),
  icon: z.string(),
  created_at: z.string().datetime({ offset: true }),
})

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string(),
})

export type Room = z.infer<typeof roomSchema>
export type CreateRoom = z.infer<typeof createRoomSchema>
```

### `lib/schemas/roomGroups.ts`

```typescript
import { z } from 'zod'

export const roomGroupMemberSchema = z.object({
  group_id: z.string().uuid(),
  room_id: z.string().uuid(),
})

export const roomGroupSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1),
  icon: z.string(),
  created_at: z.string().datetime({ offset: true }),
  room_group_members: z.array(z.object({ room_id: z.string().uuid() })).default([]),
})

export const createRoomGroupSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string(),
})

export type RoomGroup = z.infer<typeof roomGroupSchema>
export type CreateRoomGroup = z.infer<typeof createRoomGroupSchema>
```

---

## 4. Auth Architecture

### Overview

Auth is handled entirely by Supabase Auth. The app uses two sign-in methods:
1. **Email + password** — traditional email/password flow
2. **Google OAuth** — via Supabase's Google OAuth provider

### The Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Electron uses 'implicit' flowType because PKCE's server code-exchange
// breaks across the system browser → Electron boundary.
// On React Native / Expo, use PKCE (the default). Do NOT use 'implicit' on mobile.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'implicit' },  // CHANGE THIS to 'pkce' for mobile
})
```

**Mobile note:** For Expo/React Native, use the default PKCE flow via `expo-auth-session`. PKCE works correctly on mobile because the system browser can redirect back to the app via a custom URL scheme handled by the OS.

### Session Storage

On the Mac app: sessions are stored in `localStorage`. Supabase JS v2 uses `localStorage` by default in browser-like environments.

On React Native: sessions must be stored in AsyncStorage. Configure the Supabase client:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})
```

### Sign-Up Flow (email + password)

1. User fills signup form (email, password, display_name) — validated by `signupFormSchema`
2. Call `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`
3. Supabase sends a confirmation email
4. After email confirmation, user lands on the **setup page** where they:
   - Choose a home name (defaults to "Our Home")
   - Optionally enter an invite code to join an existing home
5. If creating a new home: call `supabase.rpc('create_home_for_user', { home_name, display_name })`
6. If joining: call `supabase.rpc('join_home_by_invite_code', { code, display_name })`
7. Navigate to the main app

**Edge case:** A signed-in user with no home (signed up but never completed setup) must be sent to the setup screen. Check `get_user_home_id()` — if it returns null, redirect to setup.

### Join Flow (partner joining an existing home)

Two paths, same outcome:

**Path A — Join via invite code (new account):**
1. User fills join form (email, password, display_name, invite_code) — validated by `joinFormSchema`
2. Call `supabase.auth.signUp({ email, password })`
3. After confirmation, call `supabase.rpc('join_home_by_invite_code', { code: invite_code, display_name })`

**Path B — Invite link (deep link):**
1. Owner shares a `roost://join?code=abc123ef` deep link
2. App opens to the join screen with the invite code pre-filled
3. Same flow as Path A from there

### Login Flow (returning user)

1. User fills login form (email, password) — validated by `loginFormSchema`
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. Check if user has a home (`get_user_home_id()`). If not, send to setup. If yes, send to main app.

### Google OAuth Flow

**Mac app approach (DO NOT replicate this on mobile):**
- Uses implicit flow
- `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'roost://auth/callback' } })`
- Opens the system browser
- Supabase redirects back to `roost://auth/callback#access_token=...`
- Electron main process captures the deep link and forwards the URL fragment to the renderer
- Renderer calls `supabase.auth.setSession()` with the tokens from the fragment

**Mobile approach (use this instead):**
- Use `expo-auth-session` with PKCE
- `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'roost-ios://auth/callback' } })`
- Expo handles the system browser redirect and URL scheme capture
- After OAuth: if new user, send to setup screen to collect display_name and optional invite_code (`setupFormSchema`)

### Post-Auth Setup Screen

This screen handles Google OAuth users who haven't set up their home yet. It collects:
- `display_name` (required)
- `invite_code` (optional — to join a partner's home instead of creating one)

Logic:
- If invite_code is provided: call `join_home_by_invite_code`
- If no invite_code: call `create_home_for_user`
- Navigate to main app

### What Happens When a User Has No Home

`useHome()` calls `supabase.rpc('get_user_home_id')`. If it returns `null`, the hook returns `home: null`. The auth guard in the app shell detects this and redirects to the setup screen. This handles:
- Users who signed up via email but haven't confirmed yet (shouldn't reach the app)
- Users who signed up via Google OAuth but quit before setup
- Edge cases where `create_home_for_user` failed silently

### Auth State

The Mac app uses a React context (`AuthContext`) that wraps `supabase.auth.onAuthStateChange()` and exposes the current user. Session persistence means users stay logged in across app restarts. `SIGNED_OUT` events trigger navigation to the login screen.

### Account Deletion

Account deletion requires a Supabase Edge Function because `auth.admin.deleteUser()` can only be called with the service role key (never expose this to the client).

Flow:
1. User confirms deletion in settings
2. Call `supabase.rpc('delete_account')` — this calls `leave_home()` to clean up home data
3. Call the `delete-account` Edge Function — this calls `auth.admin.deleteUser(userId)` using the service role key
4. Sign out and redirect to login

---

## 5. Realtime Architecture

### The Core Pattern

Realtime is centralised through a `RealtimeManager` module. Every hook that needs live updates calls `subscribe()` from this module rather than calling `supabase.channel()` directly.

**Why:** Supabase's JS client deduplicates channels by name internally. Without a manager, two React components mounting the same hook would both call `supabase.channel('same-name')` and the first to unmount would call `removeChannel()` — silently killing the subscription for the second.

### RealtimeManager API

```typescript
interface ChannelConfig {
  table: string           // postgres table name
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string         // e.g. "home_id=eq.<uuid>"
}

// Subscribe to realtime events. Returns an unsubscribe function.
function subscribe(config: ChannelConfig, callback: (payload) => void): () => void

// Re-subscribe any broken channels (called on network reconnect)
function resubscribeAll(): void

// Debugging: get status of all active channels
function getChannelStatus(): Record<string, SubscriptionStatus>
```

### How It Works

1. **Stable key:** Each channel is keyed by `table:event:filter`. Two subscriptions with the same config share one channel.
2. **Ref-counting:** Each subscriber gets an unsubscribe function. The channel is only torn down when the last subscriber calls unsubscribe.
3. **Fan-out:** One Supabase channel fans events to all registered callbacks.
4. **Error recovery:** Channels in `CHANNEL_ERROR` or `TIMED_OUT` states are torn down and rebuilt on the next `window.addEventListener('online')` event.
5. **Latency measurement:** INSERT events with a `created_at` field trigger a latency measurement comparing DB write time to client receipt time (useful for debugging, not user-facing).

### The `useRealtime` Hook

```typescript
interface UseRealtimeOptions {
  table: string
  homeId: string | undefined
  onUpdate: () => void  // called on any change — typically invalidates the TanStack Query cache
  filter?: string       // optional postgres filter
}

function useRealtime({ table, homeId, onUpdate, filter }: UseRealtimeOptions): void
```

Key behaviour:
- Does not subscribe until `homeId` is available (waits for home to load)
- The `onUpdate` callback ignores the payload content — it just triggers a TanStack Query cache invalidation, which re-fetches and validates through Zod
- Cleanup returns `unsubscribe` from the RealtimeManager

### Which Tables Use Which Filter Strategy

| Table | Filter Strategy | Reason |
|-------|----------------|---------|
| `shopping_items` | No filter (RLS scopes) | Works fine, low volume |
| `expenses` | `home_id=eq.<uuid>` | Explicit filter for clarity |
| `expense_splits` | No filter | Has no `home_id` column — RLS joins through expenses |
| `settlements` | No filter (RLS scopes) | Works fine |
| `chores` | No filter (RLS scopes) | Works fine |
| `activity_feed` | No filter (RLS scopes) | Works fine |
| `home_members` | No filter (RLS scopes) | Works fine |
| `homes` | No filter (RLS scopes) | Used for next_shop_date sync |
| `budgets` | No filter (RLS scopes) | Works fine |
| `home_custom_categories` | No filter (RLS scopes) | Works fine |
| `notifications` | No filter (RLS scopes) | RLS is `user_id = auth.uid()` so each user only sees their own |

### Mobile Implementation Note

On React Native, `window.addEventListener('online')` doesn't exist. Replace with `NetInfo` from `@react-native-community/netinfo`:

```typescript
import NetInfo from '@react-native-community/netinfo'

NetInfo.addEventListener(state => {
  if (state.isConnected) {
    resubscribeAll()
  }
})
```

The rest of the RealtimeManager logic is platform-agnostic and can be copied directly.

### Known Issues

- **Two-account realtime test not yet completed** (carried to Phase 4). The implementation is correct but hasn't been verified with two simultaneously logged-in accounts on separate devices. This is the first thing to verify with the mobile app.

---

## 6. Hook Patterns

All hooks follow a consistent pattern. Replicate this in the mobile app.

### Pattern Template

```typescript
function useSomeFeature() {
  const { user } = useAuthContext()     // get current user
  const { home, members } = useHome()  // get home data
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['key', home?.id] }),
    [queryClient, home?.id]
  )

  // 1. Fetch with TanStack Query
  const query = useQuery({
    queryKey: ['key', home?.id],
    enabled: !!home?.id,       // never fetch before home is loaded
    queryFn: async () => {
      const { data, error } = await supabase.from('table').select('*').eq('home_id', home!.id)
      if (error) throw error
      return z.array(schema).parse(data)  // always validate through Zod
    },
  })

  // 2. Subscribe to realtime (invalidates the query cache on change)
  useRealtime({ table: 'table', homeId: home?.id, onUpdate: invalidate })

  // 3. Mutations with optimistic updates
  const addItem = useMutation({
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['key', home?.id] })
      const previous = queryClient.getQueryData(['key', home?.id])
      queryClient.setQueryData(['key', home?.id], (old) => [newItem, ...(old ?? [])])
      return { previous }  // return for rollback
    },
    mutationFn: async (newItem) => {
      const { data, error } = await supabase.from('table').insert(newItem).select().single()
      if (error) throw error
      return schema.parse(data)
    },
    onSuccess: async (data) => {
      await logActivity({ ... })  // fire-and-forget
      toast.success('Done!')
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['key', home?.id], context.previous)
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addItem,
  }
}
```

### `useHome`

**Returns:** `{ home, members, homeLoading, membersLoading, homeError, updateNextShopDate }`

Key details:
- Calls `supabase.rpc('get_user_home_id')` to find the user's home — never queries `homes` directly
- `home: null` means the user exists but has no home yet (direct to setup screen)
- `members` is always an array, never undefined. Use `members.find(m => m.user_id !== user?.id)` to get the partner.
- `updateNextShopDate(date: string | null)` — updates `homes.next_shop_date` for the shopping countdown
- Realtime: subscribes to both `home_members` (partner joins) and `homes` (next_shop_date changes)

### `useShoppingList`

**Returns:** `{ items, isLoading, isError, isAdding, refetch, addItem, toggleItem, deleteItem }`

Key details:
- Items ordered by `created_at DESC` (newest first)
- `addItem` calls Hazel AI for normalization before inserting. On mobile, skip Hazel or call the Claude API directly — see Section 13.
- `toggleItem` has optimistic updates: immediately flips `checked` in the cache, rolls back on error
- `deleteItem` has optimistic updates: immediately removes from cache, rolls back on error
- Both `toggleItem` and `deleteItem` write to `activity_feed` on success

### `useExpenses`

**Returns:** `{ expenses, isLoading, isAdding, isError, refetch, balance, totals, partner, members, addExpense, deleteExpense, settleUp }`

Key details:
- Fetches with `?select=*,expense_splits(*)` — splits are embedded in every expense
- Balance calculation (important — replicate exactly):
  ```
  For each expense:
    Skip if split_type === 'solo'
    For each unsettled split:
      If split.user_id === partner.user_id && expense.paid_by === my_id: I am owed
      If split.user_id === my_id && expense.paid_by !== my_id: I owe
  Positive balance = I am owed. Negative = I owe.
  ```
- Subscribes to both `expenses` and `expense_splits` (no filter on splits since no home_id)
- `settleUp` calls the `settle_up` RPC — never modifies `expense_splits` directly from the client
- `addExpense` calls Hazel AI for category suggestion. For `equal` split: creates splits for all members. For `solo`: no splits created. For `custom`: client is expected to pass split data (not yet implemented in the Mac app, stubs exist).

### `useChores`

**Returns:** `{ chores, choreHistory, isLoading, isError, refetch, isAdding, addChore, completeChore, uncompleteChore, deleteChore }`

Key details:
- `completeChore` calculates the next due date for recurring chores using `date-fns`:
  - `weekly`: `addWeeks(currentDue ?? today, 1)`
  - `monthly`: `addMonths(currentDue ?? today, 1)`
  - `daily`/`once`/`fortnightly`: no due date advancement (only updates `last_completed_at`)
- Completion writes to `activity_feed` with `entity_type: 'chore'` and `action: 'completed "title"'`
- `choreHistory` is a separate TanStack Query fetching from `activity_feed` filtered by `entity_type='chore'` and `action ILIKE 'completed%'`, limited to 100 rows. Used for the completion history display and streak calculation.
- `addChore` has optimistic updates (adds a temporary chore immediately, replaced by server response)

### `useBudget`

**Signature:** `useBudget({ expenses: ExpenseWithSplits[] })` — takes already-loaded expenses as input

**Returns:** `{ summary, allCategories, customCategories, rawBudgets, isLoading, isError, selectedMonth, prevMonth, nextMonth, isCurrentMonth, upsertBudget, deleteBudget, addCustomCategory, deleteCustomCategory }`

Key details:
- Does NOT fetch expenses itself — consumes from the caller to avoid duplicate queries
- `summary` is a `BudgetSummary | null` — null while budgets are loading
- Month navigation: `selectedMonth` starts as current month, `prevMonth()`/`nextMonth()` navigate
- Budget rows are identified by `category` name string — categories are matched case-insensitively
- `upsertBudget` uses `onConflict: 'home_id,category,month'` — safe to call multiple times for the same category/month

`BudgetSummary` structure:
```typescript
interface CategoryBudgetRow {
  category: Category  // { name, emoji, iconName?, color, isCustom? }
  spend: number
  limit: number | null  // null = no budget set for this category
  pct: number           // 0-100, capped at 100
  isOver: boolean
  budgetId?: string
}

interface BudgetSummary {
  budgeted: CategoryBudgetRow[]    // categories with a budget limit set
  unbudgeted: CategoryBudgetRow[]  // categories with spend but no limit
  totalBudget: number
  totalSpend: number
  totalPct: number
}
```

### `useActivityFeed`

**Returns:** `{ items, isLoading, isError, refetch, members }`

Key details:
- Fetches the 50 most recent activity items, ordered `created_at DESC`
- Real-time subscription updates the feed as both partners take actions
- `members` is passed through from `useHome()` so the UI can look up display names and avatar colors from `user_id`

### `useNotifications`

Key details:
- Fetches notifications where `user_id = auth.uid()` (enforced by RLS, but also explicit in the query)
- Ordered by `created_at DESC`
- `markAsRead(id)` — updates `read = true`, optimistic
- `markAllAsRead()` — updates all unread to `read = true`
- `unreadCount` — derived from the fetched data
- Gates macOS notifications on notification preferences (quiet hours, type toggles). On mobile, gate iOS push notifications similarly.

### `useCalendarEvents`

Aggregates chores and expenses into calendar events — no new Supabase queries. Takes chores and expenses as input:

```typescript
interface CalendarEvent {
  id: string
  title: string
  date: string        // YYYY-MM-DD
  type: 'chore' | 'expense'
  color: string
  icon?: string
}
```

For recurring expenses, expands occurrences for the next 6 months using `date-fns` (`addWeeks`, `addMonths`, `addYears`). Returns both a flat sorted `CalendarEvent[]` and an `eventsByDate` record keyed by `YYYY-MM-DD` for calendar grid dot indicators.

---

## 7. Activity Feed Pattern

### How It Works

Activity is written from the application layer using the `logActivity()` helper:

```typescript
// lib/activity.ts — fire-and-forget, never blocks the mutation
async function logActivity({
  homeId, userId, action, entityType, entityId
}: {
  homeId: string
  userId: string
  action: string   // human-readable, e.g. "added milk to the shopping list"
  entityType: string  // "shopping_item" | "expense" | "chore" | "budget" | "expense"
  entityId?: string
}): Promise<void> {
  await supabase.from('activity_feed').insert({
    home_id: homeId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
  })
}
```

Key design decision: `logActivity()` is called **after** the mutation succeeds, in the `onSuccess` handler. It is fire-and-forget — a failure here never surfaces to the user and never blocks the feature. This means activity entries can be silently lost if the app crashes between the mutation and the `logActivity()` call. This is an accepted limitation.

### Which Events Trigger Activity Entries

| User Action | `action` string | `entity_type` |
|-------------|-----------------|---------------|
| Add shopping item | `added {name} to the shopping list` | `shopping_item` |
| Check shopping item | `checked off {name}` | `shopping_item` |
| Remove shopping item | `removed {name} from the shopping list` | `shopping_item` |
| Log expense | `logged £{amount} for {title}` | `expense` |
| Delete expense | `removed the expense "{title}"` | `expense` |
| Settle up (debtor) | `settled up (£{amount})` | `expense` |
| Add chore | `added "{title}" to the chore list` | `chore` |
| Complete chore | `completed "{title}"` | `chore` |
| Delete chore | `removed the chore "{title}"` | `chore` |
| Set budget | `set a £{amount} budget for {category}` | `budget` |

### The Notification Trigger

Every `activity_feed` INSERT automatically creates a notification row for every OTHER home member via the DB trigger. The mobile app benefits from this immediately — when the Mac app user adds a shopping item, the iOS app user gets a notification without any extra work.

### Phase 2 Plan (Deferred)

The original plan was to replace `logActivity()` app-layer calls with DB triggers. This would make activity writing reliable (can't be lost if the app crashes) and remove the burden from every future developer to remember to call it.

**This has been deferred indefinitely.** The reason: activity strings are human-readable and perspective-dependent (e.g. "You settled up"). Reconstructing these in PL/pgSQL from raw row data is fragile and hard to maintain. The current app-layer pattern is acceptable — copy it exactly in the mobile app.

---

## 8. Feature Specifications

### Shopping List

**What it does:** A shared, real-time grocery shopping list. Both partners add items, check them off in the store, and delete them when done. Items have categories that group them in the store.

**Data model:** `shopping_items` — name, quantity, category, checked, added_by, checked_by

**Business logic:**
- Items ordered newest first by `created_at`
- When an item is checked off: sets `checked = true`, `checked_by = user.id`. When unchecked: sets both back to null/false.
- Category grouping: when items have categories, they are grouped under collapsible headers in alphabetical/store-order. Items without categories fall under "Other".
- Next shop date: stored on `homes.next_shop_date`. Displayed as a countdown ("Shopping in 3 days / tomorrow / today / overdue").

**Hazel AI (Mac only):** When adding an item, the title is sent to Claude Sonnet for normalisation (corrects capitalisation, extracts quantity, suggests a shopping category). On mobile, either skip Hazel or call the Claude API directly from a serverless function — never call Claude from the mobile client with an exposed API key.

**What's not supported:** Quantity as a number (stored as free text string), reordering items, aisle-specific ordering.

### Expenses

**What it does:** Tracks shared household spending with Splitwise-style splitting and a running balance showing who owes whom.

**Data model:** `expenses` + `expense_splits` + `settlements`

**Business logic:**

*Split types:*
- `equal`: amount divided by number of members. Each member gets a split row. The person who paid has their split marked `settled = true` immediately.
- `custom`: custom split amounts. Client currently creates equal splits as a fallback — custom split UI exists but creation of custom splits is not yet implemented end-to-end.
- `solo`: personal expense for visibility only. No splits created. Does not affect balance.

*Balance calculation:*
- Positive balance = you are owed money
- Negative balance = you owe money
- Calculated from unsettled `expense_splits`, not raw expense amounts
- `solo` expenses are completely excluded from balance

*Settle up:*
- Call `settle_up(p_home_id, p_debtor_id, p_creditor_id, p_amount, p_note)` RPC
- This atomically marks all debtor's unsettled splits as settled AND creates a settlements record
- Never modify `expense_splits` directly — always use the RPC

**What's not supported yet:** Editing an existing expense, custom split creation UI (the data model supports it, the form doesn't yet).

### Budget

**What it does:** Monthly per-category budget limits with spend tracking against existing expense data.

**Data model:** `budgets` (per-home, per-category, per-month limits) + reads from `expenses`

**Business logic:**
- Budgets are per month (stored as `YYYY-MM-01`)
- Spend is calculated by summing expense amounts for the selected month, grouped by category
- Progress is displayed as a percentage bar with colour progression: under 60% → success, 60-80% → faint warning, 80-100% → warning, over → destructive
- Categories come from `BUILT_IN_CATEGORIES` + `home_custom_categories`

**What's not supported:** Multi-month budget targets, automatic recurring budget rollover, projected end-of-month calculation (originally planned, not implemented).

### Chores

**What it does:** Shared task list for household chores. Supports assignments, due dates, recurrence, and completion history.

**Data model:** `chores`

**Business logic:**
- Completion on recurring chores advances the `due_date` by the recurrence interval
- `last_completed_at` is reset to current time on completion; reset to null on uncomplete
- `completed_by` tracks who completed each chore
- Completion history is derived from `activity_feed` filtered by `entity_type='chore'` and `action ILIKE 'completed%'`
- Streaks: calculated from `last_completed_at` — a simple "completed N weeks in a row" based on `last_completed_at` vs expected next completion date
- Overdue: a chore with a `due_date` in the past and `last_completed_at` before the due date is overdue. Sort overdue chores to the top.

**What's not supported:** Completing a specific historical occurrence (completing today doesn't log yesterday's due), custom recurrence intervals (just daily/weekly/monthly).

### Calendar

**What it does:** Aggregates chores with due dates and recurring expenses into a calendar view. Also serves a webcal:// iCal subscription for Apple Calendar.

**Data model:** Derived from `chores` and `expenses` — no separate calendar table

**Business logic:**
- Client-side aggregation only — `useCalendarEvents` hook
- Recurring expenses expanded for 6 months forward
- Each chore's `due_date` becomes a calendar event
- iCal feed: served by a Supabase Edge Function (`supabase/functions/calendar-feed/index.ts`) authenticated by `homes.calendar_token` — no auth header required (Apple Calendar can't send one)
- `homes.calendar_last_fetched_at` is updated by the Edge Function on every GET — the app shows "Synced" if this is within 3 hours

**Mobile note:** Apple Calendar sync is macOS-specific. On iOS, consider adding the webcal URL to the iOS Calendar app, or just skip the calendar sync feature for v1 mobile.

### Activity Feed

**What it does:** A chronological log of everything that happens in the home. Both partners see each other's actions as they happen.

**Data model:** `activity_feed`

**Business logic:**
- Fetch 50 most recent items
- Display: actor's name + action string + timestamp
- Real-time: new items appear without refresh
- Cannot be deleted or modified

### Settings

**Profile:** Display name + avatar (colour and icon). 12 colours, 25 Lucide icons. Persisted to `home_members`. Default avatar: first letter of display name in `#7F77DD`.

**Household:** Home name, invite code (with share button), member list with avatars. Invite code sharing generates a `roost://join?code=<code>` deep link.

**Notifications:** Per-type toggles (chores, expenses, shopping, settlements), quiet hours. Persisted to `notification_preferences`.

**User Preferences:** Week start (Monday/Sunday), time format (12h/24h), currency, date format. Persisted to `user_preferences`.

**Hazel:** Toggle AI normalization per context (shopping, expense, chore, budget). Persisted to localStorage — NOT to the database.

**Account:** Change email (requires re-authentication OTP), change password (requires re-authentication OTP), leave home, delete account.

---

## 9. Design System

The mobile app must feel like it belongs to the same family as the Mac app. Same warmth, same palette, same aesthetic — adapted for iOS.

### Core Design Philosophy

Roost is inspired by the video game *Hozy*: the feeling of a well-lived home. **Warm over sterile. Comfortable over corporate. Cozy over clinical.** Every design decision reinforces that managing a household together should feel joyful, not like work.

### Color Palette

All values from `theme.css`. These are the source of truth.

#### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#ebe3d5` | App background — noticeably warm cream, never white |
| `--foreground` | `#3d3229` | Primary text — warm dark brown, not black |
| `--card` | `#f2ebe0` | Card surfaces — very creamy off-white |
| `--card-foreground` | `#3d3229` | Text on cards |
| `--primary` | `#d4795e` | Terracotta — CTAs, active states, the heart of the app |
| `--primary-foreground` | `#f2ebe0` | Text on primary buttons |
| `--secondary` | `#9db19f` | Sage green — secondary actions, supportive UI |
| `--secondary-foreground` | `#3d3229` | Text on secondary elements |
| `--muted` | `#ddd4c6` | Subtle backgrounds |
| `--muted-foreground` | `#6b6157` | Secondary/helper text |
| `--accent` | `#e8d5bc` | Peachy-amber — hover states, subtle highlights |
| `--accent-foreground` | `#3d3229` | Text on accent |
| `--destructive` | `#c75146` | Muted terracotta-red — even destruction feels warm |
| `--destructive-foreground` | `#f2ebe0` | Text on destructive |
| `--success` | `#7fa087` | Forest green |
| `--warning` | `#e6a563` | Warm amber |
| `--info` | `#9db19f` | Sage (reuses secondary) |
| `--border` | `rgba(61, 50, 41, 0.15)` | Subtle warm borders |
| `--input-background` | `#e3d9ca` | Form field backgrounds |
| `--ring` | `rgba(212, 121, 94, 0.3)` | Terracotta focus ring |

#### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#0f0d0b` | Near-black with warmth — candlelit atmosphere |
| `--foreground` | `#f2ebe0` | Cream text |
| `--card` | `#1a1816` | Darker cards |
| `--primary` | `#d4795e` | Terracotta unchanged |
| `--secondary` | `#7a8c7c` | Muted sage |
| `--muted` | `#2a2623` | Dark warm neutral |
| `--muted-foreground` | `#a39a8f` | Softer secondary text |
| `--border` | `rgba(242, 235, 224, 0.1)` | Light border on dark |
| `--input-background` | `#1f1c19` | Dark inputs |

#### Chart / Data Visualization Colors (same in both modes)

1. `#d4795e` — Terracotta
2. `#9db19f` — Sage
3. `#e6a563` — Warm amber
4. `#b88b7e` — Clay pink
5. `#7fa087` — Forest green

### Typography

**Font:** DM Sans — geometric sans-serif with humanist warmth, rounded letterforms.

On iOS, load DM Sans as a custom font. The fallback stack is system-ui.

**Weights:** Only two — 500 (medium) for headings/labels/buttons, 400 (normal) for body/inputs. Never bold (boldness feels aggressive against the warm palette).

**Scale:**
- Page titles: 2xl (24px equivalent)
- Section headings: xl (20px)
- Card titles: lg (18px)
- Body / labels / buttons: base (16px)
- Line height: 1.5 throughout

### Spacing and Layout

**Border radius:** Noticeably rounded — 14px base, scale down to 10px for small elements. Cards and containers feel soft, not sharp.

**Spacing:** Generous. Cards have substantial padding (equivalent to `p-6`). Lists have comfortable item gaps. The UI never feels cramped even with a lot of data.

**iOS-specific layout:** Tab bar instead of sidebar. Suggested tab order: Dashboard → Shopping → Expenses → Chores → Calendar → Settings. Budget can be reached from Expenses or via its own tab (optional).

### Animation Philosophy

Animations are **smooth, intentional, and never distracting**. They provide feedback and maintain spatial continuity.

**Timing:**
- Page transitions: 400ms with smooth easing
- Modals/sheets: 250ms ease-out
- List items: 300ms ease-out
- Interactive elements: 150-200ms

**Easing functions:**
- Smooth (page transitions): `cubic-bezier(0.43, 0.13, 0.23, 0.96)`
- Snappy (spring interactions): `cubic-bezier(0.34, 1.56, 0.64, 1)` — slight overshoot
- Ease-out (opening elements): `cubic-bezier(0.16, 1, 0.3, 1)`

**Motion patterns:**

Page transitions (vertical slide):
```
enter: { opacity: 0, translateY: 8 } → { opacity: 1, translateY: 0 } — 400ms
exit:  { opacity: 1, translateY: 0 } → { opacity: 0, translateY: -8 } — 300ms
```

Modal/sheet (scale + rise):
```
enter: { opacity: 0, scale: 0.95, translateY: 20 } → { opacity: 1, scale: 1, translateY: 0 } — 250ms
```

List items (slide in from top):
```
enter: { opacity: 0, translateY: -10, scale: 0.95 } → { opacity: 1, translateY: 0, scale: 1 } — 300ms
exit:  { opacity: 1, scale: 1, translateX: 0 } → { opacity: 0, scale: 0.9, translateX: -20 } — 200ms
```

Checked items: fade to 60% opacity, scale to 0.98, strikethrough animates from 0% to 100% width.

On React Native, use `react-native-reanimated` v3 or `expo-haptics` for spring animations. The same principles apply.

### Member Avatars

Users choose from:
- **12 avatar colours** (the `avatar_color` field in `home_members`): the Mac app uses a set including `#7F77DD` (default lavender-blue), terracotta, sage, amber, etc.
- **25 Lucide icon options** (the `avatar_icon` field): if null, show the first letter of `display_name`

The avatar system is the same on mobile. Show a coloured circle with either the icon or the initial.

---

## 10. Environment Variables

### Mac App

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The `VITE_` prefix is for Vite (the Mac app's bundler). These are the only two env vars the app needs to connect to Supabase.

Additionally for the Hazel AI feature:
```bash
MAIN_VITE_ANTHROPIC_API_KEY=your-anthropic-key
```
This lives in the Electron main process and is never exposed to the renderer.

### Mobile App (Expo)

Expo uses a different env var naming convention. When using `expo-constants` or `react-native-dotenv`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The `EXPO_PUBLIC_` prefix makes vars available to JavaScript. This is the Expo equivalent of `VITE_`.

**Important:** The Supabase URL and anon key are the same values as the Mac app — this is the same Supabase project. Copy the values from the Mac app's `.env` file.

**Never expose the Anthropic API key in the mobile app.** If implementing Hazel on mobile, route calls through a Supabase Edge Function or a separate serverless function that holds the key server-side.

---

## 11. Known Technical Decisions

These decisions were made deliberately on the Mac app and must be respected in the mobile app.

### Zod as Single Source of Truth

TypeScript types are ALWAYS derived from Zod schemas via `z.infer<typeof schema>`. Never write types separately. The Zod schema validates every response from Supabase — if the data doesn't match the schema, an error is thrown.

This matters because: if a migration changes a column type or adds a nullable column, the schema must be updated first. If the schema doesn't match the DB, `z.array(schema).parse(data)` throws and surfaces the mismatch immediately rather than silently passing bad data through the app.

### RLS Always Enforced at DB Level

Row Level Security policies are the authoritative data access control. Application-level checks (checking `home_id` in code) are secondary and optional. The database must always be the guard.

Never disable or relax an RLS policy to make something easier to code. If you find yourself wanting to query `homes` directly without going through `get_user_home_id()`, use a SECURITY DEFINER function instead.

### Feature-Grouped Code Structure

Shopping code lives together: `hooks/useShoppingList.ts`, `schemas/shopping.ts`, pages and components in a shopping folder. Do not reorganise by file type (all hooks in one folder, all schemas in another). The feature grouping makes it easy to reason about a feature in isolation.

### TanStack Query for Server State

All Supabase data fetching goes through TanStack Query (React Query v5). This handles:
- Caching with 5-minute stale times
- Deduplication of concurrent requests
- Background refetching
- Loading and error states

Do not fetch Supabase data with raw `useEffect` + `useState`. Use TanStack Query consistently.

### Optimistic Updates Pattern

Mutations that affect list data (toggle, delete, add) use TanStack Query's optimistic update pattern:
1. `onMutate`: cancel in-flight queries, snapshot current state, apply optimistic update, return snapshot
2. `mutationFn`: actual network call
3. `onError`: restore snapshot (rollback)
4. `onSettled`: invalidate to re-fetch fresh data from server

This makes the UI feel instant. The rollback ensures consistency if the server rejects the operation.

### The `logActivity()` Pattern

Every mutation that changes household data must call `logActivity()` in `onSuccess`. This is not optional — it's how the activity feed and notifications work. Write it even if it feels repetitive.

### Invite Code Case-Insensitivity

Invite codes are generated as lowercase hex by `md5()`. The UI may present them in uppercase. Always compare invite codes case-insensitively. The `join_home_by_invite_code` and `get_home_by_invite_code` functions both use `lower()` on both sides (migration 0020).

### `expense_splits` Has No `home_id`

When subscribing to realtime on `expense_splits`, do not pass a filter. The table has no `home_id` column — the RLS policy joins through `expenses`. Subscribe without a filter and let RLS scope what the client receives.

### Activity Strings Are Human-Readable and Perspective-Dependent

The `action` field in `activity_feed` contains strings like "You settled up" or "Tom settled up" which are perspective-dependent. This is why DB triggers can't reconstruct them. Accept this limitation — write activity strings from the app layer in `onSuccess`.

### Google OAuth Uses Implicit Flow on Mac, PKCE on Mobile

This is a critical difference. The Mac app's `supabase.ts` sets `flowType: 'implicit'` because PKCE's code exchange step requires a server round-trip that breaks when the system browser redirects back to the Electron app. On mobile, Expo handles this correctly — use the default PKCE flow.

---

## 12. Current Phase and Status

### Completed Phases

| Phase | What | Status |
|-------|------|--------|
| 0 | Foundation (Electron + React + Supabase + Schema) | ✅ March 2026 |
| 1 | Core features (auth, shopping, expenses, chores, activity feed, settings) | ✅ March 2026 |
| 2 | Stability (optimistic updates, Realtime, error handling, Zod hardening) | ✅ March 2026 |
| 2.5 | Depth (budget, dashboard, calendar, chore improvements, shopping enhancements) | ✅ March 2026 |
| 3 | Beauty (Figma Make design system, full UI migration, warm cream palette) | ✅ March 2026 |
| 3.5 | Polish & Stability (smoke test, bug fixes, notifications, settings, AI) | ✅ March 2026 |

### In Progress

**Phase 4 — Open the Doors:**
- Self-serve account creation ✅
- Invite link deep links ✅
- Push notifications (macOS) ✅
- Home naming ✅
- Account settings (change email, change password, delete account) ✅
- Auto-update (electron-updater) ✅
- Release pipeline with draft gate ✅
- **Pending:** Code signing with Developer ID certificate
- **Pending:** Two-account realtime test (verify sync works on two separate machines simultaneously)

### What the Mobile App Should Prioritise

Based on daily use patterns, build in this order:

1. **Auth** — signup, login, join (invite code), Google OAuth
2. **Shopping list** — highest daily use. Add, check, delete. Category grouping.
3. **Expenses** — balance view, add expense, settle up
4. **Chores** — view, complete, add
5. **Activity feed** — read-only, real-time
6. **Notifications** — receive push notifications when partner does something
7. **Settings** — profile avatar, household, preferences
8. **Budget** — view current month spend vs limits
9. **Dashboard** — summary view of all the above
10. **Calendar** — last priority, complex aggregation

The shopping list and activity feed are the features used most days. Get those right first.

---

## 13. Session Log Summary

A condensed account of discoveries, fixes, and decisions made during development that the mobile developer needs to know to avoid repeating mistakes.

### Critical Fixes That Affect Both Platforms

**Invite code case sensitivity (Migration 0020):** The invite code is generated by `md5()` which produces lowercase hex. The Mac app UI presented codes in uppercase. When the partner typed the code, the case mismatch caused "Invalid invite code". Fixed by normalising both sides with `lower()` in `get_home_by_invite_code` and `join_home_by_invite_code`. Always compare invite codes case-insensitively.

**Home creation RLS race condition (Migration 0010):** When a new user signs up and immediately tries to insert a home, there's a race between the Supabase session becoming available and the RLS check running. The direct INSERT into `homes` failed with an RLS error. Fixed by moving home creation into the `create_home_for_user` SECURITY DEFINER RPC which runs as postgres and bypasses RLS entirely. Always use the RPC, never INSERT into `homes` directly from the client.

**Account deletion (Migration 0012):** `DELETE FROM auth.users` via SQL does not work in Supabase — you get a permissions error. Account deletion must go through `auth.admin.deleteUser()` in a Supabase Edge Function with the service role key. The `delete_account()` DB function now only calls `leave_home()` — the actual auth user deletion is in the Edge Function.

**`expense_splits` RLS needs a join (Migration 0001):** This table has no `home_id` column. The original RLS policies correctly join through `expenses` to check home membership. Do not add a `home_id` column to this table — it would break the cascade model and the settle_up RPC which iterates all splits by `user_id` across expenses.

**Solo split type (Migration 0009):** The DB originally only allowed `'equal'` and `'custom'` in the `split_type` CHECK constraint. The code was updated to include `'solo'` but the DB migration was missed, causing a constraint violation when solo expenses were added. Always keep the DB CHECK constraint in sync with the Zod enum.

**Settled splits and balance (discovered in Phase 2):** The balance calculation must iterate `expense_splits`, not raw expense amounts. An expense paid 3 months ago with a £25 partner split that has since been settled should have zero contribution to the current balance. Using raw amounts would double-count settled expenses. The Mac app correctly uses `split.settled` to filter, but this was a subtle bug in early versions.

### Architecture Decisions Made During Development

**Centralised RealtimeManager (Phase 2):** Early versions had each hook creating its own Supabase channel. When the same table was subscribed to by two components, the first to unmount called `removeChannel()` and silently killed the other's subscription. The manager with ref-counting fixed this. The mobile app must replicate this pattern — never call `supabase.channel()` directly from a hook, always go through the manager.

**TanStack Query stale times (Phase 2):** Using `staleTime: Infinity` was considered (since realtime handles freshness) but rejected. If realtime breaks, the data would become stale without the user knowing. The default TanStack Query behaviour (5-minute stale time + background refetch) provides a safety net. Leave this at the default.

**Optimistic updates (Phase 2):** Initially, mutations waited for the server round-trip before updating the UI. This felt slow on a shopping list (checking off an item had a noticeable delay). Optimistic updates were added for toggle, delete, and add — the UI updates immediately, rolls back if the server rejects. This is the correct pattern for any mutation that changes list membership.

**AppContext adapter layer (Phase 3):** When the Figma Make UI was migrated in, it used a broad `AppContext` that exposed all data via one context. The real hooks (useShoppingList, useExpenses, etc.) were wired behind this adapter. This avoids prop drilling but creates a large surface area. The mobile app should use hooks directly — AppContext was a migration-specific concession, not a recommended pattern.

**Hazel AI via Electron IPC (Phase 3.5):** The Claude API key lives in the Electron main process. The renderer calls `window.api.normalize(text, context, categories)` which goes through IPC to the main process. This is Electron-specific. On mobile, the API key cannot live in the app binary. Options: (1) skip Hazel on mobile for v1, (2) route through a Supabase Edge Function that holds the key, (3) use a serverless function. Never put the Anthropic API key in a React Native app.

**Notifications via DB trigger (Phase 3.5, Migration 0007):** Notifications are created automatically by the `on_activity_inserted` trigger — no client code required. This was a deliberate choice to make notifications reliable. Every `logActivity()` call automatically notifies the partner. The mobile app gets this for free — just subscribe to the `notifications` table in Realtime and show a badge/push notification.

**Google OAuth implicit flow vs PKCE (Phase 1):** Supabase defaults to PKCE for OAuth. PKCE requires a code exchange step that works fine in web browsers but breaks when the system browser needs to redirect back to Electron (the code exchange would require a server that Electron doesn't have). Fixed by setting `flowType: 'implicit'` in the Supabase client. On mobile, PKCE works correctly because the OS handles the custom URL scheme redirect — use PKCE on mobile.

**Calendar token authentication (Session 9):** The iCal Edge Function initially required a Supabase JWT in the Authorization header. Apple Calendar cannot send auth headers when subscribing to a webcal:// URL. Fixed by using `verify_jwt = false` in `supabase/config.toml` and the `--no-verify-jwt` flag on deploy. The authentication is entirely via the `calendar_token` UUID in the URL — anyone with the token URL can access the calendar feed. This is intentional (the same model as Google Calendar private feeds).

**Quiet hours cross-midnight support (Session 9):** Quiet hours like `22:00` to `08:00` span midnight. Naive time comparison (`start < end`) fails here. The check must handle the overnight range: a notification at 23:30 is in the quiet hours range of `22:00–08:00` even though `23:30 > 08:00`. Use this logic:
```typescript
function isInQuietHours(start: string, end: string): boolean {
  const now = new Date()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const current = now.getHours() * 60 + now.getMinutes()
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  if (startMin > endMin) {
    // Overnight range: quiet if current >= start OR current < end
    return current >= startMin || current < endMin
  }
  return current >= startMin && current < endMin
}
```

**Room name as plain text on chores (Migration 0013):** Chores store the room as a plain text string (not a FK to `home_rooms`). This was intentional — if a user renames "Living Room" to "Lounge", existing chores should keep their label. A FK would either orphan the chore or silently rename it. The mobile app should follow the same pattern: display `chore.room` as-is without trying to resolve it to a `home_rooms` record.

**Migration 0015 never actually ran (discovered in Session 8/9):** The `home_room_groups` and `room_group_members` tables were supposed to be created by migration 0015, but the migration was marked as applied via `supabase migration repair` without actually running. Migration 0019 was a fix that actually created these tables idempotently. The mobile app should check if these tables exist before relying on them — the `useRoomGroups` hook handles this gracefully with an empty state.

### Things That Don't Work Yet (Known Gaps)

- **Two-account realtime test not completed:** The realtime architecture is correct in theory but hasn't been verified with two simultaneously active sessions on separate devices. This is the first thing to test with the mobile app — add an item on the Mac, verify it appears on iOS within 1-2 seconds.
- **Custom expense splits:** The data model supports custom splits (the `createExpenseSchema` has `split_type: 'custom'`) but the expense creation form doesn't have a custom split entry UI. Currently falls back to equal splits.
- **Calendar sync on mobile:** The webcal:// subscription and Apple Calendar integration is macOS-specific. Not relevant for the iOS app's initial build.
- **Code signing:** The Mac app is unsigned (bypasses Gatekeeper because both Macs have it installed with established trust). This is deferred to Phase 5. Not relevant for iOS.

---

*End of ROOST_MOBILE_CONTEXT.md — last updated 24 March 2026*
