# Roost Design Ethos

**A comprehensive guide to the design philosophy, visual language, and interaction patterns that make Roost feel like home.**

---

## Philosophy

Roost is a household management app for couples that prioritizes **warmth over sterility, comfort over corporate, and coziness over clinical**. The design is inspired by the video game *Hozy*, embodying the feeling of a well-lived home—soft, inviting, organic, and human. Every design decision, from color to spacing to animation timing, reinforces the idea that managing a household together should feel joyful and effortless, not like work.

---

## Color System

### Inspiration
The color palette is drawn from warm, earthy tones found in cozy homes: terracotta pottery, sage plants on windowsills, cream linen, warm wood, and natural light filtering through curtains.

### Light Mode Palette

**Foundation Colors:**
- **Background:** `#ebe3d5` - A noticeably warm cream, never pure white. This is the canvas that wraps everything in warmth.
- **Foreground:** `#3d3229` - Warm dark brown instead of black. Text feels organic and printed, not digital.
- **Card:** `#f2ebe0` - Very creamy off-white for elevated surfaces. Still warm, never stark.

**Semantic Colors:**
- **Primary (Terracotta):** `#d4795e` - The heart of the app. A warm coral-terracotta that feels inviting and approachable, never aggressive or loud. Used for CTAs, active states, and moments of importance.
- **Secondary (Sage):** `#9db19f` - A soft, muted sage green that brings balance and calm. Used for secondary actions and supportive UI elements.
- **Muted:** `#ddd4c6` - Warm neutral background for subtle emphasis.
- **Muted Foreground:** `#6b6157` - For secondary text that needs to recede gently.
- **Accent:** `#e8d5bc` - A warm peachy-amber for hover states and subtle highlights.

**Status Colors:**
- **Success:** `#7fa087` - Forest green, natural and reassuring.
- **Warning:** `#e6a563` - Warm amber that suggests attention without alarm.
- **Info:** `#9db19f` - Uses the sage secondary color.
- **Destructive:** `#c75146` - A muted terracotta-red. Even destruction feels warm, not harsh.

**Chart Colors:**
A curated set of earthy tones for data visualization:
1. `#d4795e` - Terracotta
2. `#9db19f` - Sage
3. `#e6a563` - Warm amber
4. `#b88b7e` - Clay pink
5. `#7fa087` - Forest green

**Input & Interactive Elements:**
- **Input Background:** `#e3d9ca` - Slightly darker cream for form fields.
- **Switch Background:** `#c9c2b8` - Neutral warm for toggle elements.
- **Border:** `rgba(61, 50, 41, 0.15)` - Subtle, warm-toned borders that define without dividing.
- **Ring (Focus):** `rgba(212, 121, 94, 0.3)` - Soft terracotta glow for keyboard focus states.

### Dark Mode Palette

Dark mode maintains the warmth but shifts to a cozy, candlelit atmosphere—think of a warm living room at night, not a cold tech interface.

**Foundation Colors:**
- **Background:** `#0f0d0b` - Very dark charcoal with a hint of warmth, almost black but never pure.
- **Foreground:** `#f2ebe0` - Warm cream text that feels like candlelight.
- **Card:** `#1a1816` - Darker cards that create depth.

**Semantic Colors:**
- **Primary:** `#d4795e` - Terracotta maintains its presence in dark mode.
- **Secondary:** `#7a8c7c` - Muted sage that complements the darker background.
- **Muted:** `#2a2623` - Darker warm neutral.
- **Muted Foreground:** `#a39a8f` - Softer text for hierarchy.
- **Accent:** `#2a2623` - Darker warm tone for subtle emphasis.

**Interactive Elements:**
- **Input Background:** `#1f1c19` - Darker input fields.
- **Switch Background:** `#3a3530` - Warm toggle backgrounds.
- **Border:** `rgba(242, 235, 224, 0.1)` - Subtle light borders in dark mode.

### Theme Transitions

All color changes during theme switching are smoothly animated over **0.2-0.3 seconds** with ease timing. This prevents jarring shifts and maintains the app's calm, intentional feel.

---

## Typography

### Font Family
**DM Sans** - A geometric sans-serif with humanist warmth. It's modern without being cold, clear without being sterile. The rounded letterforms and balanced proportions make it perfect for both UI and content.

**Fallback Stack:** `'DM Sans', system-ui, -apple-system, sans-serif`

### Font Weights
Roost uses a **restrained weight system** to maintain softness:
- **Medium (500):** For headings, labels, buttons, and emphasis. Never bold—boldness can feel aggressive.
- **Normal (400):** For body text and inputs.

### Type Scale
**Base size:** `16px` - Comfortable and accessible.

**Scale:**
- `h1`: 2xl - For page titles
- `h2`: xl - For section headings
- `h3`: lg - For card titles
- `h4`: base - For subsection headings
- `label`: base, medium weight
- `button`: base, medium weight
- `input`: base, normal weight

**Line height:** `1.5` across all text elements for comfortable reading.

### Typography Principles
1. **Hierarchy through size and weight, never color alone.** Important text is larger and medium weight.
2. **Use muted foreground for secondary text,** creating gentle visual hierarchy.
3. **Never use all-caps for large blocks,** only for small labels like section headings.
4. **Let text breathe.** Generous line-height and spacing prevent cramped interfaces.

---

## Spacing & Layout

### Border Radius
**Base radius:** `0.875rem` (14px) - Noticeably rounded corners that feel soft and friendly.

**Scale:**
- **sm:** `calc(var(--radius) - 4px)` - 10px, for small elements
- **md:** `calc(var(--radius) - 2px)` - 12px, for medium elements
- **lg:** `var(--radius)` - 14px, for cards and major containers
- **xl:** `calc(var(--radius) + 4px)` - 18px, for prominent elements

### Spacing Philosophy
Roost follows a **generous spacing system** that prioritizes breathing room:
- Cards have substantial padding (`p-6`, `p-8`) to prevent cramped content.
- Vertical sections use consistent gaps (`space-y-5`, `space-y-6`) for rhythm.
- Lists use comfortable spacing between items.
- The layout never feels dense—even information-heavy screens maintain calm through space.

### Layout Structure
**Max Widths:**
- **Dashboard:** `max-w-6xl` - Wider for overview content
- **Detail pages:** `max-w-xl` - Narrower for focused tasks
- **Settings:** `max-w-md` - Comfortable reading width

**Container padding:** `p-6` on mobile, scales up on larger screens.

---

## Borders & Dividers

**Border Color:** Subtle, warm-toned with low opacity (`rgba(61, 50, 41, 0.15)` in light mode).

**Usage:**
- Cards have borders, but they're soft—defining space without harsh divisions.
- Dividers use the same subtle approach.
- Input fields have borders for definition but blend into the background when not focused.

**Border weights:** Always `1px` or `border` (default). Never heavy or bold.

---

## Shadows & Depth

Roost uses **minimal shadow** to maintain flatness and warmth:
- Cards typically have border-based elevation, not heavy shadows.
- Modals and popovers use soft shadows: `shadow-lg`, `shadow-2xl`.
- Shadows are warm-toned, never pure black.

**Layering through background color and border,** not aggressive z-depth.

---

## Motion & Animation

### Philosophy
Animations in Roost are **smooth, intentional, and never distracting**. They serve two purposes:
1. **Provide feedback** - Users know their action was received.
2. **Maintain spatial continuity** - Elements move logically through space.

### Animation System

**Timing:**
- **Page transitions:** 0.4s smooth easing for major view changes.
- **Modals/dialogs:** 0.25s ease-out for quick, responsive opening.
- **Interactive elements:** 0.15-0.2s for hovers and clicks.
- **List items:** 0.3s ease-out for additions/removals.

**Easing Functions:**
- **Smooth:** `[0.43, 0.13, 0.23, 0.96]` - For page transitions and major movements.
- **Snappy:** `[0.34, 1.56, 0.64, 1]` - Springy feel for buttons and interactions.
- **Ease-out:** `[0.16, 1, 0.3, 1]` - Gentle deceleration for opening elements.

### Motion Patterns

**Page Transitions:**
```
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0, duration: 0.4s }
exit: { opacity: 0, y: -8, duration: 0.3s }
```
Subtle vertical movement creates flow between pages.

**Modals & Dialogs:**
```
hidden: { opacity: 0, scale: 0.95, y: 20 }
visible: { opacity: 1, scale: 1, y: 0, duration: 0.25s }
```
Scale and rise, like content gently appearing.

**Buttons:**
```
hover: { scale: 1.02 }
tap: { scale: 0.98 }
transition: spring with stiffness: 400, damping: 17
```
All buttons have hover scale (1.02x) and tap scale (0.98x) with spring physics.

**List Items:**
```
hidden: { opacity: 0, y: -10, scale: 0.95 }
visible: { opacity: 1, y: 0, scale: 1, duration: 0.3s }
exit: { opacity: 0, scale: 0.9, x: -20, duration: 0.2s }
```
Items enter from above and exit to the left.

**Checkboxes:**
When an item is checked, it animates to 60% opacity and 98% scale over 0.2s.

**Strikethrough:**
A strikethrough line animates from 0% to 100% width over 0.4s when items are marked complete.

**Theme Transitions:**
All color properties transition smoothly over 0.2s with ease timing.

### Animation Principles
1. **Subtle over flashy.** Never draw unnecessary attention.
2. **Consistent timing.** Similar actions have similar durations.
3. **Physics-based when interactive.** Spring animations for buttons feel responsive.
4. **Respect reduced motion preferences.** (Implemented at system level)

---

## Components & Patterns

### Buttons

**Variants:**
- **Default (Primary):** Terracotta background, cream text. For primary actions.
- **Secondary:** Sage background, warm text. For supporting actions.
- **Outline:** Border with background fill, warm text. For tertiary actions.
- **Ghost:** No background or border, warm text. For minimal actions.
- **Destructive:** Muted red background, cream text. For delete/remove actions.

**Sizes:**
- **sm:** `h-8`, smaller padding - For compact UI
- **default:** `h-9`, standard padding - Standard size
- **lg:** `h-10`, generous padding - For prominent CTAs
- **icon:** `size-9` square - For icon-only buttons

**Interaction:**
- All buttons scale to **1.02x on hover** and **0.98x on tap**.
- Spring physics make interactions feel responsive and alive.
- Focus rings are soft terracotta glows, never harsh outlines.

### Cards

**Structure:** Rounded corners (`rounded-lg`), subtle border, warm background.

**Padding:** Generous (`p-6` to `p-8`) to prevent cramped content.

**Hover states:** Some cards (like dashboard snapshots) have subtle hover lifts.

### Inputs

**Background:** Slightly darker cream (`#e3d9ca`) to define the input area.

**Border:** Subtle warm border that strengthens on focus.

**Focus state:** Terracotta ring glow (`ring-ring/50`, `border-ring`).

**Placeholder text:** Muted foreground color, gentle and guiding.

### Navigation

**Bottom Navigation:**
- 7 nav items in a horizontal row
- Active state: Primary background with 10% opacity, primary text, icon scales to 110%
- Hover: Muted background, slightly brighter text
- Icon + label stacked vertically
- Smooth transitions on all state changes

**Top Bar:**
- Minimal height (56px)
- Right-aligned utilities: theme toggle, notifications, profile
- Notification badge: Small terracotta circle with count
- Profile avatar: Colored circle with initials

### Modals & Dialogs

**Backdrop:** Black with 60% opacity and backdrop blur.

**Content:** Card-styled with border and shadow, center-aligned.

**Animation:** Fade + scale + rise (0.25s ease-out).

**Structure:** Header with title, body content, footer with actions.

### Lists

**Shopping Lists:**
- Checkbox + item name + quantity
- Strikethrough animation when checked
- Delete button appears on hover
- Grouped by category when applicable
- Smooth stagger animation when multiple items load

**Activity Feed:**
- Avatar + action text + timestamp
- Chronological order
- Relative timestamps ("2 hours ago")
- Colored avatars for different users

### Empty States

**Structure:**
- Icon in a rounded square with muted background
- Heading in default weight
- Body text in muted foreground
- Optional CTA button

**Tone:** Encouraging and friendly, never scolding or clinical.

### Loading States

**Skeletons:** Animated shimmer effect on muted background blocks.

**Spinner:** Used sparingly, only for full-page loads.

**Inline loading:** Button text changes ("Saving…"), button disabled.

---

## Interaction Patterns

### Hover States
- Buttons scale and/or change background
- Cards can lift slightly with shadow
- List items show action buttons (delete, edit)
- Links underline or change color
- All transitions: 0.15-0.2s

### Focus States
- Soft terracotta ring glow around focused elements
- Never harsh blue outlines
- Ring opacity: 50% for subtlety
- Keyboard navigation feels warm and welcoming

### Active/Selected States
- Primary background with reduced opacity (10-20%)
- Primary text color
- Slightly bolder appearance (scale or weight)

### Disabled States
- 50% opacity
- Pointer events disabled
- No hover effects
- Muted but still visible

---

## Toast Notifications

**Library:** Sonner

**Position:** Bottom-right

**Style:**
- Warm card background
- Border and shadow
- Primary accent for success toasts
- Destructive accent for errors
- Undo actions when applicable

**Duration:** Auto-dismiss after 3-5 seconds, unless action required.

---

## Icons

**Library:** Lucide React

**Style:** Stroke-based, clean, geometric

**Size:** Typically `w-4 h-4` or `w-5 h-5` depending on context.

**Color:** Inherits from parent text color for consistency.

**Usage:** Always paired meaningfully with text or used in clear contexts.

---

## Accessibility

### Color Contrast
All text meets WCAG AA standards for contrast:
- Foreground on background: High contrast
- Muted foreground on background: Still readable
- White text on primary: Clear contrast

### Focus Indicators
- All interactive elements have visible focus states
- Keyboard navigation is fully supported
- Focus ring is custom-styled but clearly visible

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs
- Buttons and links clearly distinguished
- ARIA labels where needed

### Motion
- Smooth transitions are short enough to not cause discomfort
- Reduced motion preferences are respected
- Animations enhance, never block, functionality

---

## Dark Mode Philosophy

Dark mode in Roost is not just inverted colors—it's a **shift in atmosphere**. Light mode feels like a sun-filled room; dark mode feels like a cozy evening by soft lamplight. The warmth is maintained through:

1. **Warm blacks:** Never pure black (`#000`), always warm charcoal (`#0f0d0b`).
2. **Cream text:** Never pure white (`#fff`), always warm cream (`#f2ebe0`).
3. **Preserved primary colors:** Terracotta and sage maintain their character.
4. **Subtle borders:** Light borders (`rgba(242, 235, 224, 0.1)`) define space softly.
5. **Depth through background layers:** Cards are lighter than background, creating hierarchy.

**Toggle:**
- Theme toggle in top bar (sun/moon icon)
- Smooth transition between modes
- Preference saved in localStorage
- System preference respected on first load
- Keyboard shortcut: `Cmd/Ctrl + Shift + L`

---

## Responsive Behavior

Roost is primarily designed for **desktop web experience** (this is a web build of a macOS app), but maintains responsiveness:

**Breakpoints:**
- Mobile: Base styles, single column layouts
- Tablet: `sm:` breakpoint, wider cards
- Desktop: `lg:`, `xl:` breakpoints, multi-column grids

**Navigation:**
- Bottom nav wraps on very small screens
- Top bar remains fixed
- Content areas are scrollable

---

## Data Visualization

### Charts
**Library:** Recharts

**Colors:** Uses the 5-color chart palette (terracotta, sage, amber, clay pink, forest green).

**Style:**
- Warm backgrounds
- Subtle gridlines
- Clear labels in muted foreground
- Tooltips match card styling
- Rounded bars/lines where possible

### Progress Bars
**Colors:**
- Green (safe): `#7fa087`
- Amber (warning): `#e6a563`
- Red (over): `#c75146`

**Transitions:** Smooth width animations (0.3s ease-out).

**Fill:** Rounded ends, warm colors.

---

## Voice & Tone

The design system extends to **copy and microcopy**:

**Principles:**
1. **Warm and conversational,** never corporate or robotic
2. **Encouraging,** never scolding
3. **Clear and direct,** never overly cute
4. **Human,** acknowledging that this is about real people managing a real home together

**Examples:**
- "All settled up" not "Balance: £0.00"
- "You're owed £24.50" not "Your balance: +£24.50"
- "Nothing coming up this week" not "No events scheduled"
- "Let's take a quick tour" not "Complete onboarding tutorial"

---

## Context & State Management

### Contexts
1. **AppContext** - Centralized state for all data (shopping, expenses, chores, etc.)
2. **ThemeContext** - Theme state and toggle function
3. **OnboardingContext** - Onboarding flow state

### State Updates
- All mutations go through context functions
- Toast notifications confirm actions
- Undo functionality for destructive actions
- Optimistic updates where appropriate
- Live updates across components

---

## Special Features

### Onboarding System
A **12-step guided tour** that walks new users through the app:
- Spotlight highlighting on target elements
- Contextual tooltips with arrows
- Auto-navigation between pages
- Progress indicators (dots)
- Smooth animations
- Skip/complete options
- Dark overlay with backdrop blur

### Settle Up Flow
A **multi-step modal** for settling balances:
- Confirmation stage
- Note entry (optional)
- Success celebration
- Smooth transitions between stages
- Confetti animation on completion

### Quick Actions
**Floating quick-add buttons** in the dashboard:
- Add shopping item
- Add expense
- Add chore
- Modals for each action
- Fast, focused forms
- Keyboard shortcuts supported

---

## Performance Considerations

1. **Animations are GPU-accelerated** (transform, opacity)
2. **Skeleton loaders prevent layout shift**
3. **Images lazy-load where appropriate**
4. **State updates are batched**
5. **Transitions are brief enough to feel instant**

---

## Future-Proofing

The design system is built to scale:
- Color tokens allow easy palette updates
- Component variants support new patterns
- Animation system is extensible
- Spacing scale accommodates growth
- Typography hierarchy has room for new levels

---

## Summary

Roost's design ethos is about **creating a digital space that feels as warm and inviting as a well-loved home**. Every color, every radius, every animation timing is chosen to reinforce that this is a tool for **people managing life together**, not a cold productivity app.

The design is:
- **Warm** over sterile
- **Soft** over sharp
- **Calm** over energetic
- **Human** over mechanical
- **Inviting** over imposing

When in doubt, ask: *Does this feel like home?*
