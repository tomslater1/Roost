# Roost — Figma Design Brief
*Complete technical specification for every screen, component, and state in the app.*

---

## What This Document Is

This brief covers every page, component, form, dialog, and interaction state that exists in Roost today. It is written for a Figma session — the goal is to give enough technical detail that the structure of every screen can be built without ambiguity, while leaving all visual decisions (colour, type, spacing, tone) entirely to the designer.

Every feature described here is live in the codebase unless explicitly noted as a placeholder.

---

## App Structure Overview

Roost is a **macOS Electron desktop app**. The window is always a standard desktop window — no mobile layout concerns at this stage. The overall chrome consists of:

- A **fixed-width left sidebar** (navigation)
- A **top bar** (notifications + user avatar), pinned to the top of the main area
- A **main content area** (scrollable, per-page content)
- **Global dialogs** that float above everything (settle up, add chore, add expense)

The app has two distinct surfaces:

1. **Auth screens** — full-window, no sidebar, no top bar. Shown before login.
2. **App shell** — sidebar + top bar + main content. Shown after login.

---

## Part 1 — Auth Screens

These screens are full-window, centred, no sidebar. Each has a Roost logomark at the top (a square icon with an "R"), a heading, and a card containing the form.

---

### 1.1 Login

**Purpose:** Returning users sign in.

**Layout:** Centred card, max width ~sm. Logomark above the card, navigation links below the card.

**Card contains:**
1. **"Continue with Google" button** — full-width, outline style, Google icon on the left. Loading state: button text changes to "Opening browser…" and is disabled.
2. **Divider** — a horizontal line with "or" text centred.
3. **Email field** — labelled "Email". Shows inline error below if validation fails.
4. **Password field** — labelled "Password", masked. Shows inline error.
5. **Error banner** — appears above the submit button when the server returns an error. Styled as a bordered error block.
6. **"Sign in" button** — full-width, primary style. Loading state: text changes to "Signing in…", disabled.

**Links below card:**
- "No account? Create one" → routes to /signup
- "Have an invite code? Join a home" → routes to /join

**States to design:** Default, submitting (loading), error (form error + server error).

---

### 1.2 Signup

**Purpose:** New users create an account and a new home. They become the "owner" of that home and receive an invite code to share with their partner.

**Layout:** Same centred card layout as Login.

**Card contains:**
1. **"Continue with Google" button** — same as Login. Google OAuth users skip this form entirely and land on /setup instead.
2. **Divider**
3. **"Your name" field** — labelled "Your name", placeholder "Tom". For the display name shown to the partner.
4. **Email field**
5. **Password field**
6. **Error banner**
7. **"Create account" button** — loading state: "Creating account…"

**Link below card:** "Already have an account? Sign in" → /login

**Note:** On successful signup, the user is automatically assigned a home, given a home_member record with role "owner", and navigated to /dashboard.

**States:** Default, submitting, error.

---

### 1.3 Join (Join a Home)

**Purpose:** The partner who receives an invite code uses this screen. They create a new account and are linked to the existing home automatically.

**Layout:** Same centred single-column layout. No Google option — email/password only.

**Form fields (in order):**
1. **Invite code** — labelled "Invite code", monospaced font, placeholder "e.g. a1b2c3d4". If the user arrives via a deep link (`roost://join?code=xxx`), this field is pre-filled.
2. **Your name** — display name.
3. **Email**
4. **Password**
5. **Error banner**
6. **"Join home" button** — loading state: "Joining…"

**Link below form:** "Creating a new home instead? Sign up" → /signup

**States:** Default, submitting, error (invalid code, existing email, etc.).

---

### 1.4 Setup (Post-Google OAuth)

**Purpose:** Shown exclusively after Google OAuth sign-in. Google users skip the signup form, so they land here to: (a) confirm or set their display name, and (b) choose to create a new home OR join an existing one with an invite code.

**Layout:** Centred card.

**Card contains a single form:**
1. **"Your name" field** — pre-filled with the user's Google display name if available.
2. **"Home" section with a two-button toggle:**
   - "Create new home" — selected by default.
   - "Join with code" — switches the form to show the invite code field.
3. **Invite code field** — only visible when "Join with code" is selected. Same monospaced style as Join page.
4. **Error banner**
5. **CTA button** — "Create my home" when in create mode, "Join home" when in join mode. Loading state: "Setting up…"

**States:** Create mode (default), Join mode (invite code visible), submitting, error.

---

## Part 2 — App Shell (Chrome)

The persistent frame around every main page.

---

### 2.1 Sidebar

**Layout:** Fixed left column, full height, never scrolls. Width is fixed (~220px). Contains:

1. **Logo area** — at the top, with extra top padding to clear macOS traffic light buttons. Shows a small square icon (the "R" logomark) and the word "Roost".
2. **Main navigation** — a vertical list of nav items. Each item: icon on the left + label. Items in order:
   - Dashboard (grid/house icon)
   - Shopping (shopping cart icon)
   - Expenses (receipt icon)
   - Budget (piggy bank icon)
   - Chores (checkbox/tick icon)
   - Calendar (calendar icon)
   - DishBoard (crossed utensils icon)
3. **Settings** — pinned to the bottom, separated from the main nav by a divider line.

**Nav item states:**
- **Default:** muted text, no background.
- **Hover:** subtle background tint, slightly brighter text.
- **Active (current page):** tinted background (primary colour at low opacity), primary-coloured text, medium font weight.

---

### 2.2 Top Bar

**Layout:** Thin horizontal bar pinned to the top of the main content area, full width. Fixed height (~44px). Right-aligned contents:

1. **Notification bell button** — icon button. Has an unread count badge (a small number circle in the top-right corner of the icon) when there are unread notifications. Badge shows "9+" when count exceeds 9. Active state: button background becomes muted/filled when the panel is open.
2. **User display name** — small text, the current user's display name.
3. **User avatar** — a small coloured circle with the user's initials. Colour comes from the user's `avatar_color` field (assigned when account is created).

**Notification panel** — drops down from the bell button, positioned absolute top-right. Described fully in Section 5.1.

---

### 2.3 Offline Banner

Appears between the top bar and the page content when the device has no internet connection. Animated in/out (height + opacity). Contains:

- A wifi-off icon
- "You're offline" — primary label
- "Showing saved data — any changes will sync when you reconnect" — secondary text

The banner disappears when connectivity is restored. The app continues to show the last cached data while offline.

---

## Part 3 — Main Pages

---

### 3.1 Dashboard

**Purpose:** The true home screen. A single view where both people can see everything that matters at a glance — no need to navigate to other pages for status. Read-only: it surfaces information but does not replace the dedicated pages. Updates in real time.

**Layout:** Single centred column, max width ~xl. Scrollable. Cards stacked vertically with consistent gaps.

**Page header:**
- **Greeting** — personalised, time-aware: "Good morning, Tom" / "Good afternoon" / "Good evening". Uses the user's first name.
- **Subtitle** — a live one-line status summary. Shows the most pressing things that need attention: "3 items to buy · 2 chores overdue". If nothing is urgent: "Here's what's happening at home".

---

**Balance Card** — full-width card. The most important piece of information on the page.

- **States:**
  - **All settled up:** Muted text. Shows "All settled up" in a neutral style. No settle-up button.
  - **You're owed:** Positive visual treatment. Shows "You're owed £XX.XX" with partner's name below ("Alice owes you"). A "Settle up →" button appears on the right.
  - **You owe:** Warning visual treatment. Shows "You owe £XX.XX" with partner's name below ("Owed to Alice"). "Settle up →" button appears.

- **Bottom strip** (conditional — only shown when monthly spend > 0): A secondary line at the bottom of the card showing "£XXX.XX household spend this month".

- **Loading state:** Three skeleton lines.

---

**Shopping + Chores — 2-column grid:**

**Shopping Snapshot Card** (clickable — navigates to /shopping):
- Label: "Shopping" with a shopping cart icon.
- Large number: count of unchecked items.
- Secondary text: "X items on the list" (or "1 item on the list").
- Small tertiary line: next shop date formatted as "Shopping today", "Shopping tomorrow", "Next shop: 12 Mar", or "No date set".
- Loading state: skeleton.

**Chores Snapshot Card** (clickable — navigates to /chores):
- Label: "Chores" with a check-square icon.
- Large number: count of overdue chores. Shown in red/destructive colour when > 0.
- Secondary text: "overdue" or "nothing overdue".
- Tertiary line: "X due in 3 days" (if any are due within 3 days) or "All clear".
- Loading state: skeleton.

---

**Budget Snapshot Card** (conditional — only shown when at least one budget limit has been set):
- Header: current month name + "budget" (e.g. "March budget"), with a "Manage →" link on the right that navigates to /budget.
- Body: "£XXX.XX of £XXX.XX" spend vs limit.
- Progress bar: fills based on percentage. Green when healthy, amber when approaching limit (>80%), red when over.
- Warning line (conditional): "X categories over budget" — only shown when at least one category exceeds its limit.

---

**Upcoming Events Card** — aggregates events from the next 7 days:
- Header: "Next 7 days" label with a calendar icon.
- **Empty state:** "Nothing coming up this week"
- **Populated state:** List of up to 5 events. Each event row:
  - A small icon in a muted square (icon varies by event type: check-square for chores, receipt for expenses, shopping cart for shopping)
  - Event title (truncated)
  - Date on the right ("Today", "Tomorrow", or "Fri 14 Mar")
  - Optional meta text below the date (e.g. expense amount or assignee name)
- Loading state: skeleton rows.

Event types that appear here:
- **Chore** — any chore with a due_date in the next 7 days.
- **Expense** — any expense with a date in the next 7 days.
- **Shopping** — the home's next_shop_date if it falls within the window.

---

**Activity Feed Card** — a card wrapping the activity feed component. Described fully in Section 5.2.

---

### 3.2 Shopping

**Purpose:** The shared grocery/shopping list. Both users see the same list in real time. When one person checks something off, the other sees it update immediately.

**Layout:** Single centred column, max width ~xl. Scrollable.

**Page header:**
- Title: "Shopping list"
- Subtitle: "Updates live for both of you"

---

**Next Shop Date card** — a slim card at the top:

- **No date set state:** Shows "Next shop: Set date" — the "Set date" text is a clickable link that opens editing mode.
- **Date set state:** Shows "Next shop: Thursday 14 Mar" (or "Today" / "Tomorrow" as appropriate). Two icon buttons appear on hover: a pencil (edit) and an X (clear).
- **Editing mode:** The date text is replaced by a DatePicker component. Alongside it: a green checkmark button (save) and an X button (cancel).
- A shopping cart icon leads the entire row.

---

**Add Item Form card:**
- Text input: "Add an item…" placeholder. Autofocused.
- Submit button: a "+" icon button to the right of the input. Disabled while the mutation is pending.
- **Category picker** — a horizontally scrollable row of pill/chip buttons below the input:
  - "✕ None" pill — deselects any category.
  - One pill per shopping category: Produce, Dairy, Bakery, Meat & Fish, Frozen, Drinks, Snacks, Household, Personal Care, Other. (These are the fixed categories — the list in the codebase.)
  - Selected pill: highlighted (primary tint background, primary text).
  - Unselected pill: muted text, border.
  - The category selection persists between submissions so you can quickly add multiple items from the same aisle.

---

**Shopping List card:**

**Loading state:** 4 skeleton rows.

**Error state:** An error message with a "Try again" / retry button.

**Empty state:**
- A centred icon (shopping cart in a rounded square)
- "Your list is empty" heading
- "Add the first item above — it'll appear for both of you instantly" body text

**Populated — Flat view** (when no items have categories assigned):
- Items in a simple vertical list. Each item row:
  - Checkbox (checked = item is done)
  - Item name. If checked: strikethrough text, muted colour.
  - Optional quantity: "× 2" shown after the name in muted small text.
  - Trash icon button — appears on hover only, right-aligned.
- Items enter/exit with animation (list item variants).

**Populated — Grouped view** (when at least one item has a category):
- Items are sorted into category groups (known aisle order, then unknown alphabetically, then "Other").
- Each group has a collapsible header:
  - A chevron icon (down = expanded, right = collapsed) + category name + item count on the right.
  - Clicking the header collapses/expands the group with animation.
- Within each group: same item row structure as flat view.

**"Done" section** (appears below the unchecked items when any items are checked):
- A divider line.
- "Done (X)" label.
- All checked items listed flat (no grouping).

Items animate in and out of the list as they are added, checked, or deleted.

---

### 3.3 Expenses

**Purpose:** Track shared bills and costs. See who has paid what, what the current balance is, and settle up when needed.

**Layout:** Single centred column, max width ~2xl. Scrollable.

**Page header:**
- Title: "Expenses"
- Subtitle: "Shared bills and costs"
- **"Add expense" button** — top-right, small, primary style. Opens the Add Expense dialog.

---

**Summary Card** — full-width card with two sections:

**Top section — Stats row (3 columns, divided by vertical lines):**
1. **You paid** — with an up-right arrow icon. Shows total amount paid by the current user.
2. **[Partner name] paid** — with a down-left arrow icon. Shows total amount paid by partner.
3. **Total** — wallet icon. Shows combined total.

**Bottom section — Balance row:**
- Same visual logic as the Dashboard Balance Card (positive/negative/neutral treatment).
- Full sentence: "[Partner] owes you £XX.XX" / "You owe [Partner] £XX.XX" / "You're all square".
- **"Settle up →" button** — appears on the right when there is an outstanding balance and a partner is linked.

---

**Expense List card:**

**Loading state:** 3 skeleton rows.

**Error state:** Error + retry.

**Empty state:**
- Receipt icon in rounded square.
- "No expenses yet"
- "Log a shared cost and Roost will track who's owed what"

**Populated state — two sections:**

**"One-off" section** (header: "One-off" + count badge + subtotal on right):
- One-off expenses listed individually.

**"Recurring" section** (header: "Recurring" + count badge + subtotal):
- Subdivided into **Weekly**, **Monthly**, **Yearly** sub-labels.
- Only the sub-labels that have entries are shown.

**Each expense row:**
- Title (truncated).
- Meta line below title (smaller text): "[Payer] paid · DD MMM YYYY".
- Optional badges on the meta line:
  - **"you owe £X.XX"** — amber pill, shown when the current user owes their share on this expense (and they didn't pay).
  - **"treat" + heart icon** — rose/pink pill, shown when split type is "solo" (one person is treating the other — no split).
  - **"Due DD MMM"** + clock icon — shown for recurring expenses, shows the next due date. Amber if due within 3 days, muted otherwise.
- Amount — bold, right-aligned.
- Trash icon — appears on hover, right-aligned.

---

**Settlement History card:**

- Header: "Settlement history" (uppercase label style).
- **Empty state:** "No settlements yet — settle up to clear your balance"
- **Loading state:** 2 skeleton rows.
- **Populated state:** Each row:
  - A circle icon (handshake icon, emerald/green tint background).
  - "You paid [Partner]" or "[Partner] paid you" — bold name, muted verb.
  - Optional note below name in small muted text.
  - Amount (bold, emerald/green) and date (small, muted) right-aligned.
- Shows first 3 settlements by default. If there are more: a "Show all X settlements" link below. Clicking it expands to show all, then changes to "Show less".

---

### 3.4 Budget

**Purpose:** Track monthly household spending against set limits, broken down by category. Not a replacement for Expenses — an overview layer on top.

**Layout:** Single column, max width ~xl.

**Page header:**
- Title: "Budget"
- Subtitle: "Track your monthly household spend"
- **"Manage budgets" button** — small outline button with a settings icon, links to /settings (where budget limits are configured). Top-right.

---

**Month navigation:**
- Left/right chevron buttons with the month name centred between them ("March 2026").
- The right chevron is disabled and visually greyed out when viewing the current month (can't navigate into the future).
- Navigating back through past months works freely.

---

**Loading state:** A tall skeleton card + 4 smaller skeleton rows.

---

**Total Budget Card** (appears at the top when budgets are configured):

**No budgets set state:** "No budgets set for this month — add a limit to any category below" — centred muted text in a card.

**Budgets set state:**
- Three-column stats row divided by vertical lines: **Total budget** | **Spent** | **Remaining**.
  - Spent amount: coloured red when over budget, amber when near limit, default otherwise.
  - Remaining amount: emerald/green if positive, red (with a minus sign) if over budget.
- **Progress bar** — fills as spend approaches the limit. Green → amber (>80%) → red (>=100%).
- Caption below bar: "£XX.XX of £XX.XX" or "Over budget by £XX.XX".

---

**Category Budget Rows** (one per category that has expenses or a budget limit):

**Budgeted category row:**
- Category emoji + coloured category name badge (pill shape, colour matches category's assigned colour).
- Spend amount on the right: "£XX.XX / £XX.XX" (spent / limit). Spend amount goes red when over limit.
- Progress bar (same green→amber→red logic).

**Unbudgeted category row** (categories with spend but no limit set):
- Same layout but no progress bar. Shows "no limit" in small italic text instead.

---

**Empty state** (no expenses AND no budgets this month):
- "No expenses this month" heading.
- "Log some expenses and set up your budget limits in Settings to start tracking." — with "set up your budget limits in Settings" as a link to /settings.

---

### 3.5 Chores

**Purpose:** Manage household chores. Assign them, track due dates, mark them done, and see what's been completed recently.

**Layout:** Single centred column, max width ~xl.

**Page header:**
- Title: "Chores"
- Subtitle: "What needs doing around the house"
- **"Add chore" button** — top-right, primary style. Opens the Add Chore dialog.

---

**Chore Board card:**

**Loading state:** 3 skeleton cards (each with a title skeleton and a couple of pill skeletons).

**Error state:** Error + retry.

**Empty state:**
- Clipboard icon in rounded square.
- "No chores yet"
- "Add something that needs doing — assign it and track when it's done"

**Populated state:**

Chores are sorted: overdue first → due today → future (sorted by date) → no due date (sorted by created date, newest first).

**Each Chore Card:**
- Title — the chore name.
- Optional description — smaller muted text below the title.
- **Pills row** (wrapping flex row, below the title):
  - **Assignee pill** — shows the assigned member's display name in a muted rounded pill. If unassigned: a dashed-border pill with a user-minus icon and "Needs someone".
  - **Due date pill** — shows the date (e.g. "14 Mar"). If overdue: red background, "Overdue · DD MMM" text.
  - **Recurrence pill** — only shown for recurring chores. Blue/primary tint background, a circular arrow icon + "Weekly" or "Monthly".
  - **"Done X ago" pill** — only shown when `last_completed_at` is set. Shows relative time ("Done 2 days ago").
- **Action buttons** (right-aligned, appear on hover):
  - Trash icon button — deletes the chore.
  - Tick/check-circle icon button — marks it as complete. Primary colour tint on hover.

---

**Recently Done card** (conditional — only shown when there is chore completion history):
- Header: "Recently done" (uppercase label style).
- Up to 5 most recent completions. Each row:
  - Avatar circle (coloured, shows initials of who completed it).
  - "[Name] [action text]" — e.g. "Tom completed Hoover the living room".
  - Relative time on the right ("2 days ago").

---

### 3.6 Calendar

**Purpose:** A unified calendar view showing upcoming chores and expenses. Lets both users see what's coming up and sync with Apple Calendar.

**Layout:** Single centred column, max width ~xl.

**Page header:**
- Title: "Calendar"
- Subtitle: "Upcoming chores and bills"
- **"Sync with Apple Calendar" button** (conditional — only shown on macOS when a calendar token exists):
  - Small outline button with a calendar icon.
  - Secondary note below it: "Updates automatically every hour".
  - Clicking it opens a `webcal://` URL in the system browser, which prompts the user to subscribe in Apple Calendar.

---

**Loading state:** Two tall skeleton blocks.

**Error state:** Error + retry button.

---

**Month Grid card:**

- **Month navigation:** Left chevron | "Month Year" | Right chevron. A "Today" pill button appears when viewing any month other than the current one — clicking it returns to today's month.
- **Day headers:** Mo Tu We Th Fr Sa Su (Monday first).
- **Day cells:** A 7-column grid. Each cell:
  - Day number.
  - **Event dots** — up to 3 coloured dots below the number when events fall on that day. A "+X" overflow indicator if more than 3.
  - Dot colours vary by event type (chore = primary, expense = emerald/green, recurring expense = amber, shopping = sky/blue, overdue chore = red/destructive).
  - **Today:** day number shown in primary colour (bold).
  - **Selected day:** filled background (primary colour), white text.
  - Hover state on unselected days.
- **Legend row** at the bottom: small coloured dots with labels — Chore, Expense, Recurring, Shopping, Overdue.

Clicking a day cell **selects** that day. Clicking the same day again deselects it.

---

**Overdue Section** (conditional — only shown when overdue events exist):
- Header: "Overdue · X" in destructive/red colour (uppercase label style).
- Bordered card with a red/destructive border.
- Each overdue event as an Event Row (see below).

---

**Upcoming List card:**

- **Default mode** (no day selected): Header "Upcoming (30 days)". Shows all non-overdue events in the next 30 days.
- **Selected day mode**: Header changes to the selected date ("Today", "Tomorrow", or "Fri 14 Mar"). "Show all" link appears on the right to clear the selection.
- Events grouped by date. Each date group has a date label above its events (only shown in default mode — hidden in single-day view).

**Empty states:**
- No day selected, no upcoming events: Calendar-check icon + "Nothing coming up in the next 30 days".
- Day selected, no events: "Nothing on this day".

**Event Row** (used in both Overdue and Upcoming sections):
- Coloured circle icon (icon + background tint varies by type: check-circle for chore, receipt icon for expense, refresh/cycle icon for recurring expense, shopping cart for shopping).
- Event title (truncated).
- Optional meta text below the title (e.g. amount for expenses, assignee for chores).
- **"Recurring" badge** — amber pill on the right, only shown for recurring expenses.

---

### 3.7 DishBoard (Coming Soon)

**Purpose:** A placeholder tab for a planned integration with DishBoard (Thomas's meal planning app). When the integration is built, it will push meal ingredients to the Roost shopping list automatically. The tab is fully present in the sidebar from day one, establishing the integration as a first-class feature.

**Layout:** Full centred column, vertically centred in the viewport.

**Content (single card-like panel):**
1. **Icon treatment** — two rounded squares side by side with a connecting arrow:
   - Left: DishBoard icon (crossed utensils / fork+knife).
   - Arrow connector.
   - Right: Roost "R" logomark.
2. **"In development" badge** — a small pill with an animated pulse dot + "In development" label.
3. **Heading:** "DishBoard integration"
4. **Description:** A short explanation of what the integration does.
5. **Feature cards** — 3 cards, each with an icon + title + description:
   - "Meal plan sync" — when you plan a meal in DishBoard, its ingredients appear instantly in your Roost shopping list.
   - "Smart deduplication" — already have milk on the list? DishBoard won't add it twice.
   - "Real-time across devices" — plan dinner on your phone in DishBoard, see the shopping list update in Roost immediately.
6. **Footer note:** "This tab is a placeholder while the integration is built. It will be a first-class feature when DishBoard is ready."

---

### 3.8 Settings

**Purpose:** Configure your profile, manage the household, set budget limits, and handle account actions (sign out, leave home, delete account).

**Layout:** Single centred column, max width ~md. Scrollable. Sections stacked vertically with gaps between them.

**Page header:**
- Title: "Settings"
- Subtitle: the home name (e.g. "Our Home").

**Loading state:** Several skeleton blocks stacked.

---

**Section pattern:** Each settings section has an uppercase section label above it and a rounded card containing its rows.

---

**"Your profile" section:**

- **Avatar + name row:**
  - A coloured circle avatar (background = user's `avatar_color`, content = user's initials).
  - **Display name editor** — inline editable. Default state shows the name with a pencil icon that appears on hover. Clicking edit shows an input field with a checkmark save button and an X cancel button. Keyboard: Enter saves, Escape cancels.
  - User's email address in small muted text below the name.
- **"Signed in with Google" badge** (conditional — only shown for Google OAuth accounts): a small row with the Google logo and "Signed in with Google" text.

---

**"Invite your partner" section:**

- Explanation text: "Share your invite code or link — your partner enters it on the Join screen."
- **Invite code row:** A row displaying the 8-character invite code in a monospaced font. A "Copy code" button on the right (icon + label). On click: changes to a checkmark + "Copied!" for 2 seconds.
- **Deep link row:** Shows the full invite deep link (`roost://join?code=xxxxxxxx`). Link icon on the left, truncated URL. "Copy link" button on the right — same copy feedback as above.

---

**"Household" section:**

- Lists all household members (up to 2). Each member row:
  - Avatar circle (coloured, initials).
  - Display name — with "(you)" annotation for the current user.
  - Role below the name ("owner" or "member") in small muted text.
- **"Waiting for your partner to join…" row** (shown when there is only 1 member) — italic muted text at the bottom.

---

**"Budget limits" section:**

Contains the budget configuration UI:

1. **Category budget list** — one row per category (all categories: built-in + any custom ones). Each row:
   - Category emoji + coloured name.
   - A currency input field on the right (prefixed with "£"). Blank/placeholder if no limit set. Edit and press Enter or click away to save automatically.
   - A trash icon button — only visible when a limit exists for that category. Clicking removes the limit.
   - "current: £XX.XX" text to the right — only shown when a limit exists.
   - Helper text above the list: "Set a monthly limit for each category. Changes save automatically on blur or Enter."

2. **Separator line**

3. **"Custom categories" sub-section:**
   - Header: "Custom categories".
   - List of existing custom categories (if any). Each: emoji + name (coloured) + trash button.
   - **"Add custom category" form:**
     - Name text input.
     - **Colour picker:** A row of small coloured circles. Click to select. Selected circle has a ring/outline + slight scale-up effect.
     - **Emoji picker:** A grid of emoji buttons. Click to select. Selected emoji has a highlighted background.
     - "Add category" button with a + icon.
   - Footer note: "Built-in categories (Groceries, Rent, etc.) are always available and cannot be removed."

Built-in categories (always present, cannot be deleted): Groceries, Eating Out, Transport, Household, Entertainment, Utilities, Rent/Mortgage, Health, Clothing, Subscriptions, Holidays, Other.

---

**"Account" section:**

A list of destructive/account actions, each as a full-width text button row:
1. **"Sign out"** — LogOut icon + "Sign out". Muted text, slightly brighter on hover. No confirmation — signs out immediately.
2. **"Leave home"** — DoorOpen icon + "Leave home". Opens a confirmation dialog.
3. **"Delete account"** — Trash icon + "Delete account". Destructive red text. Opens a confirmation dialog.

**Leave home dialog:**
- Title: "Leave home?"
- Body text explains what will happen. Two variants:
  - If user is the only member: "You'll be removed and the home and all its data will be permanently deleted."
  - If partner is present: "Your partner will keep the home and all shared data."
- A full-width destructive button: "Yes, leave home" / loading: "Leaving…".

**Delete account dialog:**
- Title: "Delete your account?"
- Similar body text explaining consequences (same two variants as above).
- A note: "This cannot be undone."
- Full-width destructive button: "Yes, delete my account" / loading: "Deleting…".

---

## Part 4 — Global Dialogs

These float above all page content. They are driven by global state (Zustand) and can be triggered from any page.

---

### 4.1 Settle Up Dialog

**Purpose:** Confirm that a payment has been made outside the app to clear the outstanding balance.

**Trigger:** "Settle up" button on Dashboard or Expenses page.

**Layout:** Centred modal, max width ~sm.

**Content:**
1. **Title:** "Settle up"
2. **Summary block** — a bordered/muted card:
   - Who owes whom: "[Partner] owes you" or "You owe [Partner]"
   - The amount in large bold text.
3. **Explanation text:** Settlement happens outside the app (bank transfer, cash, etc.). Once the payment is made, tap below to clear the balance. "This can't be undone."
4. **Note field** — optional. Labelled "Note (optional)", placeholder "e.g. Bank transfer, Monzo…".
5. **"Mark as settled" button** — full-width primary. Loading: "Settling…".

**Closing:** Dismiss via the X button, clicking outside, or pressing Escape.

---

### 4.2 Add Chore Dialog

**Purpose:** Add a new chore to the board.

**Trigger:** "Add chore" button on the Chores page header.

**Layout:** Centred modal, standard width.

**Form fields:**
1. **Chore** (required) — text input, "e.g. Hoover the living room". Inline error if empty.
2. **Notes (optional)** — text input, "Any extra details…".
3. **Assign to** — a `<select>` dropdown. Options: "Anyone" (default) + one option per household member ("Me (Tom)" for the current user, partner's name for the other).
4. **Two-column row:**
   - **Repeats** — a `<select>` dropdown. Options: "One-off" (default), "Weekly", "Monthly".
   - **Scheduled for** (label changes to "Starting" when a recurrence is selected) — a DatePicker component. Optional.
5. **"Save chore" button** in the dialog footer. Loading: "Saving…".

**Smart behaviour:** If a recurrence is selected but no date is set, the due date is auto-set to one week (weekly) or one month (monthly) from today.

---

### 4.3 Add Expense Dialog

**Purpose:** Log a new shared expense.

**Trigger:** "Add expense" button on the Expenses page header.

**Layout:** Centred modal, standard width. The form is longer — may need internal scroll or a taller modal.

**Form fields:**
1. **What was it for?** (required) — text input, "e.g. Groceries".
2. **Amount (£)** (required) — number input, step 0.01, "0.00".
3. **Who paid?** — a two-option segmented toggle:
   - "Me" — default.
   - "[Partner name]" — only shown when a partner is linked.
4. **How to split?** — a two-option segmented toggle:
   - "Split 50/50" — default. Means the expense is shared equally.
   - "Treating them" — means one person is paying for the other with no repayment expected (tagged as "treat", shown with a heart icon in the expense list).
5. **Category (optional)** — a 3-column grid of pill/chip buttons (same pattern as shopping categories). "None" option first. Each category pill shows its emoji + name. Selected = highlighted. Scrollable if many options.
6. **Date / Starting from** — a DatePicker. Defaults to today. Label changes to "Starting from" when recurring is toggled on.
7. **Recurring?** — a two-option segmented toggle:
   - "One-off" — default.
   - "Recurring" — reveals the recurrence interval field below.
8. **How often?** (conditional — only shown when "Recurring" is selected) — a three-option segmented toggle: "Weekly" | "Monthly" | "Yearly". Inline validation error if recurring is selected but no interval chosen.
9. **"Save expense" button** in footer. Loading: "Saving…".

---

## Part 5 — Persistent / Overlay Components

---

### 5.1 Notification Panel

**Purpose:** Shows the user's recent in-app notifications from their partner's actions.

**Trigger:** Clicking the bell icon in the TopBar.

**Layout:** A dropdown panel anchored to the bell button, positioned top-right. Fixed width (~320px). Max height with internal scroll.

**Header:** "Notifications" label (uppercase) + X close button on the right.

**Loading state:** 3 skeleton rows.

**Empty state:** Bell icon + "No notifications yet".

**Populated state:** A scrollable list of notification rows, divided by thin lines.

**Each notification row:**
- A coloured circle icon (icon and colour vary by notification type):
  - **chore** — check-circle icon, primary tint.
  - **expense** — receipt icon, emerald tint.
  - **shopping_item** — shopping cart icon, sky/blue tint.
  - **settlement** — handshake icon, emerald tint.
- **Notification text** — the title of the notification. Bold if unread.
- **Relative timestamp** below the text ("2 minutes ago").
- **Unread dot** — a small primary-coloured dot on the far right, only shown for unread notifications.
- **Unread row background tint** — a very subtle tint behind unread rows.

**Auto-mark as read:** All notifications are marked as read the moment the panel opens.

**Closing:** X button, click outside the bell+panel area, or pressing Escape.

The **unread count badge** on the bell icon updates in real time and disappears when all notifications are read.

---

### 5.2 Activity Feed

**Purpose:** A chronological log of everything that has happened in the home. Automatic — no user input required. "Tom checked off milk. · 2 mins ago."

**Usage:** Appears inside the Dashboard (wrapped in a card) and is the main content on the Dashboard below the summary cards.

**Loading state:** 4 skeleton rows (each with an avatar circle, a text line, and a small timestamp).

**Error state:** Error message + retry.

**Empty state:**
- Activity icon in rounded square.
- "Nothing here yet"
- "Activity appears here as you add items, log expenses, and complete chores"

**Populated state:** A list of activity rows. Each row:
- **Avatar circle** — coloured (user's `avatar_color`), shows their initials.
- **Action text** — "[Name] [action]" e.g. "Tom checked off oat milk" or "Alice added a chore: Hoover".
- **Relative timestamp** — right-aligned, small, muted ("2 mins", "1 hr", "3 days ago").

Items animate in at the top when new activity arrives (real-time).

---

### 5.3 DatePicker

**Purpose:** A reusable calendar popup for any date input in the app. Used in: Add Chore form, Add Expense form, Shopping page (Next Shop Date), and anywhere else a date is entered.

**Trigger:** Clicking the date input field.

**Layout:** A popover/dropdown appearing below the trigger input. A compact month grid.

**States of the trigger input:**
- **Empty/no date:** Shows placeholder text ("Pick a date", or contextual text per field).
- **Date selected:** Shows the formatted date.
- **Disabled:** Greyed out, not interactive.

**Popover content:**
- Month navigation: left/right chevron buttons + month + year label.
- Day header row: Mo Tu We Th Fr Sa Su.
- Day grid:
  - **Today:** highlighted with a ring or different text style.
  - **Selected date:** filled primary background, white text.
  - **Other days:** default, hover state.
- Keyboard support: arrow keys navigate days, Enter selects, Escape closes.
- Closes on selection or outside click.

---

### 5.4 Error Boundary

**Purpose:** Catches any unexpected React errors in page content and shows a recoverable error state instead of a white screen.

**Layout:** Full page fallback inside the main content area.

**Content:** An error icon, a "Something went wrong" heading, a "Try reloading" button.

---

### 5.5 Query Error Component

**Purpose:** Inline error state for data-loading failures (Supabase query errors). Used inside list components when a query fails.

**Content:** A short error message (e.g. "Couldn't load the shopping list.") + a small "Try again" / retry button.

---

### 5.6 Toast Notifications (Sonner)

**Purpose:** Transient success/failure feedback after any user action.

**Position:** Bottom-right corner of the window (or bottom-centre — standard Sonner positioning).

**Types:**
- **Success:** Positive confirmation. Examples: "Item added", "Chore saved", "Settled up!", "Name updated".
- **Error:** Failure explanation. Examples: "Failed to add item", "Couldn't save chore".

Toasts appear, persist briefly, then fade out automatically. Multiple can stack.

---

## Part 6 — State Inventory

Every list or data-displaying component has these states. Design all of them.

| State | Description |
|---|---|
| **Loading** | Data is being fetched. Show skeleton loaders — not spinners. Skeletons match the approximate shape of the content. |
| **Empty** | Data loaded successfully but there are no items. Always include an icon, a heading, and 1–2 lines of explanatory text. Optionally include a call-to-action. |
| **Error** | The query failed. Show the `QueryError` component: a short message + retry button. |
| **Populated** | The default rich data state. |

Every **form** or **dialog** has these states:
- Default
- Submitting (button loading, fields disabled)
- Success (dialog closes, toast fires)
- Error (error message appears, form re-enables)

---

## Part 7 — Navigation & Routing Map

| Route | Component | Auth required? | Home required? |
|---|---|---|---|
| /login | Login | No | No |
| /signup | Signup | No | No |
| /join | Join | No | No |
| /setup | Setup | Yes | No |
| /dashboard | Dashboard | Yes | Yes |
| /shopping | Shopping | Yes | Yes |
| /expenses | Expenses | Yes | Yes |
| /budget | Budget | Yes | Yes |
| /chores | Chores | Yes | Yes |
| /calendar | Calendar | Yes | Yes |
| /dishboard | DishBoard | Yes | Yes |
| /settings | Settings | Yes | Yes |

**Auth guard logic:**
- Not logged in → redirect to /login.
- Logged in, no home → redirect to /setup (this is the post-Google OAuth state).
- Logged in, has home → render the AppShell normally.

---

## Part 8 — Real-Time Behaviour

The following actions by one partner are immediately reflected on the other's screen without any refresh:

- Shopping item added, checked, or deleted.
- Chore added, completed, or deleted.
- Expense added or deleted.
- Budget limits changed.
- Activity feed — new events appear at the top in real time.
- Notifications — the bell badge count updates in real time.

This means every list needs to handle **items animating in at the top** (new activity, new items added by partner) and **items disappearing** (deleted by partner, checked off by partner).

---

## Part 9 — Platform Context

Roost runs inside **Electron on macOS**. Design implications:

- The window has macOS traffic lights (red/yellow/green close/minimise/maximise buttons) in the top-left. The sidebar's logo area has extra top padding to clear these buttons. Account for this in any sidebar header design.
- Standard macOS desktop proportions. The window is resizable but designed for a comfortable desktop size — not a browser tab, not a phone. Think ~1200×800 as the comfortable default.
- No mobile layout is needed at this stage.
- The app uses the system font stack where applicable (`-apple-system, BlinkMacSystemFont`).
- macOS scroll bars (auto-hiding) apply in the main content area.

---

## Part 10 — App Character

This is not a SaaS product. It is a private tool for two people. The tone should be:

- **Calm and quiet** — information is surfaced without shouting. Status is communicated through colour and weight, not alerts or pop-ups.
- **Personal** — the app knows both people's names. Everything is phrased for two people ("Updates live for both of you", "Your partner will keep the data").
- **Functional first** — every element earns its place. No decorative elements without purpose.
- **Mac-native** — respects macOS conventions. Keyboard navigation matters. Hover states matter. Nothing should feel like a repurposed mobile app.

---

*End of brief. All features described here are live in the codebase unless explicitly noted as placeholder or conditional.*
