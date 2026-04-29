import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endOfMonth, format, isAfter, startOfMonth, subDays } from "date-fns";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronRight, Handshake, Plus, Repeat, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/AnimatedPage";
import { EmptyState } from "@/components/EmptyState";
import { MemberAvatar } from "@/components/MemberAvatar";
import { Skeleton } from "@/components/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExpenseQuickAddSheet } from "@/components/expenses/ExpenseQuickAddSheet";
import { useApp } from "@/context/AppContext";
import { useHome, useCurrencyFormat } from "@/hooks/useHome";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionUi } from "@/context/SubscriptionUiContext";
import { supabase } from "@/lib/supabase";
import { translateError } from "@/lib/errors";
import {
  ease,
  getCategoryColor,
  getStatusColor,
  MoneyScreenHeader,
  SectionHeading,
  useMoneyMonthSync,
} from "./MoneyShared";

type SpendingExpenseRow = {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string | null;
  paid_by: string;
  is_recurring: boolean | null;
  recurrence_interval: string | null;
};

type CategoryGroup = {
  name: string;
  amount: number;
  limit: number;
  color: string;
  expenses: SpendingExpenseRow[];
};

function DonutChart({ groups, total }: { groups: CategoryGroup[]; total: number }) {
  const fmt = useCurrencyFormat();
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <div className="relative mx-auto h-40 w-40 shrink-0">
        <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(61,50,41,0.08)" strokeWidth="24" />
          {groups.map((group) => {
            const dash = total > 0 ? (group.amount / total) * circumference : 0;
            const segment = (
              <circle
                key={group.name}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={group.color}
                strokeWidth="24"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += dash;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-lg font-medium tracking-tight">{fmt(total)}</p>
          <p className="text-xs text-muted-foreground">spent</p>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {groups.map((group) => (
          <div key={group.name} className="flex items-center justify-between gap-3 rounded-[16px] bg-background/45 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
              <span className="truncate text-sm">{group.name}</span>
            </div>
            <span className="text-sm font-medium">{fmt(group.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Set Envelope Sheet ────────────────────────────────────────────────────────

function SetEnvelopeSheet({
  category,
  month,
  onClose,
}: {
  category: string | null;
  month: Date;
  onClose: () => void;
}) {
  const { home } = useHome();
  const fmt = useCurrencyFormat();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const open = !!category;
  const amountNum = parseFloat(amount);
  const valid = !isNaN(amountNum) && amountNum > 0;

  const save = useMutation({
    mutationFn: async () => {
      const monthKey = format(startOfMonth(month), "yyyy-MM-dd");
      const { error } = await supabase
        .from("budgets")
        .upsert(
          { home_id: home!.id, category: category!, month: monthKey, amount: amountNum, budget_type: "envelope" },
          { onConflict: "home_id,category,month" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Lifestyle budget set for ${category}`);
      queryClient.invalidateQueries({ queryKey: ["budgets", home?.id] });
      setAmount("");
      onClose();
    },
    onError: (err) => toast.error(translateError(err)),
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] bg-card border-t border-border/60 shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between p-5 pb-4 bg-card border-b border-border/40">
              <h2 className="text-base font-medium">Set lifestyle budget for {category}</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <p className="text-sm text-muted-foreground">
                Set a spending allowance for {category} in {format(month, "MMMM")}. The bar will fill as you log expenses.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="envelope-amount">Monthly allowance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">£</span>
                  <Input
                    id="envelope-amount"
                    className="pl-7"
                    placeholder="0.00"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={!valid || save.isPending} className="flex-1">
                  {save.isPending ? "Saving…" : "Set lifestyle budget"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SpendingInsight({ topCategory, topLimit }: { topCategory?: CategoryGroup; topLimit?: number }) {
  const fmt = useCurrencyFormat();
  const { canAccess } = useSubscription();
  if (!topCategory) return null;

  if (canAccess("budget_insights")) {
    return (
      <p className="text-sm italic leading-6 text-muted-foreground">
        {topCategory.name} is leading the month so far at {fmt(topCategory.amount)} — still enough time to nudge the shape of the rest of the month.
      </p>
    );
  }

  if (!topLimit) {
    return <p className="text-sm italic leading-6 text-muted-foreground">{topCategory.name} is your biggest category so far this month.</p>;
  }

  const pct = (topCategory.amount / topLimit) * 100;
  return (
    <p className="text-sm italic leading-6 text-muted-foreground">
      {topCategory.name} is sitting at {Math.round(pct)}% of its limit this month.
    </p>
  );
}

export function Spending() {
  const { selectedSummaryMonth, setSelectedSummaryMonth, envelopeLines, currentMember, partnerMember, settlements } = useApp();
  const { home } = useHome();
  const fmt = useCurrencyFormat();
  const { canAccess } = useSubscription();
  const { openUpgrade } = useSubscriptionUi();
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllForCategory, setShowAllForCategory] = useState<string | null>(null);
  const [settlementsExpanded, setSettlementsExpanded] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [envelopeCategory, setEnvelopeCategory] = useState<string | null>(null);

  useMoneyMonthSync(selectedSummaryMonth, setSelectedSummaryMonth);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["money-spending-month", home?.id, format(startOfMonth(selectedSummaryMonth), "yyyy-MM-dd")],
    enabled: !!home?.id,
    queryFn: async (): Promise<SpendingExpenseRow[]> => {
      const start = format(startOfMonth(selectedSummaryMonth), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("expenses")
        .select("id, title, amount, date, category, paid_by, is_recurring, recurrence_interval")
        .eq("home_id", home!.id)
        .gte("date", start)
        .lte("date", format(endOfMonth(selectedSummaryMonth), "yyyy-MM-dd"))
        .order("amount", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
    },
  });

  const groups = useMemo<CategoryGroup[]>(() => {
    // Map expenses to spend buckets by category name (case-insensitive normalised
    // to the matching template line name where possible).
    const envelopeNameSet = new Map(envelopeLines.map((l) => [l.name.toLowerCase(), l.name]));
    const spendByName = new Map<string, SpendingExpenseRow[]>();

    (rows ?? []).forEach((row) => {
      const rawKey = row.category?.trim();
      if (!rawKey) {
        // null / empty category → Uncategorised
        spendByName.set("Uncategorised", [...(spendByName.get("Uncategorised") ?? []), row]);
        return;
      }
      // Normalise to the canonical template line name (case-insensitive match)
      const canonicalName = envelopeNameSet.get(rawKey.toLowerCase()) ?? rawKey;
      spendByName.set(canonicalName, [...(spendByName.get(canonicalName) ?? []), row]);
    });

    // Build a bar for every Lifestyle envelope line (even zero-spend ones so
    // the user can see which categories have budget but no spend yet).
    const envelopeGroups: CategoryGroup[] = envelopeLines.map((line) => {
      const expenses = spendByName.get(line.name) ?? [];
      return {
        name: line.name,
        amount: expenses.reduce((s, e) => s + e.amount, 0),
        limit: line.amount,
        color: getCategoryColor(line.name),
        expenses: expenses.sort((a, b) => b.date.localeCompare(a.date)),
      };
    });

    // Collect any expenses whose category doesn't match any envelope line.
    const matchedNames = new Set(envelopeLines.map((l) => l.name));
    const orphanExpenses: SpendingExpenseRow[] = [];
    for (const [key, exps] of spendByName.entries()) {
      if (!matchedNames.has(key)) orphanExpenses.push(...exps);
    }

    const result: CategoryGroup[] = envelopeGroups.filter((g) => g.amount > 0 || g.limit > 0);

    if (orphanExpenses.length > 0) {
      result.push({
        name: "Uncategorised",
        amount: orphanExpenses.reduce((s, e) => s + e.amount, 0),
        limit: 0,
        color: getCategoryColor("Uncategorised"),
        expenses: orphanExpenses.sort((a, b) => b.date.localeCompare(a.date)),
      });
    }

    return result.sort((a, b) => b.amount - a.amount);
  }, [rows, envelopeLines]);

  const totalSpend = groups.reduce((sum, group) => sum + group.amount, 0);
  const topCategory = groups[0];
  const historyCutoff = subDays(new Date(), 30);

  // All expenses sorted by date DESC for the flat list
  const rowsByDate = useMemo(
    () => [...(rows ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [rows]
  );

  return (
    <AnimatedPage className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="flex flex-col gap-6">
        <MoneyScreenHeader title="Spending" selectedMonth={selectedSummaryMonth} setSelectedMonth={setSelectedSummaryMonth} />

        <section className="space-y-3">
          <Card className="border-0 bg-card/90 shadow-none">
            <CardContent className="space-y-5 p-5">
              {isLoading ? <Skeleton className="h-56 w-full rounded-[20px]" /> : groups.length ? <DonutChart groups={groups} total={totalSpend} /> : null}
              {!isLoading && groups.length ? (
                <SpendingInsight topCategory={topCategory} topLimit={topCategory?.limit || undefined} />
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeading title="Against your limits" />
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[20px]" />)}
            </div>
          ) : !envelopeLines.length ? (
            <EmptyState icon={Wallet} title="No lifestyle budgets set up" description="Set up lifestyle budgets to see your spending by category." action={{ label: "Go to Budgets →", onClick: () => navigate("/money/budgets") }} />
          ) : !groups.length ? (
            <EmptyState icon={Wallet} title="Nothing logged this month yet" description="When expenses land, each category will show up here with its share of the month." />
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isExpanded = expandedCategory === group.name;
                const hasLimit = group.limit > 0;
                const pct = hasLimit ? (group.amount / group.limit) * 100 : 0;
                const fillColor = hasLimit ? getStatusColor(pct) : "#d4795e";
                const visibleExpenses = showAllForCategory === group.name ? group.expenses : group.expenses.slice(0, 5);
                const olderHidden = !canAccess("expense_history") && group.expenses.some((expense) => isAfter(historyCutoff, new Date(`${expense.date}T12:00:00`)));

                return (
                  <Card key={group.name} className="border-0 bg-card/90 shadow-none">
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAllForCategory(null);
                          setExpandedCategory((current) => (current === group.name ? null : group.name));
                        }}
                        className="w-full space-y-3 p-5 text-left"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                              <p className="truncate text-sm font-medium">{group.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-medium">{fmt(group.amount)}</p>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2, ease }}>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-2.5 overflow-hidden rounded-full bg-muted/55">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${hasLimit ? Math.min(pct, 100) : 100}%` }}
                              transition={{ duration: 0.45, ease }}
                              style={{ backgroundColor: fillColor }}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            {hasLimit ? (
                              <span>{fmt(group.amount)} of {fmt(group.limit)} lifestyle budget</span>
                            ) : (
                              <span>No lifestyle budget set</span>
                            )}
                          </div>
                        </div>
                      </button>

                      {!hasLimit && (
                        <div className="px-5 pb-3.5">
                          <button
                            type="button"
                            onClick={() => setEnvelopeCategory(group.name)}
                            className="text-xs text-primary font-medium hover:text-primary/80 transition-colors"
                          >
                            Set lifestyle budget →
                          </button>
                        </div>
                      )}

                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 border-t border-border/50 px-5 pb-5 pt-3">
                              {visibleExpenses.map((expense) => {
                                const olderThanFreeWindow = !canAccess("expense_history") && isAfter(historyCutoff, new Date(`${expense.date}T12:00:00`));
                                const payer = expense.paid_by === currentMember?.user_id ? currentMember : partnerMember;
                                return (
                                  <div
                                    key={expense.id}
                                    className={`rounded-[18px] bg-background/55 px-3.5 py-3 ${olderThanFreeWindow ? "opacity-45 blur-[1px]" : ""}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{expense.title}</p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>{format(new Date(`${expense.date}T12:00:00`), "d MMM")}</span>
                                          {payer ? <MemberAvatar displayName={payer.display_name ?? "?"} avatarColor={payer.avatar_color} avatarIcon={payer.avatar_icon} size="xs" /> : null}
                                        </div>
                                      </div>
                                      <span className="text-sm font-medium">{fmt(expense.amount)}</span>
                                    </div>
                                  </div>
                                );
                              })}

                              {olderHidden ? (
                                <button type="button" onClick={openUpgrade} className="w-full rounded-[18px] bg-primary/10 px-4 py-3 text-left">
                                  <p className="text-sm font-medium text-foreground">Older expenses are here</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">Your data is safe — upgrade to Roost Pro to see your full history.</p>
                                </button>
                              ) : null}

                              {group.expenses.length > 5 && showAllForCategory !== group.name ? (
                                <button
                                  type="button"
                                  onClick={() => setShowAllForCategory(group.name)}
                                  className="text-sm font-medium text-primary"
                                >
                                  {group.expenses.length - 5} more
                                </button>
                              ) : null}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })}

              <button
                type="button"
                onClick={() => navigate("/money/budgets")}
                className="w-full rounded-[20px] bg-card/70 px-4 py-4 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Manage budget limits →
              </button>
            </div>
          )}
        </section>

        {/* All Expenses section */}
        <section className="space-y-3">
          <SectionHeading title="All Expenses" />
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-[18px]" />
              ))}
            </div>
          ) : rowsByDate.length === 0 ? (
            <EmptyState icon={Wallet} title="No expenses this month" description="Expenses you add will appear here, grouped by day." />
          ) : (
            <div className="space-y-2">
              {rowsByDate.map((expense) => {
                const olderThanFreeWindow = !canAccess("expense_history") && isAfter(historyCutoff, new Date(`${expense.date}T12:00:00`));
                const payer = expense.paid_by === currentMember?.user_id ? currentMember : partnerMember;
                const color = getCategoryColor(expense.category ?? "Other");

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease }}
                    className={`rounded-[18px] bg-card/90 border border-border/40 px-4 py-3 ${olderThanFreeWindow ? "opacity-45 blur-[1px]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{expense.title}</p>
                          {expense.category && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                              style={{ backgroundColor: color }}
                            >
                              {expense.category}
                            </span>
                          )}
                          {expense.is_recurring && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                              <Repeat className="w-2.5 h-2.5" />
                              {expense.recurrence_interval ?? "Recurring"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(`${expense.date}T12:00:00`), "d MMM")}
                          </span>
                          {payer && (
                            <MemberAvatar
                              displayName={payer.display_name ?? "?"}
                              avatarColor={payer.avatar_color}
                              avatarIcon={payer.avatar_icon}
                              size="xs"
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium tabular-nums flex-shrink-0">
                        {fmt(expense.amount)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {!canAccess("expense_history") && rowsByDate.some((e) => isAfter(historyCutoff, new Date(`${e.date}T12:00:00`))) && (
                <button type="button" onClick={openUpgrade} className="w-full rounded-[18px] bg-primary/10 px-4 py-3 text-left">
                  <p className="text-sm font-medium text-foreground">Older expenses are here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your data is safe — upgrade to Roost Pro to see your full history.</p>
                </button>
              )}
            </div>
          )}

          {/* Settlement history — collapsible */}
          {settlements.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSettlementsExpanded((prev) => !prev)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Handshake className="w-4 h-4" />
                {settlements.length} {settlements.length === 1 ? "settlement" : "settlements"}
                <motion.div animate={{ rotate: settlementsExpanded ? 180 : 0 }} transition={{ duration: 0.2, ease }}>
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {settlementsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mt-3">
                      {settlements.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-[18px] bg-card/90 border border-border/40 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{s.from} paid {s.to}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(s.date), "d MMM yyyy")}
                              {s.note && ` · ${s.note}`}
                            </p>
                          </div>
                          <span className="text-sm font-medium tabular-nums">{fmt(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* FAB — quick-add expense */}
      <motion.button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        aria-label="Add expense"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <ExpenseQuickAddSheet
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        defaultCategory={expandedCategory ?? undefined}
      />

      <SetEnvelopeSheet
        category={envelopeCategory}
        month={selectedSummaryMonth}
        onClose={() => setEnvelopeCategory(null)}
      />
    </AnimatedPage>
  );
}