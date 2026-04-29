import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { ExpenseQuickAddSheet } from "../components/expenses/ExpenseQuickAddSheet";
import {
  ChevronRight,
  Plus,
  BarChart3,
  AlertTriangle,
  PiggyBank,
  Landmark,
  CalendarDays,
} from "lucide-react";
import {
  addDays,
  differenceInCalendarMonths,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import { AnimatedPage } from "../components/AnimatedPage";
import { SettleUpModal } from "../components/SettleUpModal";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/LoadingSkeleton";
import { useApp } from "../context/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useSubscriptionUi } from "@/context/SubscriptionUiContext";
import { useScramble } from "@/hooks/useScramble";
import type { SavingsGoal, MonthlySummary } from "@/lib/schemas/money";
import type { BudgetCategory } from "../context/AppContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

// Ring dimensions — main summary ring
const RING_R = 36;
const RING_STROKE = 8;
const RING_SIZE = (RING_R + RING_STROKE) * 2; // 88px
const RING_C = 2 * Math.PI * RING_R;

// Ring dimensions — mini ring (goal cards)
const MINI_R = 10;
const MINI_STROKE = 4;
const MINI_SIZE = (MINI_R + MINI_STROKE) * 2; // 28px
const MINI_C = 2 * Math.PI * MINI_R;

// ── Colour helpers ────────────────────────────────────────────────────────────

function pctColor(pct: number, threshold = 80): string {
  const warnAt = threshold - 10 < 50 ? 50 : threshold - 10;
  if (pct < warnAt) return "#9db19f"; // sage
  if (pct <= threshold) return "#e6a563"; // amber
  return "#c75146"; // destructive
}

function categoryColorDot(name: string): string {
  const palette = ["#d4795e", "#9db19f", "#e6a563", "#b88b7e", "#7fa087"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ── AnimatedNumber ────────────────────────────────────────────────────────────

function AnimatedNumber({
  value,
  formatter,
}: {
  value: number;
  formatter: (v: number) => string;
}) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => formatter(v));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.5,
      ease: ease,
    });
    return () => controls.stop();
  }, [value, count]);

  return <motion.span>{display}</motion.span>;
}

// ── Ring arc ──────────────────────────────────────────────────────────────────

function RingArc({
  pct,
  size,
  radius,
  stroke,
  circumference,
  color,
  emptyColor = "rgba(61,50,41,0.1)",
  label,
  sublabel,
  onLabelClick,
  labelColor,
}: {
  pct: number;
  size: number;
  radius: number;
  stroke: number;
  circumference: number;
  color: string;
  emptyColor?: string;
  label: string;
  sublabel?: string;
  onLabelClick?: () => void;
  labelColor?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);
  const isMainRing = size === RING_SIZE;

  // Main ring: large % (16px) or medium "Set income" (11px)
  // Mini ring: 9px
  const labelFontSize = isMainRing ? (sublabel ? 16 : 11) : 9;
  const sublabelFontSize = isMainRing ? 9 : 7;

  const centerContent = (
    <>
      <span
        className="font-medium leading-none"
        style={{
          fontSize: labelFontSize,
          color: labelColor ?? "var(--foreground)",
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          className="text-muted-foreground mt-0.5 leading-none"
          style={{ fontSize: sublabelFontSize }}
        >
          {sublabel}
        </span>
      )}
    </>
  );

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={emptyColor}
          strokeWidth={stroke}
        />
        {/* Fill arc */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: ease }}
        />
      </svg>
      {/* Centre label */}
      {onLabelClick ? (
        <button
          type="button"
          onClick={onLabelClick}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          {centerContent}
        </button>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerContent}
        </div>
      )}
    </div>
  );
}

// ── Hazel insight line ────────────────────────────────────────────────────────

function getHazelLine(
  summary: MonthlySummary | undefined,
  budgetCategories: BudgetCategory[],
  hasIncome: boolean
): string | null {
  if (!hasIncome) return null;
  if (!summary) return null;

  const { pct_spent } = summary;

  if (pct_spent > 90) {
    const topCat = budgetCategories
      .filter((c) => c.limit > 0)
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];
    return topCat
      ? `You're over budget this month — ${topCat.name} is the main driver.`
      : "You're over budget this month.";
  }
  if (pct_spent > 70) {
    const topCat = budgetCategories
      .filter((c) => c.limit > 0)
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];
    return topCat
      ? `Getting close — watch ${topCat.name} this month.`
      : "Getting close to your budget this month.";
  }
  if (pct_spent > 0 && pct_spent < 50) return "You're well on track this month.";
  return null;
}

// ── Goal status pill ──────────────────────────────────────────────────────────

function getGoalStatus(
  goal: SavingsGoal,
  summary: MonthlySummary | undefined,
  goalsCount: number
): "on-track" | "behind" | null {
  if (!goal.target_date || !summary) return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return "on-track";

  const monthsUntil = differenceInCalendarMonths(
    parseISO(goal.target_date),
    startOfMonth(new Date())
  );
  if (monthsUntil <= 0) return "behind";

  const monthlyNeeded = remaining / monthsUntil;
  const monthlyAvailable = summary.surplus / Math.max(1, goalsCount);
  return monthlyAvailable >= monthlyNeeded ? "on-track" : "behind";
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="uppercase tracking-[0.05em] font-medium mb-2"
      style={{ fontSize: 10, color: "#6b6157" }}
    >
      {children}
    </p>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  summary,
  income,
  isLoading,
  hasError,
  onRetry,
  budgetCategories,
  hasIncome,
  onSetIncomeClick,
  overspendThreshold,
  hideBalances,
}: {
  summary: MonthlySummary | undefined;
  income: number;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  budgetCategories: BudgetCategory[];
  hasIncome: boolean;
  onSetIncomeClick: () => void;
  overspendThreshold: number;
  hideBalances: boolean;
}) {
  const { fmt, scrambled } = useScramble();
  const [revealed, setRevealed] = useState(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When hide-balances is off, always show; when on, show only when revealed
  const shouldShowAmounts = !hideBalances || revealed;

  const handleRingClick = () => {
    if (!hideBalances) return;
    if (revealed) return;
    setRevealed(true);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(() => setRevealed(false), 5000);
  };

  // When hideBalances turns off, cancel any reveal timer
  useEffect(() => {
    if (!hideBalances) {
      setRevealed(false);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    }
  }, [hideBalances]);

  const pct = summary?.pct_spent ?? 0;
  const totalSpent = summary?.total_spent ?? 0;
  const surplus = summary?.surplus ?? 0;
  const remaining = income - totalSpent;

  const ringColor = hasIncome ? pctColor(pct, overspendThreshold) : "rgba(61,50,41,0.15)";
  // When hide-balances is active and amounts are not revealed, show "Tap to reveal"
  const ringLabel = hideBalances && !revealed
    ? "Tap"
    : hasIncome ? `${Math.round(pct)}%` : "Set income";
  const ringSubLabel = hideBalances && !revealed
    ? "to reveal"
    : hasIncome ? "spent" : undefined;
  const ringLabelColor = !hasIncome && !(hideBalances && !revealed) ? "#d4795e" : undefined;

  // Remaining colour
  const remainingPct = income > 0 ? remaining / income : 1;
  const remainingColor =
    !hasIncome || totalSpent === 0
      ? "text-muted-foreground"
      : remaining < 0
      ? "text-destructive"
      : remainingPct < 0.1
      ? "text-destructive"
      : remainingPct < 0.3
      ? "text-warning"
      : "text-success";

  const hazelLine = getHazelLine(summary, budgetCategories, hasIncome);

  if (isLoading) {
    return (
      <div className="rounded-[18px] border border-border/70 bg-card/90 p-3.5">
        <div className="flex gap-4 items-center">
          <Skeleton className="w-[88px] h-[88px] rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: ease }}
    >
      <Card>
        <CardContent className="p-3.5 space-y-3">
          {/* Ring + stats row */}
          <div className="flex items-center gap-4">
            <RingArc
              pct={pct}
              size={RING_SIZE}
              radius={RING_R}
              stroke={RING_STROKE}
              circumference={RING_C}
              color={ringColor}
              label={ringLabel}
              sublabel={ringSubLabel}
              labelColor={ringLabelColor}
              onLabelClick={
                hideBalances && !revealed
                  ? handleRingClick
                  : !hasIncome
                  ? onSetIncomeClick
                  : undefined
              }
            />

            {/* Stat rows with hierarchy */}
            <div className="flex-1 space-y-2">
              {/* Income — anchor number */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>Income</span>
                <span
                  className="tabular-nums font-medium text-foreground"
                  style={{ fontSize: 18 }}
                >
                  {hasIncome ? (
                    shouldShowAmounts && !scrambled ? (
                      <AnimatedNumber value={income} formatter={fmt} />
                    ) : (
                      <span>{fmt(shouldShowAmounts ? income : null)}</span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={onSetIncomeClick}
                      className="text-primary hover:text-primary/80 transition-colors"
                      style={{ fontSize: 14 }}
                    >
                      Set →
                    </button>
                  )}
                </span>
              </div>

              {/* Spent */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground" style={{ fontSize: 11 }}>Spent</span>
                <span
                  className="tabular-nums text-muted-foreground"
                  style={{ fontSize: 14, fontWeight: 400 }}
                >
                  {shouldShowAmounts && !scrambled ? (
                    <AnimatedNumber value={totalSpent} formatter={fmt} />
                  ) : (
                    fmt(shouldShowAmounts ? totalSpent : null)
                  )}
                </span>
              </div>

              {/* Remaining */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground" style={{ fontSize: 11 }}>Remaining</span>
                <span
                  className={`tabular-nums font-medium ${remainingColor}`}
                  style={{ fontSize: 15 }}
                >
                  {hasIncome ? (
                    shouldShowAmounts && !scrambled ? (
                      <AnimatedNumber value={remaining} formatter={fmt} />
                    ) : (
                      fmt(shouldShowAmounts ? remaining : null)
                    )
                  ) : (
                    "—"
                  )}
                </span>
              </div>

              {/* Est. surplus */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground" style={{ fontSize: 11 }}>Est. surplus</span>
                <span
                  className={`tabular-nums font-medium flex items-center gap-0.5 ${
                    !hasIncome
                      ? "text-muted-foreground"
                      : surplus >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                  style={{ fontSize: 14 }}
                >
                  {hasIncome ? (
                    shouldShowAmounts && !scrambled ? (
                      <>
                        <span className="text-[10px]">{surplus >= 0 ? "↑" : "↓"}</span>
                        <AnimatedNumber value={Math.abs(surplus)} formatter={fmt} />
                      </>
                    ) : (
                      fmt(shouldShowAmounts ? Math.abs(surplus) : null)
                    )
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Hazel ambient line */}
          <AnimatePresence>
            {hazelLine && (
              <motion.p
                key={hazelLine}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: ease }}
                className="text-xs italic text-muted-foreground leading-5 pt-1 border-t border-border/40"
              >
                {hazelLine}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Error state — contained inside card for genuine failures */}
          <AnimatePresence>
            {hasError && !summary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 pt-1 border-t border-border/40"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">Couldn't load your summary</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Balance card ─────────────────────────────────────────────────────────────
// Only rendered when balance is non-zero. Compact single-row nudge card.

function BalanceCard({
  balance,
  partnerName,
}: {
  balance: { amount: number; oweType: "owed" | "owes"; person: string };
  partnerName: string;
}) {
  const [showSettleUp, setShowSettleUp] = useState(false);
  const { fmt } = useScramble();

  const partnerOwesMe = balance.oweType === "owed";
  const dotColor = partnerOwesMe ? "#7fa087" : "#e6a563";
  const textColor = partnerOwesMe ? "text-success" : "text-warning";
  const borderColor = partnerOwesMe
    ? "border-success/30 bg-success/8"
    : "border-warning/30 bg-warning/8";

  const balanceText = partnerOwesMe
    ? `${partnerName} owes you ${fmt(balance.amount)}`
    : `You owe ${partnerName} ${fmt(balance.amount)}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.24, ease }}
      >
        <div className={`rounded-[14px] border ${borderColor} px-4 py-2.5`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <p className={`text-sm font-medium truncate ${textColor}`}>
                {balanceText}
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => setShowSettleUp(true)}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex-shrink-0 text-xs font-medium text-primary border border-primary/40 rounded-full px-3 py-1 hover:bg-primary/8 transition-colors"
            >
              Settle up
            </motion.button>
          </div>
        </div>
      </motion.div>

      <SettleUpModal open={showSettleUp} onOpenChange={setShowSettleUp} />
    </>
  );
}

// ── Navigation cards ──────────────────────────────────────────────────────────

function NavigationCards({
  budgetCategories,
  summary,
  activeGoals,
  selectedMonth,
  hasIncome,
  totalBudgeted,
}: {
  budgetCategories: BudgetCategory[];
  summary: MonthlySummary | undefined;
  activeGoals: SavingsGoal[];
  selectedMonth: Date;
  hasIncome: boolean;
  totalBudgeted: number;
}) {
  const navigate = useNavigate();
  const { fmt } = useScramble();

  const income = summary?.income ?? 0;
  const totalSpent = summary?.total_spent ?? 0;
  const overviewSubtitle =
    hasIncome && summary
      ? `${fmt(income)} income · ${fmt(totalSpent)} spent`
      : "Income, fixed costs, surplus";

  const catsWithSpend = budgetCategories.filter((c) => c.spent > 0);
  const topCat = [...budgetCategories].sort((a, b) => b.spent - a.spent)[0];
  const spendingSubtitle =
    catsWithSpend.length > 0 && topCat && topCat.spent > 0
      ? `${topCat.name} ${fmt(topCat.spent)} · ${catsWithSpend.length} ${
          catsWithSpend.length === 1 ? "category" : "categories"
        }`
      : "Log and review your spending";

  const unallocated = Math.max(0, income - totalBudgeted);
  const budgetsSubtitle =
    totalBudgeted > 0
      ? `${fmt(totalBudgeted)} budgeted · ${fmt(unallocated)} free`
      : `Set up your ${format(selectedMonth, "MMMM")} budget`;
  const budgetsNeedsSetup = totalBudgeted === 0;

  const nearestGoal = activeGoals[0];
  const nearestProgressPct =
    nearestGoal && nearestGoal.target_amount > 0
      ? Math.round(
          Math.min(
            (nearestGoal.current_amount / nearestGoal.target_amount) * 100,
            100
          )
        )
      : 0;
  const goalsSubtitle =
    activeGoals.length > 0 && nearestGoal
      ? `${nearestGoal.name} · ${nearestProgressPct}% there`
      : "What are you saving toward?";

  const navItems = [
    {
      icon: Landmark,
      title: "Overview",
      subtitle: overviewSubtitle,
      subtitleHighlight: false,
      path: "/money/overview",
      accentBg: "#e6f1fb",
      accentColor: "#185fa5",
      onboarding: undefined,
    },
    {
      icon: BarChart3,
      title: "Spending",
      subtitle: spendingSubtitle,
      subtitleHighlight: false,
      path: "/money/spending",
      accentBg: "#e1f5ee",
      accentColor: "#0f6e56",
      onboarding: undefined,
    },
    {
      icon: CalendarDays,
      title: "Budgets",
      subtitle: budgetsSubtitle,
      subtitleHighlight: budgetsNeedsSetup,
      path: "/money/budgets",
      accentBg: "#faeeda",
      accentColor: "#854f0b",
      onboarding: "money-bills-goals",
    },
    {
      icon: PiggyBank,
      title: "Goals",
      subtitle: goalsSubtitle,
      subtitleHighlight: false,
      path: "/money/goals",
      accentBg: "#faece7",
      accentColor: "#993c1d",
      onboarding: undefined,
    },
  ];

  return (
    <div className="space-y-2">
      {navItems.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.path}
            onClick={() => navigate(item.path)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: ease, delay: i * 0.05 }}
            whileHover={{ backgroundColor: "rgba(61,50,41,0.04)" }}
            whileTap={{ scale: 0.985 }}
            className="w-full rounded-[18px] border border-border/60 bg-card/90 p-3.5 flex items-center gap-3 text-left transition-colors"
            data-onboarding={item.onboarding}
          >
            {/* Accent circle */}
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: item.accentBg }}
            >
              <Icon
                className="flex-shrink-0"
                style={{ width: 18, height: 18, color: item.accentColor }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" style={{ fontSize: 14 }}>
                {item.title}
              </p>
              <p
                className="truncate mt-0.5"
                style={{
                  fontSize: 12,
                  color: item.subtitleHighlight ? "#d4795e" : "var(--muted-foreground)",
                }}
              >
                {item.subtitle}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Upcoming bills strip ──────────────────────────────────────────────────────
// Only shown when recurring bills exist.

function UpcomingBillsStrip({
  getBillsForDateRange,
  bills,
}: {
  getBillsForDateRange: ReturnType<typeof useApp>["getBillsForDateRange"];
  bills: ReturnType<typeof useApp>["bills"];
}) {
  const { fmt } = useScramble();
  const upcomingBills = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, 30);
    return getBillsForDateRange(start, end).slice(0, 6);
  }, [getBillsForDateRange]);

  if (bills.length === 0) return null;

  const billDateLabel = (daysUntil: number, date: Date): string => {
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    return format(date, "d MMM");
  };

  return (
    <div>
      <SectionLabel>Coming Up</SectionLabel>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
        {upcomingBills.map((occurrence, i) => {
          const isFirst = i === 0;
          return (
            <motion.div
              key={`${occurrence.bill.id}-${occurrence.next_date.toISOString()}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, ease: ease, delay: i * 0.04 }}
              className={`flex-shrink-0 rounded-[18px] border p-3 min-w-[100px] max-w-[120px] cursor-default ${
                isFirst
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card/90 border-border/60"
              }`}
            >
              <p
                className={`text-[11px] font-medium mb-1 ${
                  isFirst ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {billDateLabel(occurrence.days_until, occurrence.next_date)}
              </p>
              <p
                className={`text-sm font-medium leading-tight truncate ${
                  isFirst ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {occurrence.bill.name}
              </p>
              <p
                className={`text-sm font-medium mt-1 tabular-nums ${
                  isFirst ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {fmt(occurrence.bill.amount)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Savings goals ─────────────────────────────────────────────────────────────
// Only shown when at least one goal exists.

function SavingsGoalsSummary({
  activeGoals,
  summary,
  isNest,
}: {
  activeGoals: SavingsGoal[];
  summary: MonthlySummary | undefined;
  isNest: boolean;
}) {
  const navigate = useNavigate();
  const { fmt } = useScramble();
  const { openUpgrade } = useSubscriptionUi();

  if (activeGoals.length === 0) return null;

  const displayGoals = activeGoals.slice(0, 2);
  const overflow = activeGoals.length - displayGoals.length;
  const showProGate = !isNest && activeGoals.length >= 1;

  return (
    <div>
      <SectionLabel>Savings Goals</SectionLabel>
      <div className="space-y-2">
        {displayGoals.map((goal, i) => {
          const progressPct =
            goal.target_amount > 0
              ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
              : 0;
          const goalColor = goal.colour ?? "#d4795e";
          const status = getGoalStatus(goal, summary, activeGoals.length);

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: ease, delay: i * 0.05 }}
            >
              <Card className="!rounded-[18px]">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    <RingArc
                      pct={progressPct}
                      size={MINI_SIZE}
                      radius={MINI_R}
                      stroke={MINI_STROKE}
                      circumference={MINI_C}
                      color={goalColor}
                      label={`${Math.round(progressPct)}%`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{goal.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmt(goal.current_amount)} of {fmt(goal.target_amount)}
                        {goal.target_date && (
                          <> · by {format(parseISO(goal.target_date), "MMM yyyy")}</>
                        )}
                      </p>
                    </div>
                    {status && (
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          status === "on-track"
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {status === "on-track" ? "On track" : "Behind"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {overflow > 0 && (
          <button
            onClick={() => navigate("/money/goals")}
            className="text-xs text-primary flex items-center gap-1 pl-1"
          >
            See all {activeGoals.length} goals
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {showProGate && (
          <button
            onClick={openUpgrade}
            className="text-xs text-muted-foreground flex items-center gap-1 pl-1 hover:text-primary transition-colors"
          >
            Add more savings goals with Roost Pro →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Spending bars ─────────────────────────────────────────────────────────────
// Only shown when there are categories with spending this month.

function SpendingBars({
  budgetCategories,
  isLoading,
  onAddExpense,
  overspendThreshold,
}: {
  budgetCategories: BudgetCategory[];
  isLoading: boolean;
  onAddExpense: () => void;
  overspendThreshold: number;
}) {
  const navigate = useNavigate();
  const { fmt } = useScramble();
  const activeCats = budgetCategories.filter((c) => c.spent > 0 || c.limit > 0);
  const catsWithSpend = activeCats.filter((c) => c.spent > 0);
  const display = activeCats.slice(0, 4);
  const overflow = activeCats.length - display.length;
  const maxSpend = Math.max(...activeCats.map((c) => c.spent), 1);
  const warnAt = Math.max(50, overspendThreshold - 10);

  if (!isLoading && catsWithSpend.length === 0) return null;

  return (
    <div>
      <SectionLabel>Spending This Month</SectionLabel>
      <Card>
        <CardContent className="p-3.5 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            display.map((cat, i) => {
              const hasLimit = cat.limit > 0;
              const barPct = hasLimit
                ? Math.min((cat.spent / cat.limit) * 100, 100)
                : (cat.spent / maxSpend) * 100;
              const barColor = hasLimit
                ? barPct < warnAt
                  ? "#7fa087"
                  : barPct <= overspendThreshold
                  ? "#e6a563"
                  : "#c75146"
                : "#d4795e";
              const dot = categoryColorDot(cat.name);

              return (
                <div key={cat.id ?? cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dot }}
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {cat.name}
                      </span>
                    </div>
                    <span
                      className="font-medium tabular-nums text-foreground ml-2 flex-shrink-0"
                      style={{ fontSize: 12 }}
                    >
                      {fmt(cat.spent)}
                      {hasLimit && (
                        <span className="text-muted-foreground font-normal">
                          {" "}/ {fmt(cat.limit)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-[6px] rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.5, ease: ease, delay: i * 0.06 }}
                    />
                  </div>
                </div>
              );
            })
          )}

          <div className="flex items-center justify-between pt-0.5">
            <div>
              {overflow > 0 && (
                <button
                  onClick={() => navigate("/money/spending")}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  {overflow} more {overflow === 1 ? "category" : "categories"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onAddExpense}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              + Add expense
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Money() {
  const {
    summary,
    isMonthlySummaryLoading,
    monthlySummaryError,
    selectedSummaryMonth,
    incomeRows,
    getIncomeForMonth,
    isHouseholdIncomeLoading,
    activeGoals,
    bills,
    getBillsForDateRange,
    budgetCategories,
    isExpensesLoading,
    getBalance,
    partnerName,
    totalBudgeted,
    overspendAlertThreshold,
  } = useApp();

  // Hide balances — device-only preference from localStorage
  const [hideBalances, setHideBalances] = useState(
    () => localStorage.getItem("roost-hide-balances") === "true"
  );

  // Keep in sync if changed in settings while page is mounted
  useEffect(() => {
    const handler = () => {
      setHideBalances(localStorage.getItem("roost-hide-balances") === "true");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const { isNest } = useSubscription();
  const navigate = useNavigate();

  const currentMonthIncome = getIncomeForMonth(selectedSummaryMonth);
  const hasIncome = incomeRows.length > 0;
  const incomeAmount = currentMonthIncome?.combined_amount ?? 0;

  // Client-side summary fallback — used when RPC is unavailable (migrations not applied)
  const clientTotalSpent = useMemo(
    () => budgetCategories.reduce((sum, c) => sum + c.spent, 0),
    [budgetCategories]
  );
  const clientSurplus = hasIncome ? incomeAmount - totalBudgeted : 0;
  const clientPctSpent =
    totalBudgeted > 0
      ? Math.min((clientTotalSpent / totalBudgeted) * 100, 100)
      : incomeAmount > 0
      ? Math.min((clientTotalSpent / incomeAmount) * 100, 100)
      : 0;

  const effectiveSummary: MonthlySummary | undefined =
    summary ??
    (hasIncome
      ? {
          income: incomeAmount,
          fixed_costs: 0,
          envelopes_total: totalBudgeted,
          total_budgeted: totalBudgeted,
          actual_spend: clientTotalSpent,
          pct_of_income_budgeted:
            incomeAmount > 0 ? (totalBudgeted / incomeAmount) * 100 : 0,
          surplus: clientSurplus,
          projected_total: clientTotalSpent,
          pct_spent: clientPctSpent,
          total_spent: clientTotalSpent,
          discretionary: totalBudgeted,
        }
      : undefined);

  const isPageLoading = isMonthlySummaryLoading || isHouseholdIncomeLoading;
  const balance = getBalance();
  const hasNonZeroBalance = balance.amount > 0;

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleSetIncomeClick = useCallback(() => {
    navigate("/settings/money");
  }, [navigate]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <AnimatedPage className="max-w-2xl mx-auto px-6 pt-5 pb-6">
      <div className="flex flex-col gap-3">
        {/* 1. Page heading */}
        <div className="mb-1">
          <h1 className="text-3xl font-semibold mb-1">Money</h1>
          <p className="text-muted-foreground text-sm">
            {format(selectedSummaryMonth, "MMMM yyyy")}
          </p>
        </div>

        {/* 2. Ring arc summary card */}
        <SummaryCard
          summary={effectiveSummary}
          income={incomeAmount}
          isLoading={isPageLoading}
          hasError={!!monthlySummaryError}
          onRetry={handleRetry}
          budgetCategories={budgetCategories}
          hasIncome={hasIncome}
          onSetIncomeClick={handleSetIncomeClick}
          overspendThreshold={overspendAlertThreshold}
          hideBalances={hideBalances}
        />

        {/* 3. Compact balance card — only when non-zero */}
        <AnimatePresence>
          {hasNonZeroBalance && (
            <div data-onboarding="money-balance-card">
              <BalanceCard balance={balance} partnerName={partnerName} />
            </div>
          )}
        </AnimatePresence>

        {/* 4. Navigation cards — always visible */}
        <NavigationCards
          budgetCategories={budgetCategories}
          summary={effectiveSummary}
          activeGoals={activeGoals}
          selectedMonth={selectedSummaryMonth}
          hasIncome={hasIncome}
          totalBudgeted={totalBudgeted}
        />

        {/* 5. Spending section — only when expenses exist */}
        <SpendingBars
          budgetCategories={budgetCategories}
          isLoading={isExpensesLoading}
          onAddExpense={() => setQuickAddOpen(true)}
          overspendThreshold={overspendAlertThreshold}
        />

        {/* 6. Upcoming bills strip — only when bills configured */}
        <UpcomingBillsStrip
          getBillsForDateRange={getBillsForDateRange}
          bills={bills}
        />

        {/* 7. Savings goals — only when goals exist */}
        <SavingsGoalsSummary
          activeGoals={activeGoals}
          summary={effectiveSummary}
          isNest={isNest}
        />
      </div>

      {/* FAB — quick-add expense, above bottom nav */}
      <motion.button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        aria-label="Add expense"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <ExpenseQuickAddSheet
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </AnimatedPage>
  );
}
