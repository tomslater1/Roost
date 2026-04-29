import { Link } from "react-router";
import { useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ShoppingCart, CheckSquare, Calendar, ArrowRight, Plus, Receipt, DollarSign, TrendingUp, Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useApp } from "../context/AppContext";
import { useQuickAdd } from "../context/QuickAddContext";
import { useCurrencyFormat } from "@/hooks/useHome";
import { SettleUpModal } from "../components/SettleUpModal";
import { AnimatedPage } from "../components/AnimatedPage";
import { EmptyState } from "../components/EmptyState";
import { StatsSkeleton, CardSkeleton } from "../components/LoadingSkeleton";
import { motion, type Variants } from "motion/react";

const feedContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};
const feedItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export function Dashboard() {
  const {
    currentUser,
    shoppingItems,
    chores,
    calendarEvents,
    expenses,
    budgetCategories,
    nextShopDate,
    getBalance,
    activities,
    isShoppingLoading,
    isExpensesLoading,
    isChoresLoading,
  } = useApp();
  
  const { openShopping, openExpense, openChore } = useQuickAdd();
  const fmt = useCurrencyFormat();
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);

  const greeting = getGreeting();
  const currentMonthLabel = format(new Date(), "MMMM");
  const balance = getBalance();
  
  // Calculate month spend
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear && e.splitType === "shared";
  });
  const monthSpend = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetTotal = budgetCategories.reduce((sum, c) => sum + c.limit, 0);
  
  // Shopping items (unchecked only)
  const allActiveShoppingItems = shoppingItems.filter(i => !i.checked);
  const activeShoppingItems = allActiveShoppingItems.slice(0, 3);
  const shoppingOverflow = allActiveShoppingItems.length - 3;

  // Next shop countdown
  const shopCountdown = (() => {
    if (!nextShopDate) return null;
    const days = differenceInCalendarDays(parseISO(nextShopDate), new Date());
    if (days < 0) return null;
    if (days === 0) return { label: "Shopping today", urgent: true };
    if (days === 1) return { label: "Shopping tomorrow", urgent: true };
    return { label: `Shopping in ${days} days`, urgent: false };
  })();
  
  // Today's events
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Your tasks — overdue means dueDate is before start of today (same as Chores page)
  const yourTasks = chores.filter(c => c.assignedTo === currentUser && !c.completed).slice(0, 3);
  const yourOverdueTasks = yourTasks.filter(t => t.dueDate && new Date(t.dueDate) < todayStart);
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const todayEvents = calendarEvents
    .filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= todayStart && eventDate <= todayEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Recent expenses
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };
  
  if (isShoppingLoading && isExpensesLoading && isChoresLoading) {
    return (
      <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
        <StatsSkeleton />
        <div className="grid grid-cols-2 gap-5">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </AnimatedPage>
    );
  }

  return (
    <>
      <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
        {/* Warm Greeting + Quick Actions */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">
              {greeting}, {currentUser}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{activeShoppingItems.length} items to buy</span>
              <span>•</span>
              <span className="text-destructive">{yourOverdueTasks.length} overdue</span>
              <span>•</span>
              <span>{todayEvents.length} events today</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2" data-onboarding="quick-actions">
            <Button size="sm" variant="outline" className="gap-2" onClick={openShopping}>
              <Plus className="w-4 h-4" />
              Shopping
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={openExpense}>
              <Plus className="w-4 h-4" />
              Expense
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={openChore}>
              <Plus className="w-4 h-4" />
              Chore
            </Button>
          </div>
        </div>

        {/* Shopping + Tasks Row */}
        <div className="grid grid-cols-3 gap-5">
          {/* Shopping List Preview */}
          <Link to="/shopping" className="block">
            <Card className="hover:bg-muted/30 transition-colors cursor-pointer h-64 overflow-hidden">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <span className="font-medium">Shopping</span>
                </div>
                
                <p className="text-4xl font-semibold mb-1">{activeShoppingItems.length}</p>
                <p className="text-sm text-muted-foreground mb-2">items to buy</p>
                {shopCountdown && (
                  <p className={`text-xs font-medium mb-4 ${shopCountdown.urgent ? "text-primary" : "text-muted-foreground"}`}>
                    {shopCountdown.label}
                  </p>
                )}

                <div className="space-y-2 mt-auto">
                  {activeShoppingItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                  {shoppingOverflow > 0 && (
                    <p className="text-xs text-muted-foreground pl-3.5">
                      +{shoppingOverflow} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Your Tasks */}
          <Link to="/chores" className="block">
            <Card className="hover:bg-muted/30 transition-colors cursor-pointer h-64">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-5">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  <span className="font-medium">Your Tasks</span>
                </div>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-4xl font-semibold">{yourTasks.length}</p>
                  {yourOverdueTasks.length > 0 && (
                    <span className="text-sm text-destructive font-medium">
                      {yourOverdueTasks.length} overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-5">to complete</p>

                <div className="space-y-2">
                  {yourTasks.map((task, i) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < todayStart;
                    return (
                      <div key={i} className={`flex items-center gap-2 text-sm ${isOverdue ? "text-destructive" : ""}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-destructive/40" : "bg-primary/40"}`} />
                        {task.title}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Activity Feed */}
          <Card className="h-64 flex flex-col">
            <CardContent className="p-5 flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <ActivityIcon className="w-5 h-5 text-primary" />
                <span className="font-medium">Activity</span>
              </div>

              <motion.div
                variants={feedContainerVariants}
                initial="hidden"
                animate="show"
                className="overflow-y-auto flex-1 min-h-0"
              >
                {activities.length === 0 ? (
                  <EmptyState
                    icon={ActivityIcon}
                    title="No activity yet"
                    description="Actions by you or your partner will show up here in real time."
                  />
                ) : activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    variants={feedItemVariants}
                    className="py-2 border-b border-border/40 last:border-0"
                  >
                    <p className="text-xs leading-snug">
                      <span className="font-medium">{activity.userName}</span>
                      {" "}{activity.action}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Events */}
        <Link to="/calendar" className="block">
          <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Today's Events</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-5">
                {todayEvents.map((event, i) => {
                  const eventDate = new Date(event.date);
                  const formatted = eventDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

                  return (
                    <div key={i} className="p-4 bg-muted/50 rounded-xl">
                      <p className="font-medium mb-2">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{formatted}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Balance + Budget */}
        <div className="grid grid-cols-2 gap-5">
          {/* Balance Card */}
          <Card data-onboarding="balance-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="font-medium">Balance</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  balance.oweType === "owed"
                    ? "bg-secondary/30 text-secondary-foreground"
                    : "bg-primary/10 text-primary"
                }`}>
                  {balance.oweType === "owed" ? "You're owed" : "You owe"}
                </span>
              </div>

              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <p className="text-4xl font-semibold mb-1">
                  {fmt(balance.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {balance.oweType === "owed"
                    ? `${balance.person} owes you`
                    : `You owe ${balance.person}`}
                </p>
              </motion.div>

              <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Household spend</p>
                  <p className="text-xl font-semibold">{fmt(monthSpend)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your share</p>
                  <p className="text-xl font-semibold">{fmt(monthSpend / 2)}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={() => setShowSettleUpModal(true)}>
                Settle up <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Month spending */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-medium">{currentMonthLabel} spending</span>
              </div>

              <div className="mb-4">
                <p className="text-4xl font-semibold mb-1">{fmt(monthSpend)}</p>
                <p className="text-sm text-muted-foreground">of {fmt(budgetTotal)}</p>
              </div>

              <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${budgetTotal > 0 ? (monthSpend / budgetTotal) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm mb-6 pt-1">
                <span className="text-muted-foreground">{budgetTotal > 0 ? Math.round((monthSpend / budgetTotal) * 100) : 0}% used</span>
                <span className="font-medium text-success">{fmt(budgetTotal - monthSpend)} left</span>
              </div>

              <Link to="/money">
                <Button variant="outline" className="w-full gap-2">
                  View Money <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Spending categories */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Spending categories</h3>
              <Link to="/money/spending" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-5">
              {budgetCategories.map((cat) => {
                const percentage = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
                const isWarning = percentage > 80;

                return (
                  <div key={cat.name} className="p-4 bg-muted/50 rounded-xl">
                    <p className="font-medium mb-3">{cat.name}</p>
                    <p className="text-2xl font-semibold mb-1">{fmt(cat.spent)}</p>
                    <p className="text-xs text-muted-foreground mb-3">of {fmt(cat.limit)}</p>
                    
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all ${isWarning ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <p className={`text-xs font-medium ${isWarning ? "text-destructive" : "text-muted-foreground"}`}>
                      {Math.round(percentage)}% used
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Recent Expenses</h3>
              </div>
              <Link to="/money/spending" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExpenses.map((expense, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-medium mb-1">{expense.title}</p>
                    <p className="text-xs text-muted-foreground">{expense.payer} • {getTimeAgo(new Date(expense.date))}</p>
                  </div>
                  <span className="text-xl font-semibold">{fmt(expense.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedPage>
      <SettleUpModal open={showSettleUpModal} onOpenChange={setShowSettleUpModal} />
    </>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}