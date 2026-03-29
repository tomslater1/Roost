import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ListFilter,
  Lock,
  Crown,
  PiggyBank,
  Receipt,
  Repeat,
  Settings2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedPage } from "../components/AnimatedPage";
import { CategoryIcon } from "../components/CategoryIcon";
import { EmptyState } from "../components/EmptyState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useBudget } from "@/hooks/useBudget";
import { useExpenses } from "@/hooks/useExpenses";
import { COLOR_CLASSES, getCategoryMeta, type Category } from "@/lib/categories";
import type { ExpenseWithSplits } from "@/lib/schemas/expenses";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionUi } from "@/context/SubscriptionUiContext";

const ease = [0.43, 0.13, 0.23, 0.96] as const;
const spring = { type: "spring" as const, stiffness: 400, damping: 17 };

interface CategoryRow {
  category: Category;
  spend: number;
  limit: number | null;
  pct: number;
  isOver: boolean;
  budgetId?: string;
  monthExpenses: ExpenseWithSplits[];
  recurringExpenses: ExpenseWithSplits[];
}

interface HazelBudgetInsight {
  summary: string;
  outlook: string;
  focus: string[];
}

export function Budget() {
  const navigate = useNavigate();
  const expensesHook = useExpenses();
  const budgetHook = useBudget({ expenses: expensesHook.expenses });
  const { canAccess, hasUsedTrial } = useSubscription();
  const { openUpgrade } = useSubscriptionUi();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analytics" | "categories">("analytics");
  const [hazelInsight, setHazelInsight] = useState<HazelBudgetInsight | null>(null);
  const [hazelLoading, setHazelLoading] = useState(false);
  const canUseHazelBudgetInsights = canAccess('hazel_budget_insights');

  const isLoading = budgetHook.isLoading || expensesHook.isLoading;

  const monthStart = startOfMonth(budgetHook.selectedMonth);
  const monthEnd = endOfMonth(budgetHook.selectedMonth);
  const monthKey = format(monthStart, "yyyy-MM-dd");
  const lastMonthStart = startOfMonth(subMonths(budgetHook.selectedMonth, 1));
  const lastMonthEnd = endOfMonth(subMonths(budgetHook.selectedMonth, 1));

  const monthExpenses = useMemo(
    () =>
      expensesHook.expenses.filter((e) => {
        try {
          return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd });
        } catch {
          return false;
        }
      }),
    [expensesHook.expenses, monthStart, monthEnd]
  );

  const lastMonthExpenses = useMemo(
    () =>
      expensesHook.expenses.filter((e) => {
        try {
          return isWithinInterval(parseISO(e.date), { start: lastMonthStart, end: lastMonthEnd });
        } catch {
          return false;
        }
      }),
    [expensesHook.expenses, lastMonthStart, lastMonthEnd]
  );

  const totalThisMonth = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const monthTrend = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : null;

  const allRows: CategoryRow[] = useMemo(() => {
    const limitsForMonth: Record<string, { amount: number; id: string }> = {};
    for (const b of budgetHook.rawBudgets) {
      if (b.month === monthKey) limitsForMonth[b.category] = { amount: Number(b.amount), id: b.id };
    }

    const allCats = budgetHook.allCategories;
    const seenNames = new Set(allCats.map((c) => c.name));

    const rows: CategoryRow[] = allCats.map((cat) => {
      const catExpenses = monthExpenses.filter((e) => e.category === cat.name);
      const spend = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const limitEntry = limitsForMonth[cat.name];
      const limit = limitEntry?.amount ?? null;
      const pct = limit ? Math.min((spend / limit) * 100, 100) : 0;
      const recurring = expensesHook.expenses.filter((e) => e.is_recurring && e.category === cat.name);

      return {
        category: cat,
        spend,
        limit,
        pct,
        isOver: limit !== null && spend > limit,
        budgetId: limitEntry?.id,
        monthExpenses: catExpenses,
        recurringExpenses: recurring,
      };
    });

    const orphanedSpend: Record<string, number> = {};
    const orphanedExpenses: Record<string, ExpenseWithSplits[]> = {};

    for (const e of monthExpenses) {
      if (!e.category || seenNames.has(e.category)) continue;
      orphanedSpend[e.category] = (orphanedSpend[e.category] ?? 0) + Number(e.amount);
      orphanedExpenses[e.category] = [...(orphanedExpenses[e.category] ?? []), e];
    }

    for (const [name, spend] of Object.entries(orphanedSpend)) {
      const limitEntry = limitsForMonth[name];
      const limit = limitEntry?.amount ?? null;
      const pct = limit ? Math.min((spend / limit) * 100, 100) : 0;
      rows.push({
        category: getCategoryMeta(name, allCats),
        spend,
        limit,
        pct,
        isOver: limit !== null && spend > limit,
        budgetId: limitEntry?.id,
        monthExpenses: orphanedExpenses[name],
        recurringExpenses: expensesHook.expenses.filter((e) => e.is_recurring && e.category === name),
      });
    }

    return rows;
  }, [budgetHook.allCategories, budgetHook.rawBudgets, expensesHook.expenses, monthExpenses, monthKey]);

  const sortedRows = useMemo(
    () => [
      ...allRows.filter((r) => r.spend > 0).sort((a, b) => b.spend - a.spend),
      ...allRows.filter((r) => r.spend === 0),
    ],
    [allRows]
  );

  const totalBudget = budgetHook.summary?.totalBudget ?? 0;
  const totalPct = budgetHook.summary?.totalPct ?? 0;
  const remaining = Math.max(totalBudget - totalThisMonth, 0);
  const overspend = Math.max(totalThisMonth - totalBudget, 0);

  const elapsedDays = useMemo(() => {
    if (!isSameMonth(budgetHook.selectedMonth, new Date())) return getDaysInMonth(budgetHook.selectedMonth);
    return Math.max(differenceInCalendarDays(new Date(), monthStart) + 1, 1);
  }, [budgetHook.selectedMonth, monthStart]);

  const daysInMonth = getDaysInMonth(budgetHook.selectedMonth);
  const projectedMonthEnd = elapsedDays > 0 ? (totalThisMonth / elapsedDays) * daysInMonth : totalThisMonth;
  const projectedDelta = totalBudget > 0 ? projectedMonthEnd - totalBudget : 0;

  const budgetedRows = useMemo(() => sortedRows.filter((row) => row.limit !== null), [sortedRows]);
  const overBudgetRows = useMemo(
    () => budgetedRows.filter((row) => row.isOver).sort((a, b) => (b.spend - (b.limit ?? 0)) - (a.spend - (a.limit ?? 0))),
    [budgetedRows]
  );
  const closeToLimitRows = useMemo(
    () => budgetedRows.filter((row) => !row.isOver && row.limit !== null && row.pct >= 80).sort((a, b) => b.pct - a.pct),
    [budgetedRows]
  );
  const topSpendingRow = useMemo(
    () => [...sortedRows].filter((row) => row.spend > 0).sort((a, b) => b.spend - a.spend)[0] ?? null,
    [sortedRows]
  );
  const recurringCommitments = useMemo(
    () =>
      sortedRows
        .map((row) => ({ row, recurringTotal: row.recurringExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0) }))
        .filter((entry) => entry.recurringTotal > 0)
        .sort((a, b) => b.recurringTotal - a.recurringTotal),
    [sortedRows]
  );

  const tone = totalBudget <= 0 ? "neutral" : totalThisMonth > totalBudget ? "over" : totalPct >= 80 ? "close" : "healthy";
  const toneClasses = {
    neutral: "bg-card border-border",
    healthy: "bg-success/8 border-success/25",
    close: "bg-warning/8 border-warning/30",
    over: "bg-destructive/8 border-destructive/30",
  } as const;

  const paceLabel =
    totalBudget <= 0
      ? "Set monthly limits to see household pacing."
      : overspend > 0
        ? `You're £${overspend.toFixed(2)} over the shared plan so far.`
        : remaining === 0
          ? "You've used the full budget for this month."
          : `£${remaining.toFixed(2)} left across the month.`;

  const forecastLabel =
    totalBudget <= 0
      ? "Add category limits to unlock end-of-month forecasting."
      : projectedDelta > 0
        ? `On pace to land about £${projectedDelta.toFixed(0)} over budget.`
        : `On pace to finish about £${Math.abs(projectedDelta).toFixed(0)} under budget.`;

  const biggestChangeLabel = topSpendingRow
    ? `${topSpendingRow.category.name} is your biggest spend area this month.`
    : "Once you log expenses, your pressure points will appear here.";

  const analyticsTopCategories = useMemo(
    () =>
      sortedRows
        .filter((row) => row.spend > 0)
        .slice(0, 5)
        .map((row) => ({
          ...row,
          recurringTotal: row.recurringExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
        })),
    [sortedRows]
  );

  const monthlyTrendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = addMonths(budgetHook.selectedMonth, index - 5);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const spend = expensesHook.expenses.reduce((sum, expense) => {
        try {
          const parsed = parseISO(expense.date);
          return isWithinInterval(parsed, { start, end }) ? sum + Number(expense.amount) : sum;
        } catch {
          return sum;
        }
      }, 0);
      const budget = budgetHook.rawBudgets
        .filter((b) => b.month === format(start, "yyyy-MM-dd"))
        .reduce((sum, b) => sum + Number(b.amount), 0);

      return { label: format(date, "MMM"), spend, budget };
    });
  }, [budgetHook.rawBudgets, budgetHook.selectedMonth, expensesHook.expenses]);

  // Stable fingerprint of the data that Hazel cares about.
  // Only changes when the month, totals, or top-category spend actually changes.
  const hazelKey = `hazel-budget|${format(budgetHook.selectedMonth, "yyyy-MM")}|${totalThisMonth.toFixed(2)}|${totalBudget.toFixed(2)}|${analyticsTopCategories.map((r) => r.category.name + r.spend.toFixed(2)).join(",")}`;

  useEffect(() => {
    if (activeTab !== "analytics" || isLoading || analyticsTopCategories.length === 0 || !canUseHazelBudgetInsights) {
      setHazelInsight(null);
      setHazelLoading(false);
      return;
    }

    // Check localStorage cache first — avoids a Claude API call if nothing has changed.
    try {
      const cached = localStorage.getItem(hazelKey);
      if (cached) {
        const parsed = JSON.parse(cached) as HazelBudgetInsight;
        if (parsed.summary && parsed.outlook && Array.isArray(parsed.focus)) {
          setHazelInsight(parsed);
          setHazelLoading(false);
          return;
        }
      }
    } catch {
      // Corrupt cache entry — fall through to a fresh API call.
    }

    let cancelled = false;
    setHazelLoading(true);

    window.api
      .budgetInsights({
        isNest: true,
        input: {
          monthLabel: format(budgetHook.selectedMonth, "MMMM yyyy"),
          totalSpent: totalThisMonth,
          totalBudget,
          projectedMonthEnd,
          remaining,
          overspend,
          topCategories: analyticsTopCategories.map((row) => ({
            name: row.category.name,
            spend: row.spend,
            limit: row.limit,
            pct: row.pct,
            recurringTotal: row.recurringTotal,
          })),
        },
      })
      .then((result) => {
        if (!cancelled && result.success) {
          // Persist to localStorage so re-opening the page doesn't re-call Claude.
          // Prune old Hazel budget cache entries to keep localStorage tidy.
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith("hazel-budget|") && k !== hazelKey) {
                localStorage.removeItem(k);
              }
            }
            localStorage.setItem(hazelKey, JSON.stringify(result.data));
          } catch {
            // localStorage full or unavailable — not critical.
          }
          setHazelInsight(result.data);
        } else if (!cancelled) {
          setHazelInsight(null);
        }
      })
      .catch(() => {
        if (!cancelled) setHazelInsight(null);
      })
      .finally(() => {
        if (!cancelled) setHazelLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hazelKey, activeTab, isLoading, canUseHazelBudgetInsights]);

  const maxTrendValue = Math.max(...monthlyTrendData.flatMap((item) => [item.spend, item.budget]), 1);
  const maxCategorySpend = Math.max(...analyticsTopCategories.map((row) => row.spend), 1);

  const memberName = (userId: string) => expensesHook.members.find((m) => m.user_id === userId)?.display_name ?? "Someone";

  return (
    <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1.5">Budget</h1>
          <p className="text-muted-foreground">
            {isSameMonth(budgetHook.selectedMonth, new Date())
              ? "A calmer read on your household spending this month"
              : `Household budget view for ${format(budgetHook.selectedMonth, "MMMM yyyy")}`}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/settings/budget-categories")}>
            <Settings2 className="w-4 h-4" />
            Manage limits
          </Button>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={budgetHook.hasBudgetHistory ? budgetHook.prevMonth : openUpgrade}
          disabled={false}
          title={!budgetHook.hasBudgetHistory ? 'Unlock budget history with Roost Nest' : undefined}
          className={!budgetHook.hasBudgetHistory ? 'opacity-50' : ''}
        >
          {budgetHook.hasBudgetHistory
            ? <ChevronLeft className="w-4 h-4" />
            : <Lock className="w-3.5 h-3.5" />
          }
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-medium min-w-[180px]">{format(budgetHook.selectedMonth, "MMMM yyyy")}</h2>
          <p className="text-xs text-muted-foreground">
            {budgetHook.hasBudgetHistory
              ? budgetHook.monthsAhead > 0
                ? `${budgetHook.monthsAhead} month${budgetHook.monthsAhead === 1 ? "" : "s"} ahead`
                : "Current or past month"
              : "Current month"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={budgetHook.nextMonth} disabled={!budgetHook.canGoForward}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center">
        <div className="inline-flex gap-1 rounded-2xl border border-border/70 bg-muted/35 p-1">
          {[
            { value: "analytics", label: "Analytics", icon: BarChart3 },
            { value: "categories", label: "Categories", icon: ListFilter },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as "analytics" | "categories")}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors",
                activeTab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "analytics" && !isLoading && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.02, ease }}>
            <Card className={toneClasses[tone]}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/15 hover:bg-primary/10">
                        <PiggyBank className="w-3.5 h-3.5" />
                        Household overview
                      </Badge>
                      {totalBudget > 0 && (
                        <Badge
                          variant="secondary"
                          className={[
                            "px-2.5 py-1 border hover:bg-transparent",
                            tone === "healthy" && "bg-success/10 text-success border-success/20",
                            tone === "close" && "bg-warning/10 text-warning border-warning/20",
                            tone === "over" && "bg-destructive/10 text-destructive border-destructive/20",
                          ].filter(Boolean).join(" ")}
                        >
                          {tone === "healthy" ? "Comfortable" : tone === "close" ? "Getting close" : "Over budget"}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h2 className="text-3xl font-semibold tracking-tight mb-1.5">
                        {totalBudget > 0 ? `£${totalThisMonth.toFixed(2)} of £${totalBudget.toFixed(2)}` : `£${totalThisMonth.toFixed(2)} spent this month`}
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-xl">{paceLabel}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Month progress</span>
                        <span>{`${elapsedDays}/${daysInMonth} days`}</span>
                      </div>
                      <Progress
                        value={totalBudget > 0 ? totalPct : Math.min((elapsedDays / daysInMonth) * 100, 100)}
                        className={[
                          "h-2.5",
                          tone === "healthy" && "[&>div]:bg-[#7fa087]",
                          tone === "close" && "[&>div]:bg-[#e6a563]",
                          tone === "over" && "[&>div]:bg-[#c75146]",
                          tone === "neutral" && "[&>div]:bg-primary",
                        ].filter(Boolean).join(" ")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-full lg:min-w-[360px] lg:max-w-[420px]">
                    {[
                      { label: totalBudget > 0 ? "Remaining" : "Budgeted", value: totalBudget > 0 ? `£${remaining.toFixed(2)}` : "£0.00", sub: totalBudget > 0 ? "Left in plan" : "No limits set yet", icon: Wallet },
                      { label: "Forecast", value: `£${projectedMonthEnd.toFixed(0)}`, sub: totalBudget > 0 ? (projectedDelta > 0 ? "Projected finish" : "Expected month-end") : "Current pace", icon: ArrowUpRight },
                      { label: "Categories under watch", value: String(overBudgetRows.length + closeToLimitRows.length), sub: overBudgetRows.length > 0 ? `${overBudgetRows.length} over limit` : "Nothing alarming", icon: AlertCircle },
                    ].map(({ label, value, sub, icon: Icon }) => (
                      <div key={label} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground">{label}</span>
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-xl font-semibold mb-1">{value}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total spent", value: `£${totalThisMonth.toFixed(2)}`, sub: `Shared & personal · ${monthExpenses.length} ${monthExpenses.length === 1 ? "expense" : "expenses"}`, icon: Receipt, iconBg: "bg-primary/10", iconColor: "text-primary", delay: 0.02, nestGated: false },
              {
                label: "vs last month",
                value: monthTrend !== null ? `${monthTrend > 0 ? "+" : ""}${monthTrend.toFixed(0)}%` : "—",
                sub: monthTrend !== null ? (monthTrend > 0 ? `£${(totalThisMonth - totalLastMonth).toFixed(2)} more` : `£${(totalLastMonth - totalThisMonth).toFixed(2)} less`) : "No prior data",
                icon: monthTrend !== null && monthTrend > 0 ? TrendingUp : TrendingDown,
                iconBg: monthTrend !== null && monthTrend > 10 ? "bg-destructive/10" : monthTrend !== null && monthTrend < -10 ? "bg-success/10" : "bg-muted",
                iconColor: monthTrend !== null && monthTrend > 10 ? "text-destructive" : monthTrend !== null && monthTrend < -10 ? "text-success" : "text-muted-foreground",
                valueColor: monthTrend !== null && monthTrend > 10 ? "text-destructive" : monthTrend !== null && monthTrend < -10 ? "text-success" : undefined,
                cardCls: monthTrend !== null && monthTrend > 10 ? "bg-destructive/8 border-destructive/25" : monthTrend !== null && monthTrend < -10 ? "bg-success/8 border-success/25" : "",
                delay: 0.08,
                nestGated: true,
              },
              {
                label: "Recurring commitments",
                value: `£${recurringCommitments.reduce((sum, item) => sum + item.recurringTotal, 0).toFixed(0)}`,
                sub: recurringCommitments.length > 0 ? `${recurringCommitments.length} ${recurringCommitments.length === 1 ? "category carries forward" : "categories carry forward"}` : "No recurring costs tagged",
                icon: Repeat,
                iconBg: "bg-muted",
                iconColor: "text-muted-foreground",
                delay: 0.14,
                nestGated: false,
              },
            ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor, cardCls, delay, nestGated }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay, ease }}>
                {nestGated && !budgetHook.hasBudgetHistory ? (
                  <Card className="h-full border-primary/15 bg-primary/4">
                    <CardContent className="p-4 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">Spend trends</span>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
                          <Crown className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-5 flex-1">Month-over-month changes and spend momentum are part of Roost Nest.</p>
                      <button
                        type="button"
                        onClick={openUpgrade}
                        className="mt-3 text-xs text-primary font-medium underline underline-offset-2 text-left hover:opacity-80 transition-opacity"
                      >
                        {hasUsedTrial ? 'Upgrade to Nest →' : 'Try free for 14 days →'}
                      </button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className={cardCls ?? ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
                          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                        </div>
                      </div>
                      <p className={`text-2xl font-semibold mb-0.5 ${valueColor ?? ""}`}>{value}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="font-medium mb-1">Six-month spend rhythm</h3>
                    <p className="text-sm text-muted-foreground">A simple view of how spending and limits are moving around this month.</p>
                  </div>
                  <Badge variant="secondary" className="bg-muted/50 text-muted-foreground hover:bg-muted/50">last 6 months</Badge>
                </div>
                <div className="grid grid-cols-6 gap-3 items-end h-56">
                  {monthlyTrendData.map((item, idx) => {
                    const isCurrentMonth = idx === monthlyTrendData.length - 1
                    const locked = !budgetHook.hasBudgetHistory && !isCurrentMonth
                    return (
                      <div key={item.label} className="flex flex-col items-center gap-2 h-full justify-end">
                        <div className="flex items-end gap-1.5 h-full w-full justify-center">
                          <div
                            className={`w-4 rounded-t-xl min-h-[8px] ${locked ? "bg-muted/40" : "bg-primary/80"}`}
                            style={{ height: `${locked ? 20 + idx * 6 : Math.max((item.spend / maxTrendValue) * 100, item.spend > 0 ? 8 : 0)}%` }}
                          />
                          <div
                            className={`w-4 rounded-t-xl min-h-[8px] ${locked ? "bg-muted/25" : "bg-secondary/60"}`}
                            style={{ height: `${locked ? 14 + idx * 5 : Math.max((item.budget / maxTrendValue) * 100, item.budget > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-medium ${locked ? "text-muted-foreground/40" : ""}`}>{item.label}</p>
                          <p className={`text-[11px] ${locked ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                            {locked ? "···" : `£${item.spend.toFixed(0)}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary/80" />Spent</span>
                    <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-secondary/60" />Budgeted</span>
                  </div>
                  {!budgetHook.hasBudgetHistory && (
                    <button
                      type="button"
                      onClick={openUpgrade}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
                    >
                      <Crown className="w-3 h-3" />
                      Unlock history with Nest
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {canUseHazelBudgetInsights ? (
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <h3 className="font-medium">Hazel’s forecast</h3>
                  </div>
                  {hazelLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 rounded-full bg-muted animate-pulse w-4/5" />
                      <div className="h-4 rounded-full bg-muted animate-pulse w-3/4" />
                      <div className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
                    </div>
                  ) : hazelInsight ? (
                    <>
                      <div className="rounded-2xl bg-primary/6 border border-primary/10 px-4 py-3.5">
                        <p className="text-sm leading-6">{hazelInsight.summary}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/35 px-4 py-3.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Outlook</p>
                        <p className="text-sm leading-6">{hazelInsight.outlook}</p>
                      </div>
                      <div className="space-y-2">
                        {hazelInsight.focus.map((item) => (
                          <div key={item} className="flex items-center gap-2 rounded-xl bg-background/70 border border-border/60 px-3 py-2.5">
                            <CircleHelp className="w-3.5 h-3.5 text-primary" />
                            <p className="text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Hazel will offer a forecast once there’s enough budget shape to read.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="p-5 h-full flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <h3 className="font-medium">Hazel’s forecast</h3>
                    </div>
                    <Badge className="bg-primary/10 text-primary border border-primary/15 hover:bg-primary/10 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Nest
                    </Badge>
                  </div>
                  <div className="flex-1 rounded-2xl bg-primary/5 border border-primary/10 p-4 flex flex-col gap-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Hazel reads your category spend, recurring costs, and budget pace — then gives you a plain-English read on how the month is shaping up and where to keep an eye.
                    </p>
                    <div className="space-y-2 mt-1">
                      {[
                        "Is your spending on pace for the month?",
                        "Which categories need attention?",
                        "Where is spend likely to land by month-end?",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-primary/25 text-primary hover:bg-primary/5 hover:text-primary"
                    onClick={openUpgrade}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    {hasUsedTrial ? 'Upgrade to Nest' : 'Try Nest free for 14 days'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium mb-1">This month, in plain English</h3>
                    <p className="text-sm text-muted-foreground">A calmer read on how the household is tracking — built on top of your existing expenses and limits.</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-muted/35 px-4 py-3.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Pacing</p>
                    <p className="text-sm leading-6">{forecastLabel}</p>
                  </div>
                  {budgetHook.hasBudgetHistory ? (
                    <>
                      <div className="rounded-2xl bg-muted/35 px-4 py-3.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Biggest pressure</p>
                        <p className="text-sm leading-6">{biggestChangeLabel}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/35 px-4 py-3.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Coverage</p>
                        <p className="text-sm leading-6">{totalBudget > 0 ? `${budgetedRows.length} ${budgetedRows.length === 1 ? "category has a limit" : "categories have limits"} this month.` : "No category limits yet — the page is showing spending only."}</p>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-3.5 flex flex-col justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <p className="text-xs font-medium text-primary">More with Roost Nest</p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Nest shows your biggest spend pressure, category coverage, and month-on-month patterns — so you always know where the household stands.
                      </p>
                      <button
                        type="button"
                        onClick={openUpgrade}
                        className="text-xs text-primary font-medium underline underline-offset-2 self-start hover:opacity-80 transition-opacity"
                      >
                        {hasUsedTrial ? 'Upgrade to Nest →' : 'Try free for 14 days →'}
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Needs attention</h3>
                </div>
                {overBudgetRows.length === 0 && closeToLimitRows.length === 0 ? (
                  <div className="rounded-2xl bg-success/8 border border-success/20 px-4 py-4">
                    <p className="text-sm font-medium text-success mb-1">Nothing urgent right now</p>
                    <p className="text-sm text-muted-foreground">Your tracked categories are sitting comfortably within the month so far.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...overBudgetRows.slice(0, 2), ...closeToLimitRows.slice(0, Math.max(0, 3 - overBudgetRows.length))].map((row) => (
                      <div key={row.category.name} className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <p className="text-sm font-medium">{row.category.name}</p>
                          <Badge
                            variant="secondary"
                            className={row.isOver ? "bg-destructive/10 text-destructive border border-destructive/15 hover:bg-destructive/10" : "bg-warning/10 text-warning border border-warning/15 hover:bg-warning/10"}
                          >
                            {row.isOver ? "Over" : "Close"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          £{row.spend.toFixed(2)} spent{row.limit !== null ? ` of £${row.limit.toFixed(2)}` : ""}
                          {row.isOver ? ` · £${(row.spend - (row.limit ?? 0)).toFixed(2)} over` : row.limit !== null ? ` · ${Math.round(row.pct)}% used` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-medium mb-1">Top categories this month</h3>
                  <p className="text-sm text-muted-foreground">The biggest spend areas in the month you’re exploring, including future planning months.</p>
                </div>
              </div>
              <div className="space-y-3">
                {analyticsTopCategories.map((row) => (
                  <div key={row.category.name} className="grid grid-cols-[140px_1fr_auto] gap-3 items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{row.category.name}</p>
                      <p className="text-[11px] text-muted-foreground">{row.limit !== null ? `£${row.limit.toFixed(0)} limit` : "No limit set"}</p>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${row.isOver ? "bg-destructive" : row.pct >= 80 ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.max((row.spend / maxCategorySpend) * 100, 6)}%` }} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">£{row.spend.toFixed(0)}</p>
                      <p className="text-[11px] text-muted-foreground">{row.recurringTotal > 0 ? `£${row.recurringTotal.toFixed(0)} recurring` : "one-off mix"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "categories" &&
        (isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[68px] rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : sortedRows.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={Receipt}
                title="No spending yet"
                description="Add expenses and they’ll show up here, grouped by category."
                action={{ label: "Go to Expenses", onClick: () => navigate("/expenses") }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedRows.map((row, i) => {
              const colors = COLOR_CLASSES[row.category.color] ?? COLOR_CLASSES.slate;
              const isEmpty = row.spend === 0;
              const isExpanded = expandedCategory === row.category.name;

              return (
                <motion.div key={row.category.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.03 + i * 0.03, ease }} layout="position">
                  <motion.div
                    layout
                    className={[
                      "rounded-2xl border overflow-hidden transition-shadow",
                      isEmpty ? "opacity-50" : "",
                      isExpanded ? "shadow-md" : "shadow-sm",
                      row.isOver ? "border-destructive/30 bg-destructive/5" : "bg-card",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => !isEmpty && setExpandedCategory(isExpanded ? null : row.category.name)}
                      disabled={isEmpty}
                      className={[
                        "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors",
                        !isEmpty && !isExpanded ? "hover:bg-muted/40" : "",
                        isEmpty ? "cursor-default" : "cursor-pointer",
                      ].join(" ")}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${row.isOver ? "bg-destructive/10" : colors.bg}`}>
                        <CategoryIcon category={row.category} className={`w-5 h-5 ${row.isOver ? "text-destructive" : colors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <span className="font-medium">{row.category.name}</span>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {!isEmpty && row.limit !== null && (
                              <Badge
                                variant="secondary"
                                className={[
                                  "hidden sm:inline-flex",
                                  row.isOver
                                    ? "bg-destructive/10 text-destructive border border-destructive/15 hover:bg-destructive/10"
                                    : row.pct >= 80
                                      ? "bg-warning/10 text-warning border border-warning/15 hover:bg-warning/10"
                                      : "bg-success/10 text-success border border-success/15 hover:bg-success/10",
                                ].join(" ")}
                              >
                                {row.isOver ? "Over" : row.pct >= 80 ? "Close" : "On track"}
                              </Badge>
                            )}
                            {row.limit !== null && !isEmpty && (
                              <span className={`text-xs ${row.isOver ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                {row.isOver ? `£${(row.spend - row.limit).toFixed(2)} over` : `£${(row.limit - row.spend).toFixed(2)} left`}
                              </span>
                            )}
                            <span className={`font-semibold tabular-nums ${isEmpty ? "text-muted-foreground" : row.isOver ? "text-destructive" : ""}`}>
                              {isEmpty ? "—" : `£${row.spend.toFixed(2)}`}
                            </span>
                          </div>
                        </div>

                        {row.limit !== null ? (
                          <div className="space-y-1.5">
                            <Progress
                              value={row.pct}
                              className={`h-1.5 ${row.isOver ? "[&>div]:bg-[#c75146]" : row.pct >= 80 ? "[&>div]:bg-[#e6a563]" : "[&>div]:bg-[#7fa087]"}`}
                            />
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{row.monthExpenses.length} {row.monthExpenses.length === 1 ? "expense" : "expenses"}</span>
                              <span>{Math.round(row.pct)}% of limit used</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {isEmpty ? "Nothing spent this month" : `${row.monthExpenses.length} ${row.monthExpenses.length === 1 ? "expense" : "expenses"} · no limit set`}
                          </p>
                        )}
                      </div>

                      {!isEmpty && (
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="flex-shrink-0 ml-1">
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 space-y-3">
                            <div className="h-px bg-border/60" />

                            {row.monthExpenses.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">No expenses recorded this month.</p>
                            ) : (
                              <div className="space-y-3">
                                {row.limit !== null && (
                                  <div className="grid sm:grid-cols-3 gap-2">
                                    <div className="rounded-xl bg-muted/35 px-3 py-2.5">
                                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Spent</p>
                                      <p className="text-sm font-semibold">£{row.spend.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/35 px-3 py-2.5">
                                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Limit</p>
                                      <p className="text-sm font-semibold">£{row.limit.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/35 px-3 py-2.5">
                                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Status</p>
                                      <p className={`text-sm font-semibold ${row.isOver ? "text-destructive" : row.pct >= 80 ? "text-warning" : "text-success"}`}>
                                        {row.isOver ? `£${(row.spend - row.limit).toFixed(2)} over` : `£${(row.limit - row.spend).toFixed(2)} left`}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {row.recurringExpenses.length > 0 && (
                                  <div className="rounded-xl bg-primary/5 border border-primary/10 px-3.5 py-3">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <Repeat className="w-3.5 h-3.5 text-primary" />
                                      <p className="text-sm font-medium">Recurring in this category</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {row.recurringExpenses.length} {row.recurringExpenses.length === 1 ? "recurring expense" : "recurring expenses"} worth £{row.recurringExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toFixed(2)} in your wider expenses history.
                                    </p>
                                  </div>
                                )}

                                <div className="space-y-1.5">
                                  {[...row.monthExpenses]
                                    .sort((a, b) => b.date.localeCompare(a.date))
                                    .map((exp, ei) => (
                                      <motion.div
                                        key={exp.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.18, delay: ei * 0.04, ease }}
                                        className="flex items-center justify-between px-3 py-2.5 bg-muted/50 rounded-xl"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{exp.title}</p>
                                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                            <CalendarIcon className="w-3 h-3" />
                                            <span>{format(parseISO(exp.date), "d MMM")}</span>
                                            <span>·</span>
                                            <User className="w-3 h-3" />
                                            <span>{memberName(exp.paid_by)}</span>
                                            {exp.split_type === "equal" && (
                                              <>
                                                <span>·</span>
                                                <Badge variant="secondary" className="text-xs py-0 h-4">shared</Badge>
                                              </>
                                            )}
                                            {exp.split_type === "solo" && (
                                              <>
                                                <span>·</span>
                                                <Badge variant="outline" className="text-xs py-0 h-4">personal</Badge>
                                              </>
                                            )}
                                            {exp.is_recurring && (
                                              <>
                                                <span>·</span>
                                                <Repeat className="w-3 h-3 text-primary" />
                                                <span className="text-primary capitalize">{exp.recurrence_interval}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm font-semibold ml-4 flex-shrink-0 tabular-nums">£{Number(exp.amount).toFixed(2)}</p>
                                      </motion.div>
                                    ))}
                                </div>
                              </div>
                            )}

                            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2" onClick={() => navigate(`/expenses?category=${encodeURIComponent(row.category.name)}`)}>
                              View all {row.category.name} expenses
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        ))}
    </AnimatedPage>
  );
}