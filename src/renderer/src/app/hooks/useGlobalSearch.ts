import { useMemo } from "react"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  PiggyBank,
  CheckSquare,
  CalendarDays,
  Pin,
  Bell,
  Home,
  User,
  Settings,
  Sparkles,
  Activity,
} from "lucide-react"
import { useApp } from "../context/AppContext"
import { useHome } from "./useHome"
import { usePinboard } from "./usePinboard"

export interface GlobalSearchResult {
  id: string
  title: string
  subtitle: string
  route: string
  section: string
  icon: LucideIcon
  keywords: string[]
  priority?: number
}

function normalise(value: string): string {
  return value.toLowerCase().trim()
}

function scoreResult(result: GlobalSearchResult, query: string): number {
  const q = normalise(query)
  if (!q) return result.priority ?? 0

  const haystacks = [result.title, result.subtitle, ...result.keywords].map(normalise)
  const title = normalise(result.title)

  if (title === q) return 120 + (result.priority ?? 0)
  if (title.startsWith(q)) return 100 + (result.priority ?? 0)
  if (haystacks.some((text) => text.split(/\s+/).some((word) => word.startsWith(q)))) return 80 + (result.priority ?? 0)
  if (haystacks.some((text) => text.includes(q))) return 55 + (result.priority ?? 0)
  return 0
}

export function useGlobalSearch(query: string) {
  const {
    shoppingItems,
    expenses,
    chores,
    calendarEvents,
    budgetCategories,
    notifications,
    activities,
    currentUser,
    partnerName,
  } = useApp()
  const { home, members } = useHome()
  const { notes } = usePinboard()

  const allResults = useMemo<GlobalSearchResult[]>(() => {
    const staticResults: GlobalSearchResult[] = [
      {
        id: "page-dashboard",
        title: "Dashboard",
        subtitle: "Everything in one place",
        route: "/dashboard",
        section: "Pages",
        icon: LayoutDashboard,
        keywords: ["home", "overview", "activity", "balance"],
        priority: 40,
      },
      {
        id: "page-shopping",
        title: "Shopping",
        subtitle: "Shared list and next shop date",
        route: "/shopping",
        section: "Pages",
        icon: ShoppingCart,
        keywords: ["groceries", "list", "food", "shop"],
        priority: 38,
      },
      {
        id: "page-expenses",
        title: "Expenses",
        subtitle: "Shared spending and settle up",
        route: "/expenses",
        section: "Pages",
        icon: Receipt,
        keywords: ["bills", "money", "rent", "mortgage", "spend"],
        priority: 38,
      },
      {
        id: "page-budget",
        title: "Budget",
        subtitle: "Monthly limits and category spend",
        route: "/budget",
        section: "Pages",
        icon: PiggyBank,
        keywords: ["budget", "limit", "categories", "monthly"],
        priority: 36,
      },
      {
        id: "page-chores",
        title: "Chores",
        subtitle: "Tasks, streaks, and due dates",
        route: "/chores",
        section: "Pages",
        icon: CheckSquare,
        keywords: ["tasks", "cleaning", "due", "weekly"],
        priority: 36,
      },
      {
        id: "page-calendar",
        title: "Calendar",
        subtitle: "Events, recurring bills, and due dates",
        route: "/calendar",
        section: "Pages",
        icon: CalendarDays,
        keywords: ["dates", "schedule", "events", "webcal"],
        priority: 34,
      },
      {
        id: "page-pinboard",
        title: "Pinboard",
        subtitle: "Shared notes and reminders",
        route: "/pinboard",
        section: "Pages",
        icon: Pin,
        keywords: ["notes", "reminders", "seen", "message"],
        priority: 35,
      },
      {
        id: "settings-profile",
        title: "Profile settings",
        subtitle: "Name, avatar, and personal details",
        route: "/settings/profile",
        section: "Settings",
        icon: User,
        keywords: ["profile", "avatar", "name", "account"],
        priority: 20,
      },
      {
        id: "settings-household",
        title: "Household settings",
        subtitle: "Invite link, members, and home details",
        route: "/settings/household",
        section: "Settings",
        icon: Home,
        keywords: ["invite", "partner", "members", "household"],
        priority: 20,
      },
      {
        id: "settings-notifications",
        title: "Notification settings",
        subtitle: "Quiet hours and reminder preferences",
        route: "/settings/notifications",
        section: "Settings",
        icon: Bell,
        keywords: ["notifications", "quiet hours", "bill reminders", "pinboard"],
        priority: 20,
      },
      {
        id: "settings-hazel",
        title: "Hazel settings",
        subtitle: "AI helpers and smart suggestions",
        route: "/settings/hazel",
        section: "Settings",
        icon: Sparkles,
        keywords: ["hazel", "ai", "smart", "suggestions"],
        priority: 16,
      },
      {
        id: "settings-account",
        title: "Account settings",
        subtitle: "Security, sign out, and account controls",
        route: "/settings/account",
        section: "Settings",
        icon: Settings,
        keywords: ["account", "email", "password", "security"],
        priority: 16,
      },
    ]

    const shoppingResults: GlobalSearchResult[] = shoppingItems.map((item) => ({
      id: `shopping-${item.id}`,
      title: item.name,
      subtitle: `Shopping · ${item.checked ? "done" : item.category}`,
      route: "/shopping",
      section: "Shopping",
      icon: ShoppingCart,
      keywords: [item.category, item.addedBy, item.checked ? "done" : "to buy"],
      priority: item.checked ? 2 : 14,
    }))

    const expenseResults: GlobalSearchResult[] = expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      title: expense.title,
      subtitle: `Expenses · £${expense.amount.toFixed(2)} · ${expense.category}`,
      route: "/expenses",
      section: "Expenses",
      icon: Receipt,
      keywords: [expense.category, expense.payer, expense.type, expense.interval ?? ""],
      priority: expense.type === "recurring" ? 18 : 12,
    }))

    const choreResults: GlobalSearchResult[] = chores.map((chore) => ({
      id: `chore-${chore.id}`,
      title: chore.title,
      subtitle: `Chores · ${chore.assignedTo}${chore.room ? ` · ${chore.room}` : ""}`,
      route: "/chores",
      section: "Chores",
      icon: CheckSquare,
      keywords: [chore.assignedTo, chore.frequency ?? "", chore.room ?? "", chore.completed ? "done" : "todo"],
      priority: chore.completed ? 3 : 14,
    }))

    const calendarResults: GlobalSearchResult[] = calendarEvents.map((event) => ({
      id: `calendar-${event.id}`,
      title: event.title,
      subtitle: `Calendar · ${event.type}${event.meta ? ` · ${event.meta}` : ""}`,
      route: "/calendar",
      section: "Calendar",
      icon: CalendarDays,
      keywords: [event.type, event.meta ?? "", event.isOverdue ? "overdue" : "upcoming"],
      priority: event.isOverdue ? 15 : 10,
    }))

    const budgetResults: GlobalSearchResult[] = budgetCategories.map((category) => ({
      id: `budget-${category.id}`,
      title: category.name,
      subtitle: `Budget · £${category.spent.toFixed(2)} of £${category.limit.toFixed(2)}`,
      route: "/budget",
      section: "Budget",
      icon: PiggyBank,
      keywords: ["budget", "limit", "spend", category.name],
      priority: 10,
    }))

    const pinboardResults: GlobalSearchResult[] = notes.map((note) => ({
      id: `pin-${note.id}`,
      title: note.content.slice(0, 56) + (note.content.length > 56 ? "…" : ""),
      subtitle: `Pinboard${note.link_label ? ` · ${note.link_label}` : " · Note"}`,
      route: "/pinboard",
      section: "Pinboard",
      icon: Pin,
      keywords: [note.link_label ?? "", note.target_scope, note.content],
      priority: 11,
    }))

    const notificationResults: GlobalSearchResult[] = notifications.map((notification) => ({
      id: `notification-${notification.id}`,
      title: notification.title,
      subtitle: `Notifications · ${notification.type.replaceAll("_", " ")}`,
      route: "/settings/notifications",
      section: "Notifications",
      icon: Bell,
      keywords: [notification.type, notification.isRead ? "read" : "unread"],
      priority: notification.isRead ? 2 : 9,
    }))

    const activityResults: GlobalSearchResult[] = activities.slice(0, 20).map((activity) => ({
      id: `activity-${activity.id}`,
      title: `${activity.userName} ${activity.action}`,
      subtitle: "Recent activity",
      route: "/dashboard",
      section: "Activity",
      icon: Activity,
      keywords: [activity.userName, activity.action],
      priority: 6,
    }))

    const peopleResults: GlobalSearchResult[] = members.map((member) => ({
      id: `member-${member.id}`,
      title: member.display_name ?? "Household member",
      subtitle: `Household · ${member.role}`,
      route: "/settings/household",
      section: "Household",
      icon: User,
      keywords: [member.role, home?.name ?? "", currentUser, partnerName],
      priority: 8,
    }))

    return [
      ...staticResults,
      ...shoppingResults,
      ...expenseResults,
      ...choreResults,
      ...calendarResults,
      ...budgetResults,
      ...pinboardResults,
      ...notificationResults,
      ...activityResults,
      ...peopleResults,
    ]
  }, [
    shoppingItems,
    expenses,
    chores,
    calendarEvents,
    budgetCategories,
    notifications,
    activities,
    members,
    notes,
    home?.name,
    currentUser,
    partnerName,
  ])

  const results = useMemo(() => {
    const q = normalise(query)
    if (!q) {
      return allResults
        .slice()
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        .slice(0, 10)
    }

    return allResults
      .map((result) => ({ result, score: scoreResult(result, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ result }) => result)
      .slice(0, 18)
  }, [allResults, query])

  const suggestion = useMemo(() => {
    const q = normalise(query)
    if (!q) return ""
    const match = results.find((result) => normalise(result.title).startsWith(q) && normalise(result.title) !== q)
    if (!match) return ""
    return match.title.slice(query.length)
  }, [query, results])

  return { results, suggestion }
}
