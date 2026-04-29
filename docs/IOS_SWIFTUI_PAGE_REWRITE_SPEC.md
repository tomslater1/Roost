# Roost iOS SwiftUI Full Page Rewrite Specification

**Purpose:** This document is a second, deeper implementation brief for Codex in Xcode. It is specifically about the **internal visual rewrite of every major page**, not just navigation or app structure.

**Intent:** The current iOS UI should be treated as **replaceable**. This is not a tune-up. It is a **full visual rewrite** so the iPhone app becomes a near-carbon-copy of the Mac app’s UI language, hierarchy, surface design, component rhythm, and emotional feel — translated intelligently into native SwiftUI.

**Non-negotiable instruction to Codex:**

> Rebuild each page from the inside out so it looks and feels like the Mac app in iPhone form. Do not preserve existing iOS page layouts just because they already exist. If the current mobile screen is ugly, generic, flat, cramped, or off-brand, replace it completely.

This document focuses on:

- Internal page composition
- Exact card hierarchy
- Visual density
- Spacing rhythm
- Status presentation
- Row design
- Surface treatments
- Control styles
- What to keep/remove from current iOS implementations
- How to make each page feel like Roost rather than “default SwiftUI app”

---

## 1. The Standard for This Rewrite

The finished iOS app should feel like:

- the same product as the Mac app
- the same visual system
- the same product personality
- the same prioritization of information
- the same warmth and softness

But it should **not** feel like:

- a web app squeezed onto a phone
- generic iOS Finance / To Do / Grocery starter templates
- plain `List`-everywhere SwiftUI
- dense utility UI with no hierarchy
- bright white cards and harsh separators
- Apple Human Interface Guidelines defaults without Roost’s personality layered in

### This is the quality bar

Every screen should look like:

- custom-designed
- intentionally layered
- warm and premium
- calm and tactile
- spacious without wasting space
- obviously part of the same family as the Mac app

---

## 2. Global Internal Page Design Rules

These apply to **all pages**.

## 2.1 Replace plain lists with Roost surfaces

Do **not** rely on raw `List` styling as the main visual container for primary screens.

Prefer:

- `ScrollView`
- `LazyVStack`
- custom grouped cards
- rounded section surfaces
- hand-built rows inside soft containers

Use `List` only if heavily restyled and invisible as a default iOS list.

## 2.2 Every screen needs a visual hierarchy of surfaces

Each page should generally have:

1. Header zone
2. Hero / key summary surface
3. Secondary cards or controls
4. Main list/content surface
5. Optional tertiary/supporting section

This layered rhythm is essential to the Mac app feel.

## 2.3 Cards should feel soft, warm, and slightly elevated

Every primary card should use:

- warm cream or dark warm card background
- subtle border
- rounded corners around 20–24 pt
- light shadow only where needed
- internal padding generous enough to breathe

Cards should **not** feel like table cells.

## 2.4 Page rhythm should be generous

Avoid cramped mobile spacing.

Recommended default spacing:

- page outer horizontal padding: `20`
- vertical spacing between major sections: `16–20`
- card internal padding: `16–20`
- chip spacing: `8`
- micro spacing between label and meta rows: `4–6`

## 2.5 Typography hierarchy should stay calm

Use typography, spacing, and surface contrast for hierarchy.

Avoid:

- too many font sizes on one card
- bold-heavy headlines
- bright accent colors used as primary hierarchy mechanism

## 2.6 No generic SF Symbols-only design language

SF Symbols are fine, but they must be wrapped in Roost styling:

- soft icon containers
- tinted backgrounds
- muted status chips
- balanced icon-to-text spacing

The app should not look like a stock Apple sample project.

## 2.7 Swipes replace hover, not hierarchy

On Mac, many secondary actions appear on hover. On iPhone:

- use swipe actions for delete/archive where relevant
- but do **not** hide essential status or metadata behind gestures
- all important state should be visible at a glance

## 2.8 Build every major page as a custom composition

For each page below, Codex should be willing to replace:

- row styling
- surface layout
- section order
- default controls
- spacing
- title treatment

The data can stay the same. The visual shell should be fully rewritten.

---

## 3. Home / Dashboard Full Rewrite

This page must feel like the Mac Dashboard translated into a premium mobile home screen.

## 3.1 What is wrong in a typical bad mobile implementation

Avoid all of these:

- simple list of sections with no hero card
- too much white space at top with no structure
- equal-weight cards everywhere
- dashboard reduced to a set of bland metrics
- activity feed feeling like debug text

## 3.2 Target page feeling

The Home screen should feel:

- welcoming
- personal
- useful within one second
- layered and rich
- quietly alive

## 3.3 Required layout order

1. Greeting block
2. Quick status line
3. Balance hero card
4. Shopping + Chores snapshot row
5. Budget snapshot
6. Upcoming events card
7. Activity card
8. Quick add affordance

## 3.4 Greeting block

This is not just a nav title. Build it as custom in-scroll content.

### Layout

- top-aligned in page content
- large greeting on first line
- supporting line below
- enough top margin to feel calm but not too loose

### Content

- “Good morning, Tom” / afternoon / evening
- subtitle summarizing household state

### Style

- headline should be one of the softest large-type moments in the app
- not huge and shouty
- not plain `.largeTitle` with default nav styling only

## 3.5 Balance hero card

This is the single most important home surface.

### Structure

- top row: icon + “Balance” label + optional status pill
- middle: large amount
- supporting sentence under amount
- lower strip or stat row for month spend / share context
- footer CTA if balance exists

### Visual treatment

- full-width card
- more prominent than all other cards
- tint shifts based on state:
  - neutral when settled
  - success-leaning when you are owed
  - destructive/warning-leaning when you owe

### State details

**All settled**
- still visually satisfying
- amount could be omitted or shown as settled state text
- no CTA button

**You’re owed**
- amount prominent
- supportive line: “Alice owes you”
- settle-up CTA visible

**You owe**
- amount equally prominent
- supportive line: “You owe Alice”
- settle-up CTA visible

## 3.6 Shopping + Chores summary cards

These are not random stats cards. They are mini destinations.

### Shared design rules

- equal height
- rounded, tactile cards
- strong icon-label header
- one prominent number
- two layers of supporting info

### Shopping summary card should show

- unchecked item count
- “items to buy” label
- next shop countdown if present
- optional preview of 2–3 items only if it doesn’t clutter

### Chores summary card should show

- overdue count
- “nothing overdue” or similar if clear
- due soon text where relevant

These should feel tappable and destination-like.

## 3.7 Budget snapshot card

Must visually resemble the Mac app’s budget snapshot.

### Include

- month name
- spend vs limit
- progress bar
- warning line if categories are over budget
- view/manage affordance

### Avoid

- plain progress row with no hierarchy
- generic finance-app style graphing here

## 3.8 Upcoming events card

### Layout

- card title row with icon
- event rows stacked

### Event rows include

- soft icon block
- title
- relative date badge or text
- optional meta

### Empty state

- “Nothing coming up this week” or equivalent warm phrasing

## 3.9 Activity card

The activity feed must feel real-time and alive, not like admin logs.

### Row structure

- actor emphasis on name
- action sentence
- timestamp in smaller muted text

### Styling

- simple, compact, readable
- subtle dividers or spacing, not thick separators

## 3.10 Quick add on Home

The Mac app uses explicit quick actions. iPhone should retain that spirit.

Preferred options:

- floating plus button anchored bottom-right above tab bar
- or a top-right add button opening a custom action sheet/menu

Menu items:

- Add shopping item
- Add expense
- Add chore

---

## 4. Shopping Page Full Rewrite

This must become one of the best-feeling pages in the app.

## 4.1 The page should feel like

- the app you use in the supermarket
- fast
- tactile
- aisle-aware
- calm but highly functional

## 4.2 Required page structure

1. Header
2. Next shop date card/strip
3. Add item card
4. Active grouped list card(s)
5. Done section

## 4.3 Header treatment

Use:

- title “Shopping list”
- soft subtitle: “Shared live for both of you” or equivalent

Avoid over-designing the nav bar. The content should carry the tone.

## 4.4 Next shop date section

This should be a slim but elegant surface.

### Layout

- cart/calendar icon at left
- label + human-readable date
- countdown badge or subtle supporting text
- tap target for edit

### States

- no date set
- date set
- overdue/past date

### Styling

- horizontal pill-card feel
- not a raw date picker row

## 4.5 Add item card

This needs to feel premium and fast.

### Structure

- small section header: Quick add / Add to list
- helper copy under header if Hazel exists
- prominent text field
- add button aligned at end or inline trailing

### Visual treatment

- card inside card or inset composer surface
- field background slightly darker than card
- button looks tactile and primary

## 4.6 Category grouping card design

Each category should feel like its own mini-surface.

### Category header

- chevron
- category name
- small subtitle or count
- badge count at trailing edge

### Card styling

- category block has its own rounded surface
- enough padding to separate from other categories

### Collapse behavior

- smooth but subtle
- expanded by default unless user collapsed it

## 4.7 Shopping item row

Each item row must feel better than a default checklist row.

### Row anatomy

- checkbox circle on left
- item label with medium weight
- quantity badge next to title if present
- metadata line below in tiny muted type
- delete via swipe action

### Visual behavior

- active row: warm surface, subtle hover analog not needed
- completed row: stays in place but gets soft success wash / reduced opacity
- strike-through animates smoothly across text

### Do not do this

- tiny checkbox with hard-to-hit touch target
- raw row separators
- plain one-line rows with all metadata missing

## 4.8 Done section

Completed items should live in a distinct but not overly separated area.

### Include

- “Done” section label with count
- same rows, just softened visually
- optional clear completed action

---

## 5. Expenses Page Full Rewrite

This must feel like the Mac expenses page compressed intelligently, not simplified into a generic ledger.

## 5.1 The page should feel like

- household money, not banking
- shared context first
- balance-focused
- visually structured, not spreadsheet-like

## 5.2 Required structure

1. Header
2. Balance summary hero
3. Supporting stat cards
4. Filter controls
5. Expenses list
6. Settlement history

## 5.3 Balance summary hero

This is the page anchor.

### Layout

- icon + “Balance” label
- optional status pill
- large amount
- supporting line about who owes whom
- CTA or settled state at bottom

### Internal styling

- more prominent than any single expense row
- state-based tinting, matching Mac tone

## 5.4 Supporting stat cards

Need to look custom, not KPI dashboard-y.

### Suggested metrics

- Total spent
- Shared vs personal / your share
- partner-paid or similar useful supporting metric

### Mobile layout

- horizontal scroll or compact stacked layout
- all cards should visually match Home summary cards

## 5.5 Filter controls

Mac uses selects. On iPhone this should feel better.

### Preferred design

- horizontally scrollable chips / filter pills
- tap opens bottom-sheet picker or menu

### Visual treatment

- muted filled pills when inactive
- primary-tinted or accent-tinted when active

## 5.6 Expense list surface

Build this as a full custom card group or repeated rounded rows.

### Expense row anatomy

- title line
- badge row next to title or just below:
  - recurring
  - shared/personal
  - category badge
- metadata line:
  - payer
  - date
  - next due if recurring
- trailing amount
- optional share information under amount if shared

### Visual hierarchy

- title should read first
- amount second
- badges third
- metadata last

### Interaction

- swipe to delete
- tap could open detail in future; if no detail exists, keep tap inert or subtle

## 5.7 Add expense sheet

This should not look like a form made from defaults.

### Build as grouped visual sections

Section 1: Title + optional Hazel note
Section 2: Category override
Section 3: Amount + paid by
Section 4: Date
Section 5: Split type cards
Section 6: Recurring toggle + interval selector
Section 7: Footer actions

### Internal form aesthetics

- use inset rounded groups
- keep each section clearly separated
- avoid endless ungrouped vertical controls

## 5.8 Split type controls

These should be tactile choice cards, not a plain segmented control if the Mac app already gives them visual weight.

Options:

- Shared
- Personal

Each option should include icon + label + one-line helper text.

## 5.9 Settlement history

Should be visibly separate from active expense list.

### Row anatomy

- who paid whom
- date and note
- amount

### Tone

- clean, reassuring, archival

---

## 6. Budget Page Full Rewrite

This page must feel like a warm household budget view, not a fintech dashboard.

## 6.1 The page should feel like

- reflective
- clear
- informative
- not stressful

## 6.2 Recommended internal order

1. Month navigation
2. Overview hero
3. Summary stat cards
4. Chart / rhythm card
5. Hazel / narrative card
6. Needs attention card
7. Top categories card
8. Category rows section

## 6.3 Month navigation strip

Should be custom, centered, and calm.

Include:

- left/right navigation
- month label
- optional lock state / upsell if history gated

## 6.4 Overview hero card

This is the equivalent of the Mac budget top card and should feel weighty.

### Include

- household overview pill
- state pill: healthy / close / over
- spend vs budget headline
- explanatory sentence
- progress bar
- three supporting metric cards embedded or adjacent

### Visual treatment

- card tint changes gently based on budget health
- do not use saturated red/green walls of color

## 6.5 Summary stat cards

Show:

- total spent
- vs last month
- recurring commitments

If Nest-gated data is unavailable, replace the full card content with a warm upgrade card, not a dead placeholder.

## 6.6 Trend chart card

The Mac app uses a simple six-month rhythm view. Preserve that.

### Requirements

- bar comparison of spend vs budget
- warm colors
- compact but legible labels
- no finance dashboard chrome

## 6.7 Hazel forecast / narrative cards

Should feel editorial and warm.

### Not acceptable

- raw AI text dumped in a blank box

### Correct style

- header with icon and title
- summary card
- outlook card
- focus item rows

## 6.8 Needs attention card

This is a great mobile card opportunity.

### Include

- over-budget categories
- close-to-limit categories
- clear status pills
- concise spend vs limit text

## 6.9 Top categories card

Rows should include:

- category name
- bar showing spend relative to top spend
- amount
- small supporting text about limit or recurring spend

## 6.10 Category budget rows

Each row must feel more like a destination than a table record.

### Row anatomy

- icon block
- category title
- status badge
- remaining/overspend text
- trailing amount
- progress bar below
- expand chevron

### Expanded content

- spent / limit / status mini cards
- recurring commitments notice
- expense rows within category
- link to full expenses list filtered by category

---

## 7. Chores Page Full Rewrite

This page should become one of the strongest mobile pages visually.

## 7.1 The page should feel like

- a calm household task board
- not a productivity app
- not a checklist template

## 7.2 Internal order

1. Header
2. Suggest / add controls
3. Stats cards
4. Assignee segmented filter
5. Overdue card block
6. Open chores card block
7. Completed chores card block

## 7.3 Suggest / Add controls

The Suggest button should not look like an afterthought.

### Use

- secondary outlined button for Suggest
- primary button for Add chore

Keep their visual hierarchy aligned with Mac.

## 7.4 Suggestions panel

If opened, it should be a full-quality card.

### Include

- icon + title
- dismiss control
- loading skeleton state
- suggestion chips
- success state after adding

### Feel

- warm and playful, but not gimmicky

## 7.5 Stats cards

Need to feel like household status summaries, not analytics.

Show:

- To do
- Needs attention
- Completed

Use gentle tinting based on status.

## 7.6 Overdue card block

This should be visually distinct and likely the strongest section on the page if it exists.

### Style

- soft destructive wash
- count badge
- slightly elevated importance

## 7.7 Chore row anatomy

This is one of the most important row designs in the app.

Each row should include:

- completion control
- title
- recurrence badge if relevant
- streak badge if relevant
- metadata line containing:
  - assignee or unassigned state
  - room
  - due date
  - last done / completed state
- delete swipe action

### Completion behavior

- visually satisfying
- strike-through animation
- subtle success tint
- no jarring disappearance

### Unassigned state

- must be visibly special
- use icon + “Unassigned” / “Needs someone” style treatment

## 7.8 Open chores block

This should be a main card surface with multiple custom rows inside.

## 7.9 Completed chores block

Should feel calmer and slightly muted, but still clearly part of same page.

---

## 8. Calendar Page Full Rewrite

## 8.1 The page should feel like

- a calm shared planner
- not a raw system calendar clone
- not data-heavy

## 8.2 Internal order

1. Header
2. Sync controls/status
3. Stats cards
4. Calendar month card
5. Events list card

## 8.3 Header and sync section

The sync status and buttons must feel like Roost UI, not developer utilities.

### States

- idle
- opening/subscribing
- pending
- synced
- refreshing

Each should be visually polished.

## 8.4 Stats cards

Show:

- My chores
- Next shop
- Bills this month

These should use the same visual grammar as Home / Chores / Budget stats cards.

## 8.5 Calendar month card

This must be custom and tactile.

### Requirements

- month header with arrows
- day headers
- rounded day cells
- event dots
- today treatment
- selected treatment
- overdue treatment

### The day cell should not look generic

Use:

- rounded corners
- soft fill states
- muted borders
- tiny but readable event dots

## 8.6 Events panel

Below the month grid, show event cards/rows with:

- icon container
- title
- badge for day or overdue state
- meta line
- recurring note if relevant

This panel must be polished enough that users can browse events without opening separate views.

---

## 9. Pinboard Page Full Rewrite

This page has the most room for expressive warmth.

## 9.1 The page should feel like

- a real note board at home
- tactile
- soft
- warm
- a little more expressive than shopping or expenses

## 9.2 Internal order

1. Header + Add note
2. Summary stats card
3. Filter chip row
4. Note card list

## 9.3 Summary stats card

This should use soft gradient or warm tonal layering, similar to Mac styling.

Metrics:

- Live notes
- Permanent
- Needs eyes

## 9.4 Filter chip row

Must look custom and tactile.

Options:

- All active
- Permanent
- Expiring soon
- Show all

## 9.5 Note card anatomy

Each note card should include:

- author dot / name / timestamp
- delete affordance via swipe or menu
- note body text with generous spacing
- metadata pills:
  - recipient
  - linked entity
  - expiry
  - seen/unseen
- seen count
- mark as seen button when relevant

### Visual feel

- cards can use slightly richer backgrounds than utilitarian pages
- but still stay within Roost palette

## 9.6 Add note sheet

Must be fully custom-styled.

### Group into sections

1. Writing area
2. Link target
3. Expiry
4. Recipient targeting
5. Notification mode
6. Footer summary pills + save action

### Writing area

Should feel like writing on a note pinned to a board, not typing in a plain text field.

---

## 10. More / Settings Full Rewrite

The More area should not be a generic list of nav links with no personality.

## 10.1 More root page

### It should feel like

- a warm utilities hub
- still clearly Roost
- grouped and intentional

### Layout

- custom section cards or inset grouped list restyled heavily
- icon-led destination rows
- soft section headers

## 10.2 Profile page

### Must include

- avatar hero area
- editable name row
- email display
- auth provider badge if needed

### Feel

- intimate and personal

## 10.3 Household page

### Must include

- home name area
- invite code card
- share link card
- member rows

### Invite code presentation

- code should feel important and shareable
- use monospaced styling or higher letter spacing
- use native share sheet

## 10.4 Notifications page

### Use grouped card sections

- delivery
- content types
- quiet hours

Do not render as flat toggle soup.

## 10.5 Subscription page

This should feel premium but gentle.

### Include

- current plan hero
- trial state if relevant
- benefits list
- upgrade/manage CTA

### Avoid

- App Store paywall template look

## 10.6 Account page

Destructive actions need clear spacing and hierarchy.

Use:

- normal actions grouped separately from destructive actions
- red only where necessary
- confirmations as native alerts or sheets

---

## 11. Notifications Screen Rewrite

If iPhone uses a dedicated Notifications screen, it must be custom-styled.

## 11.1 Layout

- title
- optional mark-all-read action
- scrollable grouped rows

## 11.2 Notification row anatomy

- icon bubble
- title text
- relative timestamp
- unread dot at trailing edge if needed

### Row styling

- unread gets subtle tint
- read rows quieter

Do not make it look like Messages or Mail. Keep it unmistakably Roost.

---

## 12. Search Screen Rewrite

If a dedicated Search screen is implemented, it should feel like a premium Roost search layer.

## 12.1 Structure

- search field at top
- recent or suggested queries optional
- grouped results by entity type

## 12.2 Result row styling

Use custom rows with:

- icon
- title
- subtype/meta label
- possible destination context

---

## 13. Specific “Do Not Preserve Current iOS UI” Guidance

Codex should assume the current iOS UI is **not sacred**.

Replace these patterns wherever they exist:

- plain `List` rows with default separators
- generic segmented controls with no surrounding hierarchy when choice cards would be better
- white background + floating text with no card grouping
- overuse of default `Form`
- under-designed nav bar headers with no supporting structure
- bland KPI metric cards
- cramped row layouts with tiny metadata
- default sheet forms with no section rhythm
- flat toggle rows that feel settings-generic

The new goal is **Mac Roost in iPhone form**, not “keep existing iOS layout but recolor it.”

---

## 14. Implementation Notes for Codex

For each page rewrite:

1. Rebuild the page composition first
2. Then rebuild primary cards
3. Then rebuild rows
4. Then rebuild modal flows
5. Then tune spacing and states

Use reusable page primitives so the whole app shares the same language:

- `RoostPageContainer`
- `RoostHeroCard`
- `RoostStatCard`
- `RoostGroupedCardSection`
- `RoostRowSurface`
- `RoostInlineBadge`
- `RoostEmptyStateView`
- `RoostSectionTitle`

This rewrite should feel systemic, not page-by-page improvised.

---

## 15. Final Instruction to Codex

Treat this as a **full-page UI rewrite mandate**.

Do not ask, “How can I keep most of the existing iOS page and improve it a bit?”

Ask instead:

> “How would this page look if I were rebuilding the Mac Roost page from scratch as a native SwiftUI iPhone screen?”

That is the standard for every major view.

The finished result should feel like:

- same brand
- same product
- same design system
- same emotional tone
- same prioritization
- same quality bar

Just made for touch, vertical scrolling, and phone-sized reading.
