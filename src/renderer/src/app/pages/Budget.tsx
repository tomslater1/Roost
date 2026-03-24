import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, ChevronRight, ChevronDown, Receipt, TrendingUp, TrendingDown,
  ArrowRight, Settings2, Repeat, User, Calendar as CalendarIcon,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths, isSameMonth } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { AnimatedPage } from "../components/AnimatedPage";
import { EmptyState } from "../components/EmptyState";
import { useBudget } from "@/hooks/useBudget";
import { useExpenses } from "@/hooks/useExpenses";
import { COLOR_CLASSES, getCategoryMeta } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import { CategoryIcon } from "../components/CategoryIcon";
import type { ExpenseWithSplits } from "@/lib/schemas/expenses";

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

interface CategoryRow {
  category: Category
  spend: number
  limit: number | null
  pct: number
  isOver: boolean
  budgetId?: string
  monthExpenses: ExpenseWithSplits[]
  recurringExpenses: ExpenseWithSplits[]
}

export function Budget() {
  const navigate = useNavigate();
  const expensesHook = useExpenses();
  const budgetHook = useBudget({ expenses: expensesHook.expenses });

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const isLoading = budgetHook.isLoading || expensesHook.isLoading;

  const monthStart = startOfMonth(budgetHook.selectedMonth);
  const monthEnd = endOfMonth(budgetHook.selectedMonth);
  const monthKey = format(monthStart, "yyyy-MM-dd");

  // Last month for comparison
  const lastMonthStart = startOfMonth(subMonths(budgetHook.selectedMonth, 1));
  const lastMonthEnd = endOfMonth(subMonths(budgetHook.selectedMonth, 1));

  // Expenses for selected month
  const monthExpenses = useMemo(() =>
    expensesHook.expenses.filter((e) => {
      try { return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }) }
      catch { return false }
    }),
    [expensesHook.expenses, monthStart, monthEnd]
  );

  // Expenses for last month (for trend)
  const lastMonthExpenses = useMemo(() =>
    expensesHook.expenses.filter((e) => {
      try { return isWithinInterval(parseISO(e.date), { start: lastMonthStart, end: lastMonthEnd }) }
      catch { return false }
    }),
    [expensesHook.expenses, lastMonthStart, lastMonthEnd]
  );

  const totalThisMonth = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalLastMonth = lastMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthTrend = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : null;

  // All category rows — built-ins + custom, always shown
  const allRows: CategoryRow[] = useMemo(() => {
    const limitsForMonth: Record<string, { amount: number; id: string }> = {};
    for (const b of budgetHook.rawBudgets) {
      if (b.month === monthKey) limitsForMonth[b.category] = { amount: Number(b.amount), id: b.id };
    }

    const allCats = budgetHook.allCategories;
    const seenNames = new Set(allCats.map((c) => c.name));

    const rows: CategoryRow[] = allCats.map((cat) => {
      const catExpenses = monthExpenses.filter((e) => e.category === cat.name);
      const spend = catExpenses.reduce((s, e) => s + Number(e.amount), 0);
      const limitEntry = limitsForMonth[cat.name];
      const limit = limitEntry?.amount ?? null;
      const pct = limit ? Math.min((spend / limit) * 100, 100) : 0;
      const recurring = expensesHook.expenses.filter(
        (e) => e.is_recurring && e.category === cat.name
      );
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

    // Safety net: include any expenses whose category isn't in allCategories (e.g. historical data).
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
  }, [budgetHook.allCategories, budgetHook.rawBudgets, monthExpenses, expensesHook.expenses, monthKey]);

  // Sort: categories with spend first (desc), then empty
  const sortedRows = useMemo(() => [
    ...allRows.filter((r) => r.spend > 0).sort((a, b) => b.spend - a.spend),
    ...allRows.filter((r) => r.spend === 0),
  ], [allRows]);

  const activeCategories = allRows.filter((r) => r.spend > 0).length;

  const memberName = (userId: string) =>
    expensesHook.members.find((m) => m.user_id === userId)?.display_name ?? "Someone";

  return (
    <>
      <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-1.5">Budget</h1>
            <p className="text-muted-foreground">
              {isSameMonth(budgetHook.selectedMonth, new Date())
                ? "How you're spending this month"
                : `Spending breakdown for ${format(budgetHook.selectedMonth, "MMMM yyyy")}`}
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/settings/budget-categories")}>
              <Settings2 className="w-4 h-4" />
              Manage limits
            </Button>
          </motion.div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={budgetHook.prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-medium min-w-[180px] text-center">
            {format(budgetHook.selectedMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={budgetHook.nextMonth}
            disabled={budgetHook.isCurrentMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total spent",
                value: `£${totalThisMonth.toFixed(2)}`,
                sub: `Shared & personal · ${monthExpenses.length} ${monthExpenses.length === 1 ? "expense" : "expenses"}`,
                icon: Receipt,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
                delay: 0.02,
              },
              {
                label: "vs last month",
                value: monthTrend !== null ? `${monthTrend > 0 ? "+" : ""}${monthTrend.toFixed(0)}%` : "—",
                sub: monthTrend !== null
                  ? monthTrend > 0
                    ? `£${(totalThisMonth - totalLastMonth).toFixed(2)} more`
                    : `£${(totalLastMonth - totalThisMonth).toFixed(2)} less`
                  : "No prior data",
                icon: monthTrend !== null && monthTrend > 0 ? TrendingUp : TrendingDown,
                iconBg: monthTrend !== null && monthTrend > 10 ? "bg-destructive/10" : monthTrend !== null && monthTrend < -10 ? "bg-success/10" : "bg-muted",
                iconColor: monthTrend !== null && monthTrend > 10 ? "text-destructive" : monthTrend !== null && monthTrend < -10 ? "text-success" : "text-muted-foreground",
                valueColor: monthTrend !== null && monthTrend > 10 ? "text-destructive" : monthTrend !== null && monthTrend < -10 ? "text-success" : undefined,
                cardCls: monthTrend !== null && monthTrend > 10 ? "bg-destructive/8 border-destructive/25" : monthTrend !== null && monthTrend < -10 ? "bg-success/8 border-success/25" : "",
                delay: 0.08,
              },
              {
                label: "Active categories",
                value: String(activeCategories),
                sub: `of ${allRows.length} categories used`,
                icon: Receipt,
                iconBg: "bg-muted",
                iconColor: "text-muted-foreground",
                delay: 0.14,
              },
            ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor, cardCls, delay }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay, ease }}
              >
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
              </motion.div>
            ))}
          </div>
        )}

        {/* Category pills */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[68px] rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : sortedRows.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={Receipt}
                title="No spending yet"
                description="Add expenses and they'll show up here, grouped by category."
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
                <motion.div
                  key={row.category.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.03 + i * 0.03, ease }}
                  layout="position"
                >
                  <motion.div
                    layout
                    className={[
                      "rounded-2xl border overflow-hidden transition-shadow",
                      isEmpty ? "opacity-50" : "",
                      isExpanded ? "shadow-md" : "shadow-sm",
                      row.isOver ? "border-destructive/30 bg-destructive/5" : "bg-card",
                    ].join(" ")}
                  >
                    {/* Pill header — always visible */}
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
                      {/* Category icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        row.isOver ? "bg-destructive/10" : colors.bg
                      }`}>
                        <CategoryIcon
                          category={row.category}
                          className={`w-5 h-5 ${row.isOver ? "text-destructive" : colors.text}`}
                        />
                      </div>

                      {/* Name + bar/sub */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <span className="font-medium">{row.category.name}</span>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {row.limit !== null && !isEmpty && (
                              <span className={`text-xs ${row.isOver ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                {row.isOver
                                  ? `£${(row.spend - row.limit).toFixed(2)} over`
                                  : `£${(row.limit - row.spend).toFixed(2)} left`}
                              </span>
                            )}
                            <span className={`font-semibold tabular-nums ${
                              isEmpty ? "text-muted-foreground" : row.isOver ? "text-destructive" : ""
                            }`}>
                              {isEmpty ? "—" : `£${row.spend.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                        {row.limit !== null ? (
                          <Progress
                            value={row.pct}
                            className={`h-1.5 ${
                              row.isOver
                                ? "[&>div]:bg-[#c75146]"
                                : row.pct >= 80
                                ? "[&>div]:bg-[#e6a563]"
                                : "[&>div]:bg-[#7fa087]"
                            }`}
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {isEmpty
                              ? "Nothing spent this month"
                              : `${row.monthExpenses.length} ${row.monthExpenses.length === 1 ? "expense" : "expenses"} · no limit set`}
                          </p>
                        )}
                      </div>

                      {/* Chevron */}
                      {!isEmpty && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="flex-shrink-0 ml-1"
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </button>

                    {/* Expanded drawer */}
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
                              <p className="text-sm text-muted-foreground py-2">
                                No expenses recorded this month.
                              </p>
                            ) : (
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
                                      <p className="text-sm font-semibold ml-4 flex-shrink-0 tabular-nums">
                                        £{Number(exp.amount).toFixed(2)}
                                      </p>
                                    </motion.div>
                                  ))}
                              </div>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
                              onClick={() => navigate(`/expenses?category=${encodeURIComponent(row.category.name)}`)}
                            >
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
        )}

      </AnimatedPage>
    </>
  );
}
