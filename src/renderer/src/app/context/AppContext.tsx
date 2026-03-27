import { createContext, useContext, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/context/AuthContext";
import { useHome } from "@/hooks/useHome";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettlements } from "@/hooks/useSettlements";
import { useChores } from "@/hooks/useChores";
import { useRooms } from "@/hooks/useRooms";
import { useRoomGroups } from "@/hooks/useRoomGroups";
import { SYSTEM_GROUPS } from "@/lib/rooms";
import { useCalendarEvents as useRealCalendarEvents } from "@/hooks/useCalendarEvents";
import { useBudget } from "@/hooks/useBudget";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useNotifications } from "@/hooks/useNotifications";
import type { HomeMember } from "@/lib/schemas/home";
import type { ExpenseWithSplits } from "@/lib/schemas/expenses";
import { getInitials } from "@/lib/utils";
import type { Category } from "@/lib/categories";

// ── Figma UI types (kept identical so pages don't need changes) ────────────

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  category: string;
  checked: boolean;
  addedBy: string;
  addedAt: Date;
}

export interface Expense {
  id: string;
  title: string;
  payer: string;
  date: Date;
  amount: number;
  type: "one-off" | "recurring";
  category: string;
  splitType: "shared" | "personal";
  youOwe?: number;
  interval?: string;
  nextDue?: Date;
  tags?: string[];
  receiptUrl?: string;
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface Chore {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: Date | null;
  completed: boolean;
  frequency?: "one-time" | "daily" | "weekly" | "monthly";
  notes?: string;
  completedAt?: Date;
  room?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "chore" | "expense" | "shopping";
  meta?: string;
  isOverdue?: boolean;
  sourceId?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
  color?: string;
}

export interface Notification {
  id: string;
  type: "chore" | "expense" | "shopping_item" | "settlement" | "bill_reminder";
  title: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Activity {
  id: string;
  userName: string;
  userInitials: string;
  userColor: string;
  userIcon?: string | null;
  action: string;
  timestamp: Date;
}

interface AppContextType {
  currentUser: string;
  partnerName: string;
  householdName: string;
  currentMember: HomeMember | null;
  partnerMember: HomeMember | null;
  updateHouseholdName: (name: string) => void;
  shoppingItems: ShoppingItem[];
  isAddingShoppingItem: boolean;
  addShoppingItem: (name: string, quantity?: number, category?: string) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  clearCompletedItems: () => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  settlements: Settlement[];
  addSettlement: (settlement: Omit<Settlement, "id">) => void;
  getBalance: () => { amount: number; oweType: "owed" | "owes"; person: string };
  chores: Chore[];
  choreHistory: Array<{ choreId: string; userName: string; completedAt: Date }>;
  isAddingChore: boolean;
  rooms: { name: string; icon: string }[];
  roomGroups: { id: string; name: string; icon: string; isSystem: boolean; memberRoomIds: string[] }[];
  addChore: (chore: Omit<Chore, "id">) => void;
  updateChore: (id: string, chore: Partial<Chore>) => void;
  deleteChore: (id: string) => void;
  toggleChore: (id: string) => void;
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  allCategories: Category[];
  budgetCategories: BudgetCategory[];
  updateBudgetCategory: (id: string, category: Partial<BudgetCategory>) => void;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  nextShopDate: string | null;
  activities: Activity[];
  undoLastAction: () => void;
  canUndo: boolean;
  isShoppingLoading: boolean;
  isExpensesLoading: boolean;
  isAddingExpense: boolean;
  isChoresLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Type adapters ─────────────────────────────────────────────────────────

function memberName(userId: string | null | undefined, members: HomeMember[]): string {
  if (!userId) return "Unknown";
  return members.find((m) => m.user_id === userId)?.display_name ?? "Unknown";
}

function memberColor(userId: string | null | undefined, members: HomeMember[]): string {
  if (!userId) return "#7F77DD";
  return members.find((m) => m.user_id === userId)?.avatar_color ?? "#7F77DD";
}

function memberIcon(userId: string | null | undefined, members: HomeMember[]): string | null {
  if (!userId) return null;
  return members.find((m) => m.user_id === userId)?.avatar_icon ?? null;
}

// ── Provider ──────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const { home, members } = useHome();
  const queryClient = useQueryClient();

  // ── Raw hook data ──────────────────────────────────────────────────────
  const shoppingHook = useShoppingList();
  const expensesHook = useExpenses();
  const settlementsHook = useSettlements();
  const choresHook = useChores();
  const roomsHook = useRooms();
  const roomGroupsHook = useRoomGroups();
  const calendarHook = useRealCalendarEvents();
  const budgetHook = useBudget({ expenses: expensesHook.expenses as ExpenseWithSplits[] });
  const activityHook = useActivityFeed();
  const notificationsHook = useNotifications();

  // ── Current user identity ─────────────────────────────────────────────
  const currentMember = members.find((m) => m.user_id === user?.id);
  const partnerMember = members.find((m) => m.user_id !== user?.id);
  const currentUser = currentMember?.display_name ?? user?.email?.split("@")[0] ?? "You";
  const partnerName = partnerMember?.display_name ?? "Your partner";
  const householdName = home?.name ?? "Our Home";

  // ── updateHouseholdName ───────────────────────────────────────────────
  const updateHouseholdName = useCallback(async (name: string) => {
    if (!home?.id) throw new Error('Home not loaded')
    const { error } = await supabase.from("homes").update({ name }).eq("id", home.id);
    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ["home", user?.id] });
  }, [home?.id, user?.id, queryClient]);

  // ── Shopping ──────────────────────────────────────────────────────────
  const shoppingItems: ShoppingItem[] = shoppingHook.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity != null ? Number(item.quantity) : undefined,
    category: item.category ?? "Other",
    checked: item.checked,
    addedBy: memberName(item.added_by, members),
    addedAt: new Date(item.created_at),
  }));

  const addShoppingItem = useCallback((name: string, quantity?: number, category?: string) => {
    shoppingHook.addItem.mutate({ name, quantity: quantity?.toString(), category });
  }, [shoppingHook.addItem]);

  const toggleShoppingItem = useCallback((id: string) => {
    const raw = shoppingHook.items.find((i) => i.id === id);
    if (!raw) return;
    shoppingHook.toggleItem.mutate({ id, checked: !raw.checked, name: raw.name });
  }, [shoppingHook.items, shoppingHook.toggleItem]);

  const deleteShoppingItem = useCallback((id: string) => {
    const raw = shoppingHook.items.find((i) => i.id === id);
    if (!raw) return;
    shoppingHook.deleteItem.mutate({ id, name: raw.name });
  }, [shoppingHook.items, shoppingHook.deleteItem]);

  const clearCompletedItems = useCallback(async () => {
    const completed = shoppingHook.items.filter((i) => i.checked);
    if (completed.length === 0) return;
    try {
      await Promise.all(completed.map((i) => shoppingHook.deleteItem.mutateAsync({ id: i.id, name: i.name })));
      toast.success(`Cleared ${completed.length} completed item${completed.length === 1 ? '' : 's'}`);
    } catch {
      toast.error('Failed to clear some items');
    }
  }, [shoppingHook.items, shoppingHook.deleteItem]);

  // ── Expenses ──────────────────────────────────────────────────────────
  const expenses: Expense[] = expensesHook.expenses.map((e) => ({
    id: e.id,
    title: e.title,
    payer: memberName(e.paid_by, members),
    date: new Date(e.date),
    amount: Number(e.amount),
    type: e.is_recurring ? "recurring" : "one-off",
    category: e.category ?? "Other",
    splitType: e.split_type === "equal" ? "shared" : "personal",
    interval: e.recurrence_interval ?? undefined,
  }));

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    // Convert display name back to user ID
    const payerId = members.find((m) => m.display_name === expense.payer)?.user_id ?? user?.id ?? "";
    expensesHook.addExpense.mutate({
      title: expense.title,
      amount: expense.amount,
      paid_by: payerId,
      split_type: expense.splitType === "shared" ? "equal" : "solo",
      category: expense.category,
      date: expense.date instanceof Date ? expense.date.toISOString().split("T")[0] : String(expense.date),
      is_recurring: expense.type === "recurring",
      recurrence_interval: expense.interval
        ? (expense.interval.toLowerCase() as "weekly" | "monthly" | "yearly")
        : undefined,
    });
  }, [members, user?.id, expensesHook.addExpense]);

  const updateExpense = useCallback((_id: string, _updates: Partial<Expense>) => {
    // Not exposed in real hook — show toast only
    toast.info("Edit expenses directly in the list");
  }, []);

  const deleteExpense = useCallback((id: string) => {
    const raw = expensesHook.expenses.find((e) => e.id === id);
    if (!raw) return;
    expensesHook.deleteExpense.mutate({ id, title: raw.title });
  }, [expensesHook.expenses, expensesHook.deleteExpense]);

  // ── Settlements ───────────────────────────────────────────────────────
  const settlements: Settlement[] = settlementsHook.settlements.map((s) => ({
    id: s.id,
    from: memberName(s.paid_by, members),
    to: memberName(s.paid_to, members),
    amount: Number(s.amount),
    date: new Date(s.created_at),
    note: s.note ?? undefined,
  }));

  const addSettlement = useCallback((settlement: Omit<Settlement, "id">) => {
    const debtorId = members.find((m) => m.display_name === settlement.from)?.user_id ?? user?.id ?? "";
    const creditorId = members.find((m) => m.display_name === settlement.to)?.user_id ?? partnerMember?.user_id ?? "";
    expensesHook.settleUp.mutate({
      debtorId,
      creditorId,
      amount: settlement.amount,
      note: settlement.note,
    });
  }, [members, user?.id, partnerMember?.user_id, expensesHook.settleUp]);

  const getBalance = useCallback((): { amount: number; oweType: "owed" | "owes"; person: string } => {
    const bal = expensesHook.balance;
    return {
      amount: Math.abs(bal),
      oweType: bal >= 0 ? "owed" : "owes",
      person: partnerName,
    };
  }, [expensesHook.balance, partnerName]);

  // ── Chores ────────────────────────────────────────────────────────────
  const chores: Chore[] = choresHook.chores.map((c) => ({
    id: c.id,
    title: c.title,
    assignedTo: memberName(c.assigned_to, members),
    dueDate: c.due_date ? new Date(c.due_date) : null,
    completed: !!c.last_completed_at,
    frequency: (c.frequency as Chore["frequency"]) ?? undefined,
    notes: c.description ?? undefined,
    completedAt: c.last_completed_at ? new Date(c.last_completed_at) : undefined,
    room: c.room ?? undefined,
  }));

  const choreHistory = choresHook.choreHistory.map((item) => ({
    choreId: item.entity_id ?? "",
    userName: memberName(item.user_id, members),
    completedAt: new Date(item.created_at),
  })).filter((h) => !!h.choreId);

  // All rooms available to this household — entirely user-managed, from DB
  const rooms = roomsHook.rooms.map((r) => ({ name: r.name, icon: r.icon }));

  // System groups are always present; "All Bedrooms"/"All Bathrooms" are only
  // shown when the household has matching rooms (so empty groups don't appear).
  const roomGroups = [
    // "All Rooms" — always present, hardcoded, not removable
    {
      id: '__all_rooms__',
      name: 'All Rooms',
      icon: 'Home',
      isSystem: true as const,
      memberRoomIds: roomsHook.rooms.map((r) => r.id),
    },
    // Other system groups — always present (memberRoomIds is empty until matching rooms are added)
    ...SYSTEM_GROUPS.filter((sg) => sg.name !== 'All Rooms').map((sg) => ({
      id: `__system__${sg.name}`,
      name: sg.name,
      icon: sg.icon,
      isSystem: true as const,
      memberRoomIds: roomsHook.rooms.filter((r) => sg.matches(r.name)).map((r) => r.id),
    })),
    // Custom groups from DB
    ...roomGroupsHook.groups.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      isSystem: false as const,
      memberRoomIds: g.room_group_members.map((m) => m.room_id),
    })),
  ];

  const addChore = useCallback((chore: Omit<Chore, "id">) => {
    const assignedId = members.find((m) => m.display_name === chore.assignedTo)?.user_id ?? user?.id;
    choresHook.addChore.mutate({
      title: chore.title,
      description: chore.notes,
      assigned_to: assignedId,
      due_date: chore.dueDate ? chore.dueDate.toISOString().split("T")[0] : undefined,
      frequency: chore.frequency !== "one-time" ? (chore.frequency as "daily" | "weekly" | "monthly" | undefined) : undefined,
      room: chore.room ?? undefined,
    });
  }, [members, user?.id, choresHook.addChore]);

  const updateChore = useCallback((_id: string, _updates: Partial<Chore>) => {
    toast.info("Edit chores by deleting and re-adding");
  }, []);

  const deleteChore = useCallback((id: string) => {
    const raw = choresHook.chores.find((c) => c.id === id);
    if (!raw) return;
    choresHook.deleteChore.mutate({ id, title: raw.title });
  }, [choresHook.chores, choresHook.deleteChore]);

  const toggleChore = useCallback((id: string) => {
    const raw = choresHook.chores.find((c) => c.id === id);
    if (!raw) return;
    if (raw.last_completed_at) {
      choresHook.uncompleteChore.mutate({ id });
    } else {
      choresHook.completeChore.mutate({
        id,
        title: raw.title,
        frequency: raw.frequency,
        due_date: raw.due_date,
      });
    }
  }, [choresHook.chores, choresHook.completeChore, choresHook.uncompleteChore]);

  // ── Calendar ──────────────────────────────────────────────────────────
  const calendarEvents: CalendarEvent[] = calendarHook.events.map((e) => ({
    id: e.id,
    title: e.title,
    date: new Date(e.date + "T12:00:00"),
    type: e.type,
    meta: e.meta,
    isOverdue: e.isOverdue,
    sourceId: e.id,
  }));

  // Calendar events are derived — these are intentional no-ops
  const addCalendarEvent = useCallback((_event: Omit<CalendarEvent, "id">) => {}, []);
  const updateCalendarEvent = useCallback((_id: string, _event: Partial<CalendarEvent>) => {}, []);
  const deleteCalendarEvent = useCallback((_id: string) => {}, []);

  // ── Budget ────────────────────────────────────────────────────────────
  const allCategories: Category[] = budgetHook.allCategories;

  const budgetCategories: BudgetCategory[] = [
    ...(budgetHook.summary?.budgeted ?? []),
    ...(budgetHook.summary?.unbudgeted ?? []),
  ].map((row) => ({
    id: row.budgetId ?? row.category.name,
    name: row.category.name,
    limit: row.limit ?? 0,
    spent: row.spend,
    color: row.category.color,
  }));

  const updateBudgetCategory = useCallback((id: string, updates: Partial<BudgetCategory>) => {
    if (updates.limit === undefined) return;
    // Find the category name by id
    const cat = [...(budgetHook.summary?.budgeted ?? []), ...(budgetHook.summary?.unbudgeted ?? [])]
      .find((r) => (r.budgetId ?? r.category.name) === id);
    if (!cat) return;
    budgetHook.upsertBudget.mutate({
      category: cat.category.name,
      amount: updates.limit,
      month: new Date().toISOString().slice(0, 7) + "-01",
    });
  }, [budgetHook.summary, budgetHook.upsertBudget]);

  // ── Notifications ─────────────────────────────────────────────────────
  const notifications: Notification[] = notificationsHook.notifications.map((n) => ({
    id: n.id,
    type: (["chore", "expense", "shopping_item", "settlement", "bill_reminder"].includes(n.type ?? "")
      ? n.type
      : "expense") as Notification["type"],
    title: n.title,
    timestamp: new Date(n.created_at),
    isRead: n.read,
  }));

  const markNotificationAsRead = useCallback(async (id: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (!error) queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }, [user?.id, queryClient]);

  const markAllNotificationsAsRead = useCallback(() => {
    notificationsHook.markAllRead.mutate();
  }, [notificationsHook.markAllRead]);

  // ── Activity feed ─────────────────────────────────────────────────────
  const activities: Activity[] = activityHook.items.map((item) => {
    const name = memberName(item.user_id, members);
    return {
      id: item.id,
      userName: name,
      userInitials: getInitials(name),
      userColor: memberColor(item.user_id, members),
      userIcon: memberIcon(item.user_id, members),
      action: item.action,
      timestamp: new Date(item.created_at),
    };
  });

  // ── Undo (not supported with server state — no-op) ────────────────────
  const undoLastAction = useCallback(() => {
    toast.info("Undo is not available for synced data");
  }, []);

  const value: AppContextType = {
    currentUser,
    partnerName,
    householdName,
    currentMember: currentMember ?? null,
    partnerMember: partnerMember ?? null,
    updateHouseholdName,
    shoppingItems,
    isAddingShoppingItem: shoppingHook.isAdding,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCompletedItems,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    settlements,
    addSettlement,
    getBalance,
    chores,
    choreHistory,
    rooms,
    roomGroups,
    addChore,
    updateChore,
    deleteChore,
    toggleChore,
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    allCategories,
    budgetCategories,
    updateBudgetCategory,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    nextShopDate: home?.next_shop_date ?? null,
    activities,
    undoLastAction,
    canUndo: false,
    isShoppingLoading: shoppingHook.isLoading,
    isExpensesLoading: expensesHook.isLoading,
    isAddingExpense: expensesHook.isAdding,
    isAddingChore: choresHook.isAdding,
    isChoresLoading: choresHook.isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
