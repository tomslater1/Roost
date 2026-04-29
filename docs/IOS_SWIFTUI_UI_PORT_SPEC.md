# Roost iOS Native SwiftUI UI Port Specification

**Purpose:** This document is a full UI/UX handoff for porting the existing Roost Mac app into a native iPhone app in Swift/SwiftUI.

**Audience:** Codex working inside Xcode, building the iOS UI layer.

**Goal:** Recreate the feel, information architecture, visual language, and interaction patterns of the Roost Mac app as faithfully as possible on iPhone, while making thoughtful adaptations for touch, small screens, safe areas, tab navigation, sheets, and native iOS expectations.

**Important framing:** This is **not** a redesign. It is a **considered native iPhone translation** of the current Roost Mac app. Preserve tone, hierarchy, warmth, and behavior. Adapt layout patterns where macOS conventions do not fit on iPhone.

---

## 1. Product Intent

Roost is a shared household dashboard for **exactly two people**. It is not a team app, not a family organizer, and not generic productivity software. Every screen should feel like a calm, warm, private shared home space.

The app should feel:

- Warm, soft, and domestic
- Calm and uncluttered
- Personal rather than corporate
- Native to iOS, not web-like
- Function-first, but still beautiful

When porting from Mac to iPhone, preserve these truths:

- The app is built around **two people sharing one home**
- Shared data is the center of the product
- Real-time updates matter
- The UI should feel quiet and trustworthy, not loud or game-like
- Hierarchy is driven by spacing, weight, and surface treatment more than by hard contrast

---

## 2. High-Level iPhone Porting Principles

### 2.1 What must stay the same

Keep these elements as close to the Mac app as possible:

- Warm cream / terracotta / sage design language
- Gentle rounded surfaces
- Clear card-based information grouping
- Dashboard-first philosophy
- Same page set and same core features
- Same wording/tone where possible
- Same data states: loading, empty, populated, error
- Same semantic emphasis: balance, overdue chores, upcoming items, budget pressure, notifications

### 2.2 What must change for iPhone

Adapt these for mobile:

- Sidebar becomes a **bottom tab bar**
- Desktop top utility bar becomes a **navigation bar + toolbar + sheets**
- Hover behaviors become visible-by-default or swipe/context actions
- Wide multi-column grids collapse into stacked cards or 2-up tiles when space permits
- Dialogs become **sheets** or **confirmation dialogs**
- Dense controls become segmented controls, chips, bottom sheets, and inline sections
- Search becomes a full-screen search surface or `.searchable`

### 2.3 Native iOS over literal pixel matching

Codex should not attempt to force macOS layout metaphors onto iPhone. The goal is:

> “Feels like Roost, but built for iPhone from day one.”

If a Mac pattern conflicts with clear iOS usability, choose the iOS-native presentation while preserving Roost’s tone and structure.

---

## 3. Source of Truth for the Existing Mac App

The current Mac app structure is:

- Auth screens
- Main app shell
- Dashboard
- Shopping
- Expenses
- Budget
- Chores
- Calendar
- Pinboard
- Settings (multiple subpages)
- Global overlays: notifications, settle up, add expense, add chore, quick add, onboarding, update/offline/trial banners

The route map in the Mac app currently includes:

- `/welcome`
- `/join`
- `/setup`
- `/dashboard`
- `/shopping`
- `/expenses`
- `/budget`
- `/chores`
- `/calendar`
- `/pinboard`
- `/settings/profile`
- `/settings/household`
- `/settings/rooms`
- `/settings/budget-categories`
- `/settings/hazel`
- `/settings/notifications`
- `/settings/account`
- `/settings/subscription`

On iPhone, these should be reorganized into tab navigation plus pushed settings/detail screens.

---

## 4. Recommended iPhone Information Architecture

## 4.1 Primary tab bar

Use a 5-tab iPhone tab bar.

### Recommended tabs

1. **Home** → Dashboard
2. **Shopping**
3. **Money** → Expenses as landing view, with Budget accessible in-page
4. **Chores**
5. **More** → Calendar, Pinboard, Settings, Subscription, Household detail screens

This is better than trying to fit 7 desktop destinations into the iPhone tab bar.

### Why this grouping works

- Dashboard and Shopping are highest-frequency destinations
- Expenses + Budget are naturally paired on mobile as “Money”
- Chores deserves top-level prominence
- Calendar, Pinboard, and Settings are important but lower-frequency than the above

## 4.2 More tab structure

The **More** tab should be a grouped list screen with navigation links to:

- Calendar
- Pinboard
- Household
- Rooms
- Notifications
- Hazel
- Subscription
- Account

Settings-related destinations should be pushed inside a navigation stack.

## 4.3 Alternative acceptable variant

If Codex strongly prefers a 6-tab architecture on larger iPhones, this is acceptable:

- Home
- Shopping
- Expenses
- Chores
- Calendar
- More

But the preferred default is still the 5-tab setup above.

---

## 5. App Shell on iPhone

## 5.1 Root container

Use:

- `TabView` for primary navigation
- Independent `NavigationStack` inside each tab
- Global sheets for add flows and settle up
- Global banners/overlays only when necessary

## 5.2 Navigation bar behavior

Each top-level tab root should have a standard iOS navigation bar with:

- Large title where appropriate on first-level screens
- Inline title on scrolled/detail states
- Toolbar actions in top-right

### Navigation title recommendations

- Home → large title optional, but can also use custom greeting header in-scroll with inline nav title hidden/minimal
- Shopping → large title “Shopping list”
- Money → large title “Expenses” or “Money” depending on chosen structure
- Chores → large title “Chores”
- More → large title “More”

## 5.3 Global utility affordances

The Mac top bar contains:

- Search
- Theme toggle
- Notification bell
- Settings shortcut
- User profile trigger

On iPhone:

- **Search**: use `.searchable` or a dedicated search screen launched from Home/More
- **Theme toggle**: move into Settings > Profile or Preferences; do not surface in nav bar
- **Notifications**: bell button in top-right on Home and optionally mirrored in More
- **Settings shortcut**: not needed if More tab exists
- **Profile menu**: move into More / Profile

## 5.4 Offline / update / trial banners

These exist on Mac between top bar and content. On iPhone they should appear as slim inline banners near the top of the scroll content.

Priority order when multiple are present:

1. Offline banner
2. Update banner
3. Trial banner

They should:

- Push content down naturally
- Not cover navigation bars
- Be dismissible where appropriate
- Use subtle animation and not dominate the screen

---

## 6. Design System Translation to SwiftUI

## 6.1 Color system

Translate the existing design tokens directly.

### Light mode

- Background: `#ebe3d5`
- Foreground: `#3d3229`
- Card: `#f2ebe0`
- Primary: `#d4795e`
- Secondary: `#9db19f`
- Muted: `#ddd4c6`
- Muted foreground: `#6b6157`
- Accent: `#e8d5bc`
- Success: `#7fa087`
- Warning: `#e6a563`
- Destructive: `#c75146`
- Input background: `#e3d9ca`
- Border: warm low-opacity brown

### Dark mode

- Background: `#0f0d0b`
- Foreground: `#f2ebe0`
- Card: `#1a1816`
- Primary: `#d4795e`
- Secondary: `#7a8c7c`
- Muted: `#2a2623`
- Muted foreground: `#a39a8f`
- Border: warm low-opacity cream

## 6.2 SwiftUI token recommendation

Define a central theme layer, e.g.:

- `RoostColor.background`
- `RoostColor.card`
- `RoostColor.primary`
- `RoostColor.secondary`
- `RoostColor.muted`
- `RoostColor.success`
- `RoostColor.warning`
- `RoostColor.destructive`
- `RoostColor.border`

Avoid raw color literals in feature views.

## 6.3 Typography

Primary font should be **DM Sans** if bundled correctly in iOS.

Fallback is San Francisco only if necessary.

Weight usage:

- Use `.medium` for headings, labels, buttons
- Use `.regular` for body
- Avoid heavy bold unless truly necessary

Suggested scale:

- Hero/greeting: 28–32 pt
- Page title: 28–34 pt large title area if native nav title is used
- Section title: 20–22 pt
- Card title/stat: 16–18 pt
- Body: 16 pt
- Caption/meta: 12–13 pt

## 6.4 Shape language

Roost should feel visibly rounded and soft.

Recommended radii:

- Primary cards: 20–24 pt
- Inputs: 14–18 pt
- Pills/chips/badges: capsule or 14 pt
- Buttons: 14–18 pt

## 6.5 Borders and depth

Use subtle warm borders and very light shadows.

Preferred depth model:

- Border-first elevation
- Very soft shadow only on sheets/floating surfaces/high-priority cards
- No glassmorphism-heavy look
- No stark white panels

---

## 7. Motion and Interaction Guidance

## 7.1 Motion tone

Animations should be:

- soft
- brief
- intentional
- never flashy

Use animation to communicate state changes, not to show off.

## 7.2 Suggested motion patterns in SwiftUI

- Card entrance: fade + slight upward move
- Modal/sheet content: native sheet presentation plus small internal fade
- Toggle completion: strike-through animation / opacity drop / scale to 0.98
- List insertion: slight move from top + fade
- Badge updates: subtle scale pulse only if it helps

## 7.3 Reduce motion

Respect iOS reduce motion settings.

---

## 8. Shared Component Mapping: Mac → SwiftUI

## 8.1 Cards

Nearly every Mac screen relies on cards. On iPhone, cards remain the core structural primitive.

Use cards for:

- summary tiles
- list containers
- grouped section surfaces
- status blocks
- pinned note surfaces
- settlement summaries

## 8.2 Buttons

Map variants to SwiftUI styles:

- Primary button → filled terracotta background, cream text
- Secondary button → sage or muted filled surface
- Outline button → bordered cream/muted background
- Ghost button → text-only / transparent
- Destructive button → muted red fill or red text depending on severity

## 8.3 Badges / pills

Badges are heavily used in the Mac app. Preserve them in iPhone UI.

Use for:

- overdue
- recurring
- personal/shared split
- Nest/free status
- budget status
- seen/unseen pinboard note state
- recipient targeting

## 8.4 Inputs

Inputs should feel soft and embedded.

Use:

- filled warm input background
- subtle border
- generous height
- no harsh outlines

## 8.5 Date picker

Mac app uses a custom dropdown DatePicker. On iPhone:

- Prefer a custom compact trigger that opens a sheet or popover-style date selector
- Avoid full inline wheel unless the context specifically suits it
- A calendar-style picker is best for chores, shopping dates, and expenses

## 8.6 Dialogs and modals

Map to:

- `sheet` for form-heavy flows (Add Expense, Add Chore, compose Pinboard note)
- `confirmationDialog` or destructive confirmation sheet for deletions
- focused modal/card sheet for Settle Up

## 8.7 Empty states

Every empty state should include:

- icon in a soft rounded container
- heading
- short explanation
- optional CTA

Tone must remain warm and encouraging.

## 8.8 Loading states

Prefer skeletons or redacted placeholders over spinners.

---

## 9. Detailed Screen-by-Screen Specification

## 9.1 Auth Flow Overview

The Mac app has:

- Welcome (sign in + sign up switching)
- Join
- Setup

On iPhone, these should remain distinct but feel native and full-screen.

### General auth layout principles

- Full-screen warm background
- Centered but slightly top-weighted content, not perfectly vertically centered on tall phones
- App icon at top
- Clear title and subtitle
- Single card/form surface beneath
- Bottom helper links
- Keyboard-safe layout with scroll behavior

---

## 9.2 Welcome / Sign In / Sign Up

### Purpose

Handle existing users signing in and new users creating accounts.

### Recommended iPhone structure

Use one auth screen with a segmented toggle or pager between:

- Sign In
- Create Account

This preserves the Mac screen’s combined feel while being more efficient on iPhone.

### Shared content

- App icon
- Title/subtitle that changes with selected mode
- Google sign-in button near top
- divider “or”
- email/password form below

### Sign In form

Fields:

- Email
- Password

Actions:

- Primary CTA: Sign in
- Secondary text button: Create account
- Optional helper if email unconfirmed

### Sign Up form

Fields:

- Email
- Password
- Confirm password

Actions:

- Primary CTA: Create account
- Secondary text button: Sign in instead

### Important states

- idle
- loading
- validation error
- oauth error
- email confirmation sent
- email already exists
- not confirmed yet

### UX notes

- Keep Google sign-in prominent but not oversized
- Password matching feedback should appear inline
- Use quiet status surfaces rather than aggressive alerts

---

## 9.3 Join Home Screen

### Purpose

Partner joins an existing home via invite code.

### iPhone layout

Single scrolling form with:

- title: Join a home
- subtitle: Use the invite code your partner shared
- invite code field first and visually emphasized
- name field
- email
- password
- primary CTA: Join home
- secondary link: Create a new home instead

### Special behavior

- If launched from deep link, prefill invite code
- Invite code should use monospaced treatment or increased tracking

---

## 9.4 Setup Screen

### Purpose

Post-auth setup for users without a home, especially Google OAuth users.

### iPhone layout

Card or grouped form with:

- name field
- choice between:
  - Create new home
  - Join with code
- if join selected, reveal invite code field
- CTA updates based on mode

### Native adaptation

Use a segmented control for:

- Create Home
- Join Home

This is cleaner than two desktop-style toggle buttons.

---

## 10. Home Tab / Dashboard

The Dashboard is the soul of the app and should be treated as the most important mobile screen.

## 10.1 Core purpose

At-a-glance household state without navigating elsewhere.

## 10.2 iPhone structure

Use a vertically scrolling dashboard with this order:

1. Greeting header
2. Status summary line
3. Balance hero card
4. Two-up mini summary cards (Shopping / Chores)
5. Budget snapshot card
6. Upcoming events card
7. Activity feed card
8. Quick actions area (optional as floating/toolbar/sheet)

## 10.3 Greeting header

Display:

- “Good morning, Tom” / afternoon / evening
- Short secondary summary such as:
  - “3 items to buy · 2 chores overdue”
  - fallback: “Here’s what’s happening at home”

This should feel warm and personal, not dashboard-corporate.

## 10.4 Balance hero card

This should remain the strongest visual card on the Home screen.

States:

- All settled up
- You’re owed
- You owe

Content:

- primary amount headline
- relationship text (“Alice owes you” / “You owe Alice”)
- monthly household spend secondary figure if available
- CTA: Settle up only when relevant

### iPhone treatment

- Full-width card
- Prominent amount
- status pill
- CTA button inside card footer

## 10.5 Shopping and Chores mini cards

On iPhone these should sit either:

- side by side on Pro Max / Plus widths if comfortable, or
- stacked on smaller devices

### Shopping card

Show:

- item count
- tiny subtitle
- next shop date countdown if available

### Chores card

Show:

- overdue count
- “nothing overdue” or due soon text

Tap should push into respective tab destination.

## 10.6 Budget snapshot card

Show only if meaningful budget data exists.

Include:

- month label
- spend vs limit
- progress bar
- over-budget category warning if relevant
- Manage/View button

## 10.7 Upcoming events card

Show next 5 events max.

Rows include:

- icon
- title
- relative day text
- optional meta

## 10.8 Activity feed card

This should remain chronologically ordered and lightweight.

Rows include:

- actor name
- action text
- short timestamp

Do not make this visually noisy.

## 10.9 Quick actions on iPhone

The Mac app has explicit quick-add buttons on the dashboard. On iPhone, recommended options:

### Preferred

Use a floating circular **+** button or top-right add button that opens a confirmation menu / sheet:

- Add shopping item
- Add expense
- Add chore

### Acceptable alternative

Inline “Quick actions” row of pill buttons under the greeting.

---

## 11. Shopping Screen

Shopping is likely the highest-frequency mobile surface. It should feel especially fast and touch-friendly.

## 11.1 Page structure

Recommended order:

1. Navigation title
2. Next shop date strip/card
3. Quick add card
4. Active shopping list by category
5. Completed items section

## 11.2 Next shop date section

On iPhone this should be a compact card or inline row near the top.

Display:

- next shop date or “Set next shop date”
- humanized countdown (“today”, “tomorrow”, “in 3 days”, “date passed”)

Interaction:

- tap opens date picker sheet or compact calendar modal
- include clear/remove action if date is set

## 11.3 Quick add card

This needs to remain frictionless.

Include:

- single text field
- add button
- optional small Hazel helper note if AI exists in iOS build

If AI/Hazel is not in the iOS build initially, keep the UI wording neutral enough that the field still works naturally.

## 11.4 Shopping list grouping

Preserve category grouping from the Mac app.

Each category section should have:

- section header
- collapse/expand behavior
- item count badge

Order categories by supermarket aisle order, matching current Mac behavior.

## 11.5 Item row design

Each shopping item row should include:

- checkbox/toggle on left
- item name
- quantity badge if present
- subtle metadata under item name if needed
- delete via swipe action, not hover

### Important mobile behavior

- Do **not** hide deletion behind hover-only affordance
- Use `swipeActions` for delete
- Tapping row should toggle checked state only if this doesn’t conflict with checkbox usability

## 11.6 Completion treatment

Preserve current premium behavior:

- checked items stay in context
- strike-through animates left to right
- opacity reduces
- completed state feels calm, not harsh

## 11.7 Empty/loading/error states

Must exist explicitly.

---

## 12. Expenses / Money Screen

## 12.1 Recommended mobile structure

If using a **Money** tab, the root should be a segmented screen:

- Expenses
- Budget

If using a dedicated Expenses tab, Budget can be a secondary section button or segment near top.

### Preferred structure

Root = Expenses first, with a segmented control:

- Expenses
- Budget

This gives budget strong visibility without consuming a tab bar slot.

---

## 12.2 Expenses screen layout

Order:

1. Summary/balance card
2. Stats row/cards
3. Filters
4. Expense list
5. Settlement history

## 12.3 Summary/balance card

This is the hero section.

Show:

- current balance amount
- “Nothing owed either way” or who owes whom
- settle up CTA if relevant

This card should visually echo the Mac app: calm but important.

## 12.4 Stats row

On iPhone, use either:

- three compact cards horizontally scrollable, or
- stacked 2+1 layout

Metrics:

- Total spent
- Your share / personal vs shared
- optional partner-paid or household split summary

## 12.5 Filters

Desktop select controls should become iPhone-friendly filters:

- category filter chip or menu
- payer filter chip or menu
- clear filters button if active

Preferred UI:

- horizontal chip row or menu buttons
- bottom sheet filter picker if list of categories is long

## 12.6 Expense row

Each expense row must include:

- title
- badges: recurring, split type, category if present
- payer + date
- amount on trailing side
- your share subtext if shared

Delete action via swipe.

## 12.7 Add expense flow

Present as a medium/large detent sheet.

Fields:

- title
- amount
- category override optional
- paid by
- date
- split type (shared vs personal, or model-aligned naming)
- recurring toggle
- interval if recurring

### Mobile control mapping

- Paid by → segmented control or picker
- Split type → segmented control / two large choice buttons
- Recurring → toggle
- Interval → segmented or picker shown conditionally

The form should be scrollable and keyboard-safe.

## 12.8 Settle up flow

Use a dedicated sheet or card-style modal.

Content:

- title
- who pays whom
- amount
- optional note
- primary CTA: Mark as settled

Keep it simple and reassuring.

## 12.9 Settlement history

Show as a separate section below expenses or in its own grouped card/list.

Rows should include:

- who paid whom
- amount
- date
- note if present

---

## 13. Budget Screen (inside Money or standalone flow)

## 13.1 Overall goal

Budget is an overview layer on top of expenses, not a separate accounting system.

## 13.2 Mobile layout

Keep the Mac structure conceptually, but simplify the surface.

Recommended sections:

1. Month navigation header
2. Overview card
3. Optional analytics cards / charts
4. Category budget rows
5. Expanded category drill-in

## 13.3 Month navigation

Use a centered month label with left/right arrow controls.

If free-tier restrictions exist, present locked states warmly and clearly.

## 13.4 Overview card

Include:

- total spent
- total budget
- remaining or overspend
- progress bar
- short explanatory text

## 13.5 Analytics section

If Hazle/Nest analytics are present, they should appear as:

- six-month spend rhythm chart
- short summary/narrative cards
- top categories list
- forecast card

If unavailable, use warm upgrade gating cards rather than abrupt blocks.

## 13.6 Category rows

Each category row needs:

- category icon/emoji
- name
- spend vs limit
- progress bar if budget exists
- status color
- tap to expand

Expanded state should reveal:

- category stats
- recurring expenses in category
- recent month expenses
- link/button to view expenses for category

Use expansion or navigation push depending on implementation simplicity. Either is acceptable if the result feels clean.

---

## 14. Chores Screen

## 14.1 Structure

Order:

1. Header
2. Suggest button and Add chore button
3. Stats cards
4. Person filter segmented control
5. Overdue section
6. To do section
7. Completed section

## 14.2 Header

Keep subtitle warm and useful.

Examples:

- “Everything’s taken care of”
- “5 tasks keeping the home in motion”

## 14.3 Stats cards

Show:

- To do
- Needs attention
- Completed

On iPhone these can be:

- horizontally scrollable cards, or
- 3 compact cards in a responsive grid

## 14.4 Person filter

Use a segmented control:

- Everyone
- Me
- Partner

## 14.5 Overdue section

Needs visual distinction, but still within Roost’s warm style.

Use:

- soft destructive tinted background
- section header with count badge
- same chore row pattern as normal, just elevated urgency

## 14.6 Chore row

Each row includes:

- completion button
- title
- frequency badge if recurring
- streak badge if applicable
- assignee state
- room state
- due date state
- last completion metadata if available

### Important mobile adaptations

- Delete via swipe action
- Complete toggle should be easy to hit with thumb
- Metadata can wrap to two lines if needed

### Unassigned chores

Preserve the “Needs someone” / unassigned emphasis.

## 14.7 Add chore flow

Sheet with fields:

- title
- assigned to
- planned date
- frequency
- room
- notes

### Mobile control mapping

- Assigned to → segmented buttons or menu
- Frequency → chips or segmented choices
- Room → chips if limited list, otherwise picker sheet

## 14.8 Suggestions panel

This can appear as:

- a collapsible card inline under the header, or
- a sheet from “Suggest” button

Inline card is closer to current Mac behavior and preferable.

---

## 15. Calendar Screen

## 15.1 Purpose

Show chores, bills, and shop date in one place.

## 15.2 iPhone layout

Order:

1. Header + sync actions if applicable
2. Stats cards
3. Month calendar card
4. Events list panel

## 15.3 Month calendar

Preserve:

- month navigation
- day headers
- event dots
- selected date behavior
- today state

### Mobile behavior

- Tappable day cells
- selected day updates list below
- tapping selected day again deselects

## 15.4 Event dots

Keep color mapping:

- chore → primary
- expense → warm amber / bill color
- shopping → secondary/sage/blue depending system used
- overdue → destructive

## 15.5 Events list below grid

When no date selected:

- show “Coming up”

When date selected:

- show chosen date title
- “Show all” clear action

Rows include:

- icon badge
- title
- relative date badge
- meta text
- recurring note if applicable

## 15.6 Apple Calendar sync on iPhone

This feature may not match the Mac flow exactly.

For v1 iPhone UI:

- Keep a sync section only if backend behavior is ready
- If not, display sync as unavailable / coming later on iPhone while preserving the calendar browsing UI

Do **not** invent complex Apple Calendar account integration if it does not exist.

---

## 16. Pinboard Screen

## 16.1 Purpose

Shared notes pinned around the house context.

## 16.2 iPhone layout

Order:

1. Header + Add note action
2. Summary stats card
3. Filter chips
4. Grid/list of notes

## 16.3 Note layout on iPhone

Prefer a **single-column stacked card list** on iPhone.

Do not preserve multi-column desktop layout on small screens.

Each note card includes:

- author info
- delete action (swipe or menu)
- full note text
- metadata pills (recipient, link, expiry, seen state)
- seen count
- mark as seen action if needed

## 16.4 Add note flow

Present as a large sheet.

Fields:

- note content
- link target type
- link target selection if chosen
- expiry date
- recipient target
- notify or silent toggle
- save CTA

This should feel like composing a thoughtful note, not filling admin fields.

---

## 17. More / Settings Architecture

## 17.1 More root screen

Use grouped list sections.

### Suggested layout

Section: Household

- Household
- Rooms
- Notifications

Section: Tools

- Calendar
- Pinboard
- Hazel

Section: Account

- Subscription
- Profile
- Account

Section header/footer copy can be minimal.

## 17.2 Profile screen

Include:

- avatar preview
- display name editing
- email display
- signed in with Google if applicable
- theme preference if desired

Avatar editing should feel native and visual.

## 17.3 Household screen

Include:

- home name
- invite code
- share/copy invite link
- household member list

Use native share sheet for invite link/code.

## 17.4 Rooms screen

If already supported structurally, present as a clean editable list of rooms and groups.

## 17.5 Notifications screen

Grouped settings style.

Include:

- in-app notifications
- iOS push notifications placeholder/real toggle depending implementation
- chore notifications
- expense notifications
- shopping notifications
- settlement notifications
- quiet hours with time picker

## 17.6 Hazel screen

Explain what Hazel does and allow preference toggles if supported in iOS.

## 17.7 Subscription screen

Need warm, premium-but-soft presentation.

Show:

- Free / Nest state
- trial state
- features list
- manage subscription or upgrade CTA

## 17.8 Account screen

Include:

- change email
- change password
- sign out
- leave home
- delete account

Destructive actions should use native confirmation flows.

---

## 18. Notification UX on iPhone

The Mac app uses a dropdown panel. On iPhone, use a dedicated pushed screen or a sheet.

### Preferred

Tap bell icon → push to **Notifications** screen.

Why:

- More native on iPhone than anchored dropdown
- Better for longer histories
- Better for accessibility

### Notification row content

- icon bubble by type
- text title
- timestamp
- unread dot or unread styling

Mark-as-read can happen on open or on row appearance, matching current app behavior where appropriate.

---

## 19. Search UX on iPhone

The Mac app has a global expanding search field.

On iPhone:

- Use `.searchable` where feasible
- Or a dedicated global search screen accessible from Home / More / nav bar

Search results should be grouped by entity type if possible:

- Shopping
- Expenses
- Chores
- Notes / Pinboard
- Settings destinations if included

---

## 20. Banner Components on iPhone

## 20.1 Offline banner

Compact rounded strip with:

- wifi-off icon
- title: You’re offline
- brief explanatory copy

Should sit inline at top of scroll content.

## 20.2 Update banner

Small surface with message and update action.

## 20.3 Trial banner

Slim but noticeable, not aggressive.

Use warm Nest styling with clear CTA if applicable.

---

## 21. Onboarding Guidance for iPhone

The Mac app includes an onboarding flow. If ported to iOS, it should be lighter.

Recommended approach:

- first-launch guided tips on key tabs
- no overly heavy spotlight choreography unless already implemented cleanly
- keep it brief, skippable, and warm

Suggested focus points:

- Dashboard overview
- Quick add
- Shopping
- Expenses / settle up
- Chores

---

## 22. Accessibility Requirements

Codex should treat this as mandatory, not optional.

## 22.1 Text scaling

- Support Dynamic Type where practical
- Avoid truncating core information too aggressively

## 22.2 Contrast

- Preserve warm palette but ensure readable contrast
- Pay special attention to muted text on warm cream

## 22.3 Touch targets

- Minimum 44x44 pt targets
- Especially for checkboxes, delete affordances, and small toolbar actions

## 22.4 VoiceOver

Ensure semantic labels for:

- badges
- progress bars
- calendar day cells with event counts
- member avatars
- settle-up actions
- completion toggles

## 22.5 Motion sensitivity

- Respect reduced motion

---

## 23. Exact Component Recommendations for SwiftUI

## 23.1 Recommended app structure

- `RoostApp`
- `RootTabView`
- `HomeTabView`
- `ShoppingTabView`
- `MoneyTabView`
- `ChoresTabView`
- `MoreTabView`

Reusable UI:

- `RoostCard`
- `RoostBadge`
- `RoostPrimaryButtonStyle`
- `RoostSecondaryButtonStyle`
- `RoostGhostButtonStyle`
- `RoostSectionHeader`
- `RoostEmptyStateView`
- `RoostSkeletonView`
- `MemberAvatarView`
- `StatusBannerView`
- `BudgetProgressBar`
- `DashboardSummaryCard`
- `CalendarEventRow`
- `ExpenseRowView`
- `ChoreRowView`
- `ShoppingItemRowView`
- `PinboardNoteCard`

## 23.2 Recommended modal/sheet map

- Add Shopping Item → sheet or focused inline composer
- Add Expense → sheet
- Add Chore → sheet
- Settle Up → sheet
- Notifications → pushed screen
- Search → search screen or searchable overlay
- Add Pinboard Note → large sheet

---

## 24. Visual Style Notes per Feature

## 24.1 Shopping

- fastest-feeling screen
- highly tactile
- category headers should feel structured but soft

## 24.2 Expenses

- slightly denser information
- balance card must anchor the screen
- category and split badges important

## 24.3 Budget

- analytical but not sterile
- charts should still feel warm
- avoid generic fintech styling

## 24.4 Chores

- operational but encouraging
- overdue state visible, not alarming
- completion should feel satisfying

## 24.5 Calendar

- informative and quiet
- date grid should not feel cramped

## 24.6 Pinboard

- warm, tactile, almost physical note-board feeling
- cards can feel slightly more expressive than utilitarian screens

---

## 25. State Inventory That Must Exist in iOS Build

Every major data surface needs these states:

## 25.1 Loading

- skeletons matching content shape
- avoid centered spinner-only screens unless initial app bootstrap

## 25.2 Empty

- icon
- heading
- short body copy
- optional CTA

## 25.3 Error

- short explanation
- retry action

## 25.4 Populated

- standard fully-rendered state

## 25.5 Submitting / mutation in progress

- buttons disabled
- loading label changes where appropriate
- optimistic state if supported by data layer

---

## 26. Copy Guidance

Preserve Roost’s existing copy style.

Copy should be:

- conversational
- restrained
- domestic
- direct
- not cutesy
- not SaaS-like

Examples to preserve:

- “All settled up”
- “Nothing coming up”
- “Add a chore”
- “Shared live for both of you”
- “Everything’s taken care of”

Avoid replacing these with cold/systemic phrases like:

- “No records found”
- “Transaction completed successfully”
- “User has no pending tasks”

---

## 27. Non-Negotiable Parity Expectations

The iPhone app should preserve these behaviors visually and structurally:

- household balance remains prominent
- shopping list supports grouped aisles/categories
- chores clearly separate overdue/open/completed
- budget uses progress and pressure states
- calendar shows dots and list details
- pinboard notes show recipient, expiry, and seen state
- notification count/unread state is visible
- same core forms exist for adding chores and expenses
- empty/loading/error states are not skipped

---

## 28. Explicit iPhone Adaptation Decisions for Codex

If Codex must choose between multiple patterns, use these defaults:

1. Use **TabView + NavigationStack** as the shell
2. Use **5 tabs** with Budget nested inside Money and Calendar/Pinboard inside More
3. Use **sheets** for create/edit flows
4. Use **swipe actions** for destructive list actions
5. Use **segmented controls** for short binary/ternary choices
6. Use **cards** as primary layout primitive
7. Use **large title or custom greeting header**, not both competing heavily
8. Use **single-column layouts** on iPhone unless two-up cards clearly fit
9. Use **searchable or pushed search screen**, not a desktop-style anchored search bar
10. Use **notifications as a screen**, not a popover dropdown

---

## 29. Implementation Priority Recommendation for UI Build

If Codex needs to stage the work, build in this order:

1. App shell + theme tokens + reusable components
2. Auth screens
3. Dashboard/Home
4. Shopping
5. Expenses + Settle Up + Add Expense sheet
6. Chores + Add Chore sheet
7. Budget
8. Calendar
9. Pinboard
10. More / Settings stack
11. Notifications screen
12. Search and polish states

---

## 30. Final Instruction to Codex

Build the iPhone UI as a **native SwiftUI app** that feels unmistakably like Roost.

Do not redesign the product into a generic iOS finance/productivity app.

Do not flatten the visual warmth out of it.

Do not overcomplicate navigation to preserve desktop structure literally.

Instead:

- preserve the hierarchy
- preserve the mood
- preserve the wording
- preserve the importance of shared household context
- preserve the card-based summary surfaces
- preserve the balance between utility and warmth

The best outcome is:

> If someone uses the Roost Mac app and then opens the iPhone app, it should feel like the same product, the same home, and the same design mind — just translated intelligently for a phone.

---

## 31. Short Screen Summary Checklist for Codex

### Auth
- Welcome / Sign In
- Create Account
- Join Home
- Setup

### Primary tabs
- Home
- Shopping
- Money (Expenses + Budget)
- Chores
- More

### More destinations
- Calendar
- Pinboard
- Household
- Rooms
- Notifications
- Hazel
- Subscription
- Profile
- Account

### Global sheets
- Add Expense
- Add Chore
- Add Shopping item or quick add
- Settle Up
- Add Pinboard note

### Global states
- Offline banner
- Update banner
- Trial banner
- Notifications screen
- Search

---

## 32. Final Quality Bar

Before considering the UI port “done,” it should satisfy all of the following:

- Looks recognizably like Roost, not a default SwiftUI prototype
- Feels good one-handed on iPhone
- Reads clearly at a glance
- Preserves the Mac app’s warmth and hierarchy
- Uses native iOS navigation patterns
- Has polished empty/loading/error states
- Handles modal flows cleanly
- Makes Shopping, Balance, and Chores especially strong
- Keeps the app feeling private, calm, and built for two
