# Roost iOS — Figma AI Design Specification
### A Complete Visual Blueprint for Native iOS (SwiftUI)

**Version:** 1.0 — March 2026  
**Purpose:** Three sequential prompts for Figma AI to design the complete Roost iOS app — a direct port of the Mac app, adapted intelligently for iPhone.  
**Standard:** Every screen should look like it was designed by the same hand that made the Mac app. Same warmth. Same typography. Same personality. Different form factor.

---

## Before You Begin: The Design System

This section must be applied universally across all three prompts. Every component, every surface, every state is built from these foundations.

---

### Colour Palette

#### Light Mode

| Token | Hex | Usage |
|---|---|---|
| Background | `#ebe3d5` | App-wide page background — warm cream, never white |
| Foreground | `#3d3229` | All primary text — warm dark brown, never black |
| Card | `#f2ebe0` | Card surfaces and elevated panels |
| Primary (Terracotta) | `#d4795e` | CTAs, active states, key moments of importance |
| Secondary (Sage) | `#9db19f` | Secondary actions, supporting elements |
| Muted | `#ddd4c6` | Subtle background fills, section dividers |
| Muted Foreground | `#6b6157` | Secondary/supporting text |
| Accent | `#e8d5bc` | Hover fills, chip backgrounds, subtle emphasis |
| Input Background | `#e3d9ca` | Text input fields, search bars |
| Border | `rgba(61, 50, 41, 0.15)` | Card borders, dividers — always subtle and warm |
| Focus Ring | `rgba(212, 121, 94, 0.30)` | Terracotta glow on focused interactive elements |
| Success | `#7fa087` | Progress bars (under 70%), confirmations, streaks |
| Warning | `#e6a563` | Progress bars (70–99%), upcoming due dates |
| Destructive | `#c75146` | Delete actions, overdue indicators, over-budget states |
| Chart 1 | `#d4795e` | Terracotta — primary chart colour |
| Chart 2 | `#9db19f` | Sage — secondary chart colour |
| Chart 3 | `#e6a563` | Warm amber — third chart colour |
| Chart 4 | `#b88b7e` | Clay pink — fourth chart colour |
| Chart 5 | `#7fa087` | Forest green — fifth chart colour |

#### Dark Mode

| Token | Hex | Usage |
|---|---|---|
| Background | `#0f0d0b` | Warm near-black — cosy lamplight, never pure black |
| Foreground | `#f2ebe0` | Cream text — candlelight, never pure white |
| Card | `#1a1816` | Elevated card surfaces |
| Primary | `#d4795e` | Unchanged — terracotta holds its character |
| Secondary | `#7a8c7c` | Muted sage adapted for dark |
| Muted | `#2a2623` | Dark warm neutral |
| Muted Foreground | `#a39a8f` | Softer hierarchy text |
| Accent | `#2a2623` | Subtle dark emphasis |
| Input Background | `#1f1c19` | Darker input fields |
| Border | `rgba(242, 235, 224, 0.10)` | Subtle light borders |

---

### Typography

**Font:** DM Sans — imported via Google Fonts or bundled. Geometric sans-serif with humanist warmth. Clear without being sterile, modern without being cold.

**Fallback:** `system-ui`, `-apple-system`, `sans-serif`

**Weight system — restrained and soft:**
- **Medium (500):** All headings, labels, buttons, badge text, navigation items
- **Regular (400):** All body text, input values, supporting text, secondary metadata

**Never use Bold (700) or Heavy.** Boldness feels aggressive. Medium is the ceiling.

| Style Name | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Page Title | 26pt | Medium | 1.2 | Page-level headings (inline, not nav bar) |
| Section Heading | 20pt | Medium | 1.3 | Section titles within pages |
| Card Title | 17pt | Medium | 1.3 | Primary card headings |
| Body | 15pt | Regular | 1.5 | Body copy, list item text |
| Label | 13pt | Medium | 1.4 | Labels, badges, metadata |
| Caption | 12pt | Regular | 1.4 | Secondary metadata, timestamps |
| Micro | 11pt | Medium | 1.3 | Smallest badges, tiny labels |
| Hero Number | 34pt | Medium | 1.0 | Balance amounts, large stats |
| Large Greeting | 28pt | Medium | 1.2 | Dashboard greeting line |

---

### Border Radius

| Token | Value | Usage |
|---|---|---|
| Radius XS | 8pt | Small chips, tiny badges |
| Radius SM | 10pt | Input fields, small buttons |
| Radius MD | 14pt | Standard cards, modals |
| Radius LG | 18pt | Hero cards, prominent containers |
| Radius XL | 22pt | Bottom sheets, tab bar |
| Radius Full | 999pt | Pills, avatar circles, toggle switches |

---

### Spacing

| Token | Value | Usage |
|---|---|---|
| Page Horizontal Padding | 20pt | Outer padding for all page content |
| Section Vertical Gap | 16–20pt | Space between major sections on a page |
| Card Internal Padding | 16–20pt | Padding inside cards |
| Row Item Gap | 12pt | Space between list rows |
| Inline Gap | 8pt | Space between icon and label within a row |
| Chip Gap | 8pt | Space between multiple chips/badges |
| Micro Gap | 4–6pt | Between label and its sub-metadata |

---

### Shadows & Elevation

- **Cards:** No heavy drop shadow. Use border + warm background for elevation.
- **Modals / Bottom Sheets:** `shadow: 0 20px 60px rgba(0,0,0,0.15)` warm-tinted
- **Tab Bar:** Subtle top border + very soft shadow above it
- **Never** use cool-grey or pure-black shadows anywhere

---

### Animation Principles (Translate to SwiftUI)

| Pattern | Duration | Easing |
|---|---|---|
| Page transition (NavigationStack push) | 0.35s | `.easeInOut` |
| Modal / Sheet present | 0.28s | `.easeOut` |
| Button tap (scale down) | 0.10s | `.spring(response: 0.3, dampingFraction: 0.6)` |
| Button release (scale up) | 0.15s | `.spring(response: 0.3, dampingFraction: 0.5)` |
| List item appear | 0.25s | `.easeOut` with stagger |
| Checkbox complete | 0.20s | `.easeInOut` |
| Strikethrough draw | 0.35s | `.easeInOut` |
| Progress bar fill | 0.40s | `.easeOut` |
| Toast notification | 0.20s appear / 3s dismiss | `.easeOut` |

**Scale values:** Buttons tap to 0.97x, hover (long press preview) to 1.01x.  
**All animations respect** `@Environment(\.accessibilityReduceMotion)`.

---

### Icon System

**Library:** SF Symbols — always stroke/outline weight, never filled unless specified.  
**Wrapping:** Icons should always appear inside soft Roost-styled containers when used in headers or navigation — a muted-background rounded square (Radius SM, 8–10pt padding, accent-tinted fill).  
**Sizing:** 16pt in rows, 20pt in cards/headers, 24pt in hero elements, 28pt in empty states.  
**Colour:** Inherits from parent text or uses `primary` / `secondary` / `muted-foreground` directly.

---

### Component Library

These components appear across all three prompts and should be consistent:

#### RoostCard
A foundational surface. `background: card`, `border: 1pt border colour`, `cornerRadius: Radius MD (14pt)`, `padding: 16–20pt`. Use for nearly all content blocks.

#### RoostHeroCard  
A larger, more prominent surface. Same as RoostCard but `cornerRadius: Radius LG (18pt)`, `padding: 20pt`, may have tinted background variants.

#### RoostChip / Badge
Small pill: `background: muted`, `foreground: muted-foreground`, `cornerRadius: Full`, `padding: 4pt vertical, 10pt horizontal`, `font: Micro or Label`. Status variants: success (green bg 15% opacity + green text), warning (amber bg 15% opacity + amber text), destructive (red bg 15% opacity + red text), primary (terracotta bg 15% opacity + terracotta text).

#### RoostProgressBar
`height: 6pt`, `cornerRadius: Full`, `background: muted`, `fill: gradient or solid` — green below 70%, amber 70–99%, red at/above 100%. Animated fill on appear.

#### RoostButton (Primary)
`background: primary (#d4795e)`, `foreground: #f2ebe0`, `cornerRadius: Radius SM (10pt)`, `height: 44pt`, `font: Label Medium`, spring scale on tap.

#### RoostButton (Secondary)
`background: secondary (#9db19f)`, `foreground: card`, same dimensions as primary.

#### RoostButton (Ghost)
`background: clear`, `foreground: primary`, optional subtle border, same dimensions.

#### RoostButton (Destructive)
`background: destructive (#c75146)`, `foreground: #f2ebe0`, same dimensions.

#### RoostTextField
`background: input-background (#e3d9ca)`, `border: border colour`, `cornerRadius: Radius SM`, `font: Body Regular`, focus ring: terracotta glow at 30% opacity.

#### RoostToggle
Custom toggle: `track: muted / primary when on`, `thumb: card colour`, `cornerRadius: Full`, spring-animated.

#### RoostAvatar
Circle, 36pt diameter default. Background is one of 12 warm swatches. Shows SF Symbol icon centred or initials as fallback.

#### NestGate (Paywall overlay)
When a feature requires Nest subscription: blurred content behind, a centred card with Nest badge, feature name, short description, and "Upgrade to Nest" primary button. Never harsh. Always warm.

---

## PROMPT 1 — THE SKELETON

---

**COPY THIS ENTIRE BLOCK TO FIGMA AI:**

---

> **Task:** Build the complete skeleton of the Roost iOS app — a native SwiftUI iPhone app that is a direct port of the Roost Mac household management app for couples. This prompt establishes every screen, every tab, every navigation path, and every major layout container. Do not fill in real content yet — establish the structural bones, layout regions, and navigation architecture with placeholder content only.
>
> **This is phase 1 of 3.** The skeleton must be complete and navigable. Every screen listed must exist. Every navigation path must be connected. No screen is optional.
>
> ---
>
> ### Global Design Foundation
>
> Apply these design tokens universally. All subsequent phases build on top of this foundation.
>
> **Colour palette (light mode):**  
> - Background: `#ebe3d5` (warm cream — this is the page canvas, never white)  
> - Foreground: `#3d3229` (warm dark brown — all primary text, never black)  
> - Card: `#f2ebe0` (creamy off-white — all card surfaces)  
> - Primary: `#d4795e` (terracotta — CTAs, active states, key moments)  
> - Secondary: `#9db19f` (sage green — secondary actions)  
> - Muted: `#ddd4c6` (warm neutral — subtle fills, dividers)  
> - Muted Foreground: `#6b6157` (secondary text)  
> - Accent: `#e8d5bc` (warm peachy-amber — chip backgrounds, hover fills)  
> - Input Background: `#e3d9ca` (slightly darker cream — form fields)  
> - Border: `rgba(61,50,41,0.15)` (warm subtle border)  
> - Success: `#7fa087` (forest green)  
> - Warning: `#e6a563` (warm amber)  
> - Destructive: `#c75146` (muted terracotta-red)
>
> **Dark mode equivalents:**  
> - Background: `#0f0d0b`, Foreground: `#f2ebe0`, Card: `#1a1816`, Primary: `#d4795e` (unchanged), Muted: `#2a2623`, Muted Foreground: `#a39a8f`, Input: `#1f1c19`, Border: `rgba(242,235,224,0.10)`
>
> **Typography:** Font is DM Sans throughout. Two weights only: Medium (500) for headings/buttons/labels, Regular (400) for body/inputs/metadata. Base body size 15pt. Page titles 26pt. Hero numbers 34pt. Never use Bold or Heavy weight.
>
> **Border radius:** Cards 14pt, hero cards 18pt, inputs 10pt, buttons 10pt, chips/pills fully rounded (999pt). All corners are noticeably soft — this is a defining character of the app.
>
> **Spacing:** Page horizontal padding 20pt. Section vertical gaps 16pt. Card internal padding 16–20pt. Never cramped. Generous breathing room everywhere.
>
> ---
>
> ### App Architecture — Tab Bar Navigation
>
> The app uses a native iOS tab bar at the bottom of the screen with 5 tabs. The tab bar itself uses:  
> - Background: Card colour (`#f2ebe0` light / `#1a1816` dark)  
> - Top border: 1pt border colour  
> - Active tab: Primary terracotta icon and label (`#d4795e`)  
> - Inactive tab: Muted foreground (`#6b6157`) icon and label  
> - Font: 10pt Medium for all tab labels  
> - Tab bar height: 83pt including safe area  
>
> **The 5 tabs are:**
>
> **Tab 1 — Home**  
> Icon: SF Symbol `house` (filled when active, outlined otherwise)  
> Label: "Home"  
> Root: Dashboard screen  
> NavigationStack: Yes
>
> **Tab 2 — Shopping**  
> Icon: SF Symbol `cart` (filled when active)  
> Label: "Shopping"  
> Badge: Number badge showing unchecked shopping item count (terracotta background, cream text, fully rounded)  
> Root: Shopping list screen  
> NavigationStack: Yes
>
> **Tab 3 — Money**  
> Icon: SF Symbol `creditcard` (filled when active)  
> Label: "Money"  
> Root: Money hub screen with two sub-sections: Expenses and Budget  
> NavigationStack: Yes  
> Sub-navigation: Horizontal segmented picker at top of screen ("Expenses" / "Budget")
>
> **Tab 4 — Plan**  
> Icon: SF Symbol `checkmark.circle` (filled when active)  
> Label: "Plan"  
> Badge: Number badge showing overdue chores count (destructive background, cream text)  
> Root: Plan hub screen with three sub-sections: Chores, Calendar, Pinboard  
> NavigationStack: Yes  
> Sub-navigation: Horizontal pill-style segment picker ("Chores" / "Calendar" / "Pinboard")
>
> **Tab 5 — More**  
> Icon: SF Symbol `ellipsis` (always same weight)  
> Label: "More"  
> Root: More menu screen (grouped list of secondary features and settings)  
> NavigationStack: Yes
>
> ---
>
> ### Screen Inventory — Complete List
>
> Create every screen below as a separate frame. All screens are 390 × 844pt (iPhone 15 Pro canvas). Group screens by section. Connect all navigation links.
>
> ---
>
> #### Authentication Screens (no tab bar)
>
> **Screen: Welcome / Sign In**  
> Route: Entry point before authentication  
> Layout regions:  
> - Top area: Roost logo (two-toned terracotta/sage) + "Roost" wordmark in DM Sans 28pt Medium  
> - Tagline line: secondary text, 15pt Regular  
> - Middle: Email input field + Password input field stacked with 12pt gap  
> - Sign In primary button (full width, terracotta)  
> - Divider: "or" line  
> - Google sign in outline button (full width)  
> - Toggle link: "Don't have an account? Sign up"  
> - Background: App background colour (warm cream) — no hero image  
> - No top bar or tab bar on this screen
>
> **Screen: Sign Up**  
> Same layout regions as Sign In but with additional Name field above email. Button label "Create account". Toggle link "Already have an account? Sign in".
>
> **Screen: Join Household**  
> Route: User accepts an invite to an existing household  
> Layout regions:  
> - Back navigation  
> - Title: "Join a home"  
> - Description text  
> - Invite code input field (large, centred)  
> - "Join" primary button  
> - Separator + "Or create your own home" ghost button
>
> **Screen: Setup / Onboarding**  
> Route: Post-authentication first-run  
> Layout regions:  
> - Step indicator (dots or progress bar)  
> - Large welcome heading  
> - Display name input  
> - "Create a new home" or "Join existing" choice cards (two tappable cards side by side)  
> - Continue primary button  
> No tab bar.
>
> ---
>
> #### Tab 1 — Home (Dashboard)
>
> **Screen: Home / Dashboard**  
> NavigationStack root  
> Layout regions (top to bottom in a ScrollView):  
> - Navigation bar: Roost logo left, notification bell right (with unread badge)  
> - Greeting block: Large personalised greeting + status summary line  
> - Balance hero card (full width, prominent)  
> - Two-column card row: Shopping snapshot left + Chores snapshot right  
> - Budget snapshot card (full width)  
> - Today's Events card (full width)  
> - Activity feed card (full width)  
> - Recent expenses card (full width)  
> - Bottom padding above tab bar  
> No sub-navigation. Single scrolling canvas.
>
> ---
>
> #### Tab 2 — Shopping
>
> **Screen: Shopping List**  
> NavigationStack root  
> Layout regions:  
> - Navigation bar: "Shopping" title, no back button  
> - Stats line below title  
> - Shop date + countdown banner/card  
> - Quick add input row (text field + Add button, full width)  
> - Hazel processing indicator (conditional, hidden when not processing)  
> - Scrollable content: collapsible category sections, each with header row + item rows  
> - Empty state (when list is empty)  
> - Bottom padding above tab bar
>
> ---
>
> #### Tab 3 — Money
>
> **Screen: Money Hub**  
> NavigationStack root  
> Top: Segmented picker — "Expenses" | "Budget"  
> The content area below the picker swaps between two child views.
>
> **Screen: Money > Expenses**  
> Layout regions:  
> - Page title inline: "Expenses"  
> - Three stats cards in a row: Balance card, Total Spent card, Your Share card  
> - Filter row: Category dropdown + Payer dropdown  
> - Scrollable expense list with Hazel processing indicator at top  
> - Settlement history section (conditional, appears if settlements exist)  
> - FAB (floating action button) in bottom-right corner: terracotta circle with `+` icon
>
> **Screen: Money > Budget**  
> Layout regions:  
> - Page title inline: "Budget"  
> - Month navigator row: left arrow + month name + right arrow  
> - Sub-tab picker: "Analytics" | "Categories"  
> - Analytics sub-view: summary card stack (spend vs limit, trend, projection, Hazel insights)  
> - Categories sub-view: scrollable list of budget category rows  
> - FAB: not present on Budget
>
> **Sheet: Add Expense**  
> Presented as bottom sheet (detent: large)  
> Layout: Title "Add Expense", form fields stacked (Title, Amount, Category picker, Payer picker, Date picker, Split type picker, Recurring toggle + interval picker), Save / Cancel buttons
>
> **Sheet: Settle Up**  
> Presented as bottom sheet  
> Multi-stage: Stage 1 confirmation, Stage 2 optional note, Stage 3 success celebration
>
> ---
>
> #### Tab 4 — Plan
>
> **Screen: Plan Hub**  
> NavigationStack root  
> Top: Three-segment pill picker — "Chores" | "Calendar" | "Pinboard"  
> Content area below swaps between three child views.
>
> **Screen: Plan > Chores**  
> Layout regions:  
> - Page title inline: "Chores"  
> - Stats summary line  
> - View filter tabs: "All" | "Me" | "Partner"  
> - Scrollable list: Overdue section → Upcoming section → Completed section (collapsed by default)  
> - FAB: terracotta `+` for add chore  
> - Conditional: Hazel suggestions banner
>
> **Screen: Plan > Calendar**  
> Layout regions:  
> - Page title inline: "Calendar"  
> - Month navigator (← month name →)  
> - Month grid (7-column calendar grid)  
> - Stats line  
> - Event list for selected date or upcoming events  
> - Apple Calendar sync button (secondary style)
>
> **Screen: Plan > Pinboard**  
> Layout regions:  
> - Page title inline: "Pinboard"  
> - Stats badges (live notes count, unseen count)  
> - View filter pills: "All" | "Active" | "Expiring" | "Permanent"  
> - Scrollable notes list  
> - FAB: terracotta `+` for add note
>
> **Sheet: Add Chore**  
> Bottom sheet (large detent)  
> Fields: Title, Assignee picker, Due date picker, Frequency picker (One-time / Daily / Weekly / Monthly), Room picker, Notes, Save / Cancel
>
> **Sheet: Add Note (Pinboard)**  
> Bottom sheet (medium detent)  
> Fields: Note text area, Audience selector (Everyone / Me / Partner), Expiry toggle + date picker, Save / Cancel
>
> ---
>
> #### Tab 5 — More
>
> **Screen: More Menu**  
> Root of the More tab — a styled list grouped by category, not a default iOS settings table.  
> Layout regions:  
> - User profile card at top (avatar + display name + email)  
> - "Account" group: Profile, Household, Account, Subscription  
> - "App" group: Hazel, Notifications  
> - "Household Setup" group: Rooms, Budget Categories  
> - "Support" group: Privacy Policy, App Version  
> - Sign out button at bottom (ghost/destructive style)
>
> **Screen: Profile Settings**  
> Layout regions:  
> - Avatar display (large, centred) with edit overlay  
> - Avatar customiser: colour swatches row + icon picker grid  
> - Display name field with edit/save  
> - Email field (read-only)
>
> **Screen: Household Settings**  
> Layout regions:  
> - Household name with edit button  
> - Household ID with copy button  
> - Members section (avatar + name + role for each member)  
> - Invite partner section (invite link, copy button, instructions)
>
> **Screen: Rooms Settings**  
> Layout regions:  
> - Rooms list (each row: room name + icon picker + delete swipe action)  
> - "Add Room" button at bottom of list
>
> **Screen: Budget Categories Settings**  
> Layout regions:  
> - Built-in categories list (read-only, greyed out)  
> - Optional preset categories list (toggleable)  
> - Custom categories list (editable, deleteable)  
> - "Add custom category" button (opens add sheet)
>
> **Screen: Hazel Settings**  
> Layout regions:  
> - Hazel identity card (avatar + description)  
> - Examples card (before/after examples)  
> - Toggles card: "Auto-categorise expenses" toggle, "Smart chore suggestions" toggle  
> - Privacy footer
>
> **Screen: Notifications Settings**  
> Layout regions:  
> - Toggle rows: In-app notifications, Email notifications, Bill reminders, Chore reminders
>
> **Screen: Account Settings**  
> Layout regions:  
> - Email display (read-only)  
> - Change password button  
> - Leave household button (with inline confirmation)  
> - Delete account button (destructive, with inline confirmation)  
> - Sign out button
>
> **Screen: Subscription**  
> Layout regions:  
> - Current plan badge (Free / Nest)  
> - Trial banner if on trial (days remaining, end date)  
> - Active subscription details if subscribed  
> - Feature comparison table (Free vs Nest)  
> - Upgrade button (if free) / Manage subscription button (if subscribed)  
> - Promo code collapsible section  
> - FAQ collapsible section
>
> ---
>
> #### Global Overlays / Modals
>
> **Overlay: Notification Panel**  
> Presented as sheet from notification bell  
> Layout: "Notifications" title, scrollable list of notification rows (icon + text + timestamp + read indicator), "Mark all as read" button
>
> **Overlay: Upgrade to Nest (NestGate)**  
> Presented as modal sheet  
> Layout: Nest logo/badge at top, feature name, short description of what unlocks, feature comparison list, "Upgrade to Nest" primary button, "Maybe later" ghost button
>
> **Overlay: Onboarding Tour**  
> Full-screen overlay on top of app (appears on first launch)  
> Dark overlay with spotlight circle on highlighted element + tooltip card  
> Progress dots at bottom  
> Next / Back / Skip controls
>
> ---
>
> ### Navigation Connections
>
> Wire all navigation paths:
>
> - Welcome → Sign Up (toggle link)  
> - Welcome / Sign Up → Home (after auth)  
> - Welcome → Join Household (via join link)  
> - Auth → Setup (first time only)  
> - Setup → Home  
> - Home balance card tap → Money tab (Expenses)  
> - Home shopping card tap → Shopping tab  
> - Home chores card tap → Plan tab (Chores)  
> - Home budget card tap → Money tab (Budget)  
> - Home activity card → no navigation (static feed)  
> - Shopping FAB / Quick add → inline in page  
> - Money segmented picker → swaps content in place  
> - Plan segmented picker → swaps content in place  
> - Plan > Chores FAB → Add Chore sheet  
> - Money > Expenses FAB → Add Expense sheet  
> - Plan > Pinboard FAB → Add Note sheet  
> - Expenses > Settle Up button → Settle Up sheet  
> - More > each row → respective settings screen  
> - Notification bell → Notification panel sheet  
> - Any NestGate → Upgrade sheet  
> - First launch → Onboarding tour overlay
>
> ---
>
> **Skeleton deliverable:** Every screen exists as a named frame. Navigation is wired. Layout regions are marked with labelled placeholder rectangles using card background colour and border. Typography placeholder blocks use correct sizes and weights. Colour tokens applied to all surfaces. Tab bar present on all authenticated screens except auth/onboarding.

---

## PROMPT 2 — FLESH OUT ALL PAGES

---

**COPY THIS ENTIRE BLOCK TO FIGMA AI:**

---

> **Task:** Fill in every screen of the Roost iOS app with complete, production-accurate content. Every card, row, field, state, and component must look exactly as it would in a live app. This is a near-carbon-copy of the Roost Mac app translated to native iOS. Every design decision — spacing, colour, typography, iconography, chip styles, badge styles — must be derived from the established Roost design system. No default iOS styling. No generic SwiftUI templates. Every pixel should feel warm, considered, and distinctly Roost.
>
> Work through every screen in order. For each screen, replace placeholder rectangles with real, fully-designed components.
>
> ---
>
> ### Screen 1 — Welcome / Sign In
>
> **Full layout (top to bottom):**
>
> Top 30% of screen (vertically centred in its zone):  
> - Roost logomark: a small warm illustration — a stylised house/nest shape. Two tones: terracotta (`#d4795e`) and sage (`#9db19f`). 60pt × 60pt.  
> - "Roost" wordmark: 28pt Medium, foreground colour. Below logomark, 8pt gap.  
> - Tagline: "Your home, together." 15pt Regular, muted-foreground colour. 6pt gap below wordmark.
>
> Middle form area (vertically centred):  
> - Email input: full width (minus 40pt horizontal padding), RoostTextField style, placeholder "Email address", envelope SF Symbol prefix icon.  
> - 12pt gap  
> - Password input: same style, placeholder "Password", lock SF Symbol prefix icon, eye/eye-slash toggle suffix for show/hide.  
> - 16pt gap  
> - "Sign in" primary button: full width, terracotta background, cream text "Sign in", 44pt height, 10pt radius.  
> - 24pt gap  
> - Divider: two 1pt muted lines with "or" in muted-foreground text centred between them.  
> - 24pt gap  
> - Google button: full-width outline button, 1pt border at border-colour, Google "G" logo left-aligned, "Continue with Google" label in foreground colour, 44pt height.  
> - 24pt gap  
> - Toggle text: "Don't have an account? " in muted-foreground + "Sign up" in primary colour, 15pt, centre-aligned, tappable.
>
> Error state: A red-tinted card above the sign in button showing error text in destructive colour with an `exclamationmark.triangle` SF Symbol.
>
> ---
>
> ### Screen 2 — Sign Up
>
> Same layout as Sign In with:  
> - Additional "Display name" field above email (person SF Symbol prefix)  
> - Button label: "Create account"  
> - Toggle: "Already have an account? Sign in"
>
> ---
>
> ### Screen 3 — Setup / Onboarding
>
> Step indicator: row of 3 dots at top, active dot is terracotta (8pt), inactive dots are muted (6pt).
>
> Step 1 — Name:  
> - Large heading "Welcome to Roost" 26pt Medium, centred  
> - Body "Let's get you set up." 15pt Regular, muted-foreground, centred  
> - Display name input field  
> - Continue button
>
> Step 2 — Home choice:  
> - Heading "Create or join a home?" 26pt  
> - Two equal-height choice cards side by side:  
>   - "Create a new home" card: house SF Symbol 28pt in soft accent square, label below, description text in muted  
>   - "Join an existing home" card: same treatment with person.badge.plus symbol  
> - Cards have selected state: primary border + primary-tinted background at 10% opacity
>
> Step 3 — Home name (if creating):  
> - Heading "Name your home"  
> - Input field: "The [Name] household"  
> - Finish button (primary)
>
> ---
>
> ### Screen 4 — Home / Dashboard
>
> This is the most important screen. Build every section with full content.
>
> **Navigation bar:**  
> Left: Roost logomark 24pt + "Roost" 17pt Medium in foreground  
> Right: Notification bell button — `bell` SF Symbol, 22pt, foreground colour. If unread: small terracotta filled circle badge top-right of bell with white count number in 10pt Medium.  
> Nav bar background: transparent (content scrolls under it with blur)
>
> **Scroll content begins below safe area:**
>
> **Greeting block:**  
> Vertical padding top: 20pt  
> - Line 1: "Good morning, Tom" — 28pt Medium, foreground colour  
> - Line 2: "3 items to buy · 1 overdue · 2 events today" — 15pt Regular, muted-foreground  
> - Bottom margin: 20pt  
> The greeting is part of the scroll content, not a sticky header.
>
> **Balance hero card:**  
> Full width card (minus 40pt), RoostHeroCard style, 20pt radius, 20pt internal padding.  
> - Top row: `creditcard` SF Symbol 16pt in a soft accent-coloured rounded square (8pt radius, accent-bg) + "Balance" label 13pt Medium muted-foreground + right-side status pill  
>   - Status pill: "You're owed" (sage bg 15% opacity + sage text) OR "You owe" (destructive bg 15% opacity + destructive text) OR "All settled" (muted bg + muted-foreground text)  
> - 12pt gap  
> - Hero amount: "£24.50" — 34pt Medium, foreground. Colour shifts: sage/success when owed, destructive when owing, muted when settled.  
> - 4pt gap  
> - Supporting line: "Alice owes you £24.50" or "You owe Alice £24.50" or "You're all settled up 🎉" — 15pt Regular, muted-foreground  
> - 16pt gap  
> - Stat row (horizontal): "Household spent" label + amount left-side | "Your share" label + amount right-side. Both 13pt, muted-foreground labels with 15pt Medium foreground values.  
> - 16pt gap (only if balance exists)  
> - "Settle up" primary button: terracotta, full width, "Settle up" label. Hidden if settled.  
> Card tint: If owed — very faint sage background tint. If owing — very faint destructive background tint. If settled — standard card background.
>
> **16pt gap**
>
> **Two-column summary row:**  
> Two equal-width cards side by side, 12pt gap between.  
> Each card: RoostCard, 14pt radius, 16pt internal padding.
>
> Shopping card (left):  
> - Icon: `cart` SF Symbol in accent-bg rounded square, 16pt  
> - Label: "Shopping" 13pt Medium muted-foreground  
> - Count: "8 items" 20pt Medium foreground  
> - Preview text: "Milk, Bread +6 more" 12pt Regular muted-foreground  
> - If shop date set: countdown chip at bottom "In 3 days" — amber chip if soon, green chip if comfortably far
>
> Chores card (right):  
> - Icon: `checkmark.circle` SF Symbol in accent-bg rounded square  
> - Label: "Chores" 13pt Medium muted-foreground  
> - Count: "3 to do" 20pt Medium foreground  
> - Overdue chip if applicable: "1 overdue" in destructive chip  
> - Due soon text: "Bins due today" 12pt muted-foreground
>
> **16pt gap**
>
> **Budget snapshot card:**  
> Full width RoostCard.  
> - Header row: `chart.bar` icon in accent square + "Budget" label + right-side month text (e.g. "March") in muted-foreground 13pt  
> - 12pt gap  
> - Spend line: "£420 of £800" — "£420" in 20pt Medium foreground + " of £800" in 15pt muted-foreground  
> - 8pt gap  
> - RoostProgressBar: full width, 6pt height, fully rounded. Fill colour: green if < 70%, amber if 70–99%, red if 100%+  
> - 8pt gap  
> - Supporting line: "52% used · £380 remaining" OR "Over budget by £20" — 13pt muted-foreground  
> - 12pt gap  
> - "View Budget" ghost button: right-aligned, terracotta text, 13pt Medium
>
> **16pt gap**
>
> **Today's Events card:**  
> Full width RoostCard.  
> - Header: `calendar` icon in accent square + "Today" label  
> - If events exist: list of up to 3 event rows, each: event-type colour dot (6pt circle) + event title 15pt + date/time right-aligned 13pt muted-foreground  
> - If no events: "Nothing coming up today" in muted-foreground, centred, 15pt Regular  
> Event types: chore = sage, expense = terracotta, shopping = amber
>
> **16pt gap**
>
> **Activity feed card:**  
> Full width RoostCard.  
> - Header: `clock.arrow.circlepath` icon + "Activity" label  
> - List of up to 5 activity rows, each:  
>   - Left: RoostAvatar (28pt, user's colour + icon or initials)  
>   - Middle: "Tom added Milk to shopping" 15pt Regular, "Tom" in foreground, rest in muted-foreground  
>   - Right: "2h ago" 12pt muted-foreground  
>   - 10pt row gap  
> - Empty: "No recent activity" muted-foreground centred
>
> **16pt gap**
>
> **Recent Expenses card:**  
> Full width RoostCard.  
> - Header: `receipt` icon + "Recent Expenses" label + "See all" ghost link right-aligned  
> - Up to 3 expense rows, each:  
>   - Left: category colour chip label + expense title 15pt  
>   - Right: amount in foreground 15pt Medium + your share in muted-foreground 12pt below  
>   - Payer avatar 24pt left of amount  
>   - 10pt row gap
>
> **80pt bottom padding** (clears tab bar)
>
> ---
>
> ### Screen 5 — Shopping List
>
> **Navigation bar:**  
> Large inline title "Shopping" 26pt Medium, foreground. Toolbar right: `calendar` icon button (set next shop date).
>
> **Stats line:**  
> Below title: "8 items to buy · Shared live" — 15pt Regular muted-foreground
>
> **Shop date banner:**  
> Full-width card, RoostCard style.  
> - Left: `calendar` icon 20pt in accent square + "Next shop" label 13pt muted-foreground  
> - Right: date text 15pt Medium + countdown chip  
>   - Countdown colour: primary chip if 5+ days, warning chip if 2–4 days, destructive chip if 0–1 days ("Today!", "Tomorrow")  
> - Tappable to open date picker sheet
>
> **Quick add row:**  
> Full-width horizontal row (minus 40pt padding):  
> - Text field: RoostTextField, placeholder "Add an item...", fills available width  
> - "Add" primary button: terracotta, 44pt height, 10pt radius, minimum 72pt wide  
> - 8pt gap between field and button
>
> **Hazel processing indicator (conditional):**  
> When Hazel AI is normalising items: a small horizontal strip — sage-tinted background, `sparkles` SF Symbol 14pt + "Hazel is sorting your list..." 13pt sage text. Animated pulsing opacity.
>
> **Shopping categories (each is a collapsible section):**  
> Sections ordered by supermarket aisle logic: Produce → Bakery → Dairy → Meat & Fish → Frozen → Tins & Dry Goods → Snacks → Drinks → Household → Toiletries → Baby & Kids → Other
>
> Category header row:  
> - Chevron `chevron.down` / `chevron.right` 14pt muted-foreground, rotates on expand/collapse  
> - Category name 15pt Medium foreground  
> - Item count badge: small muted chip "3 items" — right-aligned  
> - Full row tappable to expand/collapse  
> - Section header background: muted at 30% opacity, 6pt vertical padding
>
> Item rows (inside expanded category):  
> Left: Custom Roost checkbox — 22pt circle, border-colour border, terracotta fill + cream checkmark when checked.  
> Middle:  
> - Item name 15pt Regular foreground. When checked: strikethrough with muted-foreground text.  
> - "Added by Tom" 12pt muted-foreground below name.  
> Right: Quantity badge if > 1 — muted chip "×3". Swipe-left action: red delete button.  
> Row height: 52pt minimum. Separator: none (use vertical padding for rhythm).
>
> Checked state animation: simultaneous opacity drop to 60% + strikethrough draws from left to right over 0.35s.
>
> **All clear state:**  
> When all items are checked: full-width sage-tinted card "All done! 🎉 Ready for your shop." with "Clear completed" ghost button below.
>
> **Empty state:**  
> If no items at all: centred layout — `cart` SF Symbol 40pt in accent square, "Your list is empty" 17pt Medium, "Add items above and they'll appear here" 15pt muted-foreground.
>
> ---
>
> ### Screen 6 — Money > Expenses
>
> **Segmented picker at top:**  
> Horizontally centred, pill-style segment: "Expenses" (active) | "Budget". Active segment: terracotta background, cream text. Inactive: muted background, muted-foreground text. 40pt height, fully rounded.
>
> **Inline page title:** "Expenses" 26pt Medium
>
> **Three stats cards in horizontal row (each 1/3 width, 8pt gaps):**
>
> Balance card:  
> - RoostCard with tinted background (sage-tint if owed, destructive-tint if owing)  
> - "Balance" 12pt muted-foreground  
> - Amount 20pt Medium, colour-coded  
> - Status pill: "You're owed" / "You owe" / "Settled" — fully rounded chip  
> - "Settle up" button below if not settled — small terracotta button 34pt height
>
> Total Spent card:  
> - "Total Spent" 12pt muted-foreground  
> - Amount 20pt Medium foreground  
> - "X expenses" 12pt muted-foreground
>
> Your Share card:  
> - "Your Share" 12pt muted-foreground  
> - Shared amount 20pt Medium  
> - "Personal: £X" 12pt muted-foreground below
>
> **Filter row:**  
> Horizontal scroll row of filter chips (fully rounded muted chips):  
> - "All categories" dropdown chip (chevron.down SF Symbol suffix)  
> - "All payers" dropdown chip  
> - "Clear" ghost chip (only visible when filters applied) — appears with spring animation
>
> **Expense list:**  
> Hazel indicator if processing (same style as shopping).  
> Each expense row — RoostCard with 12pt radius, 14pt padding:  
> - Top row: Category chip (coloured bg 15% opacity + category colour text) + Expense title 15pt Medium + right-aligned amount 15pt Medium foreground  
> - Second row: Payer RoostAvatar 20pt + "Paid by Tom" 13pt muted-foreground + "Your share: £X" 13pt muted-foreground right-aligned  
> - Third row (conditional): For recurring: `arrow.clockwise` 12pt muted + "Monthly · next: 15 Apr" 12pt muted-foreground. For one-off: date only 13pt muted-foreground.  
> - Right edge: Split type badge — "Shared" (sage chip) / "Personal" (muted chip) / "Solo" (accent chip)  
> - Swipe-left: red delete action  
> - 8pt gap between cards
>
> **Freemium gate — Expense history:**  
> If on free tier: expenses older than 30 days are hidden. A NestGate banner appears at the bottom of the list:  
> Card with sage-tinted background, `lock` SF Symbol 20pt, "Full history with Nest" 15pt Medium, "You're seeing the last 30 days. Upgrade to see all time." 13pt muted-foreground, "Upgrade to Nest" primary button.
>
> **Settlement history section (conditional):**  
> If settlements exist: section header "Settlements" 15pt Medium + divider. Each settlement row: from-avatar + "→" + to-avatar + amount + date + optional note. Smaller and quieter than expense rows.
>
> **FAB:**  
> 56pt circle, terracotta background, cream `+` SF Symbol 24pt. Bottom-right corner, 24pt from edges. Spring animation on press.
>
> ---
>
> ### Screen 7 — Money > Budget (Analytics tab)
>
> **Inline title:** "Budget" 26pt Medium  
> **Month navigator:** Left arrow button + "March 2026" 17pt Medium centred + right arrow button. Free tier: right arrow disabled (cannot go to future months you haven't tracked, and cannot go back past 1 month).
>
> **Sub-tab picker:** "Analytics" | "Categories" — same pill segment style as Expenses/Budget picker but slightly smaller (36pt height).
>
> **Analytics view (full content):**
>
> **Spend summary card (hero):**  
> RoostHeroCard, full width.  
> - Header: `chart.bar.fill` icon in accent square + "This month" label + right-aligned month progress "Day 18 of 31" in 13pt muted-foreground  
> - 16pt gap  
> - Main spend: "£420" 34pt Medium foreground  
> - "of £800 budget" 15pt muted-foreground to the right of or below the main figure  
> - 12pt gap  
> - RoostProgressBar full width: 8pt height (slightly taller in hero context)  
> - 8pt gap  
> - Status line: "You're on track 🌿" (sage text if under 70%) OR "Getting close to your limit" (amber text) OR "Over budget by £X" (destructive text)  
> - 16pt gap  
> - Stat row: "Remaining" + "£380" left | "Projected" + "£743" right — 13pt labels, 15pt Medium values
>
> **16pt gap**
>
> **Month comparison card:**  
> RoostCard, full width.  
> - Header: `arrow.left.arrow.right` icon + "Month over month"  
> - Horizontal stat row: "Last month" £510 muted-foreground | trend chip: "▼ 17.6%" in sage chip if down, "▲ X%" in destructive chip if up  
> - Simple bar chart (2 bars only — this month + last month) using chart colour 1 and chart colour 2. Bars have 6pt radius top corners, warm background grid lines at 20% opacity muted.
>
> **16pt gap**
>
> **Hazel Budget Insights (Nest feature):**  
> RoostCard, full width, sage-tinted background at 8% opacity.  
> - Header: `sparkles` SF Symbol 16pt sage + "Hazel's Insights" 15pt Medium sage  
> If subscribed to Nest:  
> - "Summary" 13pt Medium + summary text 15pt Regular foreground  
> - "Outlook" 13pt Medium + outlook text  
> - "Focus areas" 13pt Medium + up to 3 category chips with brief note  
> If free tier:  
> - NestGate treatment: blurred content behind, lock icon, "Budget insights with Nest" heading, upgrade button
>
> ---
>
> ### Screen 8 — Money > Budget (Categories tab)
>
> **Categories list:**  
> Each category row — full-width, RoostCard style with 14pt radius, 14pt padding, 8pt gap between cards.
>
> Row content:  
> - Left: Category colour dot (10pt circle, category's assigned colour) + Category name 15pt Medium  
> - Right: "£X / £Y" 15pt — spent in foreground, limit in muted-foreground  
> - Below: RoostProgressBar full width within card  
> - Below bar: "X% used" 12pt muted-foreground left + "£Z remaining" 12pt muted-foreground right  
> - Tappable to expand: reveals list of individual expenses in this category + list of recurring expenses  
>
> Expanded category:  
> Expenses sub-list inside card (slightly inset, muted background section):  
> Each sub-row: expense title 14pt + date 13pt muted-foreground right + amount 14pt Medium right  
> Recurring sub-section: "Recurring" 13pt Medium muted + recurring expense rows same style
>
> "No limit set" state: if a category has no budget limit, show "Set limit" ghost button right-aligned instead of progress bar.
>
> ---
>
> ### Screen 9 — Plan > Chores
>
> **Plan hub picker:** "Chores" (active) | "Calendar" | "Pinboard"
>
> **Inline title:** "Chores" 26pt Medium  
> **Stats line:** "5 to complete · 1 overdue · 2 due soon" 15pt muted-foreground
>
> **View filter tabs (below stats):**  
> Three equal pill chips in a row: "All" | "Me" | "Partner"  
> Active: terracotta bg 15% opacity + terracotta text. Inactive: muted bg + muted-foreground.
>
> **Hazel suggestion banner (conditional):**  
> Appears after tapping "Suggest chores" button — sage-tinted card with 5 suggestion chips. Each chip is a fully-rounded pill with the suggested chore name + `+` icon. Tapping adds the chore instantly. Once all are added, the banner dismisses with a success flash.
>
> **Chore sections:**
>
> **Overdue section (only if overdue chores exist):**  
> Section header: `exclamationmark.circle.fill` SF Symbol destructive 14pt + "Overdue" 13pt Medium destructive  
> Chore rows in this section use destructive-tinted card backgrounds (very faint, 5% opacity).
>
> **Upcoming section:**  
> Section header: `clock` SF Symbol 14pt muted-foreground + "Upcoming" 13pt Medium muted-foreground
>
> **Each chore row (RoostCard, 14pt padding, 8pt gap between):**  
> - Left: Roost checkbox (same style as shopping — 22pt circle, terracotta fill when done)  
> - Middle column:  
>   - Chore title 15pt Medium foreground. Strike through if complete.  
>   - Row below: Assignee RoostAvatar 18pt + assignee name 13pt muted-foreground + separator · + due date 13pt (destructive if overdue, warning if today/tomorrow, muted-foreground otherwise)  
>   - Row below: Room chip (muted bg) + Frequency chip (muted bg) — both 12pt labels  
>   - Last completed line (if recurring): `checkmark` 12pt muted + "Tom · 2 days ago" 12pt muted-foreground  
> - Right:  
>   - Streak badge if applicable: `flame` SF Symbol 12pt terracotta + "4 weeks" 12pt Medium terracotta — warm amber chip  
>   - Swipe-left: red delete action
>
> **Completed section (collapsed by default):**  
> Section header tappable to expand: `checkmark.circle` 14pt muted + "Completed (3)" 13pt muted-foreground + chevron  
> Completed rows: greyed out, 50% opacity, strikethrough on title.
>
> **FAB:** 56pt terracotta circle, `+` cream 24pt. Bottom-right 24pt from edges.
>
> Also: "Suggest chores" secondary button — small secondary-coloured button (sage bg) with `sparkles` SF Symbol 14pt + "Suggest" — positioned at top right area or in a toolbar button.
>
> ---
>
> ### Screen 10 — Plan > Calendar
>
> **Month navigator:**  
> Left `chevron.left` button + "March 2026" 17pt Medium centred + `chevron.right` button.
>
> **Calendar grid:**  
> 7 columns (S M T W T F S), header row 13pt Medium muted-foreground, 20pt height.  
> Day cells: 40pt × 40pt, centred.  
> - Day number: 15pt Regular foreground  
> - Today: terracotta background circle (36pt), cream text  
> - Selected: accent background circle, foreground text  
> - Other month: muted-foreground text, 50% opacity  
> - Event dots below day number: up to 3 coloured dots (6pt circles) — chore = sage, expense = terracotta, shopping = amber  
> Grid has no borders. Cell tap selects date and updates event list below.
>
> **Stats line (below grid):**  
> "3 upcoming chores · 1 overdue · 2 bills this month · Next shop: 4 Apr" 13pt Regular muted-foreground
>
> **Apple Calendar sync button:**  
> Ghost button: `calendar.badge.checkmark` SF Symbol + "Sync with Apple Calendar" — secondary style, right-aligned or centred below stats.  
> If synced: shows sage "Synced" chip instead.  
> Nest gate: free users see `lock` prefix and tapping opens NestGate modal.
>
> **Event list:**  
> Section title: "Events on [selected date]" or "Upcoming" if no date selected. 15pt Medium.  
> Each event row (not a card — use row with left-border accent):  
> - Left border: 3pt × full height bar in event-type colour  
> - Event type icon: small (14pt) in event colour  
> - Event title: 15pt Regular foreground  
> - Date + time (if applicable): 13pt muted-foreground  
> - "Overdue" chip if applicable (destructive chip, 12pt)  
> - 8pt gap between rows  
> Empty: "Nothing scheduled" muted-foreground centred with calendar SF Symbol in accent square.
>
> ---
>
> ### Screen 11 — Plan > Pinboard
>
> **Inline title:** "Pinboard" 26pt Medium  
> **Subtitle:** "A warm little shared board for reminders, nudges, and notes..." 15pt Regular muted-foreground  
> **Badge row:** "4 live notes" muted chip + "2 unseen" primary chip (if unseen > 0) — horizontally stacked with 8pt gap
>
> **Filter pills:**  
> Horizontal scroll row: "All" | "Active" | "Expiring" | "Permanent"  
> Active pill: primary bg 15% opacity + primary text. Inactive: muted bg + muted-foreground. Scrollable horizontally if overflow.
>
> **Notes list:**  
> Each note — RoostCard, 16pt radius, 16pt padding, 12pt gap between cards.  
> - Note content: 15pt Regular foreground, up to 3 lines with "See more" expansion  
> - 12pt gap  
> - Meta row: RoostAvatar 20pt + Author name 13pt Medium + "For everyone" / "For [name]" 13pt muted-foreground right-aligned  
> - If expiring: `clock` SF Symbol 12pt warning + "Expires 5 Apr" 12pt warning text  
> - If linked: `link` SF Symbol 12pt muted + "Linked to Kitchen" 12pt muted-foreground  
> - Acknowledge button (only for unread/unacknowledged notes): ghost pill button "Acknowledge ✓" sage text — appears below meta row  
> - Swipe-left: red delete action  
>
> Unseen notes have a subtle left border: 3pt terracotta bar on left edge of card.
>
> **FAB:** terracotta `+` circle, bottom-right.
>
> **Empty state:** `pin` SF Symbol 40pt in accent square, "Nothing pinned yet" 17pt Medium, "Add a note to share something with your home." 15pt muted-foreground, "Add Note" primary button.
>
> ---
>
> ### Screen 12 — More Menu
>
> **Top user card:**  
> Full-width card, RoostHeroCard, 20pt padding.  
> - Left: RoostAvatar 48pt (user's colour, icon, initials fallback)  
> - Right of avatar: Display name 17pt Medium foreground + email 13pt Regular muted-foreground  
> - Far right: chevron → navigates to Profile settings  
> - Card has very subtle primary border (terracotta at 20% opacity) as a warm touch
>
> **Settings groups (grouped card lists):**  
> Each group has a section title 13pt Medium muted-foreground (ALL CAPS) above it, 6pt gap, then a RoostCard containing all rows in the group.
>
> Row style within card: 44pt minimum height, `chevron.right` 14pt muted-foreground right-aligned, icon in accent-bg rounded square left-aligned (20pt icon, 8pt padding, 8pt radius), label 15pt Regular foreground. Divider between rows: 1pt at border-colour, inset left past icon.
>
> **Group "Account":**  
> - Profile — `person.crop.circle` icon  
> - Household — `house` icon  
> - Account — `gear` icon  
> - Subscription — `star` icon (or `crown` — use whichever feels warm, not corporate)
>
> **Group "App":**  
> - Hazel — `sparkles` icon (sage tint)  
> - Notifications — `bell` icon
>
> **Group "Household Setup":**  
> - Rooms — `door.left.hand.open` icon  
> - Budget Categories — `tag` icon
>
> **Group "Support":**  
> - Privacy Policy — `hand.raised` icon  
> - App Version — `info.circle` icon — no chevron, right-aligned version number "v1.4.0" in muted-foreground
>
> **Sign out button (bottom):**  
> Full-width button, ghost style, destructive foreground colour, "Sign out" label, `arrow.right.square` SF Symbol left. Positioned 24pt below last group. 20pt bottom padding.
>
> ---
>
> ### Screen 13 — Profile Settings
>
> NavigationStack pushed from More > Profile. Back button in nav bar.  
> Title: "Profile" in nav bar.
>
> **Avatar display area:**  
> Centred at top. Large avatar 80pt diameter. Showing current colour + icon. No edit overlay in this state — it is always interactive.
>
> **Colour swatches row:**  
> Horizontal scroll row of 12 circular colour swatches, each 32pt. Selected swatch has a white ring (2pt) and primary-coloured outer ring (3pt). Swatches warm palette: terracotta, sage, amber, clay, forest green, dusty rose, warm blue, dusty purple, slate warm, soft orange, warm teal, cream brown.
>
> **Icon picker grid:**  
> 5-column grid of icon options. Each cell: 44pt × 44pt, rounded square (8pt radius), muted bg. Shows SF Symbol icon 20pt centred. Selected cell: accent-bg + primary border. Icons include: person, star, heart, leaf, flame, home, pawprint, music.note, scissors, hammer, paintbrush, gamecontroller, book, camera, airplane, bicycle, car, moon, sun.max, cloud, snowflake, fish, and letter initials as fallback.
>
> **Display name section:**  
> Section card. Row: label "Display name" + current name right-aligned + `pencil` icon to activate edit mode. In edit mode: name becomes an inline input field with Save / Cancel buttons appearing.
>
> **Email section:**  
> Section card. Row: label "Your ID" + email right-aligned, muted-foreground. No edit capability. Small `lock` icon indicates read-only.
>
> ---
>
> ### Screen 14 — Household Settings
>
> **Household name section:**  
> RoostCard. "Household name" label + current name right-aligned + `pencil` edit button. Inline edit same pattern as Profile.
>
> **Household ID section:**  
> RoostCard. "Household ID" label + UUID truncated (first 8 chars + "...") in muted-foreground monospace or regular text. Right: `doc.on.doc` copy button — tapping animates the button to show `checkmark` for 1.5s then reverts.
>
> **Members section:**  
> Section title "Members". RoostCard with member rows.  
> Each member row: RoostAvatar 36pt + Display name 15pt Medium + Role badge ("Owner" / "Member") right-aligned sage chip.
>
> **Invite partner section:**  
> RoostCard, sage-tinted background at 8% opacity.  
> - Header: `person.badge.plus` icon + "Invite your partner" 15pt Medium  
> - Invite link display: monospace-style text in input-background rounded field, truncated, with `doc.on.doc` copy button right  
> - Instructions text: "Send this link or share the code: XXXXX" 13pt muted-foreground  
> - Deep link format: roost://join?code=...
>
> ---
>
> ### Screen 15 — Rooms Settings
>
> Title: "Rooms"  
>
> **Rooms list:**  
> RoostCard containing all room rows, dividers between rows.  
> Each row: `door.left.hand.open` SF Symbol in accent square + Room name 15pt + right: icon picker (tappable, shows current room icon) + chevron for edit. Swipe-left: red delete action.
>
> **Room groups section:**  
> Below rooms list. "Room Groups" section title. List of groups (All Rooms always first, read-only). Custom groups editable.
>
> **"Add Room" button:**  
> Ghost button with `+` icon, full width, bottom of list. Tapping pushes to Add Room screen or opens inline input row.
>
> ---
>
> ### Screen 16 — Budget Categories Settings
>
> Title: "Budget Categories"
>
> **Built-in categories section:**  
> Section title "Built-in · Read only". RoostCard. Each row: category colour dot + name 15pt + `lock` SF Symbol 14pt muted-foreground right. Greyed out at 70% opacity to reinforce read-only.  
> Built-in: Rent, Bills, Groceries, Transport, Takeaways, Toiletries & Household, Other.
>
> **Optional presets section:**  
> Section title "Optional". RoostCard. Each row: category colour dot + name + toggle right. Toggling adds/removes from active categories.  
> Presets: Mortgage, Subscriptions, Insurance, Gym & Fitness, Entertainment, Eating Out, Clothing, Holidays, Pets, Healthcare, Gifts.
>
> **Custom categories section:**  
> Section title "Custom". List of custom category cards (same style, swipe-delete). "Add Category" ghost button at bottom opens Add Category sheet.
>
> **Add Category sheet (bottom sheet, medium):**  
> Name input field, colour picker (8 colour swatches: slate, red, amber, lime, cyan, blue, purple, fuchsia), icon picker (grid of SF Symbols), Save button.
>
> ---
>
> ### Screen 17 — Hazel Settings
>
> Title: "Hazel"
>
> **Identity card:**  
> RoostHeroCard, sage-tinted background at 10% opacity.  
> - RoostAvatar 48pt using sage colour + `sparkles` icon  
> - "Hazel" 17pt Medium foreground  
> - "Your AI household assistant, powered by Claude." 15pt Regular muted-foreground  
> - Body description: "Hazel quietly helps in the background — normalising your shopping list, suggesting chores, categorising expenses, and giving you budget insights." 14pt Regular muted-foreground
>
> **Examples card:**  
> RoostCard. Title "How Hazel helps" 15pt Medium.  
> Three before/after example rows, each:  
> - Before: muted pill "Brocolli" → After: sage pill "Broccoli" ✓  
> - Separator dot  
> - Icon showing what kind of help it was (shopping = cart, chore = checkmark, expense = creditcard)
>
> **Toggles card:**  
> RoostCard. Two toggle rows with divider between:  
> - "Auto-categorise expenses" — RoostToggle right-aligned + 13pt muted-foreground sub-label "Hazel suggests a category for new expenses" below title  
> - "Smart chore suggestions" — same pattern  
> Nest badge next to "Auto-categorise expenses" since it's a premium feature.
>
> **Privacy footer:**  
> 13pt Regular muted-foreground, centred. "Hazel processes data on Anthropic's servers. Your household data is never stored or used for training."
>
> ---
>
> ### Screen 18 — Notifications Settings
>
> Title: "Notifications"
>
> RoostCard containing all 4 toggle rows with dividers:  
> - "In-app notifications" — RoostToggle right + "Get notified when your partner makes changes" 13pt muted-foreground sub-label  
> - "Email notifications" — RoostToggle right + sub-label  
> - "Bill reminders" — RoostToggle right + "Reminder when recurring bills are due" sub-label  
> - "Chore reminders" — RoostToggle right + "Reminder when chores are due" sub-label
>
> ---
>
> ### Screen 19 — Account Settings
>
> Title: "Account"
>
> **Info section:**  
> RoostCard. Email row: label "Email" + email address right-aligned muted-foreground.
>
> **Actions section:**  
> RoostCard. Three rows:  
> - "Change password" → ghost row with `key` icon + chevron  
> - Divider  
> - "Leave household" → destructive-coloured row, `door.right.hand.open` icon. Tapping reveals inline confirmation: "Are you sure? This cannot be undone." + "Leave" destructive button + "Cancel" ghost button  
> - Divider  
> - "Delete account" → destructive-coloured row, `trash` icon. Same inline confirmation pattern.
>
> **Sign out button:** Below card. Same as in More menu but larger here. Full width destructive ghost.
>
> ---
>
> ### Screen 20 — Subscription
>
> Title: "Subscription"
>
> **Current plan card:**  
> RoostHeroCard.  
> - "Roost" or "Roost Nest" 20pt Medium foreground  
> - Plan badge: "Free" (muted chip) OR "Nest" (terracotta chip) OR "Nest Annual" (terracotta chip)  
> - If on trial: sage-tinted banner inside card "14-day trial · ends 14 Apr" with `gift` SF Symbol  
> - If subscribed: "Renews on 1 Apr 2026 · £4.99/month" 13pt muted-foreground
>
> **Feature comparison:**  
> Two-column comparison table. Column headers: "Free" and "Nest" — Nest header has terracotta bg 10% tint.  
> Rows (each feature):  
> - Shopping list — ✓ ✓  
> - Real-time sync — ✓ ✓  
> - Expenses (30 days) — ✓ —  
> - Full expense history — — ✓  
> - Chores — ✓ ✓  
> - Chore recurrence & streaks — — ✓  
> - Budget (current month) — ✓ ✓  
> - Budget history & trends — — ✓  
> - Hazel shopping assist — ✓ ✓  
> - Hazel expense categories — — ✓  
> - Hazel budget insights — — ✓  
> - Calendar sync — — ✓  
> - iOS app — — ✓  
> Checkmarks: `checkmark.circle.fill` sage for both tiers, `minus` muted for absent.
>
> **Upgrade section (if free):**  
> RoostCard sage-tinted background.  
> - "£4.99 / month" 26pt Medium foreground + "or £39.99/year" 15pt muted-foreground  
> - "Per household, not per person." 13pt muted-foreground  
> - "Upgrade to Nest" primary button full width  
> - "Start with annual plan" secondary button below
>
> **Promo code section:**  
> Collapsible row: `tag` icon + "Have a promo code?" 15pt + chevron. Expands to reveal input + Apply button.
>
> **FAQ section:**  
> Collapsible rows for each FAQ. Same expand pattern.
>
> ---
>
> ### Sheet: Add Expense
>
> Presented as bottom sheet (large detent). Drag handle at top.
>
> Title: "Add Expense" 20pt Medium  
>
> Fields (stacked, 12pt gaps):  
> - Title input: RoostTextField, placeholder "What did you spend on?"  
> - Amount input: RoostTextField, `£` prefix, numeric keyboard, placeholder "0.00"  
> - Category row: tappable row showing current category chip + "Change" muted text → opens inline category picker (grid of chips)  
> - Paid by: segmented control or chip picker showing both partner names + "Split equally" option  
> - Date: RoostDatePicker row — shows selected date + `calendar` icon, tappable opens inline month picker  
> - Split type: three-segment picker "Shared" | "Personal" | "Solo"  
> - Recurring toggle: RoostToggle. When on, interval picker appears: "Weekly" | "Monthly" | "Yearly" segment  
>
> Footer: Cancel ghost button + Save primary button, horizontal.
>
> ---
>
> ### Sheet: Add Chore
>
> Bottom sheet large detent. Drag handle.  
> Title: "Add Chore" 20pt Medium  
>
> Fields:  
> - Title input: "What needs doing?"  
> - Assign to: chip picker showing both partner names  
> - Due date: RoostDatePicker row  
> - Frequency: chip picker "One-time" | "Daily" | "Weekly" | "Monthly"  
> - Room: chip picker showing rooms list  
> - Notes: multiline text area, RoostTextField, 3 lines minimum  
>
> Footer: Cancel + Save.
>
> ---
>
> ### Sheet: Add Note (Pinboard)
>
> Bottom sheet medium detent.  
> Title: "Add Note"  
>
> Fields:  
> - Note text area: multiline RoostTextField, 4 lines, placeholder "Write something..."  
> - Audience: chip picker "Everyone" | "Me" | "Partner's name"  
> - Expires toggle: RoostToggle. When on, date picker row appears.  
>
> Footer: Cancel + Save.
>
> ---
>
> ### Sheet: Settle Up
>
> Bottom sheet medium detent.  
>
> **Stage 1 — Confirmation:**  
> - Avatar row: From-avatar → `arrow.right` → To-avatar  
> - Amount: "£24.50" 34pt Medium  
> - Supporting text: "Tom will transfer £24.50 to Alice"  
> - "Confirm settlement" primary button  
> - "Cancel" ghost button
>
> **Stage 2 — Note (optional):**  
> - "Add a note (optional)" label  
> - RoostTextField single line, placeholder "e.g. For groceries this week"  
> - "Confirm" primary button  
> - "Back" ghost button
>
> **Stage 3 — Success:**  
> - Large `checkmark.circle.fill` SF Symbol, 60pt, sage colour, spring-animated scale in  
> - "All settled up!" 22pt Medium  
> - "You're now even with Alice." 15pt muted-foreground  
> - "Done" primary button
>
> ---
>
> ### NestGate Overlay
>
> Presented as sheet (detent: medium).  
>
> - Top: Nest badge icon — crown or star in terracotta, 40pt, in accent-bg circle  
> - "Roost Nest" 22pt Medium  
> - Feature name: "Budget history & trends" (or whatever the locked feature is) 15pt muted-foreground  
> - Description: Short 2-sentence explanation of what unlocks  
> - Separator  
> - Feature list: 3–4 bullet rows with `checkmark.circle` sage icon + feature description  
> - "Upgrade to Nest · £4.99/mo" primary button  
> - "Maybe later" ghost button muted-foreground
>
> ---
>
> ### Notification Panel Sheet
>
> Sheet medium/large detent.  
> Title "Notifications" + "Mark all read" ghost button right.  
>
> Each notification row:  
> - Left: icon in accent-bg square (type-specific icon) — overdue chore `exclamationmark.circle`, new expense `creditcard`, settlement `arrow.left.right`, etc.  
> - Middle: notification text 15pt Regular. Bold the key entity name (expense name, chore title).  
> - Right: timestamp 12pt muted-foreground + unread indicator (8pt terracotta dot) if unread  
> - Row height 54pt. Tap row to mark as read + navigate to relevant section.  
> Empty: `bell.slash` SF Symbol + "No notifications" muted.
>
> ---
>
> ### Onboarding Tour Overlay
>
> Full-screen overlay on top of app. Semi-transparent dark background (`rgba(0,0,0,0.55)`) with blur.  
> A circular "spotlight" cutout (no background, reveals content beneath) centred on the highlighted element.  
>
> **Tooltip card:**  
> RoostCard, 280pt wide, positioned near spotlight (above or below, never clipped).  
> - Step title 17pt Medium foreground  
> - Step body text 15pt Regular muted-foreground  
> - 16pt gap  
> - Progress dots row centred (active = 8pt terracotta, inactive = 6pt muted) — 12 dots total  
> - Button row: "Back" ghost + "Next" primary, or "Finish" primary on last step  
> - "Skip" ghost button 13pt muted, far right or below buttons
>
> Steps navigate through: balance card → shopping → expenses → chores → calendar → profile → completion.

---

## PROMPT 3 — FINAL POLISH

---

**COPY THIS ENTIRE BLOCK TO FIGMA AI:**

---

> **Task:** Apply the final layer of polish across every screen of the Roost iOS app. This is about refinement, consistency, emotional resonance, and making the app feel premium, warm, and native-quality. Every detail — spacing, colour precision, state completeness, micro-interactions, empty states, loading states, and edge cases — must be addressed. The goal is for every screen to look as if it was designed and signed off by the same senior product designer who made the Mac app.
>
> Work through every screen in sequence. For each one, apply the polish items below.
>
> ---
>
> ### Global Polish Pass
>
> Apply these to every screen before screen-specific work:
>
> **1. Typography consistency check:**  
> Verify every text element uses only DM Sans Medium (500) or Regular (400). No bold, no semibold, no system default. Ensure page titles are 26pt Medium. Card titles 17pt Medium. Body 15pt Regular. Labels/badges 13pt Medium. Captions 12pt Regular. Hero numbers 34pt Medium. Apply to all screens.
>
> **2. Colour precision:**  
> Check every colour token against spec. Background cream must be `#ebe3d5` — not white, not grey-white. Card must be `#f2ebe0`. Primary terracotta `#d4795e`. Muted foreground `#6b6157`. Any element using default iOS blue should be corrected to terracotta or sage. Any pure black or pure white should be replaced with warm equivalents.
>
> **3. Border radius audit:**  
> All cards 14pt, hero cards 18pt, buttons and inputs 10pt, chips fully rounded. Check every rounded element. No default iOS 8pt system radius cards. No flat corners on any card.
>
> **4. Spacing rhythm:**  
> Page horizontal padding 20pt on all screens. Section vertical gaps 16–20pt. Card internal padding 16–20pt. Chip internal padding 4pt vertical, 10pt horizontal. Check that no section feels cramped or crowded.
>
> **5. Dark mode accuracy:**  
> Every screen should have a dark mode variant. Check that dark mode cards are `#1a1816`, background `#0f0d0b`, text `#f2ebe0`. No screens should appear jarring or cold in dark mode. It should feel like lamplight.
>
> **6. Empty states:**  
> Every list-based screen must have a polished empty state:  
> - Relevant SF Symbol 40pt in an accent-background rounded square (18pt radius), soft and warm  
> - Heading 17pt Medium foreground  
> - Supporting line 15pt Regular muted-foreground, max 2 lines  
> - Optional CTA button below (only where it makes sense)  
> - The tone must be warm, encouraging, not clinical. "Your list is empty" not "No data found."  
>
> Specific empty state copy:  
> Shopping: "Your list is empty · Add items above and they'll appear here"  
> Expenses: "No expenses yet · Add your first one below"  
> Budget: "No budget set · Visit Budget Categories to set limits"  
> Chores: "All caught up · No chores to do right now"  
> Calendar: "Nothing coming up · Your events will appear here"  
> Pinboard: "Nothing pinned yet · Share something with your home"  
> Activity: "Quiet in here · Activity will show up as you both use Roost"  
> Notifications: "You're all caught up · No new notifications"
>
> **7. Loading states:**  
> Every screen should have a loading skeleton variant:  
> - Skeleton blocks use muted background (`#ddd4c6` light, `#2a2623` dark) with a shimmer animation (subtle left-to-right light sweep)  
> - Skeleton blocks match the shape of the real content they replace  
> - Card skeletons: full-width card-height muted rectangle with internal lines  
> - List skeletons: 3–4 rows of progressively-narrowing skeleton lines  
> No loading spinners on main screens (only inside buttons).
>
> **8. Button states:**  
> All primary buttons: active state shows 0.97x scale. Ghost buttons: show muted bg on press. Disabled buttons: 50% opacity. Loading buttons: show inline spinner + "Saving..." label replacing default label.
>
> **9. Swipe actions:**  
> All deleteable list items have swipe-left revealing a red destructive action button labelled "Delete" with `trash` SF Symbol. The button reveals with a spring animation. Confirm tap required for irreversible actions (expense delete, chore delete, note delete). Shopping item delete is immediate.
>
> **10. Tab bar active states:**  
> Active tab: icon transitions from outline to filled SF Symbol variant, label colour transitions to terracotta. Both changes are instantaneous but smooth. Badge count updates in real-time.
>
> ---
>
> ### Screen-Specific Polish
>
> **Home / Dashboard polish:**  
>
> - Greeting changes based on time: "Good morning" before 12:00, "Good afternoon" 12:00–17:00, "Good evening" 17:00+. Design all three variants.  
> - Balance hero card: design all three state variants with correct colour tinting — settled (neutral), owed (sage tint), owing (destructive tint). The tint should be very subtle, 5–8% opacity wash over card background.  
> - Shopping + Chores cards: make sure both cards are exactly equal height. If one has less content, pad it to match. Neither card should clip or overflow.  
> - Budget progress bar: design three variants — green (under 70%), amber (70–99%), red (100%+). The bar should have rounded endcaps on both sides.  
> - Activity feed: ensure avatars use user colour + icon correctly. "You added..." vs "Tom added..." — the perspective is first-person for the logged-in user.  
> - Dashboard when completely fresh (no data anywhere): show a warm welcome state that gently points to each tab rather than a sea of empty cards.
>
> **Shopping polish:**  
>
> - Category headers: ensure the chevron rotation animation is indicated in the design (open vs closed states on each header).  
> - Hazel processing strip: the pulsing animation should be subtle — show the "during processing" state as a design variant.  
> - Shop countdown chip: design all four states: "In 7 days" (sage/neutral), "In 3 days" (amber/warning), "Tomorrow" (amber, stronger), "Today!" (destructive/terracotta, slightly larger text). The chip colour and label change across these states.  
> - "All done" celebration state: full-width sage-tinted card at the top of the list once everything is checked. Include a warm, subtle ✓ icon. "Clear completed" button in ghost style below.  
> - Item row: the delete button revealed by swipe should be a red rounded rectangle (not a full-height red bar). Give it the Roost radius and `trash` SF Symbol + "Remove" label.
>
> **Expenses polish:**  
>
> - Category chips on expense rows: each category has its own assigned colour (from the budget category colour system). Design the chip to have the category colour at 15% opacity as background and 100% as text colour. The 8 category colours are: terracotta `#d4795e`, sage `#9db19f`, amber `#e6a563`, clay `#b88b7e`, forest `#7fa087`, slate warm `#8a9ba8`, warm purple `#a08ab8`, warm fuchsia `#c4789a`.  
> - Balance card: when balance is exactly zero ("All settled up") — show a small sage `checkmark.circle.fill` icon + "You're even ✓" — no CTA button. This state should feel satisfying and warm.  
> - Recurring expense indicator: the `arrow.clockwise` icon and next-due date should be right-aligned and styled as a chip, not plain text. Use a very faint muted chip to contain it.  
> - Settlement history rows: these should be visually quieter than expense rows. No card border, just a plain row with a left-side directional arrow and subtle divider. The from/to names should use small RoostAvatars (18pt).
>
> **Budget Analytics polish:**  
>
> - Spend summary hero: when over budget, add a very faint destructive tint wash to the entire hero card (5% opacity). The headline amount should turn destructive colour. The status line "Over budget by £X" should be destructive and slightly larger than the on-track variant.  
> - Month comparison bar chart: bars should be warm and rounded. Use exact chart colours. Bars should animate their height on appear. Grid lines should be muted at 20% opacity. Today marker optional — a subtle vertical line if helpful.  
> - Projected spend: the "Projected: £743" figure should visually indicate whether it's good or bad. If projected < limit: sage colour. If projected > limit: destructive colour.  
> - Hazel insights card (Nest): the three focus area chips should use category colours matching the actual categories mentioned.  
> - Free tier gate on Budget: the entire month history arrow should be disabled (greyed out). Add a lock chip to the month navigator title: "← March · Nest only →". Tapping the arrow opens the NestGate sheet.
>
> **Budget Categories polish:**  
>
> - Expanded category card: the inner expense sub-list should have a clear visual separation from the card header area — use a subtle 1pt muted divider and inset the sub-list by 8pt on each side with muted background.  
> - "Set limit" ghost button: when no limit is set, the "Set limit" button opens an inline number input within the card row. The input field should appear with a spring animation and have a confirm checkmark button to the right.  
> - Category rows sorted by spend (highest first). Include a small ordinal or just ensure the visual weight of high-spend categories feels heavier (larger amount text? No — maintain consistency, just the ordering matters).
>
> **Chores polish:**  
>
> - Overdue section: the section header should have a subtle destructive-tinted background strip (6pt vertical padding, full width, destructive at 8% opacity). The overdue count should be in a destructive chip, not just text.  
> - Streak badge: the `flame` symbol + "4 weeks" badge should feel like a small celebration. Use a warm amber chip with amber text. Only appears on recurring chores with ≥2 consecutive completions.  
> - Completion animation: when a checkbox is tapped, the row should animate — checkbox fills with terracotta (spring scale pop), title gets strikethrough, row fades to 60% opacity and moves to Completed section. Design a "during animation" frame showing the mid-state.  
> - "Suggest chores" button: position as a secondary button in the top-right navigation bar (small, sage colour, `sparkles` icon). Not a FAB — the `+` FAB is for Add Chore only.  
> - Hazel suggestions: the suggestion chips should appear in a horizontal scroll row inside a sage-tinted card. Each chip is a primary-style pill with `+` SF Symbol left + chore name. After tapping all of them, the card shows a sage checkmark + "Added! Check the list." before dismissing.
>
> **Calendar polish:**  
>
> - Today cell: always visible even when another date is selected. Today has the terracotta circle background even when not selected. If selected, it gets an additional outline ring (2pt, 2pt gap from circle edge).  
> - Event dots: maximum 3 dots per day cell. If more than 3 events, show 2 dots + a "+N" label in 9pt muted. Dots are 5pt circles, 4pt gap between them, centred below the day number.  
> - Selected date panel: when a date with no events is selected, show "Nothing on [date]" in muted-foreground — never an empty screen. Show the date formatted as "Tuesday, 2 April".  
> - Event type left border colours in the event list: chore = sage `#9db19f`, expense = terracotta `#d4795e`, shopping = amber `#e6a563`. The border is 3pt wide, full row height.  
> - Apple Calendar sync: if on Nest, tapping shows a bottom sheet with the webcal:// URL, a copy button, and instructions ("Paste this into your Calendar app"). If free, NestGate sheet.
>
> **Pinboard polish:**  
>
> - Unseen note visual treatment: left border terracotta 3pt + card background tinted with primary at 3% opacity. Seen notes have neutral card background, no left border.  
> - Acknowledge button: only appears on notes not authored by the logged-in user (you can't acknowledge your own note). After acknowledging, the button disappears with a spring fade-out and the unseen visual treatment is removed. The note stays in the list.  
> - Audience indicator: "For everyone" uses a `person.2` SF Symbol 12pt + text. "For [name]" uses a `person` SF Symbol + name. Muted-foreground, 12pt.  
> - Note card expansion: long notes (>3 lines) truncate with a "See more" tappable in primary colour. Expanded state shows full content with "See less".  
> - Empty state per filter: if filter is "Expiring" and no expiring notes exist, show filter-specific empty state: "No notes expiring soon · All your notes are permanent or long-lived."
>
> **More Menu polish:**  
>
> - User card at top: ensure the avatar colour matches the actual user's selected avatar colour. The card should feel personal and warm — this is the only place in the app that knows it's "your" settings.  
> - Nest badge in menu: if subscribed to Nest, add a small terracotta "Nest" chip next to the user's name in the top card. If free, add a small muted "Free" chip.  
> - Section headers (group titles): all-caps, 13pt, muted-foreground, 16pt above the group card.  
> - Icon containers: each row icon should use a category-appropriate tint. Profile = terracotta-tinted square. Household = sage-tinted. Hazel = sage (sparkles icon always in sage). Notifications = amber. Budget = amber. Rooms = muted. Subscription = terracotta.  
> - Version number row: right-aligned "v1.4.0" in muted-foreground 13pt. No chevron. Non-interactive appearance.
>
> **Subscription screen polish:**  
>
> - If actively subscribed to Nest: add a visual "active" crown treatment — a small crown SF Symbol or badge in the top card. The card background gets a very faint terracotta tint (5% opacity). This should feel like a reward for being a subscriber, not a utility screen.  
> - If in trial: the trial card inside should be sage-tinted, with countdown urgency increasing as days decrease. 14 days: calm sage. 7 days: amber tint. 3 days or fewer: destructive-tinted with slightly more emphasis on the upgrade CTA.  
> - Feature comparison table: alternate row backgrounds (every other row has muted at 30% opacity tint) for readability. Column header for "Nest" has terracotta bg at 10% to draw the eye.  
> - Pricing: "£4.99 / month" should be prominent. "or £39.99/year · Save 33%" should appear below in sage-tinted text. The "Save" badge could be a sage chip.
>
> **All Sheets / Bottom Sheets polish:**  
>
> - Drag handle: always 4pt × 36pt, muted background, centred at top, 8pt from top of sheet. Always present on all bottom sheets.  
> - Sheet backgrounds: card colour (`#f2ebe0` light, `#1a1816` dark) — never white or system grey.  
> - Sheet shadow: `0 -8px 32px rgba(0,0,0,0.12)` warm-tinted at top edge.  
> - Save button: always primary (terracotta) full-width at bottom of form. Always the last element. 20pt padding below it.  
> - Cancel: always ghost or muted text link, positioned above or beside save.  
> - Form field spacing: 16pt between all fields. Labels 13pt Medium muted-foreground above each field, 6pt gap between label and field.
>
> **Onboarding Tour polish:**  
>
> - Spotlight: smooth fade-in of the overlay (0.3s). The spotlight circle should have a soft edge — use a subtle outer glow or very soft shadow to separate it from the dark overlay.  
> - Tooltip card: always positioned to never obscure the spotlight. If spotlight is in bottom third of screen, card appears above. If in top third, card appears below.  
> - Progress dots: animate smoothly between steps — active dot expands from 6pt to 8pt with spring.  
> - Final step (completion): the overlay fades out, the spotlight circle expands to fill the screen, and then the overlay fully disappears — a theatrical "reveal" of the app in one smooth motion (0.5s).  
> - Step copy must match Roost's warm voice: "Here's your household's pulse" not "This is the balance card". "Let's take a look at your shopping list together" not "Navigate to shopping".
>
> **NestGate polish:**  
>
> - The lock icon: use `lock.fill` SF Symbol in terracotta, 32pt, inside an accent-bg circle 64pt diameter. Spring-animated scale in on appear.  
> - Feature bullet list: use `checkmark.circle.fill` sage for each item. Max 4 items. Keep descriptions short and benefit-focused ("Full expense history, all time" not "Unlimited expense records").  
> - Pricing in CTA: "Upgrade to Nest · from £4.99/mo" — including the price in the button removes friction.  
> - The sheet should never feel aggressive. It is an invitation, not a hard wall. "Maybe later" must be visible and easy to tap.
>
> ---
>
> ### Final Cross-Screen Consistency Check
>
> After polishing individual screens, do a final pass:
>
> **1. Avatar system:**  
> Check that RoostAvatars appear in the same 36pt size everywhere they appear in lists. Profile view uses 48pt for the profile preview. Notification panel uses 28pt. All avatars use the user's selected colour + icon, with letter initials as fallback. No default iOS grey profile icons anywhere.
>
> **2. Chip system:**  
> All chips are fully rounded (cornerRadius: 999). Category chips use category colour at 15% opacity bg + 100% category colour text. Status chips use semantic colour at 15% opacity bg + semantic colour text. Muted chips use muted bg + muted-foreground text. No rectangular flat badges anywhere.
>
> **3. Progress bar system:**  
> All progress bars are 6pt height (8pt in hero contexts), fully rounded endcaps, smooth animated fill. Green below 70%, amber 70–99%, red 100%+. Verify Budget Hero, Budget Categories, and Dashboard Budget card all use consistent bar styling.
>
> **4. Icon container system:**  
> Every icon used in a card header, list row header, or empty state must be in a soft rounded square container (8pt radius, relevant tint at 15% opacity, 8pt internal padding). No bare SF Symbols floating without context.
>
> **5. Date formatting:**  
> Dates always formatted as human-readable: "4 Apr", "4 Apr 2025" (when year is different), "Today", "Yesterday", "Tomorrow", "2 days ago" for recent. No "2025-04-04" format anywhere. No "April 4th" American format.
>
> **6. Amount formatting:**  
> All monetary amounts use GBP format: "£24.50". Always 2 decimal places. Negative amounts shown as "−£24.50" (minus, not hyphen). Large amounts use comma separator: "£1,240.00".
>
> **7. Tone audit:**  
> Scan every piece of visible copy. Replace any clinical/generic phrasing:  
> "No records found" → "Nothing here yet"  
> "Error occurred" → "Something went wrong — try again"  
> "Loading..." → use skeleton states only, no text  
> "Submit" → "Save" or context-specific ("Add", "Confirm", "Create")  
> "Delete" in modals → "Remove" for soft deletes, "Delete" only for permanent
>
> **8. Navigation bar consistency:**  
> Tab bar is the primary navigation — no back buttons on root tab screens. Settings screens pushed from More → always have a back button and inline title (not large title). Modal sheets have drag handle + sheet title, no nav bar.
>
> **9. Safe area respect:**  
> Content never sits under the tab bar or behind the status bar. Bottom padding on all scrollable content: 80pt (clears tab bar + safe area). Top content begins below the status bar/navigation bar safe area.
>
> **10. The "feel" test:**  
> Step back from each screen and ask: does this feel warm? Does it feel like Roost? Does it feel native to iOS without feeling generic? Would someone who loves the Mac app recognise this immediately?  
> If any screen feels cold, flat, corporate, or generic — it needs more work. The answer is always more warmth, more breathing room, warmer colours, softer edges, more considered copy.  
> This app is someone's home. It should feel like it.

---

## Reference: Complete Screen Index

| # | Screen | Tab | Priority |
|---|---|---|---|
| 1 | Welcome / Sign In | — Auth | Critical |
| 2 | Sign Up | — Auth | Critical |
| 3 | Join Household | — Auth | High |
| 4 | Setup / Onboarding | — Auth | High |
| 5 | Home / Dashboard | Home | Critical |
| 6 | Shopping List | Shopping | Critical |
| 7 | Money > Expenses | Money | Critical |
| 8 | Money > Budget Analytics | Money | Critical |
| 9 | Money > Budget Categories | Money | High |
| 10 | Plan > Chores | Plan | Critical |
| 11 | Plan > Calendar | Plan | High |
| 12 | Plan > Pinboard | Plan | High |
| 13 | More Menu | More | High |
| 14 | Profile Settings | More | High |
| 15 | Household Settings | More | High |
| 16 | Rooms Settings | More | Medium |
| 17 | Budget Categories Settings | More | Medium |
| 18 | Hazel Settings | More | Medium |
| 19 | Notifications Settings | More | Medium |
| 20 | Account Settings | More | High |
| 21 | Subscription | More | High |
| 22 | Add Expense Sheet | Overlay | Critical |
| 23 | Add Chore Sheet | Overlay | Critical |
| 24 | Add Note Sheet | Overlay | High |
| 25 | Settle Up Sheet (3 stages) | Overlay | Critical |
| 26 | NestGate / Upgrade Sheet | Overlay | High |
| 27 | Notification Panel Sheet | Overlay | High |
| 28 | Onboarding Tour Overlay | Overlay | Medium |

**Total: 28 screens / overlays** (many with multiple state variants)

---

## Reference: Roost Voice & Copy Guide

| Generic | Roost |
|---|---|
| "No items found" | "Nothing here yet" |
| "Loading..." | *(use skeleton only)* |
| "Submit" | "Save" |
| "Error occurred" | "Something went wrong · try again" |
| "Balance: £0.00" | "You're all settled up" |
| "No events scheduled" | "Nothing coming up" |
| "Complete onboarding" | "Let's take a quick tour" |
| "Budget limit exceeded" | "Over budget this month" |
| "Recurring" | "Monthly · every month" |
| "Add item" | "Add an item" |
| "Delete record" | "Remove" |
| "User" | "[First name]" always |
| "Partner" | Partner's first name always |
| "Due date exceeded" | "Overdue" |
| "Unauthenticated" | "Let's get you signed in" |

---

*End of Roost iOS Figma AI Specification — v1.0 — March 2026*  
*Built from the Roost Mac app design system, translated for native iOS.*
