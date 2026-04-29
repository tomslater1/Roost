# Roost iOS — Complete Button & Interaction Reference

> Purpose: Full inventory of every interactive element on every page of the iOS app, for use during Figma UI/UX design work. Covers buttons, taps, swipes, toggles, pickers, sheets, alerts, and gestures.

---

## Table of Contents

1. [Navigation Structure](#navigation-structure)
2. [Authentication Flow](#authentication-flow)
3. [Dashboard](#dashboard)
4. [Shopping](#shopping)
5. [Chores](#chores)
6. [Calendar](#calendar)
7. [Expenses](#expenses)
8. [Budget](#budget)
9. [Notifications](#notifications)
10. [Activity Feed](#activity-feed)
11. [More Menu](#more-menu)
12. [Settings](#settings)
13. [Rooms](#rooms)
14. [Hazel](#hazel)
15. [Subscription](#subscription)
16. [Sheets & Modals](#sheets--modals)

---

## Navigation Structure

The app uses a **5-tab bottom tab bar** as the root container once authenticated.

| Tab | Icon | Destination |
|-----|------|-------------|
| Home | House | DashboardView |
| Shopping | Cart | ShoppingListView |
| Money | £ symbol | MoneyHomeView (Expenses / Budget) |
| Plan | Calendar | LifeHomeView (Chores / Calendar) |
| More | Ellipsis | MoreMenuView |

The **More** tab shows a **badge** with the unread notification count when there are unread notifications.

**Before authentication**, the app shows:
- WelcomeView (not logged in)
- SetupView (logged in but no household)

---

## Authentication Flow

### WelcomeView

Entry point for new and returning users.

| Element | Type | Action |
|---------|------|--------|
| Sign In with Apple | Button (system) | Triggers native ASAuthorizationController sign-in |
| Continue with Google | Button | Google OAuth sign-in |
| Create account | NavigationLink | Pushes SignupView |
| I already have an account | NavigationLink | Pushes LoginView |

---

### LoginView

Email and password login.

| Element | Type | Action |
|---------|------|--------|
| Email | Text field | `.emailAddress` keyboard, no autocorrect |
| Password | SecureField | Hidden input |
| Log in | Button (primary) | Submits login — disabled if fields empty or currently submitting |

---

### SignupView

Create a new account via email/password.

| Element | Type | Action |
|---------|------|--------|
| Display Name | Text field | Free text |
| Email | Text field | `.emailAddress` keyboard |
| Password | SecureField | Hidden input |
| Create account | Button (primary) | Submits signup — disabled if fields invalid or currently submitting |

---

### SetupView

Shown after login when user has no household. Allows creating or joining one.

| Element | Type | Action |
|---------|------|--------|
| Create / Join | Segmented picker | Switches between create mode and join mode |
| Open invite link | NavigationLink | Shown only if a pending join code exists; pushes JoinView pre-filled |
| Home Name (Create mode) | Text field | Name for new household |
| Invite Code (Join mode) | Text field | Uppercase, no autocorrect |
| Your Display Name | Text field | Free text |
| Create my home / Join Home | Button (primary) | Executes action based on selected mode — disabled while loading |

---

### JoinView

Join an existing household via invite code (also accessible from SetupView).

| Element | Type | Action |
|---------|------|--------|
| Invite Code | Text field | No autocorrect or autocapitalisation |
| Display Name | Text field | Free text |
| Join Home | Button (primary) | Joins the household — disabled while loading |

---

## Dashboard

**DashboardView** — the Home tab. Overview of household activity.

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads all dashboard data |
| Shopping card / button | Button | Switches bottom tab to Shopping |
| Balance / Money card | Button | Switches bottom tab to Money (Expenses) |
| Chores card | Button | Switches bottom tab to Plan (Chores) |
| Budget card | Button | Switches bottom tab to Money (Budget) |
| Next shop card | Button | Switches bottom tab to Shopping |
| See all activity | Link / Button | Navigates to ActivityFeedView via notification router |
| Error message | Tap gesture | Dismisses error overlay |

> Note: All cards are full-width tappable areas, not small buttons. Each maps to a tab switch rather than a modal.

---

## Shopping

### ShoppingListView

Main shopping list screen.

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads shopping data |
| + (header / navigation bar) | Button (primary) | Opens AddShoppingItemSheet |
| Next shop card | Button | Opens AddShoppingItemSheet (shortcut entry point) |
| Quick-add text field | Text field | Type item name inline |
| + (quick-add row) | Button | Adds item from quick-add field — disabled if field is empty |
| Category header row | Tap gesture | Expands or collapses that category section |
| Shopping item row | Tap gesture | Toggles item checked/unchecked (strike-through animation) |
| Delete item (swipe) | Swipe action (trailing) | Deletes the shopping item |
| Error message | Tap gesture | Dismisses error overlay |

---

### ShoppingItemRow

Individual item in the shopping list.

| Element | Type | Action |
|---------|------|--------|
| Row tap | Tap gesture | Toggles checked state |

Visual states: unchecked (normal), checked (strike-through, reduced opacity).

---

### AddShoppingItemSheet *(sheet)*

| Element | Type | Action |
|---------|------|--------|
| Cancel | Toolbar button | Dismisses sheet without saving |
| Item name | Text field | Required — item name |
| Quantity | Text field | Optional — free text |
| Quick quantity chips | Buttons: "1", "2", "6", "1 pack", "2 pints", "Weekly" | Sets the Quantity field to that value |
| Category | Text field | Optional — free text |
| Category shortcut grid | Buttons: "Dairy", "Fruit", "Pantry", "Household", "Bakery", "Drinks" | Sets the Category field to that value |
| Add item | Button (primary, bottom) | Saves item — disabled if name is empty or currently saving |

---

## Chores

### ChoresView

Main chores management screen (accessible via Plan tab → Chores segment).

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads chores data |
| Suggest | Button (outline) | Toggles visibility of AI suggestion chips |
| Suggestion chips (e.g. "Take bins out") | Button chips | Opens AddChoreSheet pre-filled with that suggestion |
| Add chore | Button (primary) | Opens AddChoreSheet blank |
| Everyone / Me / Partner | Segmented picker | Filters chore list |
| Chore row | Tap gesture | Toggles chore completion |
| Long press / context menu on chore | Context menu | Shows "Delete" option |
| Error message | Tap gesture | Dismisses error overlay |

---

### ChoreRow

Individual chore in the list.

| Element | Type | Action |
|---------|------|--------|
| Row tap | Tap gesture | Toggles `isCompleted` |

Visual states: active (normal), completed (strike-through), overdue (destructive colour).

---

### AddChoreSheet *(sheet)*

| Element | Type | Action |
|---------|------|--------|
| Cancel | Toolbar button | Dismisses sheet without saving |
| Title | Text field | Required |
| Description | Text field | Optional |
| Assigned to chips | Button chips: "Me", "Partner", "Unassigned" | Sets assignment |
| Frequency chips | Button chips: "One-off", "Daily", "Weekly", "Monthly" | Sets recurrence |
| Include due date | Toggle | Shows / hides DatePicker below |
| Due date | DatePicker | Visible only when toggle is on |
| Room | Text field | Optional |
| Suggested room buttons | Button chips (room names) | Sets Room field |
| Add chore | Button (primary, bottom) | Saves chore — disabled if title is empty or currently saving |

---

## Calendar

### CalendarView

Month-view calendar showing chores and expenses (accessible via Plan tab → Calendar segment).

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads calendar data |
| < (previous month) | Button | Navigates to previous month |
| > (next month) | Button | Navigates to next month |
| Day cell | Tap gesture | Selects that date; shows events for selected day below the grid |
| Error message | Tap gesture | Dismisses error overlay |

---

### CalendarDayCell

Individual day in the calendar grid.

| Element | Type | Action |
|---------|------|--------|
| Cell tap | Tap gesture (handled by parent) | Selects that date |

Visual states: today (highlighted), selected (accent), has events (coloured dot indicators per type), past (muted).

---

## Expenses

### ExpensesView

Main expenses view (accessible via Money tab → Expenses segment).

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads expenses data |
| Filter chips | Buttons: "All", "Shared", "Personal", "Open" | Filters the expense list |
| Settle up (header area) | Button (secondary) | Opens SettleUpSheet — only visible when balance ≠ 0 and partner exists |
| Add expense | Button (primary) | Opens AddExpenseSheet |
| Settle up (on BalanceCardView) | Button | Opens SettleUpSheet |
| Expense row (long press) | Context menu | Shows "Delete" option |
| Error message | Tap gesture | Dismisses error overlay |

---

### BalanceCardView

Hero card showing the current balance between housemates.

| Element | Type | Action |
|---------|------|--------|
| Settle up | Button | Triggers `onSettleUp` callback → opens SettleUpSheet |

---

### AddExpenseSheet *(sheet)*

| Element | Type | Action |
|---------|------|--------|
| Cancel | Toolbar button | Dismisses sheet without saving |
| What was it for? | Text field | Required — expense title |
| Amount | Text field | `.decimalPad` keyboard — required |
| Paid by chips | Button chips: "Me", "Partner" | Visible only if partner exists — sets who paid |
| Split chips | Button chips: "Shared equally", "Solo" | Visible only if partner exists — sets split type |
| Category | Text field | Optional |
| Category shortcut buttons | Buttons: "Groceries", "Bills", "Dining", "House", "Travel" | Sets Category field |
| Date | DatePicker | Defaults to today |
| Notes | Text field | Optional |
| Add expense | Button (primary, bottom) | Saves expense — disabled if title or amount empty/invalid, or currently saving |

---

### SettleUpSheet *(sheet)*

| Element | Type | Action |
|---------|------|--------|
| Cancel | Toolbar button | Dismisses sheet (shown before settlement completes) |
| Done | Toolbar button | Dismisses sheet (shown after settlement completes, replaces Cancel) |
| Note | Text field | Optional — e.g. "Bank transfer" |
| Confirm settlement | Button (primary) | Records the settlement — disabled while settling |

After success the sheet enters a success state and the toolbar shows "Done" instead of "Cancel".

---

## Budget

### BudgetView

Budget tracking (accessible via Money tab → Budget segment).

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads budget data |
| < (previous month) | Button | Navigates to previous month |
| > (next month) | Button | Navigates to next month |
| New category | Button (secondary) | Shows alert with text input to name a new custom category |
| Set budget | Button (primary) | Opens SetBudgetSheet |
| + (toolbar, circle icon) | Toolbar button | Opens SetBudgetSheet — shown when view is not embedded |
| Tag icon (toolbar) | Toolbar button | Shows New Category alert — shown when view is not embedded |
| Budget category row | Tap gesture | Opens SetBudgetSheet pre-filled for that category |
| Long press / context menu on category | Context menu | Shows "Delete" option |
| Set first budget (empty state) | Button | Opens SetBudgetSheet |
| Error message | Tap gesture | Dismisses error overlay |

---

### BudgetCategoryRow

Individual budget category with spending progress bar — display only, tap handled by parent.

---

### SetBudgetSheet *(sheet)*

| Element | Type | Action |
|---------|------|--------|
| Cancel | Toolbar button | Dismisses sheet without saving |
| Category | Text field | Category name |
| Budget amount | Text field | `.decimalPad` keyboard — monthly limit in £ |
| Save budget | Button (primary, bottom) | Saves budget — disabled if category empty, amount invalid, or currently saving |

---

## Notifications

### NotificationsView

Notification inbox (accessible via More → Notifications).

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads notifications |
| Mark all read | Button | Marks all notifications as read — only visible when unread count > 0 |
| Notification row | Tap / Button | Marks notification as read and routes to the related feature |
| Error message | Tap gesture | Dismisses error overlay |

---

### NotificationRow

Individual notification — tap handled by parent.

Visual states: unread (accent dot / bold), read (muted).

---

## Activity Feed

### ActivityFeedView

Household activity log (accessible via More → Activity).

| Element | Type | Action |
|---------|------|--------|
| Pull to refresh | Gesture | Reloads activity data |
| Error message | Tap gesture | Dismisses error overlay |

Display only — no interactive rows.

---

### ActivityRow

Individual activity item — display only, no interactions.

---

## More Menu

### MoreMenuView

Secondary navigation hub (the More tab).

| Element | Type | Action |
|---------|------|--------|
| Household | NavigationLink | Pushes HouseholdSettingsView |
| Rooms | NavigationLink | Pushes RoomsView |
| Notifications | NavigationLink (with badge) | Pushes NotificationsView |
| Activity | NavigationLink | Pushes ActivityFeedView |
| Hazel | NavigationLink | Pushes HazelView |
| Subscription | NavigationLink | Pushes SubscriptionView |
| Profile | NavigationLink | Pushes ProfileSettingsView |
| Account | NavigationLink | Pushes AccountSettingsView |

---

## Settings

### SettingsView

*(Note: this view exists but the primary entry point for settings-style pages is the More menu above. Some settings pages are linked directly from MoreMenuView.)*

| Element | Type | Action |
|---------|------|--------|
| Profile | NavigationLink | Pushes ProfileSettingsView |
| Preferences | NavigationLink | Pushes PreferencesSettingsView |
| Household | NavigationLink | Pushes HouseholdSettingsView |
| Notifications | NavigationLink | Pushes NotificationSettingsView |
| Account | NavigationLink | Pushes AccountSettingsView |
| DishBoard | NavigationLink | Pushes DishBoardComingSoonView |
| Sign Out | Button (destructive, red) | Signs user out — disabled while signing out |
| Error / success overlay | Tap gesture | Dismisses message |

---

### ProfileSettingsView

Customise display name and avatar.

| Element | Type | Action |
|---------|------|--------|
| Display name | Text field | Editable inline |
| Avatar colour grid | Colour swatch buttons (4 per row) | Selects avatar background colour |
| None icon button | Button | Clears any selected avatar icon |
| Avatar icon grid | Icon buttons (5 per row) | Selects avatar icon |
| Save | Toolbar button | Saves changes |
| Error / success overlay | Tap gesture | Dismisses message |

---

### AccountSettingsView

Email, password, and destructive account actions.

| Element | Type | Action |
|---------|------|--------|
| New email | Text field | Enter new email address |
| Change Email | Button | Sends email change request |
| Send Password Reset OTP | Button | Sends password reset email to current address |
| Leave Household | Button (destructive) | Shows confirmation alert |
| — Alert: Cancel | Alert button | Dismisses alert |
| — Alert: Leave | Alert button (destructive) | Leaves the current household |
| Delete Account | Button (destructive) | Shows confirmation alert |
| — Alert: Cancel | Alert button | Dismisses alert |
| — Alert: Delete | Alert button (destructive) | Permanently deletes account |
| Error / success overlay | Tap gesture | Dismisses message |

---

### HouseholdSettingsView

Household name and invite management.

| Element | Type | Action |
|---------|------|--------|
| Household name | Text field | Editable inline |
| Save | Toolbar button | Saves household name |
| Share invite link | ShareLink button | Opens native iOS share sheet with the invite URL |
| Members list | Display only | Shows avatars and names of current members |
| Error / success overlay | Tap gesture | Dismisses message |

---

### PreferencesSettingsView

App-wide formatting and locale preferences.

| Element | Type | Action |
|---------|------|--------|
| Week starts | Segmented picker: "Monday" / "Sunday" | Sets first day of week |
| Time format | Segmented picker: "12h" / "24h" | Sets time display format |
| Currency | Dropdown picker | Sets currency symbol |
| Date format | Dropdown picker | Sets date display format |
| Save | Toolbar button | Saves all preferences |
| Error / success overlay | Tap gesture | Dismisses message |

---

### NotificationSettingsView

Per-category notification preferences.

| Element | Type | Action |
|---------|------|--------|
| Chores | Toggle | Enables / disables chore notifications |
| Expenses | Toggle | Enables / disables expense notifications |
| Shopping | Toggle | Enables / disables shopping notifications |
| Settlements | Toggle | Enables / disables settlement notifications |
| Enable quiet hours | Toggle | Enables quiet hours window — reveals time pickers below |
| Start | DatePicker (time) | Sets quiet hours start time — only visible when quiet hours enabled |
| End | DatePicker (time) | Sets quiet hours end time — only visible when quiet hours enabled |
| Save | Toolbar button | Saves all notification preferences |
| Error / success overlay | Tap gesture | Dismisses message |

---

### DishBoardComingSoonView

Placeholder screen. No interactive elements.

---

## Rooms

Manage household rooms and room groups (accessible via More → Rooms).

### RoomsView — Your Rooms section

| Element | Type | Action |
|---------|------|--------|
| Room row (edit icon) | Button (appears on tap/hover) | Opens inline edit row for that room |
| Room row (delete icon) | Button (appears on tap/hover) | Deletes the room — disabled while deletion pending |

**Inline edit row (shown when editing a room):**

| Element | Type | Action |
|---------|------|--------|
| Room name | Text field | Editable — saves on blur or Return, closes on Escape |
| Close (X) | Button | Dismisses edit mode without saving |
| Icon picker | Grid of icon buttons | Selects the room icon — saves automatically |

---

### RoomsView — Suggestions section

Preset room cards in a 2-column grid.

| Element | Type | Action |
|---------|------|--------|
| Preset room card | Button | Adds that preset room — disabled while adding, dimmed with checkmark if already added |

---

### RoomsView — Create a Custom Room section

| Element | Type | Action |
|---------|------|--------|
| Room name | Text field | Required — triggers add on Return |
| Icon picker | Row of icon buttons | Selects the icon for the new room |
| Add room | Button (primary) | Adds the custom room — disabled if name is empty, already exists, or currently adding |

Error state: "A room with this name already exists." shown inline if duplicate name entered.

---

### RoomsView — Room Groups section

| Element | Type | Action |
|---------|------|--------|
| New group | Button (secondary) | Toggles the New Group form open/closed |
| Built-in group rows | Display only | All Rooms, All Bedrooms, All Bathrooms — read-only with lock icon |
| Custom group row (edit icon) | Button | Opens inline edit row for that group |
| Custom group row (delete icon) | Button | Deletes the group — disabled while pending |

**Inline edit row (shown when editing a group):**

| Element | Type | Action |
|---------|------|--------|
| Group name | Text field | Editable — saves on blur or Return |
| Close (X) | Button | Dismisses edit mode |
| Icon picker | Grid of icon buttons | Selects the group icon |
| Room membership chips | Toggle buttons (one per room) | Tap to add/remove a room from the group — saves automatically |

**New Group form (shown when New group is tapped):**

| Element | Type | Action |
|---------|------|--------|
| Group name | Text field | Required |
| Icon picker | Grid of icon buttons | Selects the group icon |
| Room chips | Toggle buttons (one per room) | Tap to include/exclude rooms |
| Cancel | Button | Closes form and clears state |
| Create group | Button (primary) | Creates the group — disabled if name empty, already exists, or currently saving |

Error state: "A group with this name already exists." shown inline if duplicate name entered.

---

## Hazel

Configure the AI assistant (accessible via More → Hazel).

### HazelView

| Element | Type | Action |
|---------|------|--------|
| Shopping list toggle | Toggle switch | Enables / disables Hazel for the shopping list |
| Expenses toggle | Toggle switch | Enables / disables Hazel for expenses |
| Chores toggle | Toggle switch | Enables / disables Hazel for chores |
| Budget toggle | Toggle switch | Enables / disables Hazel for budget categories |

The rest of the page is informational:
- **Identity card** — description, status badge ("Active in X areas" or "Paused"), feature chips
- **See it in action** — before/after examples for each section (display only)
- **Privacy note** — explanation of data handling (display only)

The status badge on the identity card updates reactively to reflect how many toggles are currently on.

---

## Subscription

Manage the Roost Nest subscription (accessible via More → Subscription).

This page is **fully conditional** — the UI shown depends on the user's current subscription state.

---

### State: Free plan

| Element | Type | Action |
|---------|------|--------|
| Try Nest free for 14 days *or* Upgrade to Nest | Button (primary, large) | Opens the upgrade / paywall flow |

Also shows: feature comparison between free and Nest, sales points list, info box. All display only.

---

### State: Trial active

| Element | Type | Action |
|---------|------|--------|
| Keep Nest — choose a plan | Button (primary, large) | Opens the upgrade / plan selection flow |
| FAQ accordion (What happens when my trial ends?) | Tap to expand/collapse | Reveals answer text |

Also shows: trial progress bar (X of 14 days used), trial end date, feature grid. All display only.

---

### State: Active subscription

| Element | Type | Action |
|---------|------|--------|
| Manage subscription | Button (primary) | Opens Stripe customer portal — disabled if no billing ID or loading |

Also shows: current plan name + price, next billing date, feature grid, thank you text. All display only.

---

### State: Past due (payment failed)

| Element | Type | Action |
|---------|------|--------|
| Update payment method | Button (primary) | Opens Stripe customer portal — disabled if no billing ID or loading |

Also shows: warning card explaining billing issue, instructions. All display only.

---

### State: Cancelled

| Element | Type | Action |
|---------|------|--------|
| Resubscribe to Nest | Button (primary, large) | Opens the upgrade / resubscribe flow |

Also shows: reassurance that data is safe, feature grid. All display only.

---

### State: Lifetime access

No action buttons. Display only: confirmation of lifetime access, thank you message.

---

### Promo code section (all states)

| Element | Type | Action |
|---------|------|--------|
| Have a promo code? | Button (text/link style) | Toggles the promo code input open/closed |
| Promo code | Text field | Auto-uppercases input — disabled while applying |
| Apply | Button (primary) | Applies the promo code — disabled if field empty or currently applying |

Success state: replaces input with "You're all set — welcome to Roost Nest."
Error states: inline error message for invalid, expired, already used, or already lifetime codes.

---

## Sheets & Modals — Summary

Quick reference of all bottom sheets in the app and what triggers them.

| Sheet | Triggered from | Purpose |
|-------|---------------|---------|
| AddShoppingItemSheet | ShoppingListView (+ header button, Next shop card) | Add a new shopping item |
| AddChoreSheet | ChoresView (Add chore button, suggestion chips) | Add a new chore |
| AddExpenseSheet | ExpensesView (Add expense button) | Add a new expense |
| SettleUpSheet | ExpensesView (Settle up button), BalanceCardView (Settle up button) | Record a settlement between housemates |
| SetBudgetSheet | BudgetView (Set budget, + toolbar, category tap, empty state button) | Set or edit a monthly budget for a category |

---

## Global Patterns

These behaviours apply consistently across the whole app:

| Pattern | Behaviour |
|---------|-----------|
| **Primary button disabled state** | All primary action buttons disable when: required fields are empty, input is invalid, or an async operation is in progress |
| **Pull to refresh** | Supported on: Shopping, Chores, Expenses, Calendar, Budget, Notifications, Activity |
| **Error overlay** | Appears as an overlay message — tap anywhere on it to dismiss |
| **Success overlay** | Same visual pattern as error — tap to dismiss |
| **Context menus** | Long-press on: chore rows (Delete), expense rows (Delete), budget category rows (Delete) |
| **Swipe actions** | Trailing swipe on shopping item rows → Delete |
| **Toolbar buttons** | Cancel (left) and primary action (right) on all sheets |
| **Sheet dismiss on success** | Sheets auto-dismiss after a successful save, or show a success state before manual dismissal (SettleUpSheet) |
| **Subscription states** | SubscriptionView renders different UI depending on state: free, trial, active, past due, cancelled, lifetime |
